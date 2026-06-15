<?php

declare(strict_types=1);

namespace App\Services\Api;

use App\DTOs\Api\Visit\CreateVisitData;
use App\DTOs\Api\Visit\CreateVisitFromAppointmentData;
use App\DTOs\Api\Visit\ListVisitData;
use App\Enums\AppointmentStatusEnum;
use App\Enums\RegistrationTypeEnum;
use App\Enums\VisitStatusEnum;
use App\Models\Appointment;
use App\Models\Visit;
use App\Services\Base\Service;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class VisitService extends Service
{
    /**
     * Create a new Visit with auto-generated code and queue_number.
     *
     * @param CreateVisitData $dto
     * @return Visit
     * @throws \Throwable
     */
    public function create(CreateVisitData $dto): Visit
    {
        return DB::transaction(function () use ($dto) {
            // Generate visit code: KByyMMdd-NNNN
            $code = $this->generateVisitCode();

            // Generate queue number (per room, per day)
            $queueNumber = $this->generateQueueNumber($dto->clinicRoomId);

            // Prepare visit data
            $visitData = [
                'code' => $code,
                'queue_number' => $queueNumber,
                'customer_id' => $dto->customerId,
                'clinic_room_id' => $dto->clinicRoomId,
                'registration_type' => $dto->registrationType,
                'status' => VisitStatusEnum::WAITING->value,
                'is_priority' => $dto->isPriority,
                'visited_at' => now(),
                'appointment_date' => $dto->registrationType === RegistrationTypeEnum::SCHEDULED->value
                    ? $dto->appointmentDate
                    : ($dto->appointmentDate ?? now()),
                'reason' => $dto->reason,
            ];

            // Create the visit
            $visit = Visit::create($visitData);

            // Attach services
            if (!empty($dto->serviceIds)) {
                $visit->services()->sync($dto->serviceIds);
            }

            // Attach service packages
            if (!empty($dto->servicePackageIds)) {
                $visit->packages()->sync($dto->servicePackageIds);
            }

            // Log the creation
            Log::info('Visit created successfully', [
                'visit_id' => $visit->id,
                'code' => $code,
                'queue_number' => $queueNumber,
                'registration_type' => $dto->registrationType,
                'user_id' => $this->user?->id,
            ]);

            // Load relations for response
            return $visit->fresh()->load(['customer', 'clinicRoom', 'services', 'packages']);
        });
    }

    /**
     * Update an existing Visit.
     *
     * @param int $id
     * @param \App\DTOs\Api\Visit\UpdateVisitData $dto
     * @return Visit
     * @throws \Throwable
     */
    public function update(int $id, \App\DTOs\Api\Visit\UpdateVisitData $dto): Visit
    {
        return DB::transaction(function () use ($id, $dto) {
            $visit = Visit::findOrFail($id);

            // Update fields (visit code and queue_number are auto-generated, do NOT edit)
            $visit->update([
                'customer_id' => $dto->customerId,
                'clinic_room_id' => $dto->clinicRoomId,
                'registration_type' => $dto->registrationType,
                'is_priority' => $dto->isPriority,
                'appointment_date' => $dto->registrationType === RegistrationTypeEnum::SCHEDULED->value
                    ? $dto->appointmentDate
                    : ($dto->appointmentDate ?? $visit->appointment_date ?? $visit->created_at ?? now()),
                'reason' => $dto->reason,
            ]);

            // Sync relations
            $visit->services()->sync($dto->serviceIds);
            $visit->packages()->sync($dto->servicePackageIds);

            Log::info('Visit updated successfully', [
                'visit_id' => $visit->id,
                'code' => $visit->code,
                'user_id' => $this->user?->id,
            ]);

            return $visit->fresh()->load(['customer', 'clinicRoom', 'services', 'packages']);
        });
    }

    /**
     * Create a new Visit from an Appointment.
     *
     * Uses lockForUpdate to prevent race conditions when multiple users
     * attempt to check in the same appointment simultaneously.
     *
     * @param CreateVisitFromAppointmentData $dto
     * @return Visit
     * @throws \Throwable
     */
    public function createFromAppointment(CreateVisitFromAppointmentData $dto): Visit
    {
        return DB::transaction(function () use ($dto) {
            // 1. Load Appointment with LOCK to prevent race condition
            $appointment = Appointment::query()
                ->where('id', $dto->appointmentId)
                ->lockForUpdate()
                ->first();

            if (!$appointment) {
                throw new NotFoundHttpException(trans('reception.errors.appointment_not_found'));
            }

            // 2. Check status is BOOKED - if not, another process already checked in
            if ($appointment->status !== AppointmentStatusEnum::BOOKED) {
                throw new UnprocessableEntityHttpException(
                    trans('reception.errors.appointment_not_bookable'),
                );
            }

            // 3. Generate code and queue_number
            $code = $this->generateVisitCode();
            $queueNumber = $this->generateQueueNumber($dto->clinicRoomId);

            // 4. Create Visit
            $visit = Visit::create([
                'code' => $code,
                'queue_number' => $queueNumber,
                'customer_id' => $appointment->customer_id,
                'appointment_id' => $appointment->id,
                'clinic_room_id' => $dto->clinicRoomId,
                'registration_type' => RegistrationTypeEnum::SCHEDULED->value,
                'status' => VisitStatusEnum::WAITING->value,
                'is_priority' => $dto->isPriority,
                'visited_at' => now(),
                'appointment_date' => $appointment->appointment_date,
            ]);

            // 5. Update Appointment status to CHECKED_IN
            $appointment->update(['status' => AppointmentStatusEnum::CHECKED_IN]);

            // 6. Log
            Log::info('Visit created from appointment', [
                'visit_id' => $visit->id,
                'appointment_id' => $appointment->id,
                'code' => $code,
                'user_id' => $this->user?->id,
            ]);

            // 7. Return with relations
            return $visit->fresh()->load(['customer', 'appointment', 'clinicRoom']);
        });
    }

    /**
     * List visits with filters.
     *
     * @param ListVisitData $dto
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function list(ListVisitData $dto): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $from = $dto->from ? Carbon::parse($dto->from) : today();
        $to = $dto->to ? Carbon::parse($dto->to) : $from;

        return Visit::query()
            ->whereBetween('visited_at', [$from->startOfDay(), $to->endOfDay()])
            ->when($dto->status !== null, fn ($q) => $q->where('status', $dto->status))
            ->with(['customer', 'clinicRoom', 'services', 'packages'])
            ->orderBy('queue_number', 'asc')
            ->paginate($dto->perPage, ['*'], 'page', $dto->page);
    }

    /**
     * Cancel a visit.
     *
     * Only visits with WAITING or IN_PROGRESS status can be cancelled.
     *
     * @param int $visitId
     * @return Visit
     * @throws \Throwable
     */
    public function cancel(int $visitId): Visit
    {
        return DB::transaction(function () use ($visitId) {
            $visit = Visit::findOrFail($visitId);

            if (!in_array($visit->status, [VisitStatusEnum::WAITING, VisitStatusEnum::IN_PROGRESS], true)) {
                throw new UnprocessableEntityHttpException(
                    $visit->status === VisitStatusEnum::COMPLETED
                        ? trans('reception.errors.visit_already_completed')
                        : trans('reception.errors.visit_already_cancelled'),
                );
            }

            $visit->update(['status' => VisitStatusEnum::CANCELLED]);

            Log::info('Visit cancelled', [
                'visit_id' => $visit->id,
                'user_id' => $this->user?->id,
            ]);

            return $visit->fresh()->load(['customer', 'clinicRoom', 'services', 'packages']);
        });
    }

    /**
     * Delete (soft delete) a visit.
     *
     * @param int $visitId
     * @return void
     * @throws \Throwable
     */
    public function delete(int $visitId): void
    {
        $visit = Visit::findOrFail($visitId);

        $visit->delete();

        Log::info('Visit deleted', [
            'visit_id' => $visitId,
            'user_id' => $this->user?->id,
        ]);
    }

    /**
     * Generate visit code in format KByyMMdd-NNNN.
     *
     * Uses lockForUpdate to prevent race conditions.
     *
     * @return string
     */
    private function generateVisitCode(): string
    {
        $today = now()->format('ymd');
        $prefix = "KB{$today}";

        // Count today's visits with lock to prevent race condition
        $count = Visit::query()
            ->whereDate('visited_at', today())
            ->lockForUpdate()
            ->count();

        $sequence = $count + 1;

        return "{$prefix}-" . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate queue number for the day (per room).
     *
     * Uses lockForUpdate to prevent race conditions.
     *
     * @param int|null $clinicRoomId
     * @return int
     */
    private function generateQueueNumber(?int $clinicRoomId): int
    {
        // For scheduled visits without a room assigned yet
        if ($clinicRoomId === null) {
            return 0;
        }

        // Count visits for this room today with lock
        $count = Visit::query()
            ->whereDate('visited_at', today())
            ->where('clinic_room_id', $clinicRoomId)
            ->lockForUpdate()
            ->count();

        return $count + 1;
    }
}
