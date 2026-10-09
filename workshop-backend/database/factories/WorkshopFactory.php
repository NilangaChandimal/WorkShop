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
                'Introduction to Computers',
                'Basic Bookkeeping & Accounting',
                'First Aid & Emergency CPR',
                'Professional Resume Writing',
                'Community Urban Gardening',
                'Smartphone Essentials for Daily Life',
                'Public Speaking & Confidence',
                'Personal Budgeting & Financial Health',
                'Web Design Basics with HTML and CSS',
                'Time Management & Workplace Productivity',
            ]),
            'instructor' => fake()->randomElement([
                'Dr. Alan Turing',
                'Sarah Connor',
                'Marcus Aurelius',
                'Elena Rostova',
                'David Miller',
                'Clara Barton',
                'James Wilson',
                'Emma Watson',
            ]),
            'description' => fake()->randomElement([
                'Practical hands-on training designed for beginners seeking workplace skills and practical knowledge in a supportive setting.',
                'Comprehensive step-by-step guidance led by experienced instructors in an interactive classroom setting with real-world exercises.',
                'Master fundamental concepts and build confidence through collaborative exercises, group discussions, and practical demonstrations.',
                'Essential techniques and practical tools to enhance your daily personal and professional productivity.',
                'An interactive workshop covering core concepts, best practices, and actionable strategies for career and personal growth.',
            ]),
            'location' => fake()->randomElement([
                'Computer Lab A',
                'Computer Lab B',
                'Conference Room 1',
                'Seminar Room 3',
                'Main Hall',
                'Creative Arts Studio',
                'Auditorium',
            ]),
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
