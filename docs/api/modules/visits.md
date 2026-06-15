# Visit Management API

Quản lý lượt khám (Visit) — Check-in từ lịch hẹn hoặc walk-in, theo dõi trạng thái hàng chờ, hủy lượt khám.

> [!IMPORTANT]
> **API này yêu cầu xác thực Bearer Token** (`auth:sanctum`). Người dùng phải đăng nhập thành công trước khi gọi bất kỳ endpoint nào.

---

## 1. Danh sách lượt khám (List Visits)

Lấy danh sách lượt khám có phân trang, hỗ trợ lọc theo ngày và trạng thái.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `GET /api/visits` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Query Parameters

| Tham số | Kiểu | Bắt buộc | Quy tắc validation | Mô tả |
|---|---|---|---|---|
| `from` | string | ✗ | Định dạng `Y-m-d` | Lọc từ ngày. Mặc định: hôm nay. |
| `to` | string | ✗ | Định dạng `Y-m-d` | Lọc đến ngày. Mặc định: bằng `from`. |
| `status` | integer | ✗ | Giá trị: 1–4 | Lọc theo trạng thái lượt khám. |
| `page` | integer | ✗ | Tối thiểu 1 | Trang muốn hiển thị. Mặc định: `1`. |
| `per_page` | integer | ✗ | Tối thiểu 1, tối đa 100 | Số bản ghi trên trang. Mặc định: `15`. |

#### Ví dụ Request URL:
```
GET /api/visits?from=2026-07-01&to=2026-07-01&status=1&per_page=15&page=1
```

### Response `200` (Thành công)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "KB260701-0001",
      "queue_number": 1,
      "registration_type": {
        "value": 2,
        "label": "Đặt lịch trước"
      },
      "status": {
        "value": 1,
        "label": "Đang chờ"
      },
      "is_priority": false,
      "visited_at": "2026-07-01T08:00:00+07:00",
      "appointment_date": "2026-07-01T08:00:00+07:00",
      "reason": null,
      "customer": {
        "id": 10,
        "code": "BN000001",
        "full_name": "Nguyễn Văn A"
      },
      "clinic_room": {
        "id": 1,
        "name": "Phòng Da Liễu"
      },
      "services": [
        { "id": 1, "name": "Khám Da Cơ Bản" }
      ],
      "packages": [],
      "created_at": "2026-07-01T08:00:00+07:00",
      "updated_at": "2026-07-01T08:00:00+07:00"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 15,
    "total": 42
  }
}
```

---

## 2. Tạo lượt khám Walk-in (Create Walk-in Visit)

Tạo lượt khám mới cho khách vãng lai (không có lịch hẹn trước).

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `POST /api/visits` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Request Body

| Field | Kiểu | Bắt buộc | Quy tắc validation | Mô tả |
|---|---|---|---|---|
| `customer_id` | integer | ✓ | `exists:customers,id` | ID khách hàng. |
| `clinic_room_id` | integer | ✗ | `exists:clinic_rooms,id` | ID phòng khám. Bắt buộc nếu `registration_type = 1`. |
| `registration_type` | integer | ✓ | Giá trị: 1, 2 | Loại đăng ký: 1 = Walk-in, 2 = Đặt lịch. |
| `is_priority` | boolean | ✗ | | Ưu tiên. Mặc định: `false`. |
| `service_ids` | array | ✗ | `exists:services,id` | Mảng ID dịch vụ. |
| `service_package_ids` | array | ✗ | `exists:service_packages,id` | Mảng ID gói dịch vụ. |
| `reason` | string | ✗ | Nullable | Lý do khám. |

#### Ví dụ Request Body (Walk-in):
```json
{
  "customer_id": 10,
  "clinic_room_id": 1,
  "registration_type": 1,
  "is_priority": false,
  "service_ids": [1, 2],
  "reason": "Khám da định kỳ"
}
```

### Response `201` (Tạo thành công)
```json
{
  "success": true,
  "message": "Lượt khám đã được tạo thành công.",
  "data": {
    "id": 1,
    "code": "KB260701-0001",
    "queue_number": 1,
    "registration_type": {
      "value": 1,
      "label": "Vãng lai"
    },
    "status": {
      "value": 1,
      "label": "Đang chờ"
    },
    "is_priority": false,
    "visited_at": "2026-07-01T08:00:00+07:00",
    "appointment_date": "2026-07-01T08:00:00+07:00",
    "reason": "Khám da định kỳ",
    "customer": {
      "id": 10,
      "code": "BN000001",
      "full_name": "Nguyễn Văn A"
    },
    "clinic_room": {
      "id": 1,
      "name": "Phòng Da Liễu"
    },
    "services": [
      { "id": 1, "name": "Khám Da Cơ Bản" },
      { "id": 2, "name": "Laser CO2" }
    ],
    "packages": [],
    "created_at": "2026-07-01T08:00:00+07:00",
    "updated_at": "2026-07-01T08:00:00+07:00"
  }
}
```

### Response `422` (Validation Error)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "customer_id": ["The customer field is required."],
    "clinic_room_id": ["The clinic room field is required when registration type is walk-in."]
  }
}
```

