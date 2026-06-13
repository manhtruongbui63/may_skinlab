<?php

declare(strict_types=1);

namespace App\DTOs\Api\Appointment;

/**
 * DTO for appointment update.
 */
final readonly class UpdateAppointmentData
{
    public function __construct(
        public ?string $appointmentDate = null,
        public ?string $appointmentTime = null,
        public ?int $status = null,
        public ?string $note = null,
    ) {
    }

    /**
     * Create DTO from validated array data.
     *
     * @param array<string, mixed> $data
     * @return self
     */
    public static function from(array $data): self
    {
        return new self(
            appointmentDate: $data['appointment_date'] ?? null,
            appointmentTime: $data['appointment_time'] ?? null,
            status: isset($data['status']) ? (int) $data['status'] : null,
            note: $data['note'] ?? null,
        );
    }
}
