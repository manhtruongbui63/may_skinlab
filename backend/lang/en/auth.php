<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines are used during authentication for various
    | messages that we need to display to the user. You are free to modify
    | these language lines according to your application's requirements.
    |
    */

    'failed' => 'These credentials do not match our records.',
    'password' => 'The provided password is incorrect.',
    'throttle' => 'Too many login attempts. Please try again in :seconds seconds.',
    'logout_success' => 'Logout successful.',
    'register_success' => 'Registration successful.',
    'register_fail' => 'Registration failed. Please try again.',
    'throttle_user' => 'Your account is temporarily locked due to too many failed login attempts. Please try again in :seconds seconds.',

    'reset' => [
        'link_sent' => 'A password reset link has been sent to your email.',
        'email_not_found' => 'No account was found with this email address.',
        'success' => 'Your password has been reset. Please sign in with your new password.',
        'invalid_token' => 'This password reset link is invalid.',
        'expired_token' => 'This password reset link has expired. Please request a new one.',
        'same_password' => 'The new password must be different from your current password.',

        'mail' => [
            'subject' => 'Reset your password',
            'greeting' => 'Hello :name,',
            'intro' => 'You are receiving this email because we received a password reset request for your account.',
            'action' => 'Reset password',
            'expires' => 'This password reset link will expire in :minutes minutes.',
            'outro' => 'If you did not request a password reset, no further action is required.',
        ],

        'changed_mail' => [
            'subject' => 'Your password was changed',
            'greeting' => 'Hello :name,',
            'intro' => 'This is a confirmation that your password was changed on :datetime.',
            'warning' => 'If you did not make this change, please contact support immediately.',
        ],
    ],
];
