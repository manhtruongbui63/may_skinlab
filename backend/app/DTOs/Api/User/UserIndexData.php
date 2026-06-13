<?php

namespace App\DTOs\Api\User;

final readonly class UserIndexData
{
    public function __construct(
        public string $search = '',
        public ?array $orders = null,
        public ?array $filters = null,
        public int $perPage = 10,
    ) {
    }

    public static function from(array $data): self
    {
        return new self(
            search: $data['search'] ?? '',
            orders: $data['orders'] ?? null,
            filters: $data['filters'] ?? null,
            perPage: (int) ($data['per_page'] ?? 10),
        );
    }

    public function toTableParams(): array
    {
        return [$this->search, $this->orders, $this->filters, $this->perPage];
    }
}
