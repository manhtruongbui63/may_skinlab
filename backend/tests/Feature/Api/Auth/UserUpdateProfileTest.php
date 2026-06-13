<?php

namespace Tests\Feature\Api\Auth;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserUpdateProfileTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that an authenticated user can update their profile successfully.
     */
    public function test_user_can_update_profile_successfully(): void
    {
        // Arrange
        $user = User::factory()->create([
            'name' => 'Original Name',
            'status' => UserStatus::ACTIVE,
        ]);

        $payload = [
            'name' => 'Updated Name',
        ];

        // Act
        $response = $this->actingAs($user, 'api')
            ->postJson('/api/auth/profile', $payload);

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', trans('response.update_successfully'))
            ->assertJsonPath('data', 1); // Service returns 1 (affected rows)

        // Verify changes are in database
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
        ]);
    }

    /**
     * Test that profile update fails when required name is missing.
     */
    public function test_update_profile_fails_when_name_is_missing(): void
    {
        // Arrange
        $user = User::factory()->create([
            'status' => UserStatus::ACTIVE,
        ]);

        $payload = [];

        // Act
        $response = $this->actingAs($user, 'api')
            ->postJson('/api/auth/profile', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    /**
     * Test that profile update fails when name is not a string.
     */
    public function test_update_profile_fails_when_name_is_not_string(): void
    {
        // Arrange
        $user = User::factory()->create([
            'status' => UserStatus::ACTIVE,
        ]);

        $payload = [
            'name' => ['invalid', 'array'],
        ];

        // Act
        $response = $this->actingAs($user, 'api')
            ->postJson('/api/auth/profile', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    /**
     * Test that profile update fails when name exceeds max length (50 characters).
     */
    public function test_update_profile_fails_when_name_exceeds_max_length(): void
    {
        // Arrange
        $user = User::factory()->create([
            'status' => UserStatus::ACTIVE,
        ]);

        $maxName = config('validate.max_length.name');
        $payload = [
            'name' => str_repeat('A', $maxName + 1), // 51 characters
        ];

        // Act
        $response = $this->actingAs($user, 'api')
            ->postJson('/api/auth/profile', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    /**
     * Test that profile update fails when user status is INACTIVE.
     */
    public function test_update_profile_fails_when_user_is_inactive(): void
    {
        // Arrange
        $user = User::factory()->create([
            'status' => UserStatus::INACTIVE,
        ]);

        $payload = [
            'name' => 'New Name',
        ];

        // Act
        $response = $this->actingAs($user, 'api')
            ->postJson('/api/auth/profile', $payload);

        // Assert
        // AuthService throws InputException which maps to 400 Bad Request
        $response->assertStatus(400)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', trans('response.invalid'));
    }

    /**
     * Test that an unauthenticated guest cannot update user profile.
     */
    public function test_guest_cannot_update_profile(): void
    {
        // Arrange
        $payload = [
            'name' => 'New Name',
        ];

        // Act
        $response = $this->postJson('/api/auth/profile', $payload);

        // Assert
        $response->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', trans('response.unauthenticated'));
    }
}
