<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\DTOs\Api\Visit\CreateVisitData;
use App\DTOs\Api\Visit\CreateVisitFromAppointmentData;
use App\DTOs\Api\Visit\ListVisitData;
use App\Factories\ApiFactory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Reception\IndexVisitRequest;
use App\Http\Requests\Reception\StoreVisitFromAppointmentRequest;
use App\Http\Requests\Reception\StoreVisitRequest;
use App\Http\Resources\Reception\VisitResource;
use App\Models\Visit;
use Illuminate\Http\JsonResponse;

class VisitController extends Controller
{
    /**
     * Store a newly created Visit.
     *
     * @param StoreVisitRequest $request
     * @return JsonResponse
     */
    public function store(StoreVisitRequest $request): JsonResponse
    {
        $dto = CreateVisitData::fromRequest($request->validated());

        $visit = ApiFactory::getVisitService()
            ->withUser($request->user())
            ->create($dto);

        return response()->json([
            'success' => true,
            'message' => trans('reception.visit_created'),
            'data' => new VisitResource($visit),
        ], 201);
    }

    /**
     * Store a newly created Visit from an Appointment.
     *
     * @param StoreVisitFromAppointmentRequest $request
     * @return JsonResponse
     */
    public function storeFromAppointment(StoreVisitFromAppointmentRequest $request): JsonResponse
    {
        $dto = CreateVisitFromAppointmentData::fromRequest($request->validated());

        $visit = ApiFactory::getVisitService()
            ->withUser($request->user())
            ->createFromAppointment($dto);

        return response()->json([
            'success' => true,
            'message' => trans('reception.visit_created_from_appointment'),
            'data' => new VisitResource($visit),
        ], 201);
    }

    /**
     * Update an existing Visit.
     *
     * @param \App\Http\Requests\Reception\UpdateVisitRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(\App\Http\Requests\Reception\UpdateVisitRequest $request, int $id): JsonResponse
    {
        $dto = \App\DTOs\Api\Visit\UpdateVisitData::fromRequest($request->validated());

        $visit = ApiFactory::getVisitService()
            ->withUser($request->user())
            ->update($id, $dto);

        return response()->json([
            'success' => true,
            'message' => trans('reception.visit_updated'),
            'data' => new VisitResource($visit),
        ]);
    }

    /**
     * Display a listing of Visits.
     *
     * @param IndexVisitRequest $request
     * @return JsonResponse
     */
    public function index(IndexVisitRequest $request): JsonResponse
    {
        $dto = ListVisitData::fromRequest($request->validated());

        $visits = ApiFactory::getVisitService()
            ->withUser($request->user())
            ->list($dto);

        return response()->json([
            'success' => true,
            'data' => VisitResource::collection($visits),
            'meta' => [
                'current_page' => $visits->currentPage(),
                'last_page' => $visits->lastPage(),
                'per_page' => $visits->perPage(),
                'total' => $visits->total(),
            ],
        ]);
    }

    /**
     * Cancel a Visit.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function cancel(int $id): JsonResponse
    {
        $visit = ApiFactory::getVisitService()
            ->withUser(request()->user())
            ->cancel($id);

        return response()->json([
            'success' => true,
            'message' => trans('reception.visit_cancelled'),
            'data' => new VisitResource($visit),
        ]);
    }

    /**
     * Remove a Visit (soft delete).
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $visit = Visit::findOrFail($id);

        $this->authorize('delete', $visit);

        ApiFactory::getVisitService()
            ->withUser(request()->user())
            ->delete($id);

        return response()->json(null, 204);
    }
}
