<?php

declare(strict_types=1);

namespace App\DTOs\Api\Visit;

/**
 * DTO for listing Visits with filters.
 */
final readonly class ListVisitData
{
    /**
     * @param string|null $from Start date (Y-m-d)
     * @param string|null $to End date (Y-m-d)
     * @param int|null $status VisitStatusEnum value filter
     * @param int $perPage Items per page
     * @param int $page Page number
     */
    public function __construct(
        public ?string $from,
        public ?string $to,
        public ?int $status,
        public int $perPage,
        public int $page,
    ) {
    }

    /**
     * Create DTO from validated request data.
     *
     * @param array<string, mixed> $data
     */
    public static function fromRequest(array $data): self
    {
        return new self(
            from: !empty($data['from']) ? $data['from'] : null,
            to: !empty($data['to']) ? $data['to'] : null,
            status: isset($data['status']) && $data['status'] !== '' ? (int) $data['status'] : null,
            perPage: (int) ($data['per_page'] ?? 20),
            page: (int) ($data['page'] ?? 1),
        );
    }
}
