<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class HomeController extends Controller
{
    /**
     * Homepage
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return $this->sendSuccessResponse([
            'status' => true,
        ]);
    }
}
