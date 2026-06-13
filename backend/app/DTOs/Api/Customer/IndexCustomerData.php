<?php

declare(strict_types=1);

namespace App\DTOs\Api\Customer;

/**
 * DTO for customer list query parameters.
 */
final readonly class IndexCustomerData
{
    public function __construct(
        public ?string $search = null,
        public ?int $gender = null,
        public ?int $source = null,
        public ?int $status = null,
        public int $page = 1,
        public int $perPage = 10,
    ) {
    }

    /**
     * Create DTO from array data.
     *
     * @param array<string, mixed> $data
     * @return self
     */
    public static function from(array $data): self
    {
        return new self(
            search: $data['search'] ?? null,
            gender: isset($data['gender']) ? (int) $data['gender'] : null,
            source: isset($data['source']) ? (int) $data['source'] : null,
            status: isset($data['status']) ? (int) $data['status'] : null,
            page: (int) ($data['page'] ?? 1),
            perPage: (int) ($data['per_page'] ?? 10),
        );
    }
}
