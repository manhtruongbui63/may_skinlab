# Upload API

Quản lý tải lên hình ảnh và tự động xử lý (resize, crop, chuyển định dạng sang WebP) trong hệ thống.

> [!IMPORTANT]
> **API này yêu cầu Bearer Token** trong Header: `Authorization: Bearer {token}`.

---

## 1. Tải lên hình ảnh (Upload Image)

Tải lên hình ảnh (ví dụ: avatar hoặc banner). Ảnh tải lên sẽ được tự động xử lý và lưu trữ theo cấu hình quy định.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `POST /api/upload-image` |
| **Auth** | ✓ Yêu cầu Bearer Token |
| **Content-Type** | `multipart/form-data` |

### Request Body

| Tham số | Kiểu | Bắt buộc | Quy tắc validation | Mô tả |
|---|---|---|---|---|
| `image` | file | ✓ | Định dạng: `jpeg, png`, dung lượng tối đa: 5MB (`size_max`) | File ảnh cần tải lên |
| `type` | string | ✓ | Phải là một trong các loại ảnh cấu hình (ví dụ: `avatar`, `banner`) | Loại ảnh để hệ thống tự động crop/resize theo đúng kích thước mong muốn |

### Cấu hình xử lý ảnh tự động (`config/upload.php`):
- **avatar**: Tự động crop tỷ lệ 1:1, tạo thumbnail (`100x100`) và các size (`360w`, `720w`).
- **banner**: Không crop, giữ tỷ lệ gốc, tạo các size (`360w`, `720w`, `1080w`).

### Response `200` (Thành công)
```json
{
  "success": true,
  "message": "Operation successful",
  "errors": null,
  "data": {
    "url": "http://localhost:8000/storage/originals/5e3d7f9a2b1c8.webp",
    "thumb": "http://localhost:8000/storage/thumbnails/5e3d7f9a2b1c8.webp",
    "type": "avatar",
    "id": 10
  }
}
```

### Response `422` (Lỗi validation)
```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "image": [
      "The image field must be an image.",
      "The image field must be a file of type: jpeg, png."
    ],
    "type": [
      "The selected type is invalid."
    ]
  },
  "data": null
}
```
