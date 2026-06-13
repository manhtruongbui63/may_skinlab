<?php

namespace Tests\Feature\Api\Auth;

use App\Notifications\ResetPasswordNotification;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\RateLimiter;
use ReflectionProperty;
use Tests\TestCase;

class ForgotPasswordTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/auth/forgot-password';

    /**
     * A registered email issues exactly one hashed token and queues the mail.
     */
    public function test_registered_email_issues_hashed_token_and_queues_notification(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'jane@example.com']);

        $response = $this->postJson(self::ENDPOINT, ['email' => 'jane@example.com']);

        $response->assertStatus(200)->assertJsonPath('success', true);

        $rows = DB::table('password_reset_tokens')->where('email', 'jane@example.com')->get();
        $this->assertCount(1, $rows);

        // Token is stored as a sha256 hash (64 hex chars), never as plaintext.
        $stored = $rows->first()->token;
        $this->assertSame(64, strlen($stored));
        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $stored);

        Notification::assertSentTo($user, ResetPasswordNotification::class, function ($notification) use ($stored) {
            $plain = $this->extractToken($notification);

            // The plaintext in the mail must hash to exactly what we stored.
            return hash('sha256', $plain) === $stored && $plain !== $stored;
        });
    }

    /**
     * An unregistered email is rejected with a 422 and creates no token / mail.
     */
    public function test_unregistered_email_is_rejected(): void
    {
        Notification::fake();

        $response = $this->postJson(self::ENDPOINT, ['email' => 'ghost@example.com']);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email'])
            ->assertJsonPath('errors.email.0', trans('auth.reset.email_not_found'));
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'ghost@example.com']);
        Notification::assertNothingSent();
    }

    /**
     * A registered email succeeds while an unregistered one is rejected.
     */
    public function test_existing_email_succeeds_and_nonexistent_is_rejected(): void
    {
        Notification::fake();
        User::factory()->create(['email' => 'real@example.com']);

        $this->postJson(self::ENDPOINT, ['email' => 'real@example.com'])->assertStatus(200);
        $this->postJson(self::ENDPOINT, ['email' => 'nobody@example.com'])->assertStatus(422);
    }

    /**
     * A repeat request inside the 60s cooldown does not send a second mail.
     */
    public function test_second_call_within_cooldown_does_not_resend(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'cool@example.com']);

        $this->postJson(self::ENDPOINT, ['email' => 'cool@example.com'])->assertStatus(200);
        $this->postJson(self::ENDPOINT, ['email' => 'cool@example.com'])->assertStatus(200);

        Notification::assertSentToTimes($user, ResetPasswordNotification::class, 1);
    }

    /**
     * Repeated requests overwrite the single row instead of duplicating it.
     */
    public function test_keeps_one_active_token_per_email(): void
    {
        Notification::fake();
        User::factory()->create(['email' => 'one@example.com']);

        $this->postJson(self::ENDPOINT, ['email' => 'one@example.com'])->assertStatus(200);
        $first = DB::table('password_reset_tokens')->where('email', 'one@example.com')->value('token');

        // Move past the cooldown so the second request issues a fresh token.
        $this->travel(61)->seconds();
        $this->postJson(self::ENDPOINT, ['email' => 'one@example.com'])->assertStatus(200);

        $rows = DB::table('password_reset_tokens')->where('email', 'one@example.com')->get();
        $this->assertCount(1, $rows);
        $this->assertNotSame($first, $rows->first()->token);
    }

    /**
     * An invalid email format is rejected by validation.
     */
    public function test_invalid_email_format_returns_422(): void
    {
        $this->postJson(self::ENDPOINT, ['email' => 'not-an-email'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        $this->postJson(self::ENDPOINT, [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Exceeding the auth throttle returns 429.
     */
    public function test_exceeding_rate_limit_returns_429(): void
    {
        Notification::fake();
        // The 'auth' limiter is disabled under the testing env; re-enable it here
        // to assert the route is actually behind throttle:auth (10/min/IP).
        RateLimiter::for('auth', fn ($request) => Limit::perMinute(10)->by($request->ip()));

        $last = null;
        for ($i = 0; $i < 11; $i++) {
            $last = $this->postJson(self::ENDPOINT, ['email' => 'spam@example.com']);
        }

        $last->assertStatus(429);
    }

    /**
     * Read the private plaintext token carried by the notification.
     */
    private function extractToken(ResetPasswordNotification $notification): string
    {
        $property = new ReflectionProperty($notification, 'token');
        $property->setAccessible(true);

        return $property->getValue($notification);
    }
}
