---
title: Upload Ảnh Đa Kích Thước (Responsive Images)
description: Nâng cấp tính năng upload ảnh hiện có để tạo nhiều size variant, phục vụ responsive image loading trên nhiều loại màn hình.
status: pending_implementation
date: 2026-05-06
version: 1.0
changelog:
  - version: 1.0
    date: 2026-05-06
    summary: Initial requirement specification after implementation plan approval.
---

# Upload Ảnh Đa Kích Thước (Responsive Images)

## 2. OVERVIEW

Nâng cấp tính năng upload ảnh hiện tại (chỉ tạo 1 file gốc + 1 thumbnail) thành **upload đa kích thước** — tự động generate nhiều size variant dựa trên config. Mỗi `image_type` định nghĩa 1 bộ size riêng (ví dụ: avatar cần crop vuông, banner cần giữ ratio). Frontend nhận toàn bộ variant URLs để dùng `srcset`/`sizes` cho responsive loading.

Scope bao gồm: cập nhật config `upload.php`, thêm cột `variants` (JSON) vào `images`, refactor `FileService`, bổ sung helper lấy variant URLs, và cập nhật API response.

**Không có dữ liệu cũ cần migrate** — hệ thống mới, record `images` hiện tại = rỗng.

---

## 3. CONTEXT

| Field | Value |
|---|---|
| **Modules** | Common (FileService, FileHelper), User (UploadImageController) |
| **Features** | Image upload, Responsive image variants, Image helper utilities |
| **Guards** | `api` (Sanctum) |
| **Third-parties** | Intervention Image (resize/encode), Laravel Storage (disk) |

---

## 4. OUT OF SCOPE

- **CDN integration** (CloudFront, Cloudflare) — chỉ dùng Laravel Storage disk hiện tại.
- **Lazy queue job** cho resize — resize thực hiện đồng bộ trong request upload.
- **Alt text / file metadata** (file_size_bytes, MIME detection) — không trong draft.
- **Image optimization nâng cao** (AVIF, progressive JPEG) — chỉ dùng WebP/JPEG/PNG theo config hiện tại.
- **Frontend component** — requirement tập trung backend API + helper.
- **Xóa ảnh gốc sau resize** — giữ original để regenerate sau này.

---

## 5. BUSINESS RULES

- **BR-G001**: Chỉ user đã xác thực (`api` guard) mới được upload ảnh. Referenced in: Flow 1.
- **PROPOSED_BR:image-type-config-required**: Mọi upload phải kèm `type` tồn tại trong `config/upload.php`. Referenced in: Flow 1.
- **PROPOSED_BR:variant-naming-by-width**: Tên size variant phải nằm trong config (ví dụ: `thumb`, `360w`, `720w`). Referenced in: Flow 1, Flow 2.
- **PROPOSED_BR:keep-original-file**: File gốc (original) phải được giữ lại trên disk. Referenced in: Flow 1.
- **PROPOSED_BR:responsive-srcset-helper**: `FileHelper` phải cung cấp method tạo chuỗi `srcset` dùng trực tiếp trong HTML `<img>`. Referenced in: Flow 2.

---

## 6. REQUIREMENT ANALYSIS

### 6.1 Mục tiêu chính

| # | Yêu cầu | Mức độ |
|---|---|---|
| 1 | Upload 1 ảnh → tạo original + nhiều size variant theo config | Bắt buộc |
| 2 | Mỗi `image_type` định nghĩa bộ size riêng (crop vs không crop, kích thước khác nhau) | Bắt buộc |
| 3 | API trả về object `variants` chứa toàn bộ size URLs | Bắt buộc |
| 4 | Model `Image` + Helper hỗ trợ lấy variant URLs và tạo `srcset` | Bắt buộc |
| 5 | Backward compatible: giữ `url` + `thumb` trong response | Bắt buộc |

### 6.2 Thiết kế Thumb cho các màn hình

Draft hỏi: *"danh sách sản phẩm dùng ảnh thumb, chi tiết dùng ảnh chính có nhiều size. Tuy nhiên ở các màn hình khác nhau thì ảnh trong danh sách có cần kích thước khác nhau không?"*

=> **Thiết kế hợp lý**: Không phân biệt "thumb cố định" vs "full". Mỗi `image_type` định nghĩa bộ size riêng. Frontend tự chọn size phù hợp từ `variants`:
- Danh sách sản phẩm trên mobile → dùng `360w`
- Danh sách sẩn phẩm trên desktop → dùng `720w`
- Chi tiết sản phẩm → dùng `1080w` hoặc `original`
- `thumb` chỉ là 1 size trong bộ variant, không phải khái niệm riêng biệt.

