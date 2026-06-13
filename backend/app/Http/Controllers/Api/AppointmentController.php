<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\DTOs\Api\Appointment\CreateAppointmentData;
use App\DTOs\Api\Appointment\UpdateAppointmentData;
use App\Factories\ApiFactory;
use App\Http\Controllers\Api\BaseController;
use App\Http\Requests\Appointment\IndexAppointmentRequest;
use App\Http\Requests\Appointment\StoreAppointmentRequest;
use App\Http\Requests\Appointment\UpdateAppointmentRequest;
use App\Http\Resources\Appointment\AppointmentResource;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;

/**
 * Controller for Appointment API endpoints.
 */
class AppointmentController extends BaseController
{
    /**
     * Get paginated list of appointments.
     *
     * @param IndexAppointmentRequest $request
     * @return JsonResponse
     */
    public function index(IndexAppointmentRequest $request): JsonResponse
    {
        $appointments = ApiFactory::getAppointmentService()
            ->withUser($this->guard()->user())
            ->list($request->validated());

        return response()->json([
            'success' => true,
            'message' => '',
            'errors' => null,
            'data' => AppointmentResource::collection($appointments),
            'meta' => [
                'current_page' => $appointments->currentPage(),
                'last_page' => $appointments->lastPage(),
                'per_page' => $appointments->perPage(),
                'total' => $appointments->total(),
            ],
        ]);
    }

    /**
     * Get appointment detail.
     *
     * @param Appointment $appointment
     * @return JsonResponse
     */
    public function show(Appointment $appointment): JsonResponse
    {
        $appointment->load('customer:id,full_name,phone');

        return response()->json([
            'success' => true,
            'message' => '',
            'errors' => null,
            'data' => new AppointmentResource($appointment),
        ]);
    }

    /**
     * Create a new appointment.
     *
     * @param StoreAppointmentRequest $request
     * @return JsonResponse
     */
    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $data = CreateAppointmentData::from($request->validated());
        $appointment = ApiFactory::getAppointmentService()
            ->withUser($this->guard()->user())
            ->create($data);

        $appointment->load('customer:id,full_name,phone');

        return response()->json([
            'success' => true,
            'message' => trans('appointments.created'),
            'errors' => null,
            'data' => new AppointmentResource($appointment),
        ], 201);
    }

    /**
     * Update an appointment (reschedule or status transition).
     *
     * @param UpdateAppointmentRequest $request
     * @param Appointment $appointment
     * @return JsonResponse
     */
    public function update(UpdateAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        $data = UpdateAppointmentData::from($request->validated());
        $appointment = ApiFactory::getAppointmentService()
            ->withUser($this->guard()->user())
            ->update($appointment, $data);

        return response()->json([
            'success' => true,
            'message' => trans('appointments.updated'),
            'errors' => null,
            'data' => new AppointmentResource($appointment),
        ]);
    }

    /**
     * Delete (soft delete) an appointment.
     *
     * @param Appointment $appointment
     * @return JsonResponse
     */
    public function destroy(Appointment $appointment): JsonResponse
    {
        ApiFactory::getAppointmentService()
            ->withUser($this->guard()->user())
            ->delete($appointment);

        return response()->json([
            'success' => true,
            'message' => trans('appointments.deleted'),
            'errors' => null,
            'data' => null,
        ]);
    }
}
