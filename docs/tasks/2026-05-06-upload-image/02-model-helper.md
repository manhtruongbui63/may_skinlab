---
title: Task 02 - Image Model & FileHelper Update
description: Update Image model with variants cast and accessors, add helper methods for variant URLs.
requirement: docs/requirements/01-upload-image.md
requirement_section:
  - "6.2 Model: Image"
  - "6.3 Config: config/upload.php"
  - "Flow 3: Helper Lấy Variant URLs / Srcset"
dependency:
  - 01-database-config
date: 2026-05-06
version: 1.0
type: IMPLEMENTATION
skill: bks-be-api-standard
workflow: /execute-api-task
effort: M
---

# Task 02: Image Model & FileHelper Update

## Mục tiêu

Cập nhật Model `Image` với casts và accessors cho variants, thêm helper methods trong `FileHelper` để lấy variant URLs và tạo srcset.

---

## Acceptance Criteria

- [ ] Model `Image` có casts `'variants' => 'array'`
- [ ] Model `Image` có accessor `variant_urls` trả về object URLs
- [ ] Model `Image` có accessor `responsive_srcset` trả về chuỗi srcset
- [ ] `FileHelper` có method `getVariantUrls(Image $image): array`
- [ ] `FileHelper` có method `getResponsiveSrcset(Image $image): string`

---

## Chi tiết Implementation

### 1. Model Update

**File:** `backend/app/Models/Image.php`

Thêm vào class `Image`:

```php
protected $casts = [
    'variants' => 'array',
];

/**
 * Get variants as full URLs object
 */
protected function variantUrls(): Attribute
{
    return Attribute::make(
        get: function () {
            if (!$this->variants || !is_array($this->variants)) {
                return ['original' => Storage::disk(config('upload.image_disk'))->url($this->url)];
            }
            
            $disk = Storage::disk(config('upload.image_disk'));
            $urls = [];
            foreach ($this->variants as $size => $path) {
                $urls[$size] = $disk->url($path);
            }
            return $urls;
        }
    );
}

/**
 * Get responsive srcset string
 */
protected function responsiveSrcset(): Attribute
{
    return Attribute::make(
        get: function () {
            $urls = $this->variant_urls;
            $srcset = [];
            foreach ($urls as $size => $url) {
                $width = str_replace('w', '', $size);
                if (is_numeric($width)) {
                    $srcset[] = "{$url} {$width}w";
                }
            }
            return implode(', ', $srcset);
        }
    );
}
```

### 2. FileHelper Update

**File:** `backend/app/Helpers/FileHelper.php`

Thêm methods:

```php
use App\Models\Image;

/**
 * Get variant URLs for an image
 *
 * @param Image $image
 * @return array
 */
public static function getVariantUrls(Image $image): array
{
    if (!$image->variants || !is_array($image->variants)) {
        return ['original' => self::storageImages()->url($image->url)];
    }
    
    $urls = [];
    foreach ($image->variants as $size => $path) {
        $urls[$size] = self::storageImages()->url($path);
    }
    return $urls;
}

/**
 * Get responsive srcset string for an image
 *
 * @param Image $image
 * @return string
 */
public static function getResponsiveSrcset(Image $image): string
{
    $urls = self::getVariantUrls($image);
    $srcset = [];
    
    foreach ($urls as $size => $url) {
        $width = str_replace('w', '', $size);
        if (is_numeric($width)) {
            $srcset[] = "{$url} {$width}w";
        }
    }
    
    return implode(', ', $srcset);
}
```

---

## Files thay đổi

| File | Action | Lines |
|---|---|---|
| `backend/app/Models/Image.php` | MODIFY | +50 |
| `backend/app/Helpers/FileHelper.php` | MODIFY | +40 |

---

## Dependencies

- ✅ Task 01: Database Schema & Config Update

---

## Execution Workflow

Sử dụng `/execute-api-task` workflow với skill `bks-be-api-standard`:

1. Đọc skill `bks-be-api-standard`
2. Cập nhật Model `Image`
3. Cập nhật `FileHelper`

---

*Task 02 - Phase 2b: Backend API*
