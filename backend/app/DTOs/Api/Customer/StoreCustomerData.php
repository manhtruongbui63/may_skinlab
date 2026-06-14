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
        public ?string $phoneSecondary = null,
        public ?string $birthDate = null,
        public ?int $gender = null,
        public ?string $houseNumber = null,
        public ?int $provinceId = null,
        public ?int $wardId = null,
        public ?string $address = null,
        public bool $isAddressManuallyEdited = false,
        public ?string $avatarPath = null,
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
            phoneSecondary: $data['phone_secondary'] ?? null,
            birthDate: $data['birth_date'] ?? null,
            gender: isset($data['gender']) ? (int) $data['gender'] : null,
            houseNumber: $data['house_number'] ?? null,
            provinceId: isset($data['province_id']) ? (int) $data['province_id'] : null,
            wardId: isset($data['ward_id']) ? (int) $data['ward_id'] : null,
            address: $data['address'] ?? null,
            isAddressManuallyEdited: (bool) ($data['is_address_manually_edited'] ?? false),
            avatarPath: $data['avatar_path'] ?? null,
            source: isset($data['source']) ? (int) $data['source'] : null,
            status: isset($data['status']) ? (int) $data['status'] : null,
        );
    }
}
