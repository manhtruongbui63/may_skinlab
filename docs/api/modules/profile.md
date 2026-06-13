# Profile API

Quản lý thông tin cá nhân của người dùng hiện đang đăng nhập.

> [!IMPORTANT]
> **Tất cả các endpoints trong module này đều yêu cầu Bearer Token** trong Header: `Authorization: Bearer {token}`.

---

## 1. Lấy thông tin cá nhân (Get My Profile)

Lấy thông tin chi tiết của người dùng đang đăng nhập dựa trên token.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `GET /api/auth/me` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Response `200` (Thành công)
```json
{
  "success": true,
  "message": "Operation successful",
  "errors": null,
  "data": {
    "id": 1,
    "name": "Hoang Hoi",
    "email": "hoanghoi@example.com",
    "status": 1,
    "roles": [
      "admin"
    ],
    "permissions": [
      "viewAny",
      "edit"
    ]
  }
}
```

### Response `401` (Unauthenticated)
```json
{
  "message": "Unauthenticated."
}
```

---

## 2. Cập nhật Profile (Update Profile)

Cập nhật tên hiển thị của người dùng hiện tại.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `POST /api/auth/profile` |
| **Auth** | ✓ Yêu cầu Bearer Token |
| **Content-Type** | `application/json` |

### Request Body

| Tham số | Kiểu | Bắt buộc | Quy tắc validation | Mô tả |
|---|---|---|---|---|
| `name` | string | ✓ | Chuỗi ký tự, tối đa 255 ký tự | Tên hiển thị mới |

### Response `200` (Thành công)
```json
{
  "success": true,
  "message": "Cập nhật thành công.",
  "errors": null,
  "data": 1
}
```

### Response `422` (Lỗi validation)
```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "name": [
      "The name field is required."
    ]
  },
  "data": null
}
```

---

## 3. Đổi mật khẩu (Change Password)

Đổi mật khẩu tài khoản hiện tại.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `POST /api/auth/change-password` |
| **Auth** | ✓ Yêu cầu Bearer Token |
| **Content-Type** | `application/json` |

### Request Body

| Tham số | Kiểu | Bắt buộc | Quy tắc validation | Mô tả |
|---|---|---|---|---|
| `current_password` | string | ✓ | Mật khẩu hiện tại | Mật khẩu hiện tại của người dùng |
| `password` | string | ✓ | Tối thiểu 8 ký tự, khớp với `password_confirmation`, phải chứa cả chữ và số | Mật khẩu mới |
| `password_confirmation` | string | ✓ | Khớp với `password` | Xác nhận mật khẩu mới |

### Response `200` (Thành công)
```json
{
  "success": true,
  "message": "Đăng xuất thành công.",
  "errors": null,
  "data": true
}
```

### Response `422` (Lỗi mật khẩu hiện tại không đúng)
```json
{
  "success": false,
  "message": "Mật khẩu hiện tại không chính xác.",
  "errors": {
    "current_password": [
      "The current password is incorrect."
    ]
  },
  "data": null
}
```
