<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Enums\WorkshopStatus;
use App\Models\Registration;
use App\Models\User;
use App\Models\Workshop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkshopTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_filter_workshops_by_search_and_seats(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        Sanctum::actingAs($staff);

        Workshop::factory()->create([
            'title' => 'React Fundamentals',
            'location' => 'Room 101',
            'capacity' => 10,
        ]);

        $fullWorkshop = Workshop::factory()->create([
            'title' => 'Advanced Python',
            'location' => 'Lab B',
            'capacity' => 2,
        ]);

        Registration::factory()->count(2)->create([
            'workshop_id' => $fullWorkshop->id,
            'status' => 'active',
        ]);

        // Past/expired workshop with 0 attendees (unregistered capacity)
        Workshop::factory()->past()->create([
            'title' => 'Expired Past Workshop',
            'capacity' => 10,
        ]);

        // Search test
        $searchResponse = $this->getJson('/api/workshops?search=React');
        $searchResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'React Fundamentals');

        // has_seats filter: full workshop excluded
        $seatsResponse = $this->getJson('/api/workshops?has_seats=1');
        $seatsResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'React Fundamentals');
    }

    public function test_manager_cannot_reduce_capacity_below_active_registrations(): void
    {
        $manager = User::factory()->create(['role' => Role::Manager]);
        Sanctum::actingAs($manager);

        $workshop = Workshop::factory()->create(['capacity' => 10]);

        Registration::factory()->count(6)->create([
            'workshop_id' => $workshop->id,
            'status' => 'active',
        ]);

        // Trying to lower capacity to 5 when 6 are active
        $response = $this->putJson("/api/workshops/{$workshop->id}", [
            'capacity' => 5,
        ]);

        $response->assertStatus(422);

        // Lowering to 6 or above should succeed
        $validResponse = $this->putJson("/api/workshops/{$workshop->id}", [
            'capacity' => 6,
        ]);

        $validResponse->assertOk()
            ->assertJsonPath('data.capacity', 6);
    }
}
