<?php

declare(strict_types=1);

namespace App\DTOs\Api\Visit;

/**
 * DTO for creating a Visit from an Appointment.
 */
final readonly class CreateVisitFromAppointmentData
{
    /**
     * @param int $appointmentId The appointment ID to create visit from
     * @param int|null $clinicRoomId Optional clinic room ID
     * @param bool $isPriority Whether this is a priority visit
     */
    public function __construct(
        public int $appointmentId,
        public ?int $clinicRoomId,
        public bool $isPriority,
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
            appointmentId: (int) $data['appointment_id'],
            clinicRoomId: $data['clinic_room_id'] ?? null,
            isPriority: $data['is_priority'] ?? false,
        );
    }
}
