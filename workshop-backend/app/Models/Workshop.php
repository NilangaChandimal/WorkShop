<?php

namespace App\Models;

use App\Enums\RegistrationStatus;
use App\Enums\WorkshopStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

#[Fillable([
    'code',
    'title',
    'instructor',
    'description',
    'location',
    'starts_at',
    'ends_at',
    'capacity',
    'status',
    'created_by',
    'updated_by',
])]
class Workshop extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'capacity' => 'integer',
            'status' => WorkshopStatus::class,
        ];
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    public function activeRegistrations(): HasMany
    {
        return $this->registrations()->where('status', RegistrationStatus::Active);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Active registration count, using the eager-loaded aggregate when present.
     */
    protected function activeRegistrationsCount(): Attribute
    {
        return Attribute::get(function (): int {
            if (array_key_exists('active_registrations_count', $this->attributes)) {
                return (int) $this->attributes['active_registrations_count'];
            }

            return $this->activeRegistrations()->count();
        });
    }

    protected function availableSeats(): Attribute
    {
        return Attribute::get(fn (): int => max(0, $this->capacity - $this->active_registrations_count));
    }

    protected function isFull(): Attribute
    {
        return Attribute::get(fn (): bool => $this->available_seats === 0);
    }

    public function isOpenForBooking(): bool
    {
        return $this->status === WorkshopStatus::Scheduled && $this->starts_at->isFuture();
    }

    #[Scope]
    protected function withSeatCounts(Builder $query): void
    {
        $query->withCount([
            'registrations as active_registrations_count' => fn (Builder $q) => $q->where('status', RegistrationStatus::Active),
        ]);
    }

    /**
     * Restrict to workshops with at least the given number of free seats.
     */
    #[Scope]
    protected function withAvailableSeats(Builder $query, int $minimum = 1): void
    {
        $activeCount = Registration::query()
            ->selectRaw('count(*)')
            ->whereColumn('registrations.workshop_id', 'workshops.id')
            ->where('registrations.status', RegistrationStatus::Active->value);

        $query->whereRaw(
            'workshops.capacity - ('.$activeCount->toSql().') >= ?',
            [...$activeCount->getBindings(), max(1, $minimum)]
        );
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    #[Scope]
    protected function filter(Builder $query, array $filters): void
    {
        $query
            ->when($filters['search'] ?? null, function (Builder $q, string $search) {
                $q->where(function (Builder $inner) use ($search) {
                    $inner->where('title', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('instructor', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, fn (Builder $q, string $status) => $q->where('status', $status))
            ->when($filters['date_from'] ?? null, fn (Builder $q, string $from) => $q->where('starts_at', '>=', Carbon::parse($from)->startOfDay()))
            ->when($filters['date_to'] ?? null, fn (Builder $q, string $to) => $q->where('starts_at', '<=', Carbon::parse($to)->endOfDay()))
            ->when(
                filter_var($filters['has_seats'] ?? false, FILTER_VALIDATE_BOOLEAN) || ! empty($filters['min_seats']),
                fn (Builder $q) => $q->withAvailableSeats((int) ($filters['min_seats'] ?? 1))
            );
    }
}
