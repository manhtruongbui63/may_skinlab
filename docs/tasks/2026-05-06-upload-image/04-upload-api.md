---
title: Task 04 - Upload Image API Enhancement
description: Update UploadImageController to return variants in response.
requirement: docs/requirements/01-upload-image.md
requirement_section:
  - "Flow 1: Upload Ảnh Multi-Size"
  - "8.1 API Response Format (Upload)"
dependency:
  - 03-fileservice-refactor
date: 2026-05-06
version: 1.0
type: IMPLEMENTATION
skill: bks-be-api-standard
workflow: /execute-api-task
effort: S
---

# Task 04: Upload Image API Enhancement

## Mục tiêu

Cập nhật `UploadImageController` để trả về response mới chứa `variants` object cùng với `url`, `thumb`, `type`, `id`.

---

## Acceptance Criteria

- [ ] `POST /api/v1/upload-image` trả về `variants` object trong response
- [ ] Response giữ backward compatible (vẫn có `url` + `thumb` cũ)
- [ ] `variants` chứa toàn bộ size keys với full URLs

---

## Chi tiết Implementation

### 1. Controller Update

**File:** `backend/app/Http/Controllers/User/UploadImageController.php`

Controller đã có sẵn, `FileService::uploadImage()` sau Task 03 đã trả về đúng format.

Chỉ cần đảm bảo response trả về:

```php
public function upload(UploadImageRequest $request): JsonResponse
{
    $dto = UploadImageData::from($request->validated());
    $data = CommonFactory::getFileService()->uploadImage($request->file('image'), $dto->type);
    
    // $data now contains: id, url, thumb, type, variants
    return $this->sendSuccessResponse($data);
}
```

### 2. Response Format

```json
{
  "id": 1,
  "url": "https://cdn.example.com/storage/originals/abc-12345678.webp",
  "thumb": "https://cdn.example.com/storage/thumbnails/abc-12345678.webp",
  "type": "avatar",
  "variants": {
    "thumb": "https://cdn.example.com/storage/thumbnails/abc-12345678.webp",
    "360w": "https://cdn.example.com/storage/variants/360w/abc-12345678.webp",
    "720w": "https://cdn.example.com/storage/variants/720w/abc-12345678.webp"
  }
}
```

---

## Files thay đổi

| File | Action | Lines |
|---|---|---|
| `backend/app/Http/Controllers/User/UploadImageController.php` | VERIFY/MODIFY | ~5 |

---

## Dependencies

- ✅ Task 03: FileService Multi-Size Refactor

---

## Execution Workflow

Sử dụng `/execute-api-task` workflow với skill `bks-be-api-standard`:

1. Đọc skill `bks-be-api-standard`
2. Verify controller đã nhận đúng data từ FileService
3. Test API response

---

*Task 04 - Phase 2b: Backend API*
