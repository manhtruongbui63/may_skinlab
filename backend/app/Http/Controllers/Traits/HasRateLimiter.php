<?php

namespace App\Http\Controllers\Traits;

use App\Exceptions\InputException;
use Illuminate\Support\Facades\RateLimiter;

trait HasRateLimiter
{
    /**
     * Too Many Attempts
     *
     * @param $key
     * @param $maxAttempts
     * @return bool
     */
    protected function tooManyAttempts($key, $maxAttempts)
    {
        return RateLimiter::tooManyAttempts($key, $maxAttempts);
    }

    /**
     * Retries Left
     *
     * @param $key
     * @param $maxAttempts
     * @return int
     */
    protected function retriesLeft($key, $maxAttempts)
    {
        return RateLimiter::retriesLeft($key, $maxAttempts);
    }

    /**
     * Send Lockout Response
     *
     * @param $key
     * @param string $type
     * @throws InputException
     */
    protected function sendLockoutResponse($key, $type = '')
    {
        $seconds = RateLimiter::availableIn($key);
        $messageKey = ($type == 'user') ? 'auth.throttle_user' : 'auth.throttle';

        throw new InputException(trans($messageKey, ['seconds' => $seconds]));
    }

    /**
     * Increment Attempts
     *
     * @param $key
     * @param $decaySeconds
     */
    protected function incrementAttempts($key, $decaySeconds)
    {
        RateLimiter::hit($key, $decaySeconds);
    }

    /**
     * Increment Attempts and return the new attempt count.
     *
     * @param $key
     * @param $decaySeconds
     * @return int
     */
    protected function incrementAndGetAttempts($key, $decaySeconds): int
    {
        return RateLimiter::hit($key, $decaySeconds);
    }

    /**
     * Clear Login Attempts
     *
     * @param $key
     */
    protected function clearLoginAttempts($key)
    {
        RateLimiter::clear($key);
    }
}
