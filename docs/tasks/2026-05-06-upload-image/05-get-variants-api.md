---
title: Task 05 - Get Image Variants Endpoint
description: Create new endpoint to get all size variants of an image.
requirement: docs/requirements/01-upload-image.md
requirement_section:
  - "Flow 2: Lấy Variants của Ảnh (API)"
  - "10. API ENDPOINT INVENTORY"
dependency:
  - 03-fileservice-refactor
date: 2026-05-06
version: 1.0
type: IMPLEMENTATION
skill: bks-be-api-standard
workflow: /execute-api-task
effort: S
---

# Task 05: Get Image Variants Endpoint

## Mục tiêu

Tạo endpoint mới `GET /api/v1/images/{id}/variants` để lấy toàn bộ size URLs của một ảnh.

---

## Acceptance Criteria

- [ ] Endpoint `GET /images/{id}/variants` hoạt động
- [ ] Trả về 404 nếu image không tồn tại
- [ ] Trả về object chứa tất cả variants URLs
- [ ] Fallback trả về `original` nếu `variants` null

---

## Chi tiết Implementation

### 1. Create ImageController

**File:** `backend/app/Http/Controllers/User/ImageController.php`

```php
<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Image;
use Illuminate\Http\JsonResponse;

class ImageController extends Controller
{
    public function __construct()
    {
        $this->middleware($this->authMiddleware());
    }
    
    /**
     * Get image variants
     *
     * @param int $id
     * @return JsonResponse
     */
    public function variants(int $id): JsonResponse
    {
        $image = Image::findOrFail($id);
        
        $data = [
            'id' => $image->id,
            'variants' => $image->variant_urls,
            'srcset' => $image->responsive_srcset,
        ];
        
        return $this->sendSuccessResponse($data);
    }
}
```

### 2. Add Route

**File:** `backend/routes/api.php`

```php
use App\Http\Controllers\User\ImageController;

Route::get('/images/{id}/variants', [ImageController::class, 'variants'])
    ->name('images.variants');
```

### 3. Response Format

```json
{
  "id": 1,
  "variants": {
    "thumb": "https://...",
    "360w": "https://...",
    "720w": "https..."
  },
  "srcset": "https://... 360w, https://... 720w"
}
```

---

## Files tạo mới/thay đổi

| File | Action | Lines |
|---|---|---|
| `backend/app/Http/Controllers/User/ImageController.php` | CREATE | ~35 |
| `backend/routes/api.php` | MODIFY | +2 |

---

## Dependencies

- ✅ Task 03: FileService Multi-Size Refactor

---

## Execution Workflow

Sử dụng `/execute-api-task` workflow với skill `bks-be-api-standard`:

1. Đọc skill `bks-be-api-standard`
2. Tạo `ImageController`
3. Thêm route
4. Test endpoint

---

*Task 05 - Phase 2b: Backend API*
