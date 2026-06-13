<?php

namespace App\Services\Api;

use App\DTOs\Api\Auth\ChangePasswordData;
use App\DTOs\Api\Auth\ForgotPasswordData;
use App\DTOs\Api\Auth\LoginData;
use App\DTOs\Api\Auth\RegisterData;
use App\DTOs\Api\Auth\ResetPasswordData;
use App\DTOs\Api\Auth\UpdateProfileData;
use App\Exceptions\InputException;
use App\Models\User;
use App\Enums\UserStatus;
use App\Notifications\PasswordChangedNotification;
use App\Notifications\ResetPasswordNotification;
use App\Services\Base\Service;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthService extends Service
{
    /**
     * Minutes a reset token stays valid, counted from its created_at.
     */
    public const TOKEN_TTL_MINUTES = 60;

    /**
     * Seconds before the same email may trigger another reset mail.
     */
    private const TOKEN_COOLDOWN_SECONDS = 60;

    /**
     * Length of the random plaintext reset token.
     */
    private const TOKEN_LENGTH = 64;

    /**
     * Attempt a first-party SPA login against the session (web) guard.
     *
     * Returns the authenticated user on success, or null on bad credentials /
     * a deactivated account (both yield the same response, so disabled accounts
     * are not enumerable). The caller is responsible for regenerating the session.
     *
     * @param LoginData $dto
     * @return User|null
     */
    public function attemptLogin(LoginData $dto): ?User
    {
        $credentials = [
            'email' => Str::lower($dto->email),
            'password' => $dto->password,
        ];

        // Login always uses 'web' guard for session-based authentication
        if (! Auth::guard('web')->attempt($credentials)) {
            return null;
        }

        /** @var User $user */
        $user = Auth::guard('web')->user();

        if ($user->status === UserStatus::INACTIVE) {
            Auth::guard('web')->logout();

            return null;
        }

        return $user;
    }

    /**
     * Register
     *
     * @param RegisterData $dto
     * @return User
     * @throws InputException
     */
    public function register(RegisterData $dto): User
    {
        $newUser = User::query()->create([
            'name' => $dto->name,
            'email' => Str::lower($dto->email),
            'password' => Hash::make($dto->password),
            'status' => UserStatus::ACTIVE,
        ]);

        if (!$newUser) {
            throw new InputException(trans('auth.register_fail'));
        }

        return $newUser;
    }

    /**
     * Update profile
     *
     * @param UpdateProfileData $dto
     * @return int
     * @throws InputException
     */
    public function update(UpdateProfileData $dto): int
    {
        $user = $this->user;
        if (!$user) {
            throw new InputException(trans('response.not_found'));
        }

        if ($user->status == UserStatus::INACTIVE) {
            throw new InputException(trans('response.invalid'));
        }

        return User::query()
            ->where('id', '=', $user->id)
            ->update(['name' => $dto->name]);
    }

    /**
     * Change Password
     *
     * @param ChangePasswordData $dto
     * @return bool
     * @throws InputException
     */
    public function changePassword(ChangePasswordData $dto): bool
    {
        $user = $this->user;
        if (!$user) {
            throw new InputException(trans('response.not_found'));
        }

        if (!Hash::check($dto->currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => [trans('auth.password')],
            ]);
        }

        $user->update([
            'password' => Hash::make($dto->password),
        ]);

        // Revoke every existing access token so any session opened with the old
        // password (including a stolen one) can no longer authenticate.
        $user->tokens()->delete();

        return true;
    }

    /**
     * Issue a password-reset link for the given email.
     *
     * Always completes silently: callers must return an identical response
     * whether or not the email is registered (enumeration protection).
     *
     * @param ForgotPasswordData $dto
     * @return void
     */
    public function sendResetLink(ForgotPasswordData $dto): void
    {
        $email = Str::lower($dto->email);
        $user = User::query()->where('email', '=', $email)->first();

        // No account, or a fresh token was just issued: do nothing, but the
        // controller still returns the uniform success response.
        if (! $user || $this->isWithinCooldown($email)) {
            return;
        }

        $plain = Str::random(self::TOKEN_LENGTH);

        // updateOrInsert keyed by the email PK is atomic, so concurrent requests
        // for the same email overwrite one row instead of duplicating it.
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => hash('sha256', $plain),
                'created_at' => now(),
            ],
        );

        $user->notify(new ResetPasswordNotification($plain));
    }

    /**
     * Verify a reset token and set a new password.
     *
     * @param ResetPasswordData $dto
     * @return void
     * @throws ValidationException
     */
    public function resetPassword(ResetPasswordData $dto): void
    {
        $email = Str::lower($dto->email);
        $row = DB::table('password_reset_tokens')->where('email', '=', $email)->first();

        if (! $row || ! hash_equals($row->token, hash('sha256', $dto->token))) {
            throw $this->invalidTokenException();
        }

        // Expiry is handled before the transaction so deleting the stale row is
        // not rolled back by the exception we throw right after.
        if ($this->isTokenExpired($row->created_at)) {
            DB::table('password_reset_tokens')->where('email', '=', $email)->delete();

            throw ValidationException::withMessages([
                'token' => [trans('auth.reset.expired_token')],
            ]);
        }

        DB::beginTransaction();
        try {
            $user = $this->applyNewPassword($dto, $email);

            DB::commit();
        } catch (Throwable $e) {
            DB::rollBack();

            throw $e;
        }

        $user->notify(new PasswordChangedNotification());
    }

    /**
     * Consume the token under a row lock and persist the new password.
     *
     * @param ResetPasswordData $dto
     * @param string $email
     * @return User
     * @throws ValidationException
     */
    private function applyNewPassword(ResetPasswordData $dto, string $email): User
    {
        // Re-read under a row lock: a concurrent reset may have consumed the
        // single-use token between the pre-check and here.
        $row = DB::table('password_reset_tokens')
            ->where('email', '=', $email)
            ->lockForUpdate()
            ->first();

        if (! $row || ! hash_equals($row->token, hash('sha256', $dto->token))) {
            throw $this->invalidTokenException();
        }

        $user = User::query()->where('email', '=', $email)->first();
        if (! $user) {
            throw $this->invalidTokenException();
        }

        if (Hash::check($dto->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => [trans('auth.reset.same_password')],
            ]);
        }

        $user->update(['password' => Hash::make($dto->password)]);
        $user->tokens()->delete();
        DB::table('password_reset_tokens')->where('email', '=', $email)->delete();

        return $user;
    }

    /**
     * Whether the email's existing token is still inside the cooldown window.
     *
     * @param string $email
     * @return bool
     */
    private function isWithinCooldown(string $email): bool
    {
        $row = DB::table('password_reset_tokens')->where('email', '=', $email)->first();

        if (! $row || ! $row->created_at) {
            return false;
        }

        return Carbon::parse($row->created_at)->gt(now()->subSeconds(self::TOKEN_COOLDOWN_SECONDS));
    }

    /**
     * Whether a token created at the given time has passed its TTL.
     *
     * @param string|null $createdAt
     * @return bool
     */
    private function isTokenExpired(?string $createdAt): bool
    {
        if (! $createdAt) {
            return true;
        }

        return Carbon::parse($createdAt)->addMinutes(self::TOKEN_TTL_MINUTES)->isPast();
    }

    /**
     * Build the uniform invalid-token validation error.
     *
     * @return ValidationException
     */
    private function invalidTokenException(): ValidationException
    {
        return ValidationException::withMessages([
            'token' => [trans('auth.reset.invalid_token')],
        ]);
    }
}
