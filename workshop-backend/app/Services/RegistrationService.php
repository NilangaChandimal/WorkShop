<?php

namespace App\Services;

use App\Enums\RegistrationStatus;
use App\Exceptions\RegistrationException;
use App\Models\Registration;
use App\Models\User;
use App\Models\Workshop;
use Illuminate\Support\Facades\DB;

class RegistrationService
{
    /**
     * Retries absorb deadlocks raised by InnoDB under heavy contention.
     */
    private const TRANSACTION_ATTEMPTS = 3;

    /**
     * Book a seat. The workshop row is locked (SELECT ... FOR UPDATE) for the duration of the
     * transaction, so concurrent bookings for the same workshop are serialized and the
     * capacity check always sees the committed count.
     *
     * @param  array{attendee_name: string, attendee_email: string, attendee_phone?: string|null}  $data
     *
     * @throws RegistrationException
     */
    public function register(Workshop $workshop, array $data, User $actor): Registration
    {
        $email = strtolower(trim($data['attendee_email']));

        $registration = DB::transaction(function () use ($workshop, $data, $email, $actor) {
            $locked = Workshop::query()
                ->whereKey($workshop->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if (! $locked->starts_at->isFuture()) {
                throw RegistrationException::workshopStarted();
            }

            if (! $locked->isOpenForBooking()) {
                throw RegistrationException::workshopNotOpen();
            }

            $alreadyBooked = $locked->registrations()
                ->active()
                ->where('attendee_email', $email)
                ->exists();

            if ($alreadyBooked) {
                throw RegistrationException::duplicate();
            }

            $activeCount = $locked->registrations()->active()->count();

            if ($activeCount >= $locked->capacity) {
                throw RegistrationException::capacityExceeded();
            }

            return $locked->registrations()->create([
                'attendee_name' => trim($data['attendee_name']),
                'attendee_email' => $email,
                'attendee_phone' => isset($data['attendee_phone']) ? trim($data['attendee_phone']) : null,
                'status' => RegistrationStatus::Active,
                'registered_by' => $actor->getKey(),
            ]);
        }, self::TRANSACTION_ATTEMPTS);

        return $registration->load(['workshop', 'registeredBy']);
    }

    /**
     * Soft-cancel a registration. Locks are taken in the same order as register()
     * (workshop first, then registration) to avoid deadlocks.
     *
     * @throws RegistrationException
     */
    public function cancel(Registration $registration, User $actor): Registration
    {
        $cancelled = DB::transaction(function () use ($registration, $actor) {
            Workshop::query()
                ->whereKey($registration->workshop_id)
                ->lockForUpdate()
                ->firstOrFail();

            $locked = Registration::query()
                ->whereKey($registration->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if (! $locked->isActive()) {
                throw RegistrationException::alreadyCancelled();
            }

            $locked->update([
                'status' => RegistrationStatus::Cancelled,
                'cancelled_by' => $actor->getKey(),
                'cancelled_at' => now(),
            ]);

            return $locked;
        }, self::TRANSACTION_ATTEMPTS);

        return $cancelled->load(['workshop', 'registeredBy', 'cancelledBy']);
    }
}
