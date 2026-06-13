<?php

namespace Tests\Feature\Api\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserLogoutTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test successful user logout.
     */
    public function test_user_can_logout_successfully(): void
    {
        // Arrange
        $user = User::factory()->create();

        // Act — Sanctum SPA mode: the session is authenticated, no bearer token.
        $response = $this->actingAs($user, 'api')
            ->postJson('/api/auth/logout');

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', trans('auth.logout_success'));
    }

    /**
     * Test that guest (unauthenticated) cannot log out.
     */
    public function test_guest_cannot_logout(): void
    {
        // Act
        $response = $this->postJson('/api/auth/logout');

        // Assert
        $response->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', trans('response.unauthenticated'));
    }
}
