<?php

declare(strict_types=1);

namespace App\DTOs\Api\Appointment;

/**
 * DTO for cancelling an Appointment.
 */
final readonly class CancelAppointmentData
{
    /**
     * @param int $appointmentId The appointment ID to cancel
     */
    public function __construct(public int $appointmentId)
    {
    }

    /**
     * Create DTO from appointment ID.
     *
     * @param int $appointmentId
     */
    public static function fromRequest(int $appointmentId): self
    {
        return new self(appointmentId: $appointmentId);
    }
}
