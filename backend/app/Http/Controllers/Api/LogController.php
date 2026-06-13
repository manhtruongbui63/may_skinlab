<?php

namespace App\Http\Controllers\Api;

use App\DTOs\Api\Log\StoreLogData;
use App\Factories\ApiFactory;
use App\Http\Requests\Log\StoreLogRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class LogController extends BaseController
{
    /**
     * Ingest a batch of client (frontend) log entries.
     *
     * Acts like a self-hosted Sentry transport: the browser pushes batched
     * events here and they are written, enriched with request metadata, to the
     * dedicated `frontend` log channel (kept separate from the app log).
     * @unauthenticated
     *
     * @param StoreLogRequest $request
     * @return JsonResponse
     */
    public function store(StoreLogRequest $request): JsonResponse
    {
        $dto = StoreLogData::from([
            'logs' => $request->input('logs', []),
            'meta' => [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'user_id' => Auth::guard($this->getGuard())->id(),
            ],
        ]);

        ApiFactory::getLogService()->store($dto);

        return $this->sendSuccessResponse(null);
    }
}
