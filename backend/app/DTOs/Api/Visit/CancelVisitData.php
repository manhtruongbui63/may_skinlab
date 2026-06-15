<?php

declare(strict_types=1);

namespace App\DTOs\Api\Visit;

/**
 * DTO for cancelling a Visit.
 */
final readonly class CancelVisitData
{
    /**
     * @param int $visitId The visit ID to cancel
     */
    public function __construct(public int $visitId)
    {
    }

    /**
     * Create DTO from visit ID.
     *
     * @param int $visitId
     */
    public static function fromRequest(int $visitId): self
    {
        return new self(visitId: $visitId);
    }
}
