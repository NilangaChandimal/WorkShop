<?php

namespace Tests\Feature;

use App\Enums\RegistrationStatus;
use App\Enums\Role;
use App\Enums\WorkshopStatus;
use App\Models\Registration;
use App\Models\User;
use App\Models\Workshop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_register_attendee_and_available_seats_decrements(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        Sanctum::actingAs($staff);

        $workshop = Workshop::factory()->create([
            'capacity' => 10,
            'status' => WorkshopStatus::Scheduled,
            'starts_at' => now()->addDays(3),
            'ends_at' => now()->addDays(3)->addHours(2),
        ]);

        $response = $this->postJson("/api/workshops/{$workshop->id}/registrations", [
            'attendee_name' => 'Alice Walker',
            'attendee_email' => 'alice@example.com',
            'attendee_phone' => '0771234567',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.attendee_name', 'Alice Walker')
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('registrations', [
            'workshop_id' => $workshop->id,
            'attendee_email' => 'alice@example.com',
            'status' => 'active',
            'registered_by' => $staff->id,
        ]);

        $workshopResponse = $this->getJson("/api/workshops/{$workshop->id}");
        $workshopResponse->assertOk()
            ->assertJsonPath('data.active_registrations_count', 1)
            ->assertJsonPath('data.available_seats', 9)
            ->assertJsonPath('data.is_full', false);
    }

    public function test_cannot_register_duplicate_active_email_for_same_workshop(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        Sanctum::actingAs($staff);

        $workshop = Workshop::factory()->create(['capacity' => 5]);

        Registration::factory()->create([
            'workshop_id' => $workshop->id,
            'attendee_email' => 'alice@example.com',
            'status' => RegistrationStatus::Active,
        ]);

        $response = $this->postJson("/api/workshops/{$workshop->id}/registrations", [
            'attendee_name' => 'Alice Walker Again',
            'attendee_email' => 'alice@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'duplicate_registration');
    }

    public function test_cannot_register_when_workshop_is_at_capacity(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        Sanctum::actingAs($staff);

        $workshop = Workshop::factory()->create(['capacity' => 2]);

        Registration::factory()->count(2)->create([
            'workshop_id' => $workshop->id,
            'status' => RegistrationStatus::Active,
        ]);

        $response = $this->postJson("/api/workshops/{$workshop->id}/registrations", [
            'attendee_name' => 'Overflow Attendee',
            'attendee_email' => 'overflow@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'capacity_exceeded');
    }

    public function test_cancelling_registration_frees_up_seat(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        Sanctum::actingAs($staff);

        $workshop = Workshop::factory()->create(['capacity' => 1]);

        $registration = Registration::factory()->create([
            'workshop_id' => $workshop->id,
            'status' => RegistrationStatus::Active,
        ]);

        // Workshop is currently full
        $this->getJson("/api/workshops/{$workshop->id}")
            ->assertJsonPath('data.available_seats', 0)
            ->assertJsonPath('data.is_full', true);

        // Cancel the registration
        $cancelResponse = $this->patchJson("/api/registrations/{$registration->id}/cancel");
        $cancelResponse->assertOk()
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.cancelled_by.id', $staff->id);

        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'status' => 'cancelled',
            'cancelled_by' => $staff->id,
        ]);

        // Workshop now has 1 available seat again
        $this->getJson("/api/workshops/{$workshop->id}")
            ->assertJsonPath('data.available_seats', 1)
            ->assertJsonPath('data.is_full', false);
    }
}