---

## 7. DATA MODEL UPDATES

### 7.1 Table: `images` (Migration Modify)

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|---|---|---|---|---|---|---|---|---|
| id | bigint | 20 | NO | YES | — | KEPT | Primary key | — |
| imageable_id | bigint | 20 | YES | NO | NULL | KEPT | Polymorphic FK | — |
| imageable_type | string | 255 | YES | NO | NULL | KEPT | Polymorphic type | — |
| url | string | 255 | NO | NO | — | KEPT | Path file gốc (original) | — |
| thumb | string | 255 | NO | NO | — | KEPT | Path thumbnail | Backward compatible |
| type | string | 50 | NO | NO | — | KEPT | Image type config key | — |
| **variants** | **json** | — | **YES** | **NO** | **NULL** | **ADDED** | **Object `{size_key: path}`** | **See 6.3** |
| created_at | timestamp | — | NO | NO | — | KEPT | — | — |
| updated_at | timestamp | — | NO | NO | — | KEPT | — | — |

### 7.2 Model: `Image` (`backend/app/Models/Image.php`)

| Change | Detail |
|---|---|
| Casts | Thêm `'variants' => 'array'` |
| Accessor | `getVariantUrlsAttribute()` — trả object `{size_key: full_url}` kèm domain qua `Storage::disk()->url()` |
| Accessor | `getResponsiveSrcsetAttribute()` — trả chuỗi `srcset` (VD: `"url 360w, url 720w"`) |

### 7.3 Config: `config/upload.php` (Modify)

Cấu trúc mới — thay `full_size`/`thumb_size` bằng `sizes` (array linh hoạt):

```php
'image_types' => [
    'avatar' => [
        'crop' => true,
        'sizes' => [
            'thumb' => ['width' => 100,  'height' => 100],  // Preview nhỏ
            '360w'  => ['width' => 360,  'height' => 360],  // Mobile
            '720w'  => ['width' => 720,  'height' => 720],  // Tablet
        ],
    ],
    'banner' => [
        'crop' => false,
        'sizes' => [
            '360w'  => ['width' => 360,  'height' => null], // Giữ ratio
            '720w'  => ['width' => 720,  'height' => null],
            '1080w' => ['width' => 1080, 'height' => null],
        ],
    ],
],
```

> **Quy ước `sizes`:**
> - Key = tên size variant (bắt buộc nằm trong config, ví dụ: `thumb`, `360w`, `720w`, `1080w`)
> - `width` (int, required): chiều rộng target pixel
> - `height` (int|null, optional): nếu `null` → scaleDown theo width, giữ aspect ratio. Nếu có giá trị → crop/resize đến kích thước chính xác (tùy `crop`)

### 7.4 Disk Storage Layout

```
{disk_root}/
├── originals/
│   └── {filename}.webp           # File gốc (original)
├── thumbnails/
│   └── {filename}.webp           # Thumb (backward compat)
└── variants/
    ├── 360w/
    │   └── {filename}.webp
    ├── 720w/
    │   └── {filename}.webp
    └── 1080w/
        └── {filename}.webp
```

---

## 8. PROCESSING FLOWS

### Flow 1: Upload Ảnh Multi-Size

**Trigger**: User POST `/api/v1/upload-image` với `image` (file) + `type` (string).

1. **Authenticate** — Middleware `auth:api` kiểm tra token. (BR-G001)
   - Nếu thiếu token / invalid → 401.

2. **Validate** — `UploadImageRequest` kiểm tra:
   - `image`: required, image, mimes jpeg|png, mimetypes image/jpeg|image/png, max 5120KB.
   - `type`: required, string.
   - Nếu fail → 422 với field-specific errors.

3. **Resolve config** — `FileService` đọc `config('upload.image_types.' . $type)`.
   - Nếu config không tồn tại → throw `InputException` với key `validation.upload_error_type`. (PROPOSED_BR:image-type-config-required)

4. **Generate filename** — `FileHelper::constructFileName($originalName)`.

5. **Save original** — Copy/upload file gốc vào `originals/{filename}.webp` (hoặc định dạng theo config encode).
   - **State Changes:**
     - Disk: tạo file tại `originals/{filename}.{ext}`

