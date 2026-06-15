<?php

declare(strict_types=1);

namespace Tests\Unit\Jobs;

use App\Enums\AppointmentStatusEnum;
use App\Jobs\MarkOverdueAppointmentsJob;
use App\Models\Appointment;
use App\Models\Customer;
use App\Services\Background\MarkOverdueAppointmentsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Unit Tests for MarkOverdueAppointmentsJob (Task 05).
 *
 * Covers: Happy path, no eligible records, status filtering, idempotency.
 */
class MarkOverdueAppointmentsJobTest extends TestCase
{
    use RefreshDatabase;

    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->customer = Customer::factory()->create();
    }

    /**
     * Helper: Create appointment with specific status and date.
     */
    private function createAppointment(string $status, ?string $date = null): Appointment
    {
        $date = $date ?? now()->format('Y-m-d');

        return Appointment::factory()->create([
            'customer_id' => $this->customer->id,
            'status' => constant("App\\Enums\\AppointmentStatusEnum::{$status}"),
            'appointment_date' => $date,
            'appointment_at' => $date . ' 10:00:00',
        ]);
    }

    /**
     * Happy Path: BOOKED appointments with past date become OVERDUE.
     */
    public function test_marks_booked_appointments_with_past_date_as_overdue(): void
    {
        // Create 3 BOOKED appointments with past date
        $appointment1 = $this->createAppointment('BOOKED', now()->subDay()->format('Y-m-d'));
        $appointment2 = $this->createAppointment('BOOKED', now()->subDays(2)->format('Y-m-d'));
        $appointment3 = $this->createAppointment('BOOKED', now()->subDays(3)->format('Y-m-d'));

        // Run the job
        $service = app(MarkOverdueAppointmentsService::class);
        $job = new MarkOverdueAppointmentsJob($service);
        $job->handle();

        // Assert all marked as OVERDUE
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment1->id,
            'status' => AppointmentStatusEnum::OVERDUE->value,
        ]);
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment2->id,
            'status' => AppointmentStatusEnum::OVERDUE->value,
        ]);
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment3->id,
            'status' => AppointmentStatusEnum::OVERDUE->value,
        ]);
    }

    /**
     * No eligible records: Returns 0 without error.
     */
    public function test_returns_zero_when_no_eligible_appointments(): void
    {
        // Create only appointments that should NOT be marked overdue
        $this->createAppointment('COMPLETED', now()->subDay()->format('Y-m-d'));
        $this->createAppointment('CANCELLED', now()->subDay()->format('Y-m-d'));
        $this->createAppointment('BOOKED', now()->format('Y-m-d')); // Today's appointment

        // Run the job - should not throw exception
        $service = app(MarkOverdueAppointmentsService::class);
        $job = new MarkOverdueAppointmentsJob($service);

        $this->expectNotToPerformAssertions();
        $job->handle();
    }

    /**
     * Other statuses: CONFIRMED, COMPLETED, CANCELLED, NO_SHOW are not changed.
     */
    public function test_does_not_change_other_statuses(): void
    {
        $confirmed = $this->createAppointment('CONFIRMED', now()->subDay()->format('Y-m-d'));
        $completed = $this->createAppointment('COMPLETED', now()->subDay()->format('Y-m-d'));
        $cancelled = $this->createAppointment('CANCELLED', now()->subDay()->format('Y-m-d'));
        $noShow = $this->createAppointment('NO_SHOW', now()->subDay()->format('Y-m-d'));

        $service = app(MarkOverdueAppointmentsService::class);
        $job = new MarkOverdueAppointmentsJob($service);
        $job->handle();

        // Verify statuses unchanged
        $this->assertDatabaseHas('appointments', [
            'id' => $confirmed->id,
            'status' => AppointmentStatusEnum::CONFIRMED->value,
        ]);
        $this->assertDatabaseHas('appointments', [
            'id' => $completed->id,
            'status' => AppointmentStatusEnum::COMPLETED->value,
        ]);
        $this->assertDatabaseHas('appointments', [
            'id' => $cancelled->id,
            'status' => AppointmentStatusEnum::CANCELLED->value,
        ]);
        $this->assertDatabaseHas('appointments', [
            'id' => $noShow->id,
            'status' => AppointmentStatusEnum::NO_SHOW->value,
        ]);
    }

    /**
     * Today's appointments: Should NOT be marked as OVERDUE.
     */
    public function test_does_not_mark_today_appointments_as_overdue(): void
    {
        $todayBooked = $this->createAppointment('BOOKED', now()->format('Y-m-d'));

        $service = app(MarkOverdueAppointmentsService::class);
        $job = new MarkOverdueAppointmentsJob($service);
        $job->handle();

        $this->assertDatabaseHas('appointments', [
            'id' => $todayBooked->id,
            'status' => AppointmentStatusEnum::BOOKED->value,
        ]);
    }

    /**
     * Yesterday's appointments: Should be marked as OVERDUE.
     */
    public function test_marks_yesterday_appointments_as_overdue(): void
    {
        $yesterdayBooked = $this->createAppointment('BOOKED', now()->subDay()->format('Y-m-d'));

        $service = app(MarkOverdueAppointmentsService::class);
        $job = new MarkOverdueAppointmentsJob($service);
        $job->handle();

        $this->assertDatabaseHas('appointments', [
            'id' => $yesterdayBooked->id,
            'status' => AppointmentStatusEnum::OVERDUE->value,
        ]);
    }

    /**
     * Idempotency: Running job twice does not cause errors.
     */
    public function test_job_is_idempotent(): void
    {
        // Create appointments and mark as OVERDUE
        $appointment = $this->createAppointment('BOOKED', now()->subDay()->format('Y-m-d'));

        $service = app(MarkOverdueAppointmentsService::class);
        $job = new MarkOverdueAppointmentsJob($service);

        // First run
        $job->handle();

        // Second run - should not throw exception
        $job->handle();

        // Verify still OVERDUE, no duplicate records
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => AppointmentStatusEnum::OVERDUE->value,
        ]);

        // Verify only one appointment record exists
        $this->assertEquals(1, Appointment::where('id', $appointment->id)->count());
    }

    /**
     * Idempotency: OVERDUE appointments stay OVERDUE.
     */
    public function test_overdue_appointments_stay_overdue(): void
    {
        // Create already OVERDUE appointment
        $overdue = $this->createAppointment('OVERDUE', now()->subDay()->format('Y-m-d'));

        $service = app(MarkOverdueAppointmentsService::class);
        $job = new MarkOverdueAppointmentsJob($service);

        // Run job - should not change anything
        $job->handle();

        $this->assertDatabaseHas('appointments', [
            'id' => $overdue->id,
            'status' => AppointmentStatusEnum::OVERDUE->value,
        ]);
    }
}
