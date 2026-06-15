<?php

declare(strict_types=1);

namespace App\Services\Background;

use App\Enums\AppointmentStatusEnum;
use App\Models\Appointment;
use App\Services\Base\Service;
use Illuminate\Support\Facades\Log;

class MarkOverdueAppointmentsService extends Service
{
    /**
     * Mark all booked appointments with past dates as overdue.
     *
     * @return int Number of appointments updated
     */
    public function markOverdue(): int
    {
        $count = Appointment::query()
            ->whereDate('appointment_date', '<', now()->toDateString())
            ->where('status', AppointmentStatusEnum::BOOKED)
            ->whereNull('deleted_at')
            ->update([
                'status' => AppointmentStatusEnum::OVERDUE->value,
            ]);

        Log::info('Marked overdue appointments', [
            'count' => $count,
            'date_threshold' => now()->toDateString(),
        ]);

        return $count;
    }
}
