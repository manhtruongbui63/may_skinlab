<?php

namespace App\DTOs\Api\Auth;

final readonly class ForgotPasswordData
{
    public function __construct(
        public string $email,
    ) {
    }

    public static function from(array $data): self
    {
        return new self(
            email: $data['email'],
        );
    }
}
