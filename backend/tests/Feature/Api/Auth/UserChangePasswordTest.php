<?php

namespace Tests\Feature\Api\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test successful password change for an authenticated user.
     */
    public function test_user_can_change_password_successfully(): void
    {
        // Arrange
        $user = User::factory()->create([
            'password' => Hash::make('OldSecurePass1!'),
        ]);

        $payload = [
            'current_password' => 'OldSecurePass1!',
            'password' => 'NewSecurePass2@',
            'password_confirmation' => 'NewSecurePass2@',
        ];

        // Act
        $response = $this->actingAs($user, 'api')
            ->postJson('/api/auth/change-password', $payload);

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data', true);

        // Refresh user and verify new password works
        $user->refresh();
        $this->assertTrue(Hash::check('NewSecurePass2@', $user->password));
        $this->assertFalse(Hash::check('OldSecurePass1!', $user->password));
    }

    /**
     * Test that password change fails when required fields are missing.
     */
    public function test_change_password_fails_when_required_fields_are_missing(): void
    {
        // Arrange
        $user = User::factory()->create();

        $payload = [];

        // Act
        $response = $this->actingAs($user, 'api')
            ->postJson('/api/auth/change-password', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password', 'password']);
    }

    /**
     * Test that password change fails when password confirmation does not match.
     */
    public function test_change_password_fails_when_password_is_not_confirmed(): void
    {
        // Arrange
        $user = User::factory()->create([
            'password' => Hash::make('OldSecurePass1!'),
        ]);

        $payload = [
            'current_password' => 'OldSecurePass1!',
            'password' => 'NewSecurePass2@',
            'password_confirmation' => 'DifferentPass1!',
        ];

        // Act
        $response = $this->actingAs($user, 'api')
            ->postJson('/api/auth/change-password', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /**
     * Test that password change fails when new password does not meet complexity requirements.
     */
    public function test_change_password_fails_when_new_password_does_not_meet_complexity(): void
    {
        // Arrange
        $user = User::factory()->create([
            'password' => Hash::make('OldSecurePass1!'),
        ]);

        $invalidPasswords = [
            'short' => 'Aa1!',                     // Too short (< 6 chars)
            'no_digit' => 'SecurePass!',           // No digit
            'no_lowercase' => 'SECUREPASS123!',    // No lowercase
            'no_uppercase' => 'securepass123!',    // No uppercase
            'no_special' => 'SecurePass123',       // No special char
            'too_long' => str_repeat('A', 30) . 'a1!', // Too long (> 32 chars)
        ];

        foreach ($invalidPasswords as $key => $password) {
            $payload = [
                'current_password' => 'OldSecurePass1!',
                'password' => $password,
                'password_confirmation' => $password,
            ];

            // Act
            $response = $this->actingAs($user, 'api')
                ->postJson('/api/auth/change-password', $payload);

            // Assert
            $response->assertStatus(422)
                ->assertJsonValidationErrors(['password']);
        }
    }

    /**
     * Test that password change fails when current password is incorrect.
     */
    public function test_change_password_fails_when_current_password_is_wrong(): void
    {
        // Arrange
        $user = User::factory()->create([
            'password' => Hash::make('OldSecurePass1!'),
        ]);

        $payload = [
            'current_password' => 'WrongOldPass1!',
            'password' => 'NewSecurePass2@',
            'password_confirmation' => 'NewSecurePass2@',
        ];

        // Act
        $response = $this->actingAs($user, 'api')
            ->postJson('/api/auth/change-password', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    /**
     * Test that an unauthenticated guest cannot change password.
     */
    public function test_guest_cannot_change_password(): void
    {
        // Arrange
        $payload = [
            'current_password' => 'OldSecurePass1!',
            'password' => 'NewSecurePass2@',
            'password_confirmation' => 'NewSecurePass2@',
        ];

        // Act
        $response = $this->postJson('/api/auth/change-password', $payload);

        // Assert
        $response->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', trans('response.unauthenticated'));
    }
}
