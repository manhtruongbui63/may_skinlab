---
title: Task 03 - FileService Multi-Size Refactor
description: Refactor FileService to generate multiple size variants during upload.
requirement: docs/requirements/01-upload-image.md
requirement_section:
  - "Flow 1: Upload Ảnh Multi-Size"
  - "6.4 Disk Storage Layout"
dependency:
  - 02-model-helper
date: 2026-05-06
version: 1.0
type: IMPLEMENTATION
skill: bks-be-api-standard
workflow: /execute-api-task
effort: L
---

# Task 03: FileService Multi-Size Refactor

## Mục tiêu

Refactor `FileService` để generate nhiều size variant trong quá trình upload, lưu vào các thư mục riêng biệt, và trả về `variants` object.

---

## Acceptance Criteria

- [ ] `FileService` đọc config `sizes` array thay vì `full_size`/`thumb_size`
- [ ] Tạo file gốc trong `originals/` directory
- [ ] Loop qua từng size trong config, tạo variant files trong `variants/{size_key}/`
- [ ] File thumb được tạo riêng trong `thumbnails/` (backward compatible)
- [ ] `uploadImage()` trả về array chứa `variants` với đường dẫn tương đối
- [ ] `fakeImage()` được cập nhật tương tự

---

## Chi tiết Implementation

### 1. Refactor FileService

**File:** `backend/app/Services/Common/FileService.php`

Thay đổi chính:

```php
public function uploadImage(UploadedFile $file, $type): array
{
    $this->diskName = config('upload.image_disk');
    $fileName = FileHelper::constructFileName($file->getClientOriginalName());
    
    // Generate all variants
    $variants = $this->generateVariants($file, $type, $fileName);
    
    // Save original
    $originalPath = FileHelper::pathUrl($fileName, config('upload.path_origin_image'));
    $this->storage()->putFileAs(
        config('upload.path_origin_image'),
        $file,
        $fileName
    );
    
    // Create DB record
    $image = Images::query()->create([
        'imageable_id' => $this->user->id ?? null,
        'imageable_type' => $this->user ? get_class($this->user) : null,
        'url' => $originalPath,
        'thumb' => $variants['thumb'] ?? $variants[array_key_first($variants)],
        'type' => $type,
        'variants' => $variants,
    ]);
    
    return [
        'id' => $image->id,
        'url' => $this->storage()->url($image->url),
        'thumb' => $this->storage()->url($image->thumb),
        'type' => $image->type,
        'variants' => $image->variant_urls,
    ];
}

protected function generateVariants($image, $type, $fileName): array
{
    $img = Image::read($image);
    $typeConfig = config('upload.image_types.' . $type);
    
    if (!$typeConfig) {
        throw new InputException(trans('validation.upload_error_type'));
    }
    
    $sizes = $typeConfig['sizes'] ?? [];
    $crop = $typeConfig['crop'] ?? false;
    $variants = [];
    
    foreach ($sizes as $sizeKey => $sizeConfig) {
        $variantImg = clone $img;
        $width = $sizeConfig['width'];
        $height = $sizeConfig['height'];
        
        // Crop if needed
        if ($crop && $height) {
            $variantImg = $this->cropAndResize($variantImg, $width, $height);
        } else {
            // Scale down only (keep aspect ratio, no upscale)
            $variantImg = $variantImg->scaleDown($width);
        }
        
        // Encode
        $encoded = $this->encodeImage($variantImg);
        
        // Save path
        if ($sizeKey === 'thumb') {
            $path = FileHelper::pathUrl($fileName, config('upload.path_thumbnail'));
        } else {
            $path = "variants/{$sizeKey}/{$fileName}";
        }
        
        $this->storage()->put($path, $encoded);
        $variants[$sizeKey] = $path;
    }
    
    return $variants;
}

protected function cropAndResize($img, $targetWidth, $targetHeight)
{
    $deltaTarget = $targetWidth / $targetHeight;
    $deltaCurrent = $img->width() / $img->height();
    
    if ($deltaTarget >= $deltaCurrent) {
        $width = $img->width();
        $height = $width / $deltaTarget;
    } else {
        $height = $img->height();
        $width = $height * $deltaTarget;
    }
    
    return $img->crop((int) $width, (int) $height)
        ->scaleDown($targetWidth);
}

protected function encodeImage($img): string
{
    $encodeType = strtolower((string) config('upload.webp_ext', 'webp'));
    $quality = (int) config('upload.webp_quality', 80);
    
    return match ($encodeType) {
        'jpg', 'jpeg' => $img->toJpeg($quality),
        'png' => $img->toPng(),
        default => $img->toWebp($quality),
    };
}
```

### 2. Update fakeImage()

Tương tự `uploadImage()`, sử dụng `generateVariants()`.

---

## Files thay đổi

| File | Action | Lines |
|---|---|---|
| `backend/app/Services/Common/FileService.php` | MODIFY | ~100 |

---

## Dependencies

- ✅ Task 02: Image Model & FileHelper Update

---

## Execution Workflow

Sử dụng `/execute-api-task` workflow với skill `bks-be-api-standard`:

1. Đọc skill `bks-be-api-standard`
2. Refactor `FileService`
3. Cập nhật `fakeImage()`
4. Test upload

---

*Task 03 - Phase 2b: Backend API*
