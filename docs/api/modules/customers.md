# Customer Management API

Quản lý danh sách khách hàng (bệnh nhân) trong hệ thống.

> [!IMPORTANT]
> **API này yêu cầu xác thực Bearer Token** và người dùng thực hiện yêu cầu phải có quyền hạn phù hợp (được ủy quyền qua Gate policy đối với Model `Customer`).

---

## 1. Danh sách khách hàng (List Customers)

Lấy danh sách khách hàng trong hệ thống có phân trang, tìm kiếm và lọc.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `GET /api/customers` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Query Parameters

Hỗ trợ các bộ lọc và tham số phân trang:

| Tham số | Kiểu | Bắt buộc | Quy tắc validation | Mô tả |
|---|---|---|---|---|
| `search` | string | ✗ | Tối đa 100 ký tự | Tìm kiếm khách hàng theo tên hoặc số điện thoại. |
| `gender` | integer | ✗ | Giá trị: 1, 2, 3 | Lọc theo giới tính (1: Nam, 2: Nữ, 3: Khác). |
| `source` | integer | ✗ | Giá trị: 1, 2, 3, 4, 5 | Lọc theo nguồn khách hàng. |
| `status` | integer | ✗ | Giá trị: 0, 1 | Lọc theo trạng thái (0: Inactive, 1: Active). |
| `page` | integer | ✗ | Tối thiểu là 1 | Trang muốn hiển thị. Mặc định: `1`. |
| `per_page` | integer | ✗ | Tối thiểu 1, tối đa 100 | Số lượng bản ghi trên mỗi trang. Mặc định: `10`. |

#### Ví dụ Request URL:
```
GET /api/customers?search=Nguyen&gender=1&status=1&per_page=10&page=1
```

### Response `200` (Thành công)
```json
{
  "success": true,
  "message": "",
  "errors": null,
  "data": [
    {
      "id": 1,
      "full_name": "Nguyễn Văn A",
      "phone": "0987654321",
      "birth_date": "1990-05-15",
      "gender": {
        "value": 1,
        "label": "Nam"
      },
      "address": "123 Đường ABC, Quận 1",
      "source": {
        "value": 1,
        "label": "Facebook"
      },
      "status": {
        "value": 1,
        "label": "Active"
      },
      "outstanding_amount": 0,
      "created_at": "2026-06-11T08:00:00+07:00",
      "updated_at": "2026-06-11T08:00:00+07:00"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 10,
    "total": 50
  }
}
```

---

## 2. Chi tiết khách hàng (Get Customer Detail)

Lấy thông tin chi tiết của một khách hàng.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `GET /api/customers/{id}` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Path Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | integer | ✓ | ID của khách hàng. |

### Response `200` (Thành công)
```json
{
  "success": true,
  "message": "",
  "errors": null,
  "data": {
    "id": 1,
    "full_name": "Nguyễn Văn A",
    "phone": "0987654321",
    "birth_date": "1990-05-15",
    "gender": {
      "value": 1,
      "label": "Nam"
    },
    "address": "123 Đường ABC, Quận 1",
    "source": {
      "value": 1,
      "label": "Facebook"
    },
    "status": {
      "value": 1,
      "label": "Active"
    },
    "outstanding_amount": 0,
    "created_at": "2026-06-11T08:00:00+07:00",
    "updated_at": "2026-06-11T08:00:00+07:00"
  }
}
```

### Response `404` (Không tìm thấy)
```json
{
  "success": false,
  "message": "Resource not found.",
  "errors": null,
  "data": null
}
```

---

## 3. Tạo khách hàng mới (Create Customer)

Tạo một khách hàng mới trong hệ thống.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `POST /api/customers` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Request Body

| Tham số | Kiểu | Bắt buộc | Quy tắc validation | Mô tả |
|---|---|---|---|---|
| `full_name` | string | ✓ | Tối đa 255 ký tự | Tên đầy đủ của khách hàng. |
| `phone` | string | ✓ | Tối đa 50 ký tự, format số điện thoại, unique | Số điện thoại. |
| `birth_date` | string | ✗ | Format: Y-m-d | Ngày sinh. |
| `gender` | integer | ✗ | Giá trị: 1, 2, 3 | Giới tính. |
| `address` | string | ✗ | Tối đa 1000 ký tự | Địa chỉ. |
| `source` | integer | ✗ | Giá trị: 1-5 | Nguồn khách hàng. |
| `status` | integer | ✗ | Giá trị: 0, 1 | Trạng thái. Mặc định: 1 (Active). |

