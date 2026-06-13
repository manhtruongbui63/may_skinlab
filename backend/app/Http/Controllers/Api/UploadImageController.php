<?php

namespace App\Http\Controllers\Api;

use App\DTOs\Api\User\UploadImageData;
use App\Exceptions\InputException;
use App\Factories\CommonFactory;
use App\Http\Requests\Upload\UploadImageRequest;
use App\Models\Image;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class UploadImageController extends BaseController
{
    /**
     * UploadController constructor.
     */
    public function __construct()
    {
        $this->middleware($this->authMiddleware());
    }

    /**
     * Upload image
     *
     * @param UploadImageRequest $request
     * @return JsonResponse
     * @throws InputException
     */
    public function upload(UploadImageRequest $request): JsonResponse
    {
        Gate::authorize('upload', Image::class);

        $dto = UploadImageData::from($request->validated());
        $data = CommonFactory::getFileService()->uploadImage($request->file('image'), $dto->type);

        return $this->sendSuccessResponse($data);
    }
}
