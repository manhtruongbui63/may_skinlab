<?php

namespace App\Http\Controllers\Api;

use App\DTOs\Api\User\MasterDataShowData;
use App\Factories\ApiFactory;
use App\Http\Requests\MasterData\MasterDataShowRequest;
use Illuminate\Http\JsonResponse;

class MasterDataController extends BaseController
{
    /**
     * Master data
     *
     * Public master data (statuses, genders, countries, …) is available to
     * everyone. Resources that expose user records require an authenticated
     * caller (enforced per-resource via the `auth` flag in MasterDataService).
     *
     * @unauthenticated
     *
     * @param MasterDataShowRequest $request
     * @return JsonResponse
     */
    public function show(MasterDataShowRequest $request): JsonResponse
    {
        $dto = MasterDataShowData::from($request->validated());

        if (empty($dto->resources)) {
            return $this->sendSuccessResponse([]);
        }

        $data = ApiFactory::getMasterDataService()
            ->withUser($this->guard()->user())
            ->withResources($dto->resources)
            ->get();

        return $this->sendSuccessResponse($data);
    }
}
