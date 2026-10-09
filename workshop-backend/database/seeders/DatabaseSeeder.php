<?php

namespace Database\Seeders;

use App\Models\Registration;
use App\Models\User;
use App\Models\Workshop;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Demo accounts all use the password "password".
     */
    public function run(): void
    {
        User::factory()->admin()->create(['name' => 'System Admin', 'email' => 'admin@workshop.test']);
        $manager = User::factory()->manager()->create(['name' => 'Maya Manager', 'email' => 'manager@workshop.test']);
        $staff = User::factory()->staff()->create(['name' => 'Sam Staff', 'email' => 'staff@workshop.test']);
        User::factory()->staff()->create(['name' => 'Sara Staff', 'email' => 'staff2@workshop.test']);

        $workshops = Workshop::factory()
            ->count(8)
            ->create(['created_by' => $manager->id, 'updated_by' => $manager->id]);

        $nearlyFull = Workshop::factory()->capacity(3)->create([
            'code' => 'WS-101',
            'title' => 'Excel for Beginners',
            'instructor' => 'Dr. Alan Turing',
            'created_by' => $manager->id,
            'updated_by' => $manager->id,
        ]);

        Registration::factory()->count(2)->create([
            'workshop_id' => $nearlyFull->id,
            'registered_by' => $staff->id,
        ]);

        Workshop::factory()->past()->create(['created_by' => $manager->id, 'updated_by' => $manager->id]);

        $workshops->each(function (Workshop $workshop) use ($staff) {
            Registration::factory()
                ->count(fake()->numberBetween(0, min(4, $workshop->capacity)))
                ->create(['workshop_id' => $workshop->id, 'registered_by' => $staff->id]);
        });
    }
}
