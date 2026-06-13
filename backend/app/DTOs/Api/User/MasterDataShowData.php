<?php

namespace App\DTOs\Api\User;

final readonly class MasterDataShowData
{
    public function __construct(
        public array $resources,
    ) {
    }

    public static function from(array $data): self
    {
        return new self(
            resources: $data['resources'] ?? [],
        );
    }
}