6. **Generate variants** — Loop qua `sizes` trong config:
   - Với mỗi `size_key` + `size_config` (`width`, `height`):
     a. Đọc file gốc bằng `Intervention\Image\Facades\Image::read()`.
     b. Nếu `crop = true`: tính crop ratio, crop trước rồi `scaleDown()`.
     c. Nếu `crop = false`: `scaleDown($width)` (giữ ratio, không upscale).
     d. Encode theo `config('upload.webp_ext')` + `config('upload.webp_quality')`.
     e. Save vào `variants/{size_key}/{filename}.{ext}`.
   - **State Changes:**
     - Disk: tạo N files tại `variants/{size_key}/{filename}.{ext}`

7. **Save thumbnail** — Nếu config có key `thumb`, dùng file `thumb` đã generate ở bước 6.
   - Nếu config không có `thumb`, sao chép size nhỏ nhất làm `thumb`.
   - **State Changes:**
     - Disk: tạo file tại `thumbnails/{filename}.{ext}`

8. **Persist DB** — Tạo record `images`:
   - **State Changes:**
     - `images.url` = `originals/{filename}.{ext}`
     - `images.thumb` = `thumbnails/{filename}.{ext}`
     - `images.type` = `$type`
     - `images.variants` = JSON `{size_key: variants/{size_key}/{filename}.{ext}}`
     - `images.imageable_id` = `$this->user->id`
     - `images.imageable_type` = `get_class($this->user)`

9. **Build response** — Trả object URLs (kèm domain qua `Storage::disk()->url()`).

**Concurrency Handling:**
- Không cần DB lock — mỗi upload tạo record mới.
- File name dùng `StringHelper::uniqueCode(8)` đảm bảo unique, tránh collision.

**Acceptance Criteria (Happy Path):**
- [ ] Upload thành công, trả `200` với `id`, `url`, `thumb`, `type`, `variants`.
- [ ] `variants` chứa toàn bộ size key + URL tương ứng.
- [ ] File gốc + tất cả variant files tồn tại trên disk.
- [ ] DB record `variants` là valid JSON object.

**Error Cases:**
| Error Condition | System Behavior | State Changes |
|---|---|---|
| Token invalid/missing | 401 Unauthorized | No change |
| `image` fail validation (size, mime) | 422 Validation Error | No change |
| `type` không tồn tại trong config | 422 — `validation.upload_error_type` | No change |
| Intervention Image read fail (corrupt file) | 422 — `validation.upload_error_type` hoặc generic error | No change |
| Disk write fail (permission/full) | 500 — log exception | No DB record created |
| Memory limit khi resize ảnh quá lớn | 500 — log exception | No DB record created |

---

### Flow 2: Lấy Variants của Ảnh (API)

**Trigger**: User GET `/api/v1/images/{id}/variants`.

1. **Authenticate** — Middleware `auth:api`. (BR-G001)

2. **Find image** — `Image::findOrFail($id)`.
   - Nếu không tồn tại → 404.

3. **Build variants URLs**:
   - Nếu `variants` not null → map từng path trong JSON → full URL.
   - Nếu `variants` null → fallback trả `{"original": full_url_of_url_column}`.
   - Thêm `thumb` URL vào response.

4. **Return response** — `sendSuccessResponse($data)`.

**Error Cases:**
| Error Condition | System Behavior | State Changes |
|---|---|---|
| Image ID không tồn tại | 404 Not Found | No change |
| User không có quyền (nếu sau này có policy) | 403 Forbidden | No change |

---

### Flow 3: Helper Lấy Variant URLs / Srcset

**Trigger**: Gọi từ Service layer, View, hoặc Resource.

1. **`FileHelper::getVariantUrls(Image $image): array`**
   - Input: `Image` model.
   - Logic: Nếu `$image->variants` là array → map mỗi `path` → `Storage::disk()->url($path)`.
   - Nếu `$image->variants` null → return `['original' => Storage::disk()->url($image->url)]`.
   - Output: `['thumb' => url, '360w' => url, ...]`.

2. **`FileHelper::getResponsiveSrcset(Image $image): string`** (PROPOSED_BR:responsive-srcset-helper)
   - Input: `Image` model.
   - Logic: Gọi `getVariantUrls()`, format `"url 360w, url 720w"`.
   - Output: Chuỗi `srcset` dùng trực tiếp trong HTML `<img srcset="...">`.

3. **`Image` model accessor `variant_urls`**
   - Logic tương tự `FileHelper::getVariantUrls()` nhưng gắn vào model attribute.

---

## 9. UI/UX & FRONTEND IMPLICATIONS

### 9.1 API Response Format (Upload)

Frontend nhận response từ `POST /upload-image`:

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

### 9.2 Frontend Usage Pattern

```html
<!-- Danh sách sản phẩm — responsive srcset -->
<img
  src="{image.variants['360w']}"
  srcset="{image.variants['360w']} 360w, {image.variants['720w']} 720w"
  sizes="(max-width: 640px) 360px, 720px"
  alt="..."
/>

<!-- Chi tiết sản phẩm — ảnh lớn -->
<img
  src="{image.variants['1080w'] || image.url}"
  alt="..."
/>
```

### 9.3 Zod Schema (nếu frontend có form upload)

```ts
const uploadImageSchema = z.object({
  image: z.instanceof(File),
  type: z.string().min(1),
});
```

### 9.4 Localization Keys

| Key | Context |
|---|---|
| `validation.upload_error_type` | Type ảnh không tồn tại trong config |
| `enums.image_types.avatar` | Label cho image type `avatar` |
| `enums.image_types.banner` | Label cho image type `banner` |

---

## 10. NOTIFICATIONS

Không có notification/email/push liên quan đến feature này.

---

## 11. API ENDPOINT INVENTORY

| Method | Endpoint | Guard | Description | Related Flow |
|---|---|---|---|---|
| POST | `/api/v1/upload-image` | api | Upload ảnh, response thêm `variants` object | Flow 1 |
| GET | `/api/v1/images/{id}/variants` | api | Lấy toàn bộ size URLs của 1 ảnh | Flow 2 |

> **Breaking Change Note**: `POST /upload-image` response thêm field `variants`. Các consumer cũ (nếu có) vẫn hoạt động vì `url` + `thumb` được giữ nguyên.

---

## 12. IMPLEMENTATION TASKS

### Phase 1 — Database & Config
- [ ] Migration: thêm cột `variants` (json, nullable) vào `images`
- [ ] Update `config/upload.php`: chuyển `full_size`/`thumb_size` → `sizes` array
- [ ] Thêm localization keys (`upload_error_type`, image type labels)

### Phase 2 — Model & Service
- [ ] Update `Image` model: casts `variants`, accessor `variant_urls`, accessor `responsive_srcset`
- [ ] Refactor `FileService`:
  - [ ] `resizeImage()` → `generateVariants()` — loop sizes, lưu từng variant
  - [ ] `uploadImage()` — lưu `variants` JSON vào DB
  - [ ] Thêm `getImageVariants($imageId)`

### Phase 3 — Helpers & Controller
- [ ] Update `FileHelper`:
  - [ ] `getVariantUrls(Image $image): array`
  - [ ] `getResponsiveSrcset(Image $image): string`
- [ ] Update `UploadImageController::upload()` — response thêm `variants`
- [ ] Tạo `ImageController::variants($id)` cho endpoint `GET /images/{id}/variants`

### Phase 4 — Routes & Validation
- [ ] Thêm route `GET /images/{id}/variants` → `ImageController::variants()` (hoặc `UploadImageController::getVariants()`)
- [ ] Cập nhật `UploadImageRequest` nếu cần (giữ nguyên rules hiện tại)

### Phase 5 — Testing
- [ ] Feature test: upload ảnh → assert disk có original + variants
- [ ] Feature test: API `/images/{id}/variants` → assert response đúng format
- [ ] Unit test: `FileHelper::getVariantUrls()` + `getResponsiveSrcset()`
- [ ] Unit test: `Image` model accessor `variant_urls`

---

## 13. DRAFT COVERAGE MATRIX

| Draft Section | Draft Item | Requirement Section | Status |
|---|---|---|---|
| "Thêm tính năng image nhiều size" | Generate nhiều size variant | Flow 1, Data Model 6.1, Config 6.3 | ✅ Covered |
| "Cập nhật tính năng upload ảnh hiện có" | Refactor upload hiện tại | Flow 1, Service Layer, API Endpoint | ✅ Covered |
| "Thêm config nhiều size" | `sizes` array trong config | Data Model 6.3 | ✅ Covered |
| "Thêm helper để lấy toàn bộ size của ảnh" | `FileHelper::getVariantUrls()`, `getResponsiveSrcset()`, Model accessor | Flow 3 | ✅ Covered |
| Comment: thumb cho các màn hình | Thiết kế variants thay cho thumb cố định | Requirement Analysis 5.2 | ✅ Covered |

---

*Document ready for task decomposition.*
