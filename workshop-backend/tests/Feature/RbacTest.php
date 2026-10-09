<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use App\Models\Workshop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RbacTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_unauthorized(): void
    {
        $this->getJson('/api/workshops')->assertUnauthorized();
        $this->getJson('/api/users')->assertUnauthorized();
        $this->getJson('/api/registrations')->assertUnauthorized();
    }

    public function test_staff_cannot_manage_users_or_create_workshops(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        Sanctum::actingAs($staff);

        $this->getJson('/api/users')->assertForbidden();

        $this->postJson('/api/workshops', [
            'title' => 'Forbidden Workshop',
            'starts_at' => now()->addDays(2)->toDateTimeString(),
            'ends_at' => now()->addDays(2)->addHours(2)->toDateTimeString(),
            'capacity' => 10,
        ])->assertForbidden();
    }

    public function test_manager_cannot_access_user_management(): void
    {
        $manager = User::factory()->create(['role' => Role::Manager]);
        Sanctum::actingAs($manager);

        $this->getJson('/api/users')->assertForbidden();
        $this->postJson('/api/users', [
            'name' => 'New Guy',
            'email' => 'new@test.com',
            'password' => 'password123',
            'role' => 'staff',
        ])->assertForbidden();
    }

    public function test_manager_can_create_and_update_workshops(): void
    {
        $manager = User::factory()->create(['role' => Role::Manager]);
        Sanctum::actingAs($manager);

        $response = $this->postJson('/api/workshops', [
            'title' => 'Vue 3 Deep Dive',
            'starts_at' => now()->addDays(5)->toDateTimeString(),
            'ends_at' => now()->addDays(5)->addHours(3)->toDateTimeString(),
            'capacity' => 25,
            'status' => 'scheduled',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.title', 'Vue 3 Deep Dive')
            ->assertJsonPath('data.capacity', 25);

        $workshopId = $response->json('data.id');

        $updateResponse = $this->putJson("/api/workshops/{$workshopId}", [
            'capacity' => 30,
        ]);

        $updateResponse->assertOk()
            ->assertJsonPath('data.capacity', 30);
    }

    public function test_admin_can_manage_users(): void
    {
        $admin = User::factory()->create(['role' => Role::Admin]);
        Sanctum::actingAs($admin);

        $listResponse = $this->getJson('/api/users');
        $listResponse->assertOk();

        $createResponse = $this->postJson('/api/users', [
            'name' => 'Dev Staff',
            'email' => 'devstaff@workshop.test',
            'password' => 'secret1234',
            'role' => 'staff',
            'is_active' => true,
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('data.email', 'devstaff@workshop.test')
            ->assertJsonPath('data.role', 'staff');
    }
}
