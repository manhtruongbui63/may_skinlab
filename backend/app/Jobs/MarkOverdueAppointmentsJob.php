<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Factories\BackgroundFactory;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class MarkOverdueAppointmentsJob implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var list<int>
     */
    public $backoff = [60, 300, 600]; // 1min, 5min, 10min

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('MarkOverdueAppointmentsJob started');

        try {
            $count = BackgroundFactory::getMarkOverdueAppointmentsBackgroundService()
                ->markOverdue();

            Log::info('MarkOverdueAppointmentsJob completed', [
                'count' => $count,
            ]);
        } catch (Throwable $e) {
            Log::error('MarkOverdueAppointmentsJob failed during execution', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // Don't re-throw — job will retry automatically based on $tries/$backoff
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(Throwable $exception): void
    {
        Log::critical('MarkOverdueAppointmentsJob permanently failed', [
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}
