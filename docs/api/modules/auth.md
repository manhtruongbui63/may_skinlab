# Auth API

Quản lý xác thực người dùng (Đăng ký, Đăng nhập, Đăng xuất).

---

## 1. Đăng ký tài khoản (Register)

Khởi tạo một tài khoản người dùng mới trên hệ thống. Tài khoản sau khi đăng ký thành công sẽ có trạng thái là `ACTIVE`.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `POST /api/auth/register` |
| **Auth** | ✗ Không yêu cầu |
| **Content-Type** | `application/json` |

### Request Body

| Tham số | Kiểu | Bắt buộc | Quy tắc validation | Mô tả |
|---|---|---|---|---|
| `name` | string | ✓ | Tối đa 255 ký tự | Tên hiển thị của người dùng |
| `email` | string | ✓ | Định dạng email hợp lệ, tối đa 255 ký tự | Địa chỉ email dùng để đăng nhập |
| `password` | string | ✓ | Tối thiểu 8 ký tự, khớp với `password_confirmation`, phải chứa cả chữ và số | Mật khẩu tài khoản |
| `password_confirmation` | string | ✓ | Khớp với `password` | Xác nhận mật khẩu |

### Response `200` (Thành công)
```json
{
  "success": true,
  "message": "Đăng ký thành công.",
  "errors": null,
  "data": {
    "id": 2,
    "name": "Nguyen Van A",
    "email": "nguyenvana@example.com",
    "status": 1,
    "created_at": "2026-05-28 17:40:00",
    "updated_at": "2026-05-28 17:40:00"
  }
}
```

### Response `422` (Lỗi validation)
```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "email": [
      "The email has already been taken."
    ],
    "password": [
      "Mật khẩu phải chứa ít nhất một chữ cái và một chữ số."
    ]
  },
  "data": null
}
```

---

## 2. Đăng nhập (Login)

Đăng nhập bằng Email và Mật khẩu. Nếu thành công, hệ thống trả về API Access Token (Bearer Token).

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `POST /api/auth/login` |
| **Auth** | ✗ Không yêu cầu |
| **Content-Type** | `application/json` |

### Request Body

| Tham số | Kiểu | Bắt buộc | Quy tắc validation | Mô tả |
|---|---|---|---|---|
| `email` | string | ✓ | Định dạng email hợp lệ | Địa chỉ email đăng nhập |
| `password` | string | ✓ | Chuỗi ký tự | Mật khẩu tài khoản |

### Response `200` (Thành công)
```json
{
  "success": true,
  "message": "Operation successful",
  "errors": null,
  "data": {
    "access_token": "1|sanctum_token_plain_text_here...",
    "type_token": "Bearer"
  }
}
```

### Hạn chế tần suất đăng nhập (Rate Limiting)
- Tối đa: **5 lần thử** sai liên tiếp.
- Thời gian khóa: **60 giây** (`DECAY_SECONDS`).
- Nếu vượt quá số lần thử, API sẽ trả về lỗi Lockout (`422` hoặc `429`).

### Response `422` (Lockout do thử quá nhiều lần)
```json
{
  "success": false,
  "message": "Too many login attempts. Please try again in 60 seconds.",
  "errors": null,
  "data": null
}
```

### Response `401` (Sai thông tin đăng nhập)
```json
{
  "success": false,
  "message": "Mật khẩu hoặc email không chính xác.",
  "errors": null,
  "data": null
}
```

---

## 3. Đăng xuất (Logout)

Thu hồi API Access Token hiện tại của người dùng.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `POST /api/auth/logout` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Request Headers

| Header | Kiểu | Giá trị |
|---|---|---|
| `Authorization` | string | `Bearer {token}` |

### Response `200` (Thành công)
```json
{
  "success": true,
  "message": "Đăng xuất thành công.",
  "errors": null,
  "data": null
}
```

### Response `401` (Token không hợp lệ hoặc hết hạn)
```json
{
  "message": "Unauthenticated."
}
```
