<?php

namespace Tests\Feature\Api\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserLoginTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test successful login.
     */
    public function test_user_can_login_successfully(): void
    {
        // Arrange
        $password = 'SecurePass123!';
        $user = User::factory()->create([
            'email' => 'user@example.com',
            'password' => Hash::make($password),
        ]);

        $payload = [
            'email' => 'USER@example.com', // Case insensitivity check
            'password' => $password,
        ];

        // Act
        $response = $this->postJson('/api/auth/login', $payload);

        // Assert — Sanctum SPA mode: login authenticates the session and returns
        // the current user (MeResource) instead of a bearer token.
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', 'user@example.com')
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'name',
                    'email',
                    'status',
                    'roles',
                    'permissions',
                ],
            ]);
        $this->assertAuthenticatedAs($user, 'web');
    }

    /**
     * Test validation fails when required fields are missing.
     */
    public function test_login_fails_when_required_fields_are_missing(): void
    {
        // Arrange
        $payload = [];

        // Act
        $response = $this->postJson('/api/auth/login', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    /**
     * Test validation fails when email format is invalid.
     */
    public function test_login_fails_when_email_format_is_invalid(): void
    {
        // Arrange
        $payload = [
            'email' => 'invalid-email-format',
            'password' => 'SecurePass123!',
        ];

        // Act
        $response = $this->postJson('/api/auth/login', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test validation fails when fields exceed maximum lengths.
     */
    public function test_login_fails_when_fields_exceed_max_lengths(): void
    {
        // Arrange
        $maxEmail = config('validate.max_length.email');
        $maxPassword = config('validate.max_length.password');

        $payload = [
            'email' => str_repeat('a', $maxEmail - 8) . '@test.com', // total maxEmail + 1
            'password' => str_repeat('p', $maxPassword + 1),
        ];

        // Act
        $response = $this->postJson('/api/auth/login', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    /**
     * Test login fails with wrong credentials.
     */
    public function test_login_fails_with_wrong_credentials(): void
    {
        // Arrange
        $user = User::factory()->create([
            'email' => 'user@example.com',
            'password' => Hash::make('CorrectPassword123!'),
        ]);

        $payload = [
            'email' => 'user@example.com',
            'password' => 'WrongPassword123!',
        ];

        // Act
        $response = $this->postJson('/api/auth/login', $payload);

        // Assert
        $response->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', trans('auth.failed'));
    }

    /**
     * Test throttling lockout when attempts exceed maximum allowed logins.
     */
    public function test_login_rate_limiting_lockout(): void
    {
        // Arrange
        $email = 'user@example.com';
        $payload = [
            'email' => $email,
            'password' => 'WrongPassword123!',
        ];

        // 4 failed attempts should return 401 Unauthorized
        for ($i = 0; $i < 4; $i++) {
            $response = $this->postJson('/api/auth/login', $payload);
            $response->assertStatus(401);
        }

        // 5th failed attempt should trigger lockout immediately and return 400 Bad Request
        $response5 = $this->postJson('/api/auth/login', $payload);
        $response5->assertStatus(400)
            ->assertJsonPath('success', false);

        // 6th attempt should also return 400 Bad Request (Rate Limiter blocked)
        $response6 = $this->postJson('/api/auth/login', $payload);
        $response6->assertStatus(400)
            ->assertJsonPath('success', false);
    }
}
