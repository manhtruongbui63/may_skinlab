<?php

namespace App\Http\Controllers;

use App\Helpers\ResponseHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Routing\Controller as RoutingController;

abstract class Controller extends RoutingController
{
    protected $guard;

    /**
     * Get the guest middleware for the application.
     *
     * @return string
     */
    public function guestMiddleware(): string
    {
        $guard = $this->getGuard();
        return $guard ? ('guest:' . $guard) : 'guest';
    }

    /**
     * Get the auth middleware for the application.
     *
     * @return string
     */
    public function authMiddleware(): string
    {
        $guard = $this->getGuard();
        return $guard ? ('auth:' . $guard) : 'auth';
    }

    /**
     * Get the guard to be used during authentication.
     *
     * @return string
     */
    protected function getGuard(): string
    {
        return property_exists($this, 'guard') ? ($this->guard ?: config('auth.defaults.guard')) : config('auth.defaults.guard');
    }

    /**
     * Get the guard to be used during authentication.
     *
     * @return \Illuminate\Contracts\Auth\Guard|\Illuminate\Contracts\Auth\StatefulGuard
     */
    protected function guard()
    {
        return Auth::guard($this->getGuard());
    }

    /**
     * Send Error Response
     *
     * @param string $message
     * @param null $errors
     * @param null $data
     * @param int $code
     * @return JsonResponse
     */
    protected function sendErrorResponse(string $message, $errors = null, $data = null, int $code = ResponseHelper::STATUS_CODE_BAD_REQUEST): JsonResponse
    {
        return ResponseHelper::sendResponse($code, $message, $data, $errors);
    }

    /**
     * @param $data
     * @param string $message
     * @param int $code
     * @return JsonResponse
     */
    protected function sendSuccessResponse($data, string $message = '', int $code = ResponseHelper::STATUS_CODE_SUCCESS): JsonResponse
    {
        return ResponseHelper::sendResponse($code, $message, $data);
    }

    /**
     * Convert Request
     *
     * @param $request
     * @return array
     */
    protected function convertRequest($request): array
    {
        return [
            $request->input('search') ?? '',
            $request->input('orders'),
            $request->input('filters'),
            $request->input('per_page') ?? 10,
        ];
    }
}
