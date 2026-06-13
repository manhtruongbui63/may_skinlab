---
title: Task 06 - Upload Image Feature Tests
description: Write feature and unit tests for upload image functionality.
requirement: docs/requirements/01-upload-image.md
requirement_section:
  - "11. IMPLEMENTATION TASKS" (Phase 5)
dependency:
  - 04-upload-api
  - 05-get-variants-api
date: 2026-05-06
version: 1.0
type: IMPLEMENTATION
skill: bks-be-testing-standard
workflow: N/A
effort: M
---

# Task 06: Upload Image Feature Tests

## Mục tiêu

Viết feature tests và unit tests cho toàn bộ chức năng upload ảnh đa kích thước.

---

## Acceptance Criteria

- [ ] Feature test: Upload ảnh → assert disk có original + variants
- [ ] Feature test: API `/images/{id}/variants` → assert response đúng format
- [ ] Unit test: `FileHelper::getVariantUrls()` + `getResponsiveSrcset()`
- [ ] Unit test: `Image` model accessor `variant_urls`
- [ ] Test coverage >= 80%

---

## Chi tiết Implementation

### 1. Feature Tests

**File:** `backend/tests/Feature/User/UploadImageTest.php`

```php
<?php

namespace Tests\Feature\User;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UploadImageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake(config('upload.image_disk'));
    }
    
    public function test_can_upload_image_with_variants(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('avatar.jpg', 800, 800);
        
        $response = $this->actingAs($user)
            ->postJson('/api/v1/upload-image', [
                'image' => $file,
                'type' => 'avatar',
            ]);
        
        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'url',
                    'thumb',
                    'type',
                    'variants' => [
                        'thumb',
                        '360w',
                        '720w',
                    ],
                ],
            ]);
        
        // Assert files exist on disk
        $disk = Storage::disk(config('upload.image_disk'));
        $this->assertNotNull($response->json('data.variants.360w'));
    }
    
    public function test_can_get_image_variants(): void
    {
        $user = User::factory()->create();
        $image = // create image with variants
        
        $response = $this->actingAs($user)
            ->getJson("/api/v1/images/{$image->id}/variants");
        
        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'variants',
                    'srcset',
                ],
            ]);
    }
}
```

### 2. Unit Tests

**File:** `backend/tests/Unit/Helpers/FileHelperTest.php`

```php
<?php

namespace Tests\Unit\Helpers;

use App\Helpers\FileHelper;
use App\Models\Image;
use Tests\TestCase;

class FileHelperTest extends TestCase
{
    public function test_get_variant_urls_returns_array(): void
    {
        $image = new Image([
            'variants' => ['360w' => 'variants/360w/test.webp'],
            'url' => 'originals/test.webp',
        ]);
        
        $urls = FileHelper::getVariantUrls($image);
        
        $this->assertIsArray($urls);
        $this->assertArrayHasKey('360w', $urls);
    }
    
    public function test_get_responsive_srcset_returns_string(): void
    {
        $image = new Image([
            'variants' => [
                '360w' => 'variants/360w/test.webp',
                '720w' => 'variants/720w/test.webp',
            ],
        ]);
        
        $srcset = FileHelper::getResponsiveSrcset($image);
        
        $this->assertStringContainsString('360w', $srcset);
        $this->assertStringContainsString('720w', $srcset);
    }
}
```

**File:** `backend/tests/Unit/Models/ImageTest.php`

```php
<?php

namespace Tests\Unit\Models;

use App\Models\Image;
use Tests\TestCase;

class ImageTest extends TestCase
{
    public function test_variant_urls_accessor_returns_urls(): void
    {
        $image = new Image([
            'variants' => ['360w' => 'variants/360w/test.webp'],
        ]);
        
        $urls = $image->variant_urls;
        
        $this->assertIsArray($urls);
    }
}
```

---

## Files tạo mới

| File | Action | Lines |
|---|---|---|
| `backend/tests/Feature/User/UploadImageTest.php` | CREATE | ~80 |
| `backend/tests/Unit/Helpers/FileHelperTest.php` | CREATE | ~60 |
| `backend/tests/Unit/Models/ImageTest.php` | CREATE | ~40 |

---

## Dependencies

- ✅ Task 04: Upload Image API Enhancement
- ✅ Task 05: Get Image Variants Endpoint

---

## Execution Workflow

1. Đọc skill `bks-be-testing-standard`
2. Tạo feature tests
3. Tạo unit tests
4. Chạy `php artisan test`

---

*Task 06 - Phase 4: Quality*
