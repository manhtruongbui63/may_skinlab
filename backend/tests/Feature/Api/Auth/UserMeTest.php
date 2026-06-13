<?php

namespace Tests\Feature\Api\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserMeTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that an authenticated user can retrieve their profile details.
     */
    public function test_user_can_retrieve_profile_successfully(): void
    {
        // Arrange
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        // Act
        $response = $this->actingAs($user, 'api')
            ->getJson('/api/auth/me');

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
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
            ])
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.name', 'John Doe')
            ->assertJsonPath('data.email', 'john@example.com');
    }

    /**
     * Test that an unauthenticated guest cannot retrieve user profile.
     */
    public function test_guest_cannot_retrieve_profile(): void
    {
        // Act
        $response = $this->getJson('/api/auth/me');

        // Assert
        $response->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', trans('response.unauthenticated'));
    }

    /**
     * A guest request without an `Accept: application/json` header (e.g. typing
     * the URL into a browser, or a logged-out SPA tab making a non-XHR call)
     * must still get a clean 401 — not a 500 from the Authenticate middleware
     * trying to redirect to a non-existent `login` route.
     */
    public function test_guest_without_json_accept_header_gets_401_not_500(): void
    {
        // Act — no Accept: application/json, so expectsJson() is false.
        $response = $this->get('/api/auth/me', ['Accept' => 'text/html']);

        // Assert
        $response->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', trans('response.unauthenticated'));
    }
}
