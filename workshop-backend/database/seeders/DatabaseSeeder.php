<?php

namespace Database\Seeders;

use App\Enums\RegistrationStatus;
use App\Enums\WorkshopStatus;
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
        $admin = User::factory()->admin()->create([
            'name' => 'System Admin',
            'email' => 'admin@workshop.test',
        ]);

        $manager = User::factory()->manager()->create([
            'name' => 'Maya Manager',
            'email' => 'manager@workshop.test',
        ]);

        $staff = User::factory()->staff()->create([
            'name' => 'Sam Staff',
            'email' => 'staff@workshop.test',
        ]);

        $staff2 = User::factory()->staff()->create([
            'name' => 'Sara Staff',
            'email' => 'staff2@workshop.test',
        ]);

        // 1. Excel for Beginners (WS-101) - 2 of 3 booked (1 seat remaining)
        $ws1 = Workshop::create([
            'code' => 'WS-101',
            'title' => 'Excel for Beginners',
            'instructor' => 'Dr. Alan Turing',
            'description' => 'Master spreadsheet essentials including basic formulas, formatting, tables, and data entry techniques for workplace productivity.',
            'location' => 'Computer Lab A',
            'starts_at' => now()->addDays(3)->setTime(10, 0),
            'ends_at' => now()->addDays(3)->setTime(12, 0),
            'capacity' => 3,
            'status' => WorkshopStatus::Scheduled,
            'created_by' => $manager->id,
            'updated_by' => $manager->id,
        ]);

        Registration::create([
            'workshop_id' => $ws1->id,
            'attendee_name' => 'Alice Johnson',
            'attendee_email' => 'alice.johnson@example.com',
            'status' => RegistrationStatus::Active,
            'registered_by' => $staff->id,
        ]);

        Registration::create([
            'workshop_id' => $ws1->id,
            'attendee_name' => 'Bob Smith',
            'attendee_email' => 'bob.smith@example.com',
            'status' => RegistrationStatus::Active,
            'registered_by' => $staff2->id,
        ]);

        // 2. Intro to Web Development (WS-102)
        $ws2 = Workshop::create([
            'code' => 'WS-102',
            'title' => 'Introduction to Web Development',
            'instructor' => 'Sarah Connor',
            'description' => 'Hands-on introduction to building responsive websites using HTML5, CSS3, and modern browser developer tools. No prior coding experience required.',
            'location' => 'Computer Lab B',
            'starts_at' => now()->addDays(5)->setTime(14, 0),
            'ends_at' => now()->addDays(5)->setTime(16, 30),
            'capacity' => 15,
            'status' => WorkshopStatus::Scheduled,
            'created_by' => $manager->id,
            'updated_by' => $manager->id,
        ]);

        Registration::create([
            'workshop_id' => $ws2->id,
            'attendee_name' => 'Charlie Brown',
            'attendee_email' => 'charlie.brown@example.com',
            'status' => RegistrationStatus::Active,
            'registered_by' => $staff->id,
        ]);

        Registration::create([
            'workshop_id' => $ws2->id,
            'attendee_name' => 'Ian Malcolm',
            'attendee_email' => 'ian.malcolm@example.com',
            'status' => RegistrationStatus::Cancelled,
            'registered_by' => $staff->id,
            'cancelled_by' => $manager->id,
            'cancelled_at' => now()->subHours(2),
        ]);

        // 3. Financial Literacy & Budgeting (WS-103)
        $ws3 = Workshop::create([
            'code' => 'WS-103',
            'title' => 'Personal Budgeting & Financial Health',
            'instructor' => 'Marcus Aurelius',
            'description' => 'Learn practical strategies for personal budgeting, managing credit, reducing debt, and planning household savings effectively.',
            'location' => 'Conference Room 1',
            'starts_at' => now()->addDays(7)->setTime(18, 0),
            'ends_at' => now()->addDays(7)->setTime(20, 0),
            'capacity' => 20,
            'status' => WorkshopStatus::Scheduled,
            'created_by' => $manager->id,
            'updated_by' => $manager->id,
        ]);

        Registration::create([
            'workshop_id' => $ws3->id,
            'attendee_name' => 'Diana Prince',
            'attendee_email' => 'diana.prince@example.com',
            'status' => RegistrationStatus::Active,
            'registered_by' => $staff->id,
        ]);

        // 4. Resume Writing & Interview Skills (WS-104)
        $ws4 = Workshop::create([
            'code' => 'WS-104',
            'title' => 'Resume Writing & Interview Skills',
            'instructor' => 'Elena Rostova',
            'description' => 'Craft a compelling resume tailored for modern applicant tracking systems and practice confidence-building interview answers with personalized feedback.',
            'location' => 'Seminar Room 3',
            'starts_at' => now()->addDays(10)->setTime(9, 30),
            'ends_at' => now()->addDays(10)->setTime(12, 0),
            'capacity' => 12,
            'status' => WorkshopStatus::Scheduled,
            'created_by' => $manager->id,
            'updated_by' => $manager->id,
        ]);

        // 5. Community First Aid & CPR (WS-105) - Fully booked session (4 of 4)
        $ws5 = Workshop::create([
            'code' => 'WS-105',
            'title' => 'Community First Aid & Emergency CPR',
            'instructor' => 'Clara Barton, RN',
            'description' => 'Certified basic life support, emergency response techniques, wound care, and AED device training for community volunteers and families.',
            'location' => 'Main Hall',
            'starts_at' => now()->addDays(12)->setTime(13, 0),
            'ends_at' => now()->addDays(12)->setTime(16, 0),
            'capacity' => 4,
            'status' => WorkshopStatus::Scheduled,
            'created_by' => $manager->id,
            'updated_by' => $manager->id,
        ]);

        foreach ([
            ['Eva Green', 'eva.green@example.com'],
            ['Frank Miller', 'frank.miller@example.com'],
            ['Grace Hopper', 'grace.hopper@example.com'],
            ['Henry Ford', 'henry.ford@example.com'],
        ] as [$name, $email]) {
            Registration::create([
                'workshop_id' => $ws5->id,
                'attendee_name' => $name,
                'attendee_email' => $email,
                'status' => RegistrationStatus::Active,
                'registered_by' => $staff->id,
            ]);
        }

        // 6. Digital Photography Fundamentals (WS-106)
        $ws6 = Workshop::create([
            'code' => 'WS-106',
            'title' => 'Digital Photography Fundamentals',
            'instructor' => 'David Miller',
            'description' => 'Understand manual camera settings, natural lighting, composition rules, and basic post-processing tools using digital cameras and smartphones.',
            'location' => 'Creative Arts Studio',
            'starts_at' => now()->addDays(15)->setTime(11, 0),
            'ends_at' => now()->addDays(15)->setTime(13, 30),
            'capacity' => 10,
            'status' => WorkshopStatus::Scheduled,
            'created_by' => $manager->id,
            'updated_by' => $manager->id,
        ]);

        // 7. Public Speaking & Presentation Skills (WS-107)
        $ws7 = Workshop::create([
            'code' => 'WS-107',
            'title' => 'Public Speaking & Presentation Skills',
            'instructor' => 'Emma Watson',
            'description' => 'Overcome stage anxiety, structure persuasive presentations, and master vocal delivery and body language for impactful group communication.',
            'location' => 'Auditorium',
            'starts_at' => now()->addDays(18)->setTime(15, 0),
            'ends_at' => now()->addDays(18)->setTime(17, 0),
            'capacity' => 25,
            'status' => WorkshopStatus::Scheduled,
            'created_by' => $manager->id,
            'updated_by' => $manager->id,
        ]);

        // 8. Completed Past Workshop: Smartphone Basics for Seniors (WS-090)
        $wsPast = Workshop::create([
            'code' => 'WS-090',
            'title' => 'Smartphone Basics for Seniors',
            'instructor' => 'James Wilson',
            'description' => 'Introductory guide to device settings, messaging apps, photo sharing, video calls, and online security awareness for older adults.',
            'location' => 'Computer Lab A',
            'starts_at' => now()->subDays(5)->setTime(10, 0),
            'ends_at' => now()->subDays(5)->setTime(12, 0),
            'capacity' => 8,
            'status' => WorkshopStatus::Completed,
            'created_by' => $manager->id,
            'updated_by' => $manager->id,
        ]);
    }
}