### Ví dụ Request Body:
```json
{
  "full_name": "Nguyễn Văn B",
  "phone": "0987654322",
  "birth_date": "1995-08-20",
  "gender": 1,
  "address": "456 Đường XYZ, Quận 2",
  "source": 2,
  "status": 1
}
```

### Response `201` (Tạo thành công)
```json
{
  "success": true,
  "message": "Customer created successfully.",
  "errors": null,
  "data": {
    "id": 2,
    "full_name": "Nguyễn Văn B",
    "phone": "0987654322",
    "birth_date": "1995-08-20",
    "gender": {
      "value": 1,
      "label": "Nam"
    },
    "address": "456 Đường XYZ, Quận 2",
    "source": {
      "value": 2,
      "label": "Google"
    },
    "status": {
      "value": 1,
      "label": "Active"
    },
    "outstanding_amount": 0,
    "created_at": "2026-06-11T08:30:00+07:00",
    "updated_at": "2026-06-11T08:30:00+07:00"
  }
}
```

### Response `422` (Validation Error)
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "phone": ["The phone has already been taken."]
  },
  "data": null
}
```

---

## 4. Cập nhật khách hàng (Update Customer)

Cập nhật thông tin khách hàng.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `PATCH /api/customers/{id}` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Path Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | integer | ✓ | ID của khách hàng. |

### Request Body

| Tham số | Kiểu | Bắt buộc | Quy tắc validation | Mô tả |
|---|---|---|---|---|
| `full_name` | string | ✗ | Tối đa 255 ký tự | Tên đầy đủ của khách hàng. |
| `phone` | string | ✗ | Tối đa 50 ký tự, unique (bỏ qua record hiện tại) | Số điện thoại. |
| `birth_date` | string | ✗ | Format: Y-m-d | Ngày sinh. |
| `gender` | integer | ✗ | Giá trị: 1, 2, 3 | Giới tính. |
| `address` | string | ✗ | Tối đa 1000 ký tự | Địa chỉ. |
| `source` | integer | ✗ | Giá trị: 1-5 | Nguồn khách hàng. |
| `status` | integer | ✗ | Giá trị: 0, 1 | Trạng thái. |

### Ví dụ Request Body:
```json
{
  "full_name": "Nguyễn Văn B Updated",
  "address": "789 Đường MNO, Quận 3"
}
```

### Response `200` (Cập nhật thành công)
```json
{
  "success": true,
  "message": "Customer updated successfully.",
  "errors": null,
  "data": {
    "id": 2,
    "full_name": "Nguyễn Văn B Updated",
    "phone": "0987654322",
    "birth_date": "1995-08-20",
    "gender": {
      "value": 1,
      "label": "Nam"
    },
    "address": "789 Đường MNO, Quận 3",
    "source": {
      "value": 2,
      "label": "Google"
    },
    "status": {
      "value": 1,
      "label": "Active"
    },
    "outstanding_amount": 0,
    "created_at": "2026-06-11T08:30:00+07:00",
    "updated_at": "2026-06-11T09:00:00+07:00"
  }
}
```

---

## 5. Xóa khách hàng (Delete Customer)

Xóa mềm (soft delete) khách hàng khỏi hệ thống.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `DELETE /api/customers/{id}` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Path Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | integer | ✓ | ID của khách hàng. |

### Response `204` (Xóa thành công)
```json
{
  "success": true,
  "message": "Customer deleted successfully.",
  "errors": null,
  "data": null
}
```

### Response `404` (Không tìm thấy)
```json
{
  "success": false,
  "message": "Resource not found.",
  "errors": null,
  "data": null
}
```

---

## Enums

### GenderEnum
| Value | Label |
|---|---|
| 1 | Nam |
| 2 | Nữ |
| 3 | Khác |

### CustomerSourceEnum
| Value | Label |
|---|---|
| 1 | Facebook |
| 2 | Google |
| 3 | Website |
| 4 | Referral |
| 5 | Walk-in |

### CustomerStatusEnum
| Value | Label |
|---|---|
| 0 | Inactive |
| 1 | Active |
