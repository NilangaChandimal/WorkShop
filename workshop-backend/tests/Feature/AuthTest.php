<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'staff@workshop.test',
            'password' => 'password123',
            'role' => Role::Staff,
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'staff@workshop.test',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'name', 'email', 'role', 'is_active'],
            ])
            ->assertJsonPath('user.email', 'staff@workshop.test')
            ->assertJsonPath('user.role', 'staff');
    }

    public function test_user_cannot_login_with_invalid_password(): void
    {
        User::factory()->create([
            'email' => 'staff@workshop.test',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'staff@workshop.test',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_inactive_user_cannot_login(): void
    {
        User::factory()->create([
            'email' => 'inactive@workshop.test',
            'password' => 'password123',
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'inactive@workshop.test',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_user_can_access_me_and_logout(): void
    {
        $user = User::factory()->create(['role' => Role::Staff]);
        $token = $user->createToken('test-token')->plainTextToken;

        $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/me');

        $meResponse->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email);

        $logoutResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/logout');

        $logoutResponse->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
