<?php

namespace App\Helpers;

use Illuminate\Http\JsonResponse;

class ResponseHelper
{
    public const STATUS_CODE_SUCCESS = 200;
    public const STATUS_CODE_UNAUTHORIZED = 401;
    public const STATUS_CODE_FORBIDDEN = 403;
    public const STATUS_CODE_BAD_REQUEST = 400;
    public const STATUS_CODE_NOTFOUND = 404;
    public const STATUS_CODE_VALIDATE_ERROR = 422;
    public const STATUS_CODE_SERVER_ERROR = 500;

    /**
     * Send Response
     *
     * @param int $code
     * @param string $message
     * @param mixed|null $data
     * @param array|null $errors
     * @return JsonResponse
     */
    public static function sendResponse(int $code, string $message, mixed $data = null, ?array $errors = null): JsonResponse
    {
        $success = $code >= 200 && $code < 300;

        return response()->json([
            'success' => $success,
            'message' => $message,
            'errors' => $errors,
            'data' => $data,
        ], $code);
    }

    /**
     * Send Json Response
     *
     * @param $data
     * @return JsonResponse
     */
    public static function sendJsonResponse($data): JsonResponse
    {
        return response()->json($data);
    }
}
