<?php

declare(strict_types=1);

namespace App\Services\Api;

use App\DTOs\Api\Appointment\CreateAppointmentData;
use App\DTOs\Api\Appointment\UpdateAppointmentData;
use App\Enums\AppointmentStatusEnum;
use App\Models\Appointment;
use App\Services\Base\Service;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

/**
 * Service for appointment-related API operations.
 */
class AppointmentService extends Service
{
    /**
     * Terminal statuses from which no further transition is allowed.
     *
     * @var list<AppointmentStatusEnum>
     */
    private const array TERMINAL_STATUSES = [
        AppointmentStatusEnum::COMPLETED,
        AppointmentStatusEnum::CANCELLED,
        AppointmentStatusEnum::NO_SHOW,
    ];

    /**
     * Valid status transitions map: current → allowed next statuses.
     *
     * @var array<int, list<int>>
     */
    private const array ALLOWED_TRANSITIONS = [
        AppointmentStatusEnum::BOOKED->value => [AppointmentStatusEnum::CONFIRMED->value, AppointmentStatusEnum::CANCELLED->value],
        AppointmentStatusEnum::CONFIRMED->value => [AppointmentStatusEnum::CHECKED_IN->value, AppointmentStatusEnum::CANCELLED->value],
        AppointmentStatusEnum::CHECKED_IN->value => [AppointmentStatusEnum::COMPLETED->value, AppointmentStatusEnum::NO_SHOW->value],
        AppointmentStatusEnum::COMPLETED->value => [],
        AppointmentStatusEnum::CANCELLED->value => [],
        AppointmentStatusEnum::NO_SHOW->value => [],
    ];

