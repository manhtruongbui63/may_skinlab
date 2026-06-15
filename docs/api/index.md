# API Documentation

Tài liệu API dành cho Frontend Developer. Tất cả endpoints đều có tiền tố (prefix) `/api/`.

> **Tài liệu tự động sinh**: Scramble OpenAPI có sẵn tại `{APP_URL}/docs/api`

---

## Authentication

Hệ thống sử dụng **Laravel Sanctum** để xác thực thông qua API Token (Bearer Token).

| Đặc điểm | Chi tiết |
|---|---|
| **Header** | `Authorization: Bearer {token}` |
| **Public Routes** | Các route đăng nhập (`POST /api/auth/login`) và đăng ký (`POST /api/auth/register`) |
| **Protected Routes** | Tất cả các route còn lại yêu cầu truyền Header `Authorization: Bearer {token}` |

---

## Response Format

### Success Response (Phản hồi thành công)
```json
{
  "success": true,
  "message": "Operation successful",
  "errors": null,
  "data": { ... }
}
```

### Error Response (Phản hồi lỗi validation hoặc logic)
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field_name": ["The field_name field is required."]
  },
  "data": null
}
```

### Pagination Response (Phản hồi phân trang)
```json
{
  "success": true,
  "message": "Success",
  "errors": null,
  "data": {
    "data": [ ... ],
    "per_page": 10,
    "total_page": 5,
    "current_page": 1,
    "total": 50
  }
}
```

### HTTP Status Codes

| Code | Ý nghĩa |
|---|---|
| `200` | Thành công |
| `401` | Token bị thiếu, không hợp lệ, hoặc đã hết hạn (Unauthenticated) |
| `403` | Không có quyền truy cập (Unauthorized / Forbidden) |
| `404` | Tài nguyên không tồn tại (Not Found) |
| `422` | Lỗi validation dữ liệu gửi lên (Unprocessable Entity) |
| `429` | Quá nhiều yêu cầu đăng nhập sai trong thời gian ngắn (Too Many Requests / Lockout) |

---

## API Modules

| Module | Mô tả | Dành cho |
|---|---|---|
| [Auth](modules/auth.md) | Đăng ký, Đăng nhập, Đăng xuất | Frontend |
| [Profile](modules/profile.md) | Lấy thông tin cá nhân, Cập nhật Profile, Đổi mật khẩu | Frontend |
| [Upload](modules/upload.md) | Tải lên hình ảnh (avatar, banner) | Frontend |
| [Users](modules/users.md) | Quản lý danh sách người dùng hệ thống | Frontend (Quản trị viên) |
| [Customers](modules/customers.md) | Quản lý danh sách khách hàng (bệnh nhân) | Frontend |
| [Appointments](modules/appointments.md) | Quản lý lịch hẹn (booking, trạng thái, reschedule) | Frontend |
| [Visits](modules/visits.md) | Quản lý lượt khám (check-in, hủy, danh sách chờ) | Frontend |
| [Master Data](modules/master-data.md) | Tra cứu dữ liệu tĩnh (categories, statuses, types, v.v.) | Frontend |