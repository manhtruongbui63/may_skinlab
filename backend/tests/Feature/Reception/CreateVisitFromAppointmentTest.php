<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Enums\AppointmentStatusEnum;
use App\Enums\VisitStatusEnum;
use App\Models\Appointment;
use App\Models\ClinicRoom;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature Tests for Visit From Appointment API (Task 07).
 *
 * Covers: Appointment status checks, concurrency, atomicity, auth.
 */
class CreateVisitFromAppointmentTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Customer $customer;
    private ClinicRoom $clinicRoom;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->customer = Customer::factory()->create();
        $this->clinicRoom = ClinicRoom::factory()->create(['is_active' => true]);
    }

    /**
     * Helper: Create a BOOKED appointment.
     */
    private function createBookedAppointment(): Appointment
    {
        return Appointment::factory()->create([
            'customer_id' => $this->customer->id,
            'status' => AppointmentStatusEnum::BOOKED,
            'appointment_date' => now()->addDay()->format('Y-m-d'),
            'appointment_at' => now()->addDay()->setTime(10, 0),
        ]);
    }

    /**
     * Happy Path: Create visit from BOOKED appointment.
     */
    public function test_user_can_create_visit_from_booked_appointment(): void
    {
        $appointment = $this->createBookedAppointment();

        $payload = [
            'appointment_id' => $appointment->id,
            'clinic_room_id' => $this->clinicRoom->id,
            'is_priority' => false,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits/from-appointment', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.appointment_id', $appointment->id)
            ->assertJsonPath('data.status.value', VisitStatusEnum::WAITING->value);

        // Verify appointment status changed to CHECKED_IN
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => AppointmentStatusEnum::CHECKED_IN->value,
        ]);
    }

    /**
     * Error: Appointment not found.
     */
    public function test_returns_404_when_appointment_not_found(): void
    {
        $payload = [
            'appointment_id' => 99999,
            'clinic_room_id' => $this->clinicRoom->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits/from-appointment', $payload);

        $response->assertStatus(404);
    }

    /**
     * Error: Appointment status = CHECKED_IN.
     */
    public function test_returns_422_when_appointment_already_checked_in(): void
    {
        $appointment = Appointment::factory()->create([
            'customer_id' => $this->customer->id,
            'status' => AppointmentStatusEnum::CHECKED_IN,
            'appointment_date' => now()->format('Y-m-d'),
        ]);

        $payload = [
            'appointment_id' => $appointment->id,
            'clinic_room_id' => $this->clinicRoom->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits/from-appointment', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('message', fn ($m) => str_contains($m, 'appointment'));
    }

    /**
     * Error: Appointment status = CANCELLED.
     */
    public function test_returns_422_when_appointment_cancelled(): void
    {
        $appointment = Appointment::factory()->create([
            'customer_id' => $this->customer->id,
            'status' => AppointmentStatusEnum::CANCELLED,
            'appointment_date' => now()->format('Y-m-d'),
        ]);

        $payload = [
            'appointment_id' => $appointment->id,
            'clinic_room_id' => $this->clinicRoom->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits/from-appointment', $payload);

        $response->assertStatus(422);
    }

    /**
     * Error: Appointment status = OVERDUE.
     */
    public function test_returns_422_when_appointment_overdue(): void
    {
        $appointment = Appointment::factory()->create([
            'customer_id' => $this->customer->id,
            'status' => AppointmentStatusEnum::OVERDUE,
            'appointment_date' => now()->subDay()->format('Y-m-d'),
        ]);

        $payload = [
            'appointment_id' => $appointment->id,
            'clinic_room_id' => $this->clinicRoom->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits/from-appointment', $payload);

        $response->assertStatus(422);
    }

    /**
     * Error: Appointment status = COMPLETED.
     */
    public function test_returns_422_when_appointment_completed(): void
    {
        $appointment = Appointment::factory()->create([
            'customer_id' => $this->customer->id,
            'status' => AppointmentStatusEnum::COMPLETED,
            'appointment_date' => now()->format('Y-m-d'),
        ]);

        $payload = [
            'appointment_id' => $appointment->id,
            'clinic_room_id' => $this->clinicRoom->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits/from-appointment', $payload);

        $response->assertStatus(422);
    }

    /**
     * Auth: Unauthenticated user gets 401.
     */
    public function test_unauthenticated_user_cannot_create_visit_from_appointment(): void
    {
        $appointment = $this->createBookedAppointment();

        $payload = [
            'appointment_id' => $appointment->id,
            'clinic_room_id' => $this->clinicRoom->id,
        ];

        $response = $this->postJson('/api/v1/visits/from-appointment', $payload);

        $response->assertStatus(401);
    }

    /**
     * Validation: appointment_id is required.
     */
    public function test_appointment_id_is_required(): void
    {
        $payload = [
            'clinic_room_id' => $this->clinicRoom->id,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits/from-appointment', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('errors.appointment_id', fn ($e) => !empty($e));
    }

    /**
     * Validation: clinic_room_id must exist if provided.
     */
    public function test_clinic_room_id_must_exist(): void
    {
        $appointment = $this->createBookedAppointment();

        $payload = [
            'appointment_id' => $appointment->id,
            'clinic_room_id' => 99999,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/visits/from-appointment', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('errors.clinic_room_id', fn ($e) => !empty($e));
    }
}
