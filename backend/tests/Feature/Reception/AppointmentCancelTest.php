<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Enums\AppointmentStatusEnum;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature Tests for Appointment Cancel API (Task 09).
 *
 * Covers: Status transitions, Auth, Activity Log.
 */
class AppointmentCancelTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->customer = Customer::factory()->create();
    }

    /**
     * Helper: Create appointment with specific status.
     */
    private function createAppointment(string $status): Appointment
    {
        return Appointment::factory()->create([
            'customer_id' => $this->customer->id,
            'status' => constant("App\\Enums\\AppointmentStatusEnum::{$status}"),
            'appointment_date' => now()->format('Y-m-d'),
            'appointment_at' => now()->setTime(10, 0),
        ]);
    }

    /**
     * Happy Path: BOOKED appointment can be cancelled.
     */
    public function test_can_cancel_booked_appointment(): void
    {
        $appointment = $this->createAppointment('BOOKED');

        $response = $this->actingAs($this->user, 'sanctum')
            ->patchJson("/api/v1/appointments/{$appointment->id}/cancel");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status.value', AppointmentStatusEnum::CANCELLED->value);

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => AppointmentStatusEnum::CANCELLED->value,
        ]);
    }

    /**
     * Error: CHECKED_IN appointment cannot be cancelled.
     */
    public function test_cannot_cancel_checked_in_appointment(): void
    {
        $appointment = $this->createAppointment('CHECKED_IN');

        $response = $this->actingAs($this->user, 'sanctum')
            ->patchJson("/api/v1/appointments/{$appointment->id}/cancel");

        $response->assertStatus(422)
            ->assertJsonPath('errors.status', fn ($e) => !empty($e));
    }

    /**
     * Error: COMPLETED appointment cannot be cancelled.
     */
    public function test_cannot_cancel_completed_appointment(): void
    {
        $appointment = $this->createAppointment('COMPLETED');

        $response = $this->actingAs($this->user, 'sanctum')
            ->patchJson("/api/v1/appointments/{$appointment->id}/cancel");

        $response->assertStatus(422);
    }

    /**
     * Error: CANCELLED appointment cannot be cancelled again.
     */
    public function test_cannot_cancel_already_cancelled_appointment(): void
    {
        $appointment = $this->createAppointment('CANCELLED');

        $response = $this->actingAs($this->user, 'sanctum')
            ->patchJson("/api/v1/appointments/{$appointment->id}/cancel");

        $response->assertStatus(422);
    }

    /**
     * Error: OVERDUE appointment cannot be cancelled.
     */
    public function test_cannot_cancel_overdue_appointment(): void
    {
        $appointment = $this->createAppointment('OVERDUE');

        $response = $this->actingAs($this->user, 'sanctum')
            ->patchJson("/api/v1/appointments/{$appointment->id}/cancel");

        $response->assertStatus(422);
    }

    /**
     * Error: Non-existent appointment returns 404.
     */
    public function test_cancel_returns_404_for_non_existent_appointment(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->patchJson('/api/v1/appointments/99999/cancel');

        $response->assertStatus(404);
    }

    /**
     * Auth: Unauthenticated user cannot cancel appointment.
     */
    public function test_unauthenticated_user_cannot_cancel_appointment(): void
    {
        $appointment = $this->createAppointment('BOOKED');

        $response = $this->patchJson("/api/v1/appointments/{$appointment->id}/cancel");
        $response->assertStatus(401);
    }

    /**
     * Activity Log: Log entry created on successful cancel.
     */
    public function test_activity_log_created_on_cancel(): void
    {
        $appointment = $this->createAppointment('BOOKED');

        $this->actingAs($this->user, 'sanctum')
            ->patchJson("/api/v1/appointments/{$appointment->id}/cancel");

        // Verify activity log was created (BR-G002)
        $this->assertDatabaseHas('activity_log', [
            'subject_type' => Appointment::class,
            'subject_id' => $appointment->id,
            'causer_id' => $this->user->id,
        ]);
    }
}
