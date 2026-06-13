<?php

namespace App\DTOs\Api\Auth;

final readonly class ChangePasswordData
{
    public function __construct(
        public string $currentPassword,
        public string $password,
    ) {
    }

    public static function from(array $data): self
    {
        return new self(
            currentPassword: $data['current_password'],
            password: $data['password'],
        );
    }
}
