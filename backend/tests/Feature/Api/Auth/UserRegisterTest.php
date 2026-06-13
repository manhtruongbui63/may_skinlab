<?php

namespace Tests\Feature\Api\Auth;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

class UserRegisterTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test successful user registration.
     */
    public function test_user_can_register_successfully(): void
    {
        // Arrange
        $payload = [
            'name' => 'Alice Smith',
            'email' => 'ALICE@example.com',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ];

        // Act
        $response = $this->postJson('/api/auth/register', $payload);

        // Assert — register returns the safe MeResource (no raw model fields).
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', trans('auth.register_success'))
            ->assertJsonPath('data.email', 'alice@example.com')
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

        // Assert Database State
        $this->assertDatabaseHas('users', [
            'name' => 'Alice Smith',
            'email' => 'alice@example.com', // Always lowercased
            'status' => UserStatus::ACTIVE->value,
        ]);

        // Verify password was hashed correctly
        $user = User::where('email', 'alice@example.com')->first();
        $this->assertTrue(Hash::check('SecurePass123!', $user->password));

        // Assert Activity Log was created (BR-G002)
        $this->assertDatabaseHas('activity_log', [
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'event' => 'created',
        ]);

        $activity = Activity::latest()->first();
        $this->assertNotNull($activity);
        $properties = $activity->attribute_changes->toArray();

        // Verify no sensitive fields logged
        $this->assertArrayNotHasKey('password', $properties['attributes']);
        $this->assertArrayNotHasKey('remember_token', $properties['attributes']);
    }

    /**
     * Test that validation fails when required fields are missing.
     */
    public function test_register_fails_when_required_fields_are_missing(): void
    {
        // Arrange
        $payload = [];

        // Act
        $response = $this->postJson('/api/auth/register', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    /**
     * Test that validation fails when input formats are invalid.
     */
    public function test_register_fails_when_input_formats_are_invalid(): void
    {
        // Arrange
        $payload = [
            'name' => 'Alice Smith',
            'email' => 'invalid-email-format',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ];

        // Act
        $response = $this->postJson('/api/auth/register', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test that validation fails when password does not meet complexity requirements.
     */
    public function test_register_fails_when_password_does_not_meet_complexity(): void
    {
        $invalidPasswords = [
            'short' => 'Aa1!',                     // Too short (< 6 chars) BVA min
            'no_digit' => 'SecurePass!',           // No digit
            'no_lowercase' => 'SECUREPASS123!',    // No lowercase
            'no_uppercase' => 'securepass123!',    // No uppercase
            'no_special' => 'SecurePass123',       // No special char
            'too_long' => str_repeat('A', 30) . 'a1!', // Too long (> 32 chars) BVA max
        ];

        foreach ($invalidPasswords as $key => $password) {
            $payload = [
                'name' => 'Alice Smith',
                'email' => "alice_{$key}@example.com",
                'password' => $password,
                'password_confirmation' => $password,
            ];

            $response = $this->postJson('/api/auth/register', $payload);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['password']);
        }
    }

    /**
     * Test that validation fails when password is not confirmed.
     */
    public function test_register_fails_when_password_is_not_confirmed(): void
    {
        // Arrange
        $payload = [
            'name' => 'Alice Smith',
            'email' => 'alice@example.com',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'DifferentPass123!',
        ];

        // Act
        $response = $this->postJson('/api/auth/register', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /**
     * Test that validation fails when fields exceed maximum lengths.
     */
    public function test_register_fails_when_fields_exceed_max_lengths(): void
    {
        // Arrange
        $maxName = config('validate.max_length.name');
        $maxEmail = config('validate.max_length.email');

        $payload = [
            'name' => str_repeat('A', $maxName + 1),
            'email' => str_repeat('a', $maxEmail - 8) . '@test.com', // total maxEmail + 1
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ];

        // Act
        $response = $this->postJson('/api/auth/register', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email']);
    }

    /**
     * Test that registration fails when the email already exists in database.
     */
    public function test_register_fails_when_email_already_exists(): void
    {
        // Arrange
        User::factory()->create([
            'email' => 'existing@example.com',
        ]);

        $payload = [
            'name' => 'Alice Smith',
            'email' => 'EXISTING@example.com', // case insensitivity check
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ];

        // Act
        $response = $this->postJson('/api/auth/register', $payload);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}
