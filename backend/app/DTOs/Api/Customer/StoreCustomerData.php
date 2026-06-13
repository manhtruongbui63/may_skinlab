<?php

declare(strict_types=1);

namespace App\DTOs\Api\Customer;

/**
 * DTO for customer creation.
 */
final readonly class StoreCustomerData
{
    public function __construct(
        public string $fullName,
        public string $phone,
        public ?string $birthDate = null,
        public ?int $gender = null,
        public ?string $address = null,
        public ?int $source = null,
        public ?int $status = null,
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
            fullName: $data['full_name'],
            phone: $data['phone'],
            birthDate: $data['birth_date'] ?? null,
            gender: isset($data['gender']) ? (int) $data['gender'] : null,
            address: $data['address'] ?? null,
            source: isset($data['source']) ? (int) $data['source'] : null,
            status: isset($data['status']) ? (int) $data['status'] : null,
        );
    }
}
