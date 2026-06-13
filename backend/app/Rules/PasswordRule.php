<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class PasswordRule implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Check minimum length
        if (strlen($value) < 6) {
            $fail(trans('validation.password_min_length'));
            return;
        }

        // Check maximum length
        if (strlen($value) > 32) {
            $fail(trans('validation.password_max_length'));
            return;
        }

        // Check for at least one digit
        if (!preg_match('/[0-9]/', $value)) {
            $fail(trans('validation.password_digit'));
            return;
        }

        // Check for at least one lowercase letter
        if (!preg_match('/[a-z]/', $value)) {
            $fail(trans('validation.password_lowercase'));
            return;
        }

        // Check for at least one uppercase letter
        if (!preg_match('/[A-Z]/', $value)) {
            $fail(trans('validation.password_uppercase'));
            return;
        }

        // Check for at least one special character
        if (!preg_match('/[^a-zA-Z0-9]/', $value)) {
            $fail(trans('validation.password_special'));
            return;
        }
    }
}
