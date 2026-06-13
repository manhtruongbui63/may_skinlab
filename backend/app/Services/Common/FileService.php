<?php

namespace App\Services\Common;

use App\Services\Base\Service;
use App\Helpers\FileHelper;
use App\Models\Image as Images;
use Illuminate\Http\UploadedFile;
use App\Exceptions\InputException;
use Intervention\Image\Laravel\Facades\Image;
use Illuminate\Support\Facades\Storage;
use Illuminate\Contracts\Filesystem\Filesystem;

class FileService extends Service
{
    /**
     * @var string
     */
    protected $diskName;

    /**
     * @var Filesystem
     */
    protected $storage;

    /**
     * @return Filesystem
     */
    private function storage(): Filesystem
    {
        if (!$this->storage) {
            $this->storage = Storage::disk($this->diskName);
        }

        return $this->storage;
    }

    /**
     * Upload image
     *
     * @param UploadedFile $file
     * @param $type
     * @return array
     * @throws InputException
     */
    public function uploadImage(UploadedFile $file, $type): array
    {
        $this->diskName = config('upload.image_disk');

        $fileName = FileHelper::constructFileName($file->getClientOriginalName());

        [$fullPath, $thumbPath] = $this->resizeImage($file, $type, $fileName);

        $image = Images::query()->create([
            'imageable_id' => $this->user->id ?? null,
            'imageable_type' => $this->user ? get_class($this->user) : null,
            'url' => $fullPath,
            'thumb' => $thumbPath,
            'type' => $type,
        ]);

        $imageUrl = $this->storage()->url($image->url);
        $thumbnailUrl = $this->storage()->url($image->thumb);

        return ['url' => $imageUrl, 'thumb' => $thumbnailUrl, 'type' => $image->type, 'id' => $image->id];
    }

    /**
     * Fake image
     *
     * @param $type
     * @return array
     * @throws InputException
     */
    public function fakeImage($type): array
    {
        $this->diskName = config('upload.image_disk');
        $typeImage = config("upload.image_types.{$type}");
        [$fullSize] = $this->resolveSizes($typeImage ?? []);
        $width = $fullSize['width'] ?? 360;
        $height = $fullSize['height'] ?? $width;
        $imageUrl = 'https://via.placeholder.com/' . $width . 'x' . $height . '.png';

        $fileName = FileHelper::constructFileName();

        [$fullPath, $thumbPath] = $this->resizeImage($imageUrl, $type, $fileName);

        $image = Images::query()->create([
            'imageable_id' => $this->user->id ?? null,
            'imageable_type' => $this->user ? get_class($this->user) : null,
            'url' => $fullPath,
            'thumb' => $thumbPath,
            'type' => $type,
        ]);

        $imageUrl = $this->storage()->url($image->url);
        $thumbnailUrl = $this->storage()->url($image->thumb);

        return ['url' => $imageUrl, 'thumb' => $thumbnailUrl];
    }

    /**
     * Resize
     *
     * @param $image
     * @param $type
     * @param $fileName
     * @return false[]|string[]
     * @throws InputException
     */
    protected function resizeImage($image, $type, $fileName): array
    {
        $img = Image::read($image);
        $typeImage = config("upload.image_types.{$type}");

        if (!$typeImage) {
            throw new InputException(trans('validation.upload_error_type'));
        }

        [$fullSize, $thumbSize] = $this->resolveSizes($typeImage);

        $fullPath = FileHelper::pathUrl($fileName, config('upload.path_origin_image'));
        $thumbPath = FileHelper::pathUrl($fileName, config('upload.path_thumbnail'));

        // Crop to the target aspect ratio first (only when both dimensions are known).
        if (!empty($typeImage['crop']) && $fullSize['width'] && $fullSize['height']) {
            $deltaOld = $fullSize['width'] / $fullSize['height'];
            $deltaNew = $img->width() / $img->height();

            if ($deltaOld >= $deltaNew) {
                $width = $img->width();
                $height = $width / $deltaOld;
            } else {
                $height = $img->height();
                $width = $height * $deltaOld;
            }

            $img = $img->crop((int) $width, (int) $height);
        }

        // Resize keeping aspect ratio without upscaling (scaleDown tolerates null dimensions).
        $imageOrigin = (clone $img)->scaleDown($fullSize['width'], $fullSize['height']);
        $imageThumb = (clone $img)->scaleDown($thumbSize['width'], $thumbSize['height']);

        $encodeType = strtolower((string) config('upload.webp_ext', 'webp'));
        $webpQuality = (int) config('upload.webp_quality', 80);

        // Encode using Intervention Image v3 encoders
        switch ($encodeType) {
            case 'jpg':
            case 'jpeg':
                $originBinary = $imageOrigin->toJpeg($webpQuality);
                $thumbBinary = $imageThumb->toJpeg($webpQuality);
                break;
            case 'png':
                $originBinary = $imageOrigin->toPng();
                $thumbBinary = $imageThumb->toPng();
                break;
            case 'webp':
            default:
                $originBinary = $imageOrigin->toWebp($webpQuality);
                $thumbBinary = $imageThumb->toWebp($webpQuality);
                break;
        }

        $this->storage()->put($fullPath, $originBinary);
        $this->storage()->put($thumbPath, $thumbBinary);

        return [$fullPath, $thumbPath];
    }

    /**
     * Resolve the "full" (largest) and "thumb" (smallest) target dimensions
     * from an image type's `sizes` config map.
     *
     * @param array $typeImage
     * @return array{0: array{width: int|null, height: int|null}, 1: array{width: int|null, height: int|null}}
     */
    protected function resolveSizes(array $typeImage): array
    {
        $sizes = $typeImage['sizes'] ?? [];

        $full = null;
        foreach ($sizes as $dimension) {
            if ($full === null || ($dimension['width'] ?? 0) >= ($full['width'] ?? 0)) {
                $full = $dimension;
            }
        }

        $thumb = $sizes['thumb'] ?? null;
        if ($thumb === null) {
            foreach ($sizes as $dimension) {
                if ($thumb === null || ($dimension['width'] ?? PHP_INT_MAX) < ($thumb['width'] ?? PHP_INT_MAX)) {
                    $thumb = $dimension;
                }
            }
        }

        $full = $full ?? ['width' => null, 'height' => null];
        $thumb = $thumb ?? $full;

        return [
            ['width' => $full['width'] ?? null, 'height' => $full['height'] ?? null],
            ['width' => $thumb['width'] ?? null, 'height' => $thumb['height'] ?? null],
        ];
    }
}