---

## 3. Tạo lượt khám từ lịch hẹn (Check-in Appointment)

Check-in khách hàng đã có lịch hẹn (chuyển từ `Appointment` → `Visit`).

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `POST /api/visits/from-appointment` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Request Body

| Field | Kiểu | Bắt buộc | Quy tắc validation | Mô tả |
|---|---|---|---|---|
| `appointment_id` | integer | ✓ | `exists:appointments,id` | ID lịch hẹn. Phải có `status = BOOKED`. |
| `clinic_room_id` | integer | ✓ | `exists:clinic_rooms,id` | ID phòng khám. |
| `is_priority` | boolean | ✗ | | Ưu tiên. Mặc định: `false`. |

#### Ví dụ Request Body:
```json
{
  "appointment_id": 42,
  "clinic_room_id": 1,
  "is_priority": false
}
```

### Response `201` (Tạo thành công)
```json
{
  "success": true,
  "message": "Check-in từ lịch hẹn thành công.",
  "data": {
    "id": 1,
    "code": "KB260701-0001",
    "queue_number": 1,
    "registration_type": {
      "value": 2,
      "label": "Đặt lịch trước"
    },
    "status": {
      "value": 1,
      "label": "Đang chờ"
    },
    "is_priority": false,
    "visited_at": "2026-07-01T08:00:00+07:00",
    "appointment_date": "2026-07-01T08:30:00+07:00",
    "reason": null,
    "customer": {
      "id": 10,
      "code": "BN000001",
      "full_name": "Nguyễn Văn A"
    },
    "clinic_room": {
      "id": 1,
      "name": "Phòng Da Liễu"
    },
    "services": [],
    "packages": [],
    "created_at": "2026-07-01T08:00:00+07:00",
    "updated_at": "2026-07-01T08:00:00+07:00"
  }
}
```

### Response `422` — Lịch hẹn không hợp lệ
```json
{
  "message": "Lịch hẹn này không thể check-in.",
  "errors": {
    "appointment_id": ["Lịch hẹn đã được check-in hoặc không tồn tại."]
  }
}
```

---

## 4. Hủy lượt khám (Cancel Visit)

Hủy lượt khám đang ở trạng thái `WAITING` hoặc `IN_PROGRESS`.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `POST /api/visits/{id}/cancel` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Path Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | integer | ✓ | ID của lượt khám. |

### Response `200` (Hủy thành công)
```json
{
  "success": true,
  "message": "Lượt khám đã được hủy.",
  "data": {
    "id": 1,
    "code": "KB260701-0001",
    "status": {
      "value": 4,
      "label": "Đã hủy"
    },
    "..."
  }
}
```

### Response `422` — Không thể hủy
```json
{
  "message": "Không thể hủy lượt khám này.",
  "errors": {
    "status": ["Lượt khám đã hoàn thành hoặc đã bị hủy."]
  }
}
```

---

## 5. Xóa lượt khám (Soft Delete Visit)

Xóa mềm lượt khám.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `DELETE /api/visits/{id}` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Path Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | integer | ✓ | ID của lượt khám. |

### Response `204` (Xóa thành công)
```
(No content)
```

### Response `404` (Không tìm thấy)
```json
{
  "message": "No query results for model [App\\Models\\Visit]."
}
```

---

## Enums

### VisitStatusEnum

| Value | Name | Mô tả | Chuyển tiếp được sang |
|---|---|---|---|
| `1` | `WAITING` | Đang chờ | `IN_PROGRESS`, `CANCELLED` |
| `2` | `IN_PROGRESS` | Đang khám | `COMPLETED`, `CANCELLED` |
| `3` | `COMPLETED` | Đã hoàn thành | *(Không thể chuyển)* |
| `4` | `CANCELLED` | Đã hủy | *(Không thể chuyển)* |

### RegistrationTypeEnum

| Value | Name | Mô tả |
|---|---|---|
| `1` | `WALK_IN` | Vãng lai (không có lịch hẹn) |
| `2` | `SCHEDULED` | Đặt lịch trước (có lịch hẹn) |
