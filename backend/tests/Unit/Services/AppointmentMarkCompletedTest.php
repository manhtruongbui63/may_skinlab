<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Enums\AppointmentStatusEnum;
use App\Factories\ApiFactory;
use App\Models\Appointment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Unit Tests for AppointmentService::markCompleted().
 *
 * Design source (REQUIREMENT-FIRST):
 *   - BR-APPT-004: "Khi một Visit được tạo và liên kết với Appointment thành công,
 *     Appointment đó sẽ tự động chuyển sang trạng thái COMPLETED."
 *   - docs/requirements/03-appointment-management.md — Flow 3
 *
 * NOTE: The Visit model/table does not yet exist (later phase).
 * This unit test validates AppointmentService::markCompleted() in isolation —
 * the method that VisitService will call when creating a Visit (BR-APPT-004).
 * An HTTP-level integration test will be added once the Visit API is implemented.
 */
class AppointmentMarkCompletedTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test BR-APPT-004: markCompleted() transitions a CHECKED_IN appointment to COMPLETED.
     * This is the canonical pre-condition: patient arrived (CHECKED_IN) then visit is created.
     */
    public function test_mark_completed_transitions_checked_in_appointment_to_completed(): void
    {
        // Arrange
        $appointment = Appointment::factory()->create([
            'status' => AppointmentStatusEnum::CHECKED_IN,
        ]);

        // Act — simulate what VisitService calls (BR-APPT-004)
        ApiFactory::getAppointmentService()->markCompleted($appointment);

        // Assert
        $appointment->refresh();
        $this->assertSame(AppointmentStatusEnum::COMPLETED, $appointment->status);
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => AppointmentStatusEnum::COMPLETED->value,
        ]);
    }

    /**
     * Test BR-APPT-004: markCompleted() is a force-set operation that bypasses the
     * normal state machine — allowing Visit creation to override any intermediate state.
     * This ensures data integrity even if the appointment was not yet CHECKED_IN.
     */
    public function test_mark_completed_force_sets_status_regardless_of_current_state(): void
    {
        // Arrange — Appointment is still CONFIRMED (not yet CHECKED_IN)
        $appointment = Appointment::factory()->create([
            'status' => AppointmentStatusEnum::CONFIRMED,
        ]);

        // Act
        ApiFactory::getAppointmentService()->markCompleted($appointment);

        // Assert
        $appointment->refresh();
        $this->assertSame(AppointmentStatusEnum::COMPLETED, $appointment->status);
    }
}
