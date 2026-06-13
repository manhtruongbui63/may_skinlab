<?php

namespace Tests\Feature\Api;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

class UserActivityLogTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that user creation logs the activity.
     */
    public function test_user_creation_is_logged_successfully(): void
    {
        // Act
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'status' => UserStatus::ACTIVE,
            'password' => 'secret-password',
        ]);

        // Assert
        $this->assertDatabaseHas('activity_log', [
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'event' => 'created',
        ]);

        $activity = Activity::latest()->first();

        $this->assertNotNull($activity);
        $this->assertEquals('created', $activity->event);
        $this->assertEquals($user->id, $activity->subject_id);

        $properties = $activity->attribute_changes->toArray();
        $this->assertArrayHasKey('attributes', $properties);

        $this->assertEquals('John Doe', $properties['attributes']['name']);
        $this->assertEquals('john@example.com', $properties['attributes']['email']);
        $this->assertEquals(UserStatus::ACTIVE->value, $properties['attributes']['status']);

        // Security Check: Password and remember_token MUST NOT be logged
        $this->assertArrayNotHasKey('password', $properties['attributes']);
        $this->assertArrayNotHasKey('remember_token', $properties['attributes']);
    }

    /**
     * Test that user update logs the dirty changes only.
     */
    public function test_user_update_is_logged_successfully(): void
    {
        // Arrange
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'status' => UserStatus::ACTIVE,
        ]);

        // Clear previous activity from creation to isolate update
        Activity::truncate();

        // Act
        $user->update([
            'name' => 'Jane Doe',
        ]);

        // Assert
        $this->assertDatabaseHas('activity_log', [
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'event' => 'updated',
        ]);

        $activity = Activity::latest()->first();
        $properties = $activity->attribute_changes->toArray();

        // Only dirty attributes should be logged
        $this->assertArrayHasKey('attributes', $properties);
        $this->assertArrayHasKey('old', $properties);

        $this->assertEquals('Jane Doe', $properties['attributes']['name']);
        $this->assertEquals('John Doe', $properties['old']['name']);

        // email and status did not change, so they should not be in the dirty log
        $this->assertArrayNotHasKey('email', $properties['attributes']);
        $this->assertArrayNotHasKey('status', $properties['attributes']);

        // Security Check: Password must not be logged
        $this->assertArrayNotHasKey('password', $properties['attributes']);
        $this->assertArrayNotHasKey('password', $properties['old']);
    }

    /**
     * Test that updating only password does not trigger activity log insertion.
     */
    public function test_password_update_does_not_log_anything(): void
    {
        // Arrange
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'status' => UserStatus::ACTIVE,
        ]);

        Activity::truncate();

        // Act
        $user->update([
            'password' => 'new-password-123',
        ]);

        // Assert: No activity logs should be generated because password is fully ignored
        $this->assertDatabaseCount('activity_log', 0);
    }
}
