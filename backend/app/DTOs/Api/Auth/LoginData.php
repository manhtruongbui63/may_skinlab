<?php

namespace App\DTOs\Api\Auth;

final readonly class LoginData
{
    public function __construct(
        public string $email,
        public string $password,
    ) {
    }

    public static function from(array $data): self
    {
        return new self(
            email: $data['email'],
            password: $data['password'],
        );
    }
}