    /**
     * Get paginated list of appointments with optional filters.
     *
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator
     */
    public function list(array $filters): LengthAwarePaginator
    {
        $query = Appointment::query()
            ->with('customer:id,full_name,phone')
            ->select(['appointments.*']);

        if (!empty($filters['date'])) {
            $query->whereDate('appointment_date', $filters['date']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', (int) $filters['status']);
        }

        if (!empty($filters['search'])) {
            $query->whereHas('customer', function ($q) use ($filters) {
                $q->where('full_name', 'like', '%' . $filters['search'] . '%')
                    ->orWhere('phone', 'like', '%' . $filters['search'] . '%');
            });
        }

        $perPage = (int) ($filters['per_page'] ?? 15);
        $page = (int) ($filters['page'] ?? 1);

        return $query->orderBy('appointment_at', 'asc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Create a new appointment with double-booking check (BR-APPT-001).
     *
     * @param CreateAppointmentData $dto
     * @return Appointment
     * @throws ValidationException
     */
    public function create(CreateAppointmentData $dto): Appointment
    {
        $appointmentAt = $this->buildAppointmentAt($dto->appointmentDate, $dto->appointmentTime);

        return DB::transaction(function () use ($dto, $appointmentAt) {
            $this->assertNoDoubleBooking($appointmentAt);

            return Appointment::create([
                'customer_id' => $dto->customerId,
                'appointment_at' => $appointmentAt,
                'appointment_date' => $dto->appointmentDate,
                'status' => AppointmentStatusEnum::BOOKED,
                'note' => $dto->note,
            ]);
        });
    }

    /**
     * Update an appointment — reschedule and/or change status.
     *
     * @param Appointment $appointment
     * @param UpdateAppointmentData $dto
     * @return Appointment
     * @throws ValidationException
     */
    public function update(Appointment $appointment, UpdateAppointmentData $dto): Appointment
    {
        return DB::transaction(function () use ($appointment, $dto) {
            $updateData = $this->buildUpdateData($appointment, $dto);
            $appointment->update($updateData);

            return $appointment->fresh(['customer']);
        });
    }

    /**
     * Soft delete an appointment.
     *
     * @param Appointment $appointment
     * @return void
     */
    public function delete(Appointment $appointment): void
    {
        $appointment->delete();
    }

    /**
     * Force-transition an appointment to COMPLETED (used by Visit creation — BR-APPT-004).
     *
     * @param Appointment $appointment
     * @return void
     */
    public function markCompleted(Appointment $appointment): void
    {
        $appointment->update(['status' => AppointmentStatusEnum::COMPLETED]);
    }

    /**
     * Cancel an appointment (transition BOOKED → CANCELLED).
     *
     * Only appointments with BOOKED status can be cancelled.
     *
     * @param Appointment $appointment
     * @return Appointment
     * @throws \Illuminate\Validation\ValidationException
     */
    public function cancel(Appointment $appointment): Appointment
    {
        return DB::transaction(function () use ($appointment) {
            // Check if appointment is in BOOKED status
            if ($appointment->status !== AppointmentStatusEnum::BOOKED) {
                throw ValidationException::withMessages([
                    'status' => trans('reception.errors.appointment_not_cancellable'),
                ]);
            }

            // Validate transition is allowed
            $this->assertValidTransition($appointment, AppointmentStatusEnum::CANCELLED->value);

            // Update status
            $appointment->update(['status' => AppointmentStatusEnum::CANCELLED]);

            return $appointment->fresh(['customer']);
        });
    }

    /**
     * Build update payload, validating status transitions and double-booking.
     *
     * @param Appointment $appointment
     * @param UpdateAppointmentData $dto
     * @return array<string, mixed>
     * @throws ValidationException
     */
    private function buildUpdateData(Appointment $appointment, UpdateAppointmentData $dto): array
    {
        $updateData = [];

        // Handle status transition
        if ($dto->status !== null) {
            $this->assertValidTransition($appointment, $dto->status);
            $updateData['status'] = AppointmentStatusEnum::from($dto->status);
        }

        // Handle rescheduling
        if ($dto->appointmentDate !== null || $dto->appointmentTime !== null) {
            $newDate = $dto->appointmentDate ?? $appointment->appointment_at->format('Y-m-d');
            $newTime = $dto->appointmentTime ?? $appointment->appointment_at->format('H:i');
            $newAt = $this->buildAppointmentAt($newDate, $newTime);

            // Only check double-booking if the slot actually changed
            if (!$appointment->appointment_at->eq($newAt)) {
                $this->assertNoDoubleBooking($newAt, $appointment->id);
            }

            $updateData['appointment_at'] = $newAt;
            $updateData['appointment_date'] = $newDate;
        }

        if ($dto->note !== null) {
            $updateData['note'] = $dto->note;
        }

        return $updateData;
    }

    /**
     * Assert that a status transition is valid (BR-APPT-003).
     *
     * @param Appointment $appointment
     * @param int $newStatus
     * @return void
     * @throws ValidationException
     */
    private function assertValidTransition(Appointment $appointment, int $newStatus): void
    {
        $currentValue = $appointment->status->value;
        $allowed = self::ALLOWED_TRANSITIONS[$currentValue] ?? [];

        if (!in_array($newStatus, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => trans('appointments.errors.invalid_status_transition'),
            ]);
        }
    }

    /**
     * Assert that the given slot is not already booked (BR-APPT-001).
     *
     * @param Carbon $appointmentAt
     * @param int|null $excludeId Appointment to exclude from check (for updates).
     * @return void
     * @throws ValidationException
     */
    private function assertNoDoubleBooking(Carbon $appointmentAt, ?int $excludeId = null): void
    {
        $query = Appointment::whereIn('status', [
            AppointmentStatusEnum::BOOKED->value,
            AppointmentStatusEnum::CONFIRMED->value,
            AppointmentStatusEnum::CHECKED_IN->value,
        ])
            ->where('appointment_at', $appointmentAt)
            ->lockForUpdate();

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'appointment_time' => trans('appointments.errors.double_booking'),
            ]);
        }
    }

    /**
     * Build a Carbon datetime from separate date and time strings.
     *
     * @param string $date Y-m-d
     * @param string $time H:i
     * @return Carbon
     */
    private function buildAppointmentAt(string $date, string $time): Carbon
    {
        return Carbon::createFromFormat('Y-m-d H:i', "{$date} {$time}");
    }
}
