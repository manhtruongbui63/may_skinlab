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
 * Acceptance Feature Tests for Appointment Management APIs.
 *
 * Design source (REQUIREMENT-FIRST):
 *   - docs/requirements/03-appointment-management.md
 *   - Business Rules: BR-APPT-001, BR-APPT-002, BR-APPT-003, BR-APPT-004, BR-APPT-005, BR-G002
 *
 * NOTE: This is an ACCEPTANCE test (bks-be-testing-standard). It reports pass/fail
 * objectively from the requirement. Failures indicate a code-vs-spec discrepancy
 * and must NOT be silently fixed by this skill.
 */
class AppointmentApiTest extends TestCase
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

    // ─────────────────────────────────────────────────────────────────────────
    // UNAUTHENTICATED (401) — Mandatory Negative Cases
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Test guest cannot list appointments.
     * Requirement: Guard 'api' required for all appointment endpoints.
     */
    public function test_guest_cannot_list_appointments(): void
    {
        $this->getJson('/api/appointments')
            ->assertStatus(401);
    }

    /**
     * Test guest cannot create an appointment.
     */
    public function test_guest_cannot_create_appointment(): void
    {
        $this->postJson('/api/appointments', [])
            ->assertStatus(401);
    }

    /**
     * Test guest cannot view an appointment detail.
     */
    public function test_guest_cannot_show_appointment(): void
    {
        $appointment = Appointment::factory()->create();

        $this->getJson("/api/appointments/{$appointment->id}")
            ->assertStatus(401);
    }

    /**
     * Test guest cannot update an appointment.
     */
    public function test_guest_cannot_update_appointment(): void
    {
        $appointment = Appointment::factory()->create();

        $this->putJson("/api/appointments/{$appointment->id}", [])
            ->assertStatus(401);
    }

    /**
     * Test guest cannot delete an appointment.
     */
    public function test_guest_cannot_delete_appointment(): void
    {
        $appointment = Appointment::factory()->create();

        $this->deleteJson("/api/appointments/{$appointment->id}")
            ->assertStatus(401);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LIST — GET /api/appointments
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Test authenticated user can get paginated list of appointments.
     */
    public function test_authenticated_user_can_list_appointments(): void
    {
        Appointment::factory()->count(3)->create();

        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/appointments');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data',
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);
    }

    /**
     * Test list is filtered by date correctly.
     */
    public function test_list_filters_appointments_by_date(): void
    {
        Appointment::factory()->create([
            'customer_id' => $this->customer->id,
            'appointment_date' => '2026-09-01',
            'appointment_at' => '2026-09-01 09:00:00',
        ]);
        Appointment::factory()->create([
            'appointment_date' => '2026-09-02',
            'appointment_at' => '2026-09-02 10:00:00',
        ]);

        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/appointments?date=2026-09-01');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.appointment_date', '2026-09-01')
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test list is filtered by status correctly.
     */
    public function test_list_filters_appointments_by_status(): void
    {
        Appointment::factory()->create([
            'status' => AppointmentStatusEnum::CONFIRMED,
            'appointment_at' => '2026-09-01 09:00:00',
            'appointment_date' => '2026-09-01',
        ]);
        Appointment::factory()->create([
            'status' => AppointmentStatusEnum::BOOKED,
            'appointment_at' => '2026-09-02 09:00:00',
            'appointment_date' => '2026-09-02',
        ]);

        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/appointments?status=' . AppointmentStatusEnum::CONFIRMED->value);

        $response->assertStatus(200)
            ->assertJsonPath('data.0.status.value', AppointmentStatusEnum::CONFIRMED->value)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test list is filtered by customer name search.
     */
    public function test_list_filters_appointments_by_search(): void
    {
        $namedCustomer = Customer::factory()->create(['full_name' => 'Nguyen Van Search']);
        Appointment::factory()->create([
            'customer_id' => $namedCustomer->id,
            'appointment_at' => '2026-09-01 09:00:00',
            'appointment_date' => '2026-09-01',
        ]);
        Appointment::factory()->create([
            'customer_id' => $this->customer->id,
            'appointment_at' => '2026-09-02 09:00:00',
            'appointment_date' => '2026-09-02',
        ]);

        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/appointments?search=Nguyen+Van+Search');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.customer.full_name', 'Nguyen Van Search')
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test soft-deleted appointments are NOT included in the default list (BR-APPT-005).
     */
    public function test_list_excludes_soft_deleted_appointments(): void
    {
        $appointment = Appointment::factory()->create();
        $appointment->delete();

        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/appointments');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STORE — POST /api/appointments
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Validation Matrix — Required fields.
     * All three required fields missing simultaneously → all must appear in errors.
     */
    public function test_store_fails_when_required_fields_are_missing(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/appointments', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id', 'appointment_date', 'appointment_time']);
    }

    /**
     * Validation Matrix — Business rule: customer must be ACTIVE (BR-APPT-002).
     * Booking for INACTIVE customer must return 422 with custom message.
     */
    public function test_store_fails_when_customer_is_inactive(): void
    {
        $inactiveCustomer = Customer::factory()->create(['status' => CustomerStatusEnum::INACTIVE->value]);

        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/appointments', [
                'customer_id' => $inactiveCustomer->id,
                'appointment_date' => '2026-09-15',
                'appointment_time' => '10:00',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id'])
            ->assertJsonPath('errors.customer_id.0', trans('validation.custom.customer_id.active'));
    }

    /**
     * Validation Matrix — Time slot format.
     * appointment_time must be on 30-minute boundary (10:15 is invalid).
     * Requirement: "Khi người dùng chọn thời gian hẹn... kiểm tra xem giờ hẹn có nằm đúng vào các mốc 30 phút".
     */
    public function test_store_fails_when_time_is_not_on_30_minute_boundary(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/appointments', [
                'customer_id' => $this->customer->id,
                'appointment_date' => '2026-09-15',
                'appointment_time' => '10:15',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['appointment_time'])
            ->assertJsonPath('errors.appointment_time.0', trans('validation.custom.appointment_time.slot'));
    }

    /**
     * Happy Path — Create appointment for an ACTIVE customer (Flow 1).
     * Asserts: 201, correct JSON structure, DB record, activity log (BR-G002).
     */
    public function test_store_creates_appointment_for_active_customer(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/appointments', [
                'customer_id' => $this->customer->id,
                'appointment_date' => '2026-09-15',
                'appointment_time' => '10:00',
                'note' => 'Test appointment note',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.appointment_date', '2026-09-15')
            ->assertJsonPath('data.appointment_time', '10:00')
            ->assertJsonPath('data.status.value', AppointmentStatusEnum::BOOKED->value)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'customer',
                    'appointment_at',
                    'appointment_date',
                    'appointment_time',
                    'status' => ['value', 'label'],
                    'note',
                ],
            ]);

        $this->assertDatabaseHas('appointments', [
            'customer_id' => $this->customer->id,
            'appointment_date' => '2026-09-15',
            'appointment_at' => '2026-09-15 10:00:00',
            'status' => AppointmentStatusEnum::BOOKED->value,
        ]);

        // BR-G002: Activity log must record the creation event
        $this->assertDatabaseHas('activity_log', [
            'subject_type' => Appointment::class,
            'description' => 'created',
        ]);
    }

    /**
     * Unhappy Path — Double booking prevention (BR-APPT-001).
     * A second booking at the same date-time as an existing BOOKED appointment must fail.
     */
    public function test_store_fails_on_double_booking_with_booked_status(): void
    {
        Appointment::factory()->create([
            'appointment_date' => '2026-09-15',
            'appointment_at' => '2026-09-15 10:00:00',
            'status' => AppointmentStatusEnum::BOOKED,
        ]);

        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/appointments', [
                'customer_id' => $this->customer->id,
                'appointment_date' => '2026-09-15',
                'appointment_time' => '10:00',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['appointment_time'])
            ->assertJsonPath('errors.appointment_time.0', trans('appointments.errors.double_booking'));
    }

    /**
     * Unhappy Path — Double booking prevention with CONFIRMED status (BR-APPT-001).
     * A slot occupied by a CONFIRMED appointment must also block new bookings.
     */
    public function test_store_fails_on_double_booking_with_confirmed_status(): void
    {
        Appointment::factory()->create([
            'appointment_date' => '2026-09-15',
            'appointment_at' => '2026-09-15 09:30:00',
            'status' => AppointmentStatusEnum::CONFIRMED,
        ]);

        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/appointments', [
                'customer_id' => $this->customer->id,
                'appointment_date' => '2026-09-15',
                'appointment_time' => '09:30',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['appointment_time'])
            ->assertJsonPath('errors.appointment_time.0', trans('appointments.errors.double_booking'));
    }

    /**
     * Happy Path — A CANCELLED slot can be rebooked.
     * Requirement: Only active statuses (BOOKED, CONFIRMED, CHECKED_IN) block a slot.
     */
    public function test_store_succeeds_when_slot_has_only_cancelled_appointment(): void
    {
        Appointment::factory()->create([
            'appointment_date' => '2026-09-15',
            'appointment_at' => '2026-09-15 11:00:00',
            'status' => AppointmentStatusEnum::CANCELLED,
        ]);

        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/appointments', [
                'customer_id' => $this->customer->id,
                'appointment_date' => '2026-09-15',
                'appointment_time' => '11:00',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SHOW — GET /api/appointments/{id}
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Test authenticated user can view appointment detail.
     */
    public function test_authenticated_user_can_view_appointment_detail(): void
    {
        $appointment = Appointment::factory()->create(['customer_id' => $this->customer->id]);

        $response = $this->actingAs($this->user, 'api')
            ->getJson("/api/appointments/{$appointment->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $appointment->id)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'customer',
                    'appointment_at',
                    'appointment_date',
                    'appointment_time',
                    'status' => ['value', 'label'],
                    'note',
                ],
            ]);
    }

    /**
     * Test 404 is returned for a non-existent appointment.
     */
    public function test_show_returns_404_for_nonexistent_appointment(): void
    {
        $this->actingAs($this->user, 'api')
            ->getJson('/api/appointments/999999')
            ->assertStatus(404);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE — PUT /api/appointments/{id}
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Happy Path — Reschedule appointment to a free slot (Flow 2).
     */
    public function test_update_can_reschedule_appointment_to_empty_slot(): void
    {
        $appointment = Appointment::factory()->create([
            'customer_id' => $this->customer->id,
            'appointment_date' => '2026-09-15',
            'appointment_at' => '2026-09-15 10:00:00',
            'status' => AppointmentStatusEnum::BOOKED,
        ]);

        $response = $this->actingAs($this->user, 'api')
            ->putJson("/api/appointments/{$appointment->id}", [
                'appointment_date' => '2026-09-16',
                'appointment_time' => '14:00',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.appointment_date', '2026-09-16')
            ->assertJsonPath('data.appointment_time', '14:00');

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'appointment_date' => '2026-09-16',
            'appointment_at' => '2026-09-16 14:00:00',
        ]);
    }

    /**
     * State Transition — Valid: BOOKED → CONFIRMED (BR-APPT-003).
     */
    public function test_update_valid_transition_booked_to_confirmed(): void
    {
        $appointment = Appointment::factory()->create(['status' => AppointmentStatusEnum::BOOKED]);

        $this->actingAs($this->user, 'api')
            ->putJson("/api/appointments/{$appointment->id}", [
                'status' => AppointmentStatusEnum::CONFIRMED->value,
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status.value', AppointmentStatusEnum::CONFIRMED->value);
    }

    /**
     * State Transition — Valid: BOOKED → CANCELLED (BR-APPT-003).
     */
    public function test_update_valid_transition_booked_to_cancelled(): void
    {
        $appointment = Appointment::factory()->create(['status' => AppointmentStatusEnum::BOOKED]);

        $this->actingAs($this->user, 'api')
            ->putJson("/api/appointments/{$appointment->id}", [
                'status' => AppointmentStatusEnum::CANCELLED->value,
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status.value', AppointmentStatusEnum::CANCELLED->value);
    }

    /**
     * State Transition — Valid: CONFIRMED → CHECKED_IN (BR-APPT-003).
     */
    public function test_update_valid_transition_confirmed_to_checked_in(): void
    {
        $appointment = Appointment::factory()->create(['status' => AppointmentStatusEnum::CONFIRMED]);

        $this->actingAs($this->user, 'api')
            ->putJson("/api/appointments/{$appointment->id}", [
                'status' => AppointmentStatusEnum::CHECKED_IN->value,
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status.value', AppointmentStatusEnum::CHECKED_IN->value);
    }

    /**
     * State Transition — Valid: CONFIRMED → CANCELLED (BR-APPT-003).
     */
    public function test_update_valid_transition_confirmed_to_cancelled(): void
    {
        $appointment = Appointment::factory()->create(['status' => AppointmentStatusEnum::CONFIRMED]);

        $this->actingAs($this->user, 'api')
            ->putJson("/api/appointments/{$appointment->id}", [
                'status' => AppointmentStatusEnum::CANCELLED->value,
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status.value', AppointmentStatusEnum::CANCELLED->value);
    }

    /**
     * State Transition — Valid: CONFIRMED → NO_SHOW (BR-APPT-003).
     * Requirement specifies: CONFIRMED → CHECKED_IN, CANCELLED, NO_SHOW.
     */
    public function test_update_valid_transition_confirmed_to_no_show(): void
    {
        $appointment = Appointment::factory()->create(['status' => AppointmentStatusEnum::CONFIRMED]);

        $this->actingAs($this->user, 'api')
            ->putJson("/api/appointments/{$appointment->id}", [
                'status' => AppointmentStatusEnum::NO_SHOW->value,
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status.value', AppointmentStatusEnum::NO_SHOW->value);
    }

    /**
     * State Transition — Valid: CHECKED_IN → COMPLETED (BR-APPT-003).
     */
    public function test_update_valid_transition_checked_in_to_completed(): void
    {
        $appointment = Appointment::factory()->create(['status' => AppointmentStatusEnum::CHECKED_IN]);

        $this->actingAs($this->user, 'api')
            ->putJson("/api/appointments/{$appointment->id}", [
                'status' => AppointmentStatusEnum::COMPLETED->value,
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status.value', AppointmentStatusEnum::COMPLETED->value);
    }

    /**
     * State Transition — Valid: CHECKED_IN → CANCELLED (BR-APPT-003).
     * Requirement specifies: CHECKED_IN → COMPLETED, CANCELLED.
     */
    public function test_update_valid_transition_checked_in_to_cancelled(): void
    {
        $appointment = Appointment::factory()->create(['status' => AppointmentStatusEnum::CHECKED_IN]);

        $this->actingAs($this->user, 'api')
            ->putJson("/api/appointments/{$appointment->id}", [
                'status' => AppointmentStatusEnum::CANCELLED->value,
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status.value', AppointmentStatusEnum::CANCELLED->value);
    }

    /**
     * State Transition — Invalid: BOOKED → COMPLETED (skip intermediate states) (BR-APPT-003).
     */
    public function test_update_invalid_transition_booked_to_completed(): void
    {
        $appointment = Appointment::factory()->create(['status' => AppointmentStatusEnum::BOOKED]);

        $this->actingAs($this->user, 'api')
            ->putJson("/api/appointments/{$appointment->id}", [
                'status' => AppointmentStatusEnum::COMPLETED->value,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status'])
            ->assertJsonPath('errors.status.0', trans('appointments.errors.invalid_status_transition'));
    }

    /**
     * State Transition — Invalid: BOOKED → NO_SHOW (not in requirement matrix) (BR-APPT-003).
     */
    public function test_update_invalid_transition_booked_to_no_show(): void
    {
        $appointment = Appointment::factory()->create(['status' => AppointmentStatusEnum::BOOKED]);

        $this->actingAs($this->user, 'api')
            ->putJson("/api/appointments/{$appointment->id}", [
                'status' => AppointmentStatusEnum::NO_SHOW->value,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status'])
            ->assertJsonPath('errors.status.0', trans('appointments.errors.invalid_status_transition'));
    }

    /**
     * State Transition — Invalid: CANCELLED is a terminal state, no further transition allowed (BR-APPT-003).
     */
    public function test_update_invalid_transition_from_terminal_cancelled(): void
    {
        $appointment = Appointment::factory()->create(['status' => AppointmentStatusEnum::CANCELLED]);

        $this->actingAs($this->user, 'api')
            ->putJson("/api/appointments/{$appointment->id}", [
                'status' => AppointmentStatusEnum::BOOKED->value,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status'])
            ->assertJsonPath('errors.status.0', trans('appointments.errors.invalid_status_transition'));
    }

    /**
     * State Transition — Invalid: COMPLETED is a terminal state, no further transition allowed (BR-APPT-003).
     */
    public function test_update_invalid_transition_from_terminal_completed(): void
    {
        $appointment = Appointment::factory()->create(['status' => AppointmentStatusEnum::COMPLETED]);

        $this->actingAs($this->user, 'api')
            ->putJson("/api/appointments/{$appointment->id}", [
                'status' => AppointmentStatusEnum::BOOKED->value,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status'])
            ->assertJsonPath('errors.status.0', trans('appointments.errors.invalid_status_transition'));
    }

    /**
     * Unhappy Path — Rescheduling to a double-booked slot (BR-APPT-001, Flow 2).
     */
    public function test_update_fails_on_double_booking_when_rescheduling(): void
    {
        $appointment = Appointment::factory()->create([
            'appointment_date' => '2026-09-15',
            'appointment_at' => '2026-09-15 10:00:00',
            'status' => AppointmentStatusEnum::BOOKED,
        ]);
        // Another active appointment at the target slot
        Appointment::factory()->create([
            'appointment_date' => '2026-09-16',
            'appointment_at' => '2026-09-16 14:00:00',
            'status' => AppointmentStatusEnum::BOOKED,
        ]);

        $response = $this->actingAs($this->user, 'api')
            ->putJson("/api/appointments/{$appointment->id}", [
                'appointment_date' => '2026-09-16',
                'appointment_time' => '14:00',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['appointment_time'])
            ->assertJsonPath('errors.appointment_time.0', trans('appointments.errors.double_booking'));
    }

    /**
     * Test 404 for updating a non-existent appointment.
     */
    public function test_update_returns_404_for_nonexistent_appointment(): void
    {
        $this->actingAs($this->user, 'api')
            ->putJson('/api/appointments/999999', [
                'status' => AppointmentStatusEnum::CONFIRMED->value,
            ])
            ->assertStatus(404);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE — DELETE /api/appointments/{id}
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Happy Path — Soft delete preserves the record in DB (BR-APPT-005, Flow 4).
     * Asserts: 200, record is soft-deleted (deleted_at is set), still exists in DB.
     */
    public function test_delete_soft_deletes_appointment(): void
    {
        $appointment = Appointment::factory()->create();

        $response = $this->actingAs($this->user, 'api')
            ->deleteJson("/api/appointments/{$appointment->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Record must still exist in DB (soft delete, not hard delete)
        $this->assertSoftDeleted($appointment);
        $this->assertDatabaseHas('appointments', ['id' => $appointment->id]);
    }

    /**
     * Test 404 for deleting a non-existent appointment.
     */
    public function test_delete_returns_404_for_nonexistent_appointment(): void
    {
        $this->actingAs($this->user, 'api')
            ->deleteJson('/api/appointments/999999')
            ->assertStatus(404);
    }
}
