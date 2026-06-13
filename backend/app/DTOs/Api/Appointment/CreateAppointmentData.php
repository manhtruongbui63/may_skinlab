<?php

declare(strict_types=1);

namespace App\DTOs\Api\Appointment;

/**
 * DTO for appointment creation.
 */
final readonly class CreateAppointmentData
{
    public function __construct(
        public int $customerId,
        public string $appointmentDate,
        public string $appointmentTime,
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
            customerId: (int) $data['customer_id'],
            appointmentDate: $data['appointment_date'],
            appointmentTime: $data['appointment_time'],
            note: $data['note'] ?? null,
        );
    }
}
