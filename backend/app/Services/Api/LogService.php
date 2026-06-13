<?php

namespace App\Services\Api;

use App\DTOs\Api\Log\StoreLogData;
use App\Services\Base\Service;
use Illuminate\Support\Facades\Log;

class LogService extends Service
{
    /**
     * Persist a batch of client (frontend) log entries.
     *
     * Each entry is written, enriched with request metadata, to the dedicated
     * `frontend` log channel (kept separate from the app log).
     *
     * @param StoreLogData $dto
     * @return void
     */
    public function store(StoreLogData $dto): void
    {
        foreach ($dto->logs as $entry) {
            $context = [
                'source' => 'frontend',
                'client_time' => $entry['timestamp'] ?? null,
                'client' => $entry['context'] ?? [],
            ] + $dto->meta;

            Log::channel('frontend')->log($entry['level'], $entry['message'], $context);
        }
    }
}
