<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Appointment;

use App\Enums\AppointmentStatusEnum;
use App\Enums\CustomerStatusEnum;
use App\Enums\UserStatus;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Smoke tests for Appointment CRUD APIs.
 */
class AppointmentSmokeTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['status' => UserStatus::ACTIVE->value]);
        $this->customer = Customer::factory()->create(['status' => CustomerStatusEnum::ACTIVE->value]);
    }

    /**
     * Test list appointments (index) with filters.
     */
    public function test_can_list_appointments_with_filters(): void
    {
        Appointment::factory()->create([
            'customer_id' => $this->customer->id,
            'appointment_date' => '2026-07-01',
            'status' => AppointmentStatusEnum::BOOKED,
        ]);

        Appointment::factory()->create([
            'customer_id' => Customer::factory()->create(['full_name' => 'Jane Doe']),
            'appointment_date' => '2026-07-02',
            'status' => AppointmentStatusEnum::CONFIRMED,
        ]);

        // 1. Filter by date
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/appointments?date=2026-07-01');

        $response->dump();

        $response->assertStatus(200)
            ->assertJsonPath('data.0.appointment_date', '2026-07-01')
            ->assertJsonCount(1, 'data');

        // 2. Filter by status
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/appointments?status=' . AppointmentStatusEnum::CONFIRMED->value);

        $response->assertStatus(200)
            ->assertJsonPath('data.0.status.value', AppointmentStatusEnum::CONFIRMED->value)
            ->assertJsonCount(1, 'data');

        // 3. Filter by search (customer name)
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/appointments?search=Jane');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.customer.full_name', 'Jane Doe')
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test store new appointment.
     */
    public function test_can_store_appointment(): void
    {
        $payload = [
            'customer_id' => $this->customer->id,
            'appointment_date' => '2026-07-15',
            'appointment_time' => '10:00',
            'note' => 'Test appointment',
        ];

        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/appointments', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.appointment_date', '2026-07-15')
            ->assertJsonPath('data.status.value', AppointmentStatusEnum::BOOKED->value);

        $this->assertDatabaseHas('appointments', [
            'customer_id' => $this->customer->id,
            'appointment_date' => '2026-07-15',
            'appointment_at' => '2026-07-15 10:00:00',
        ]);
    }

    /**
     * Test validation rules for store.
     */
    public function test_store_validation_fails(): void
    {
        // 1. Missing required fields
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/appointments', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id', 'appointment_date', 'appointment_time']);

        // 2. Inactive customer (BR-APPT-002)
        $inactiveCustomer = Customer::factory()->create(['status' => CustomerStatusEnum::INACTIVE->value]);
        $payload = [
            'customer_id' => $inactiveCustomer->id,
            'appointment_date' => '2026-07-15',
            'appointment_time' => '10:00',
        ];

        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/appointments', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id'])
            ->assertJsonPath('errors.customer_id.0', trans('validation.custom.customer_id.active'));

        // 3. Invalid appointment_time slot (not on 30-min boundary)
        $payload = [
            'customer_id' => $this->customer->id,
            'appointment_date' => '2026-07-15',
            'appointment_time' => '10:15',
        ];

        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/appointments', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['appointment_time'])
            ->assertJsonPath('errors.appointment_time.0', trans('validation.custom.appointment_time.slot'));
    }

    /**
     * Test double-booking prevention on store (BR-APPT-001).
     */
    public function test_cannot_double_book_appointment(): void
    {
        // Create an existing booked appointment
        Appointment::factory()->create([
            'appointment_date' => '2026-07-15',
            'appointment_at' => '2026-07-15 10:00:00',
            'status' => AppointmentStatusEnum::BOOKED,
        ]);

        $payload = [
            'customer_id' => $this->customer->id,
            'appointment_date' => '2026-07-15',
            'appointment_time' => '10:00',
        ];

        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/appointments', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['appointment_time'])
            ->assertJsonPath('errors.appointment_time.0', trans('appointments.errors.double_booking'));
    }

    /**
     * Test show detail.
     */
    public function test_can_show_appointment(): void
    {
        $appointment = Appointment::factory()->create(['customer_id' => $this->customer->id]);

        $response = $this->actingAs($this->user, 'api')
            ->getJson("/api/appointments/{$appointment->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $appointment->id);
    }

    /**
     * Test update (reschedule) and transition validation.
     */
    public function test_can_update_and_reschedule(): void
    {
        $appointment = Appointment::factory()->create([
            'customer_id' => $this->customer->id,
            'appointment_date' => '2026-07-15',
            'appointment_at' => '2026-07-15 10:00:00',
            'status' => AppointmentStatusEnum::BOOKED,
        ]);

        // Reschedule and status transition (BOOKED -> CONFIRMED)
        $payload = [
            'appointment_date' => '2026-07-16',
            'appointment_time' => '11:30',
            'status' => AppointmentStatusEnum::CONFIRMED->value,
        ];

        $response = $this->actingAs($this->user, 'api')
            ->putJson("/api/appointments/{$appointment->id}", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.appointment_date', '2026-07-16')
            ->assertJsonPath('data.status.value', AppointmentStatusEnum::CONFIRMED->value);

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'appointment_date' => '2026-07-16',
            'appointment_at' => '2026-07-16 11:30:00',
            'status' => AppointmentStatusEnum::CONFIRMED->value,
        ]);
    }

    /**
     * Test invalid status transition validation (BR-APPT-003).
     */
    public function test_invalid_status_transition_fails(): void
    {
        $appointment = Appointment::factory()->create([
            'status' => AppointmentStatusEnum::BOOKED,
        ]);

        // Invalid: BOOKED -> COMPLETED is not in allowed list (must go through CONFIRMED -> CHECKED_IN -> COMPLETED)
        $payload = [
            'status' => AppointmentStatusEnum::COMPLETED->value,
        ];

        $response = $this->actingAs($this->user, 'api')
            ->putJson("/api/appointments/{$appointment->id}", $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status'])
            ->assertJsonPath('errors.status.0', trans('appointments.errors.invalid_status_transition'));
    }

    /**
     * Test soft delete.
     */
    public function test_can_soft_delete_appointment(): void
    {
        $appointment = Appointment::factory()->create();

        $response = $this->actingAs($this->user, 'api')
            ->deleteJson("/api/appointments/{$appointment->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted($appointment);
    }
}
