<?php

namespace App\Http\Controllers\Api;

use App\Factories\ApiFactory;
use App\DTOs\Api\User\UserIndexData;
use App\Http\Requests\Common\IndexRequest;
use App\Http\Resources\User\UserCollection;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class UserController extends BaseController
{
    /**
     * UserController constructor.
     */
    public function __construct()
    {
        $this->middleware($this->authMiddleware());
    }

    /**
     * Display a listing of the resource.
     *
     * @param IndexRequest $request
     * @return JsonResponse
     */
    public function index(IndexRequest $request): JsonResponse
    {
        // Authorization: Check if user has permission to view list
        Gate::authorize('viewAny', User::class);

        $dto = UserIndexData::from($request->validated());

        $data = ApiFactory::getUserTableService()
            ->withUser($this->guard()->user())
            ->data(...$dto->toTableParams());

        return $this->sendSuccessResponse(new UserCollection($data));
    }
}
