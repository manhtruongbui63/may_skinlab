<?php

namespace Tests\Feature\Api\Auth;

use App\Notifications\PasswordChangedNotification;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class ResetPasswordTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/auth/reset-password';
    private const OLD_PASSWORD = 'OldSecurePass1!';
    private const NEW_PASSWORD = 'NewSecurePass2@';

    /**
     * A valid token resets the password, revokes sessions, deletes the token,
     * and queues the security-alert notification.
     */
    public function test_valid_token_resets_password_revokes_sessions_and_notifies(): void
    {
        Notification::fake();
        $user = $this->userWithToken('valid@example.com');
        $bearer = $user->createToken('device')->plainTextToken;
        $this->seedToken('valid@example.com', 'plain-token-abc');

        $response = $this->postJson(self::ENDPOINT, $this->payload('valid@example.com', 'plain-token-abc'));

        $response->assertStatus(200)->assertJsonPath('success', true);

        $user->refresh();
        $this->assertTrue(Hash::check(self::NEW_PASSWORD, $user->password));
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'valid@example.com']);
        $this->assertSame(0, $user->tokens()->count());

        // The previously issued access token must no longer authenticate.
        $this->withHeader('Authorization', 'Bearer ' . $bearer)
            ->getJson('/api/auth/me')
            ->assertStatus(401);

        Notification::assertSentTo($user, PasswordChangedNotification::class);
    }

    /**
     * After login can no longer use the old password, only the new one.
     */
    public function test_after_reset_login_works_only_with_new_password(): void
    {
        Notification::fake();
        $this->userWithToken('login@example.com');
        $this->seedToken('login@example.com', 'plain-token-login');

        $this->postJson(self::ENDPOINT, $this->payload('login@example.com', 'plain-token-login'))
            ->assertStatus(200);

        $this->postJson('/api/auth/login', ['email' => 'login@example.com', 'password' => self::OLD_PASSWORD])
            ->assertStatus(401);
        $this->postJson('/api/auth/login', ['email' => 'login@example.com', 'password' => self::NEW_PASSWORD])
            ->assertStatus(200);
    }

    /**
     * A consumed token cannot be reused (single-use).
     */
    public function test_reused_token_is_rejected(): void
    {
        Notification::fake();
        $this->userWithToken('reuse@example.com');
        $this->seedToken('reuse@example.com', 'plain-token-reuse');

        $this->postJson(self::ENDPOINT, $this->payload('reuse@example.com', 'plain-token-reuse'))
            ->assertStatus(200);

        $this->postJson(self::ENDPOINT, $this->payload('reuse@example.com', 'plain-token-reuse'))
            ->assertStatus(422)
            ->assertJsonPath('errors.token.0', trans('auth.reset.invalid_token'));
    }

    /**
     * An expired token is rejected and the stale row is deleted.
     */
    public function test_expired_token_is_rejected_and_row_deleted(): void
    {
        Notification::fake();
        $this->userWithToken('expired@example.com');
        $this->seedToken('expired@example.com', 'plain-token-old', Carbon::now()->subMinutes(61));

        $this->postJson(self::ENDPOINT, $this->payload('expired@example.com', 'plain-token-old'))
            ->assertStatus(422)
            ->assertJsonPath('errors.token.0', trans('auth.reset.expired_token'));

        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'expired@example.com']);
    }

    /**
     * A forged/incorrect token is rejected without consuming the real one.
     */
    public function test_forged_token_is_rejected(): void
    {
        Notification::fake();
        $this->userWithToken('forge@example.com');
        $this->seedToken('forge@example.com', 'the-real-token');

        $this->postJson(self::ENDPOINT, $this->payload('forge@example.com', 'a-wrong-token'))
            ->assertStatus(422)
            ->assertJsonPath('errors.token.0', trans('auth.reset.invalid_token'));

        $this->assertDatabaseHas('password_reset_tokens', ['email' => 'forge@example.com']);
    }

    /**
     * A non-existent token row yields the uniform invalid-token error.
     */
    public function test_missing_token_row_is_rejected(): void
    {
        Notification::fake();
        $this->userWithToken('notoken@example.com');

        $this->postJson(self::ENDPOINT, $this->payload('notoken@example.com', 'whatever'))
            ->assertStatus(422)
            ->assertJsonPath('errors.token.0', trans('auth.reset.invalid_token'));
    }

    /**
     * Password policy violations are rejected by validation (no token consumed).
     */
    public function test_short_or_unconfirmed_password_returns_422(): void
    {
        Notification::fake();
        $this->userWithToken('policy@example.com');
        $this->seedToken('policy@example.com', 'plain-token-policy');

        // Too short.
        $this->postJson(self::ENDPOINT, [
            'email' => 'policy@example.com',
            'token' => 'plain-token-policy',
            'password' => 'short',
            'password_confirmation' => 'short',
        ])->assertStatus(422)->assertJsonValidationErrors(['password']);

        // Confirmation mismatch.
        $this->postJson(self::ENDPOINT, [
            'email' => 'policy@example.com',
            'token' => 'plain-token-policy',
            'password' => self::NEW_PASSWORD,
            'password_confirmation' => 'DifferentPass9#',
        ])->assertStatus(422)->assertJsonValidationErrors(['password']);

        // The token must remain unused after validation failures.
        $this->assertDatabaseHas('password_reset_tokens', ['email' => 'policy@example.com']);
    }

    /**
     * Reusing the current password is rejected by the must-differ rule.
     */
    public function test_same_as_current_password_is_rejected(): void
    {
        Notification::fake();
        $this->userWithToken('same@example.com');
        $this->seedToken('same@example.com', 'plain-token-same');

        $this->postJson(self::ENDPOINT, [
            'email' => 'same@example.com',
            'token' => 'plain-token-same',
            'password' => self::OLD_PASSWORD,
            'password_confirmation' => self::OLD_PASSWORD,
        ])->assertStatus(422)->assertJsonPath('errors.password.0', trans('auth.reset.same_password'));
    }

    /**
     * Exceeding the auth throttle returns 429.
     */
    public function test_exceeding_rate_limit_returns_429(): void
    {
        RateLimiter::for('auth', fn ($request) => Limit::perMinute(10)->by($request->ip()));

        $last = null;
        for ($i = 0; $i < 11; $i++) {
            $last = $this->postJson(self::ENDPOINT, $this->payload('rate@example.com', 'x'));
        }

        $last->assertStatus(429);
    }

    /**
     * Create an active user with the known old password.
     */
    private function userWithToken(string $email): User
    {
        return User::factory()->create([
            'email' => $email,
            'password' => Hash::make(self::OLD_PASSWORD),
        ]);
    }

    /**
     * Seed a password_reset_tokens row with the sha256 of the given plaintext.
     */
    private function seedToken(string $email, string $plain, ?Carbon $createdAt = null): void
    {
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => hash('sha256', $plain),
                'created_at' => $createdAt ?? Carbon::now(),
            ],
        );
    }

    /**
     * Build a valid reset payload setting the new password.
     *
     * @return array<string, string>
     */
    private function payload(string $email, string $token): array
    {
        return [
            'email' => $email,
            'token' => $token,
            'password' => self::NEW_PASSWORD,
            'password_confirmation' => self::NEW_PASSWORD,
        ];
    }
}
