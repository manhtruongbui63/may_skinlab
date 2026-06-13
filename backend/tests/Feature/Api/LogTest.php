<?php

namespace Tests\Feature\Api;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class LogTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_ingest_a_batch_of_client_logs(): void
    {
        // Arrange
        Log::shouldReceive('channel')->with('frontend')->andReturnSelf();
        Log::shouldReceive('log')->twice();

        // Act
        $response = $this->postJson('/api/logs', [
            'logs' => [
                ['level' => 'error', 'message' => 'Boom', 'context' => ['url' => '/login']],
                ['level' => 'info', 'message' => 'Loaded', 'timestamp' => '2026-06-03T10:00:00.000Z'],
            ],
        ]);

        // Assert
        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_enriches_entries_with_authenticated_user_id(): void
    {
        $user = User::factory()->create(['status' => UserStatus::ACTIVE->value]);

        Log::shouldReceive('channel')->with('frontend')->andReturnSelf();
        Log::shouldReceive('log')
            ->once()
            ->withArgs(function ($level, $message, $context) use ($user) {
                return $level === 'warning'
                    && $message === 'Something'
                    && $context['source'] === 'frontend'
                    && $context['user_id'] === $user->id;
            });

        $this->actingAs($user)
            ->postJson('/api/logs', [
                'logs' => [['level' => 'warning', 'message' => 'Something']],
            ])
            ->assertStatus(200);
    }

    public function test_rejects_invalid_log_level(): void
    {
        $response = $this->postJson('/api/logs', [
            'logs' => [['level' => 'verbose', 'message' => 'Nope']],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('logs.0.level');
    }

    public function test_requires_at_least_one_entry(): void
    {
        $response = $this->postJson('/api/logs', ['logs' => []]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('logs');
    }

    public function test_requires_a_message(): void
    {
        $response = $this->postJson('/api/logs', [
            'logs' => [['level' => 'error']],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('logs.0.message');
    }
}
