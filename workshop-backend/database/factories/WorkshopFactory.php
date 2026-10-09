<?php

namespace Database\Factories;

use App\Enums\WorkshopStatus;
use App\Models\Workshop;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Workshop>
 */
class WorkshopFactory extends Factory
{
    public function definition(): array
    {
        $startsAt = fake()->dateTimeBetween('+1 day', '+2 months');
        $startsAt->setTime((int) fake()->randomElement([9, 10, 13, 14, 18]), 0);

        return [
            'code' => 'WS-'.fake()->unique()->numerify('###'),
            'title' => fake()->randomElement([
                'Intro to Computers',
                'Basic Bookkeeping',
                'First Aid Essentials',
                'Resume Writing',
                'Community Gardening',
                'Smartphone Basics',
                'Public Speaking',
                'Personal Budgeting',
            ]),
            'instructor' => fake()->name(),
            'description' => fake()->sentence(16),
            'location' => fake()->randomElement(['Room A', 'Room B', 'Main Hall', 'Computer Lab']),
            'starts_at' => $startsAt,
            'ends_at' => (clone $startsAt)->modify('+2 hours'),
            'capacity' => fake()->numberBetween(5, 30),
            'status' => WorkshopStatus::Scheduled,
        ];
    }

    public function capacity(int $capacity): static
    {
        return $this->state(['capacity' => $capacity]);
    }

    public function past(): static
    {
        return $this->state(fn () => [
            'starts_at' => now()->subDays(3),
            'ends_at' => now()->subDays(3)->addHours(2),
            'status' => WorkshopStatus::Completed,
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(['status' => WorkshopStatus::Cancelled]);
    }
}
