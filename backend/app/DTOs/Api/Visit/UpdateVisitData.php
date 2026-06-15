<?php

declare(strict_types=1);

namespace App\DTOs\Api\Visit;

/**
 * DTO for updating an existing Visit.
 */
final readonly class UpdateVisitData
{
    /**
     * @param int $registrationType RegistrationTypeEnum value (1=WALK_IN, 2=SCHEDULED)
     * @param string|null $appointmentDate Date string (Y-m-d) for SCHEDULED visits
     * @param bool $isPriority Whether this is a priority visit
     * @param int|null $clinicRoomId Required for WALK_IN visits
     * @param list<int> $serviceIds Service IDs to attach (required for WALK_IN)
     * @param list<int> $servicePackageIds Service package IDs to attach
     * @param string|null $reason Optional reason for visit
     * @param int|null $customerId Optional customer ID
     */
    public function __construct(
        public int $registrationType,
        public ?string $appointmentDate,
        public bool $isPriority,
        public ?int $clinicRoomId,
        public array $serviceIds,
        public array $servicePackageIds,
        public ?string $reason,
        public ?int $customerId,
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
            registrationType: (int) $data['registration_type'],
            appointmentDate: $data['appointment_date'] ?? null,
            isPriority: $data['is_priority'] ?? false,
            clinicRoomId: $data['clinic_room_id'] ?? null,
            serviceIds: $data['service_ids'] ?? [],
            servicePackageIds: $data['service_package_ids'] ?? [],
            reason: $data['reason'] ?? null,
            customerId: $data['customer_id'] ?? null,
        );
    }
}
