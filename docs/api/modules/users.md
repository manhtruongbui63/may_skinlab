# User Management API

Quản lý danh sách người dùng trong hệ thống.

> [!IMPORTANT]
> **API này yêu cầu xác thực Bearer Token** và người dùng thực hiện yêu cầu phải có quyền hạn phù hợp (được ủy quyền qua Gate policy `viewAny` đối với Model `User`).

---

## 1. Danh sách người dùng (List Users)

Lấy danh sách người dùng trong hệ thống có phân trang, tìm kiếm và sắp xếp.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `GET /api/users` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Query Parameters

Hỗ trợ các bộ lọc và tham số phân trang chuẩn của hệ thống:

| Tham số | Kiểu | Bắt buộc | Quy tắc validation | Mô tả |
|---|---|---|---|---|
| `search` | string | ✗ | Tối đa 100 ký tự | Tìm kiếm người dùng theo tên hoặc email. |
| `page` | integer | ✗ | Tối thiểu là 1 | Trang muốn hiển thị. Mặc định: `1`. |
| `per_page` | integer | ✗ | Tối thiểu 1, tối đa 100 | Số lượng bản ghi trên mỗi trang. Mặc định: `10`. |
| `orders` | array | ✗ | | Danh sách các cột cần sắp xếp. |
| `orders.*.key` | string | ✓ (khi truyền `orders`) | | Tên trường cần sắp xếp (ví dụ: `name`, `email`, `created_at`). |
| `orders.*.dir` | string | ✓ (khi truyền `orders`) | Phải là `asc` hoặc `desc` (không phân biệt chữ hoa/thường) | Hướng sắp xếp. |
| `filters` | array | ✗ | | Bộ lọc dữ liệu nâng cao. |
| `filters.*.key` | string | ✓ (khi truyền `filters`) | | Tên cột cần lọc (ví dụ: `status`). |
| `filters.*.data` | mixed | ✗ | | Giá trị lọc tương ứng. |

#### Ví dụ Request URL:
```
GET /api/users?search=Nguyen&per_page=10&page=1&orders[0][key]=name&orders[0][dir]=asc&filters[0][key]=status&filters[0][data]=1
```

### Response `200` (Thành công)
```json
{
  "success": true,
  "message": "Operation successful",
  "errors": null,
  "data": {
    "data": [
      {
        "id": 1,
        "name": "Admin",
        "email": "admin@example.com",
        "status": 1,
        "status_label": "Active",
        "created_at": "2026-05-28 08:00:00",
        "updated_at": "2026-05-28 17:40:00"
      }
    ],
    "per_page": 10,
    "total_page": 1,
    "current_page": 1,
    "total": 1
  }
}
```

### Response `403` (Lỗi phân quyền)
Người dùng đăng nhập không có quyền `viewAny` đối với tài nguyên người dùng.
```json
{
  "success": false,
  "message": "This action is unauthorized.",
  "errors": null,
  "data": null
}
```

### Response `401` (Chưa đăng nhập / Token không hợp lệ)
```json
{
  "message": "Unauthenticated."
}
```
