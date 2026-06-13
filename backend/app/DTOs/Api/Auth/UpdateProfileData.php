<?php

namespace App\DTOs\Api\Auth;

final readonly class UpdateProfileData
{
    public function __construct(
        public string $name,
    ) {
    }

    public static function from(array $data): self
    {
        return new self(
            name: $data['name'],
        );
    }
}
