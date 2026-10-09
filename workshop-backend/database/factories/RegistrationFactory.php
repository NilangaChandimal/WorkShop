<?php

namespace Database\Factories;

use App\Enums\RegistrationStatus;
use App\Models\Registration;
use App\Models\User;
use App\Models\Workshop;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Registration>
 */
class RegistrationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workshop_id' => Workshop::factory(),
            'attendee_name' => fake()->name(),
            'attendee_email' => fake()->unique()->safeEmail(),
            'attendee_phone' => fake()->numerify('07########'),
            'status' => RegistrationStatus::Active,
            'registered_by' => User::factory(),
        ];
    }

    public function cancelled(?User $by = null): static
    {
        return $this->state(fn () => [
            'status' => RegistrationStatus::Cancelled,
            'cancelled_by' => $by?->id ?? User::factory(),
            'cancelled_at' => now(),
        ]);
    }
}
