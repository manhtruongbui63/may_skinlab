<?php

namespace App\DTOs\Api\Auth;

final readonly class RegisterData
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {
    }

    public static function from(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
            password: $data['password'],
        );
    }
}
