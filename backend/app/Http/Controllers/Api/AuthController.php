<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Helpers\ResponseHelper;
use Illuminate\Http\JsonResponse;
use App\Exceptions\InputException;
use Illuminate\Validation\ValidationException;
use App\Factories\ApiFactory;
use App\DTOs\Api\Auth\LoginData;
use App\DTOs\Api\Auth\RegisterData;
use App\DTOs\Api\Auth\UpdateProfileData;
use App\DTOs\Api\Auth\ChangePasswordData;
use App\DTOs\Api\Auth\ForgotPasswordData;
use App\DTOs\Api\Auth\ResetPasswordData;
use App\Http\Resources\Auth\MeResource;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Controllers\Traits\HasRateLimiter;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;

class AuthController extends BaseController
{
    use HasRateLimiter;

    public const MAX_ATTEMPTS_LOGIN = 5;
    public const DECAY_SECONDS = 60;

    /**
     * AuthController constructor.
     */
    public function __construct()
    {
        $this->middleware($this->authMiddleware())->except(['login', 'register', 'forgotPassword', 'resetPassword']);
    }

    /**
     * Register
     * @unauthenticated
     *
     * @param RegisterRequest $request
     * @return JsonResponse
     * @throws InputException
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $dto = RegisterData::from($request->validated());
        $user = ApiFactory::getAuthService()
            ->withGuard($this->getGuard())
            ->register($dto);

        return $this->sendSuccessResponse(new MeResource($user), trans('auth.register_success'));
    }

    /**
     * Login
     * @unauthenticated
     *
     * @param LoginRequest $request
     * @return JsonResponse
     * @throws InputException
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $ip = $request->ip();
        $dto = LoginData::from($request->validated());
        $key = Str::lower($dto->email . '|user_login|' . $ip);

        // Increment attempts atomically and get the new count.
        // This prevents race conditions where multiple requests could
        // bypass the limit check before incrementing.
        $attempts = $this->incrementAndGetAttempts($key, self::DECAY_SECONDS);

        if ($attempts > self::MAX_ATTEMPTS_LOGIN) {
            return $this->sendLockoutResponse($key);
        }

        $user = ApiFactory::getAuthService()
            ->withGuard($this->getGuard())
            ->attemptLogin($dto);
        if ($user) {
            $this->clearLoginAttempts($key);

            // Prevent session fixation now that the user is authenticated.
            if ($request->hasSession()) {
                $request->session()->regenerate();
            }

            return $this->sendSuccessResponse(new MeResource($user));
        }

        // Check if this was the final allowed attempt
        if ($attempts >= self::MAX_ATTEMPTS_LOGIN) {
            return $this->sendLockoutResponse($key);
        }

        return $this->sendFailedLoginResponse();
    }

    /**
     * Forgot password — issue a reset link.
     * @unauthenticated
     *
     * Always returns an identical success response regardless of whether the
     * email is registered, to prevent account enumeration.
     *
     * @param ForgotPasswordRequest $request
     * @return JsonResponse
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $dto = ForgotPasswordData::from($request->validated());

        ApiFactory::getAuthService()
            ->withGuard($this->getGuard())
            ->sendResetLink($dto);

        return $this->sendSuccessResponse(null, trans('auth.reset.link_sent'));
    }

    /**
     * Reset password — verify the token and set a new password.
     * @unauthenticated
     *
     * @param ResetPasswordRequest $request
     * @return JsonResponse
     * @throws ValidationException
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $dto = ResetPasswordData::from($request->validated());

        ApiFactory::getAuthService()
            ->withGuard($this->getGuard())
            ->resetPassword($dto);

        return $this->sendSuccessResponse(null, trans('auth.reset.success'));
    }

    /**
     * Send Failed Login Response
     *
     * @return JsonResponse
     */
    protected function sendFailedLoginResponse(): JsonResponse
    {
        return ResponseHelper::sendResponse(ResponseHelper::STATUS_CODE_UNAUTHORIZED, trans('auth.failed'), null);
    }

    /**
     * Current login user
     *
     * @return JsonResponse
     */
    public function me(): JsonResponse
    {
        $currentUser = $this->guard()->user();

        if (! $currentUser) {
            return $this->sendErrorResponse(trans('response.unauthenticated'), null, null, ResponseHelper::STATUS_CODE_UNAUTHORIZED);
        }

        return $this->sendSuccessResponse(new MeResource($currentUser));
    }

    /**
     * Update profile
     *
     * @param UpdateProfileRequest $request
     * @return JsonResponse
     * @throws InputException
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $dto = UpdateProfileData::from($request->validated());
        $currentUser = $this->guard()->user();

        if (! $currentUser) {
            return $this->sendErrorResponse(trans('response.unauthenticated'), null, null, ResponseHelper::STATUS_CODE_UNAUTHORIZED);
        }

        $data = ApiFactory::getAuthService()
            ->withGuard($this->getGuard())
            ->withUser($currentUser)
            ->update($dto);

        return $this->sendSuccessResponse($data, trans('response.update_successfully'));
    }

    /**
     * Change password
     *
     * @param ChangePasswordRequest $request
     * @return JsonResponse
     * @throws InputException
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $currentUser = $this->guard()->user();

        if (! $currentUser) {
            return $this->sendErrorResponse(trans('response.unauthenticated'), null, null, ResponseHelper::STATUS_CODE_UNAUTHORIZED);
        }

        $dto = ChangePasswordData::from($request->validated());
        $data = ApiFactory::getAuthService()
            ->withGuard($this->getGuard())
            ->withUser($currentUser)
            ->changePassword($dto);

        return $this->sendSuccessResponse($data, trans('auth.logout_success'));
    }

    /**
     * Logout
     *
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $currentUser = $this->guard()->user();

        if (! $currentUser) {
            return $this->sendErrorResponse(trans('response.unauthenticated'), null, null, ResponseHelper::STATUS_CODE_UNAUTHORIZED);
        }

        // Log out of the SPA session and rotate the CSRF/session tokens.
        // Note: Always use 'web' guard for logout as Sanctum RequestGuard doesn't have logout()
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return $this->sendSuccessResponse(null, trans('auth.logout_success'));
    }
}
