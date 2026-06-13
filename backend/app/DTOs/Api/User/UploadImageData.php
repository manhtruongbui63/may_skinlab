<?php

namespace App\DTOs\Api\User;

final readonly class UploadImageData
{
    public function __construct(
        public string $type,
    ) {
    }

    public static function from(array $data): self
    {
        return new self(
            type: $data['type'] ?? '',
        );
    }
}
