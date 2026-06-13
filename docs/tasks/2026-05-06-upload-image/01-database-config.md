---
title: Task 01 - Database Schema & Config Update
description: Add variants column to images table and update upload config structure.
requirement: docs/requirements/01-upload-image.md
requirement_section:
  - "6. DATA MODEL UPDATES"
  - "6.1 Table: images"
  - "6.3 Config: config/upload.php"
dependency: []
date: 2026-05-06
version: 1.0
type: IMPLEMENTATION
skill: bks-be-database-standard
workflow: /execute-database-task
effort: M
---

# Task 01: Database Schema & Config Update

## Mục tiêu

Thêm cột `variants` (JSON) vào bảng `images` và cập nhật cấu trúc config `upload.php` để hỗ trợ multi-size variants.

---

## Acceptance Criteria

- [ ] Migration thêm cột `variants` (json, nullable) vào table `images`
- [ ] Config `upload.php` được cập nhật từ `full_size`/`thumb_size` sang `sizes` array
- [ ] Config mẫu cho `avatar` và `banner` types
- [ ] Localization keys cho `upload_error_type` được thêm

---

## Chi tiết Implementation

### 1. Migration Update

**File:** `backend/database/migrations/2026_02_23_102659_create_images_table.php`

Sửa migration hiện tại (chưa run production) để thêm cột `variants`:

```php
Schema::create('images', function (Blueprint $table) {
    $table->id();
    $table->nullableMorphs('imageable');
    $table->string('url');
    $table->string('thumb');
    $table->string('type');
    $table->json('variants')->nullable()->after('type'); // ADD THIS
    $table->timestamps();
});
```

> **Lưu ý:** Nếu migration đã chạy, tạo migration mới `add_variants_to_images_table`.

### 2. Config Update

**File:** `backend/config/upload.php`

Cập nhật từ:
```php
'image_types' => [
    'avatar' => [
        'crop' => true,
        'full_size' => [360, 360],
        'thumb_size' => [100, 100],
    ],
],
```

Sang:
```php
'image_types' => [
    'avatar' => [
        'crop' => true,
        'sizes' => [
            'thumb' => ['width' => 100,  'height' => 100],
            '360w'  => ['width' => 360,  'height' => 360],
            '720w'  => ['width' => 720,  'height' => 720],
        ],
    ],
    'banner' => [
        'crop' => false,
        'sizes' => [
            '360w'  => ['width' => 360,  'height' => null],
            '720w'  => ['width' => 720,  'height' => null],
            '1080w' => ['width' => 1080, 'height' => null],
        ],
    ],
],
```

### 3. Localization

**File:** `backend/lang/en/validation.php` và `backend/lang/vi/validation.php`

Thêm key:
```php
'upload_error_type' => 'Invalid image type.',
```

---

## Files thay đổi

| File | Action | Lines |
|---|---|---|
| `backend/database/migrations/2026_02_23_102659_create_images_table.php` | MODIFY | +1 |
| `backend/config/upload.php` | MODIFY | ~15 |
| `backend/lang/en/validation.php` | MODIFY | +1 |
| `backend/lang/vi/validation.php` | MODIFY | +1 |

---

## Execution Workflow

Sử dụng `/execute-database-task` workflow với skill `bks-be-database-standard`:

1. Đọc skill `bks-be-database-standard`
2. Thực hiện migration update
3. Cập nhật config
4. Thêm localization

---

*Task 01 - Phase 1: Foundation*
