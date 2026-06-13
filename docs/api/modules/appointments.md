# Appointment Management API

Quản lý lịch hẹn (đặt lịch, theo dõi trạng thái, chuyển trạng thái, xóa mềm).

> [!IMPORTANT]
> **API này yêu cầu xác thực Bearer Token** (`auth:sanctum`). Người dùng phải đăng nhập thành công trước khi gọi bất kỳ endpoint nào.

---

## 1. Danh sách lịch hẹn (List Appointments)

Lấy danh sách lịch hẹn có phân trang, hỗ trợ lọc theo ngày, trạng thái và tìm kiếm theo tên/số điện thoại khách hàng.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `GET /api/appointments` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Query Parameters

| Tham số | Kiểu | Bắt buộc | Quy tắc validation | Mô tả |
|---|---|---|---|---|
| `date` | string | ✗ | Định dạng `Y-m-d` | Lọc theo ngày hẹn cụ thể. |
| `status` | integer | ✗ | Giá trị: 1–6 | Lọc theo trạng thái lịch hẹn. |
| `search` | string | ✗ | — | Tìm kiếm theo tên hoặc số điện thoại khách hàng (LIKE %%). |
| `page` | integer | ✗ | Tối thiểu 1 | Trang muốn hiển thị. Mặc định: `1`. |
| `per_page` | integer | ✗ | Tối thiểu 1, tối đa 100 | Số bản ghi trên trang. Mặc định: `15`. |

#### Ví dụ Request URL:
```
GET /api/appointments?date=2026-07-01&status=1&per_page=15&page=1
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
      "customer": {
        "id": 10,
        "full_name": "Nguyễn Văn A",
        "phone": "0987654321"
      },
      "appointment_at": "2026-07-01T09:00:00+07:00",
      "appointment_date": "2026-07-01",
      "appointment_time": "09:00",
      "status": {
        "value": 1,
        "label": "Đã đặt lịch"
      },
      "note": "Khám da định kỳ",
      "created_at": "2026-06-30T08:00:00+07:00",
      "updated_at": "2026-06-30T08:00:00+07:00"
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

### Response `401` (Chưa xác thực)
```json
{
  "success": false,
  "message": "Unauthenticated.",
  "errors": null,
  "data": null
}
```

---

## 2. Chi tiết lịch hẹn (Get Appointment Detail)

Lấy thông tin chi tiết của một lịch hẹn, bao gồm thông tin khách hàng liên kết.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `GET /api/appointments/{id}` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Path Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | integer | ✓ | ID của lịch hẹn. |

### Response `200` (Thành công)
```json
{
  "success": true,
  "message": "",
  "errors": null,
  "data": {
    "id": 1,
    "customer": {
      "id": 10,
      "full_name": "Nguyễn Văn A",
      "phone": "0987654321"
    },
    "appointment_at": "2026-07-01T09:00:00+07:00",
    "appointment_date": "2026-07-01",
    "appointment_time": "09:00",
    "status": {
      "value": 2,
      "label": "Đã xác nhận"
    },
    "note": "Khám da định kỳ",
    "created_at": "2026-06-30T08:00:00+07:00",
    "updated_at": "2026-06-30T09:00:00+07:00"
  }
}
```

### Response `404` (Không tìm thấy)
```json
{
  "message": "No query results for model [App\\Models\\Appointment]."
}
```

---

## 3. Tạo lịch hẹn (Create Appointment)

Tạo một lịch hẹn mới cho khách hàng đang hoạt động. Hệ thống kiểm tra trùng slot 30 phút trước khi tạo.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `POST /api/appointments` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Request Body

| Field | Kiểu | Bắt buộc | Quy tắc validation | Mô tả |
|---|---|---|---|---|
| `customer_id` | integer | ✓ | Tồn tại trong `customers`, status = `ACTIVE` | ID khách hàng (phải đang ACTIVE). |
| `appointment_date` | string | ✓ | Định dạng `Y-m-d` | Ngày hẹn. |
| `appointment_time` | string | ✓ | Định dạng `HH:MM`, regex `^\d{2}:(00\|30)$` | Giờ hẹn (chỉ chấp nhận mốc 30 phút: 08:00, 08:30...). |
| `note` | string | ✗ | Nullable, max (config `validate.max_length.note`) | Ghi chú thêm. |

#### Ví dụ Request Body:
```json
{
  "customer_id": 10,
  "appointment_date": "2026-07-15",
  "appointment_time": "10:00",
  "note": "Khách hàng yêu cầu tư vấn da mụn"
}
```

### Response `201` (Tạo thành công)
```json
{
  "success": true,
  "message": "Lịch hẹn đã được tạo thành công.",
  "errors": null,
  "data": {
    "id": 42,
    "customer": {
      "id": 10,
      "full_name": "Nguyễn Văn A",
      "phone": "0987654321"
    },
    "appointment_at": "2026-07-15T10:00:00+07:00",
    "appointment_date": "2026-07-15",
    "appointment_time": "10:00",
    "status": {
      "value": 1,
      "label": "Đã đặt lịch"
    },
    "note": "Khách hàng yêu cầu tư vấn da mụn",
    "created_at": "2026-06-12T14:00:00+07:00",
    "updated_at": "2026-06-12T14:00:00+07:00"
  }
}
```

### Response `422` (Validation Error)

**Thiếu field bắt buộc:**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "customer_id": ["The customer field is required."],
    "appointment_date": ["The appointment date field is required."],
    "appointment_time": ["The appointment time field is required."]
  }
}
```

**Khách hàng không hoạt động (BR-APPT-002):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "customer_id": ["Khách hàng này hiện không hoạt động."]
  }
}
```

**Giờ hẹn không đúng mốc 30 phút:**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "appointment_time": ["Giờ hẹn phải nằm trên các mốc 30 phút (ví dụ: 08:00, 08:30)."]
  }
}
```

**Trùng lịch (BR-APPT-001):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "appointment_time": ["Khung giờ này đã có lịch hẹn. Vui lòng chọn giờ khác."]
  }
}
```

---

## 4. Cập nhật lịch hẹn (Update Appointment)

Cập nhật thông tin lịch hẹn: đổi ngày/giờ (reschedule), chuyển trạng thái, hoặc cập nhật ghi chú.

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `PUT /api/appointments/{id}` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Path Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | integer | ✓ | ID của lịch hẹn. |

### Request Body (tất cả fields đều optional)

| Field | Kiểu | Bắt buộc | Quy tắc validation | Mô tả |
|---|---|---|---|---|
| `appointment_date` | string | ✗ | Nullable, định dạng `Y-m-d` | Ngày hẹn mới (dùng để đổi lịch). |
| `appointment_time` | string | ✗ | Nullable, regex `^\d{2}:(00\|30)$` | Giờ hẹn mới (chỉ chấp nhận mốc 30 phút). |
| `status` | integer | ✗ | Nullable, giá trị hợp lệ theo enum | Trạng thái mới (xem ma trận chuyển trạng thái). |
| `note` | string | ✗ | Nullable, max (config) | Ghi chú mới. |

### Ma trận chuyển trạng thái hợp lệ (BR-APPT-003)

| Trạng thái hiện tại | Có thể chuyển sang |
|---|---|
| `BOOKED` (1) | `CONFIRMED` (2), `CANCELLED` (5) |
| `CONFIRMED` (2) | `CHECKED_IN` (3), `CANCELLED` (5), `NO_SHOW` (6) |
| `CHECKED_IN` (3) | `COMPLETED` (4), `CANCELLED` (5) |
| `COMPLETED` (4) | *(Trạng thái cuối — không thể thay đổi)* |
| `CANCELLED` (5) | *(Trạng thái cuối — không thể thay đổi)* |
| `NO_SHOW` (6) | *(Trạng thái cuối — không thể thay đổi)* |

#### Ví dụ Request Body — Đổi lịch:
```json
{
  "appointment_date": "2026-07-16",
  "appointment_time": "11:30"
}
```

#### Ví dụ Request Body — Chuyển trạng thái:
```json
{
  "status": 2
}
```

### Response `200` (Cập nhật thành công)
```json
{
  "success": true,
  "message": "Lịch hẹn đã được cập nhật thành công.",
  "errors": null,
  "data": {
    "id": 42,
    "customer": {
      "id": 10,
      "full_name": "Nguyễn Văn A",
      "phone": "0987654321"
    },
    "appointment_at": "2026-07-16T11:30:00+07:00",
    "appointment_date": "2026-07-16",
    "appointment_time": "11:30",
    "status": {
      "value": 2,
      "label": "Đã xác nhận"
    },
    "note": null,
    "created_at": "2026-06-12T14:00:00+07:00",
    "updated_at": "2026-06-12T15:00:00+07:00"
  }
}
```

### Response `422` — Chuyển trạng thái không hợp lệ (BR-APPT-003)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "status": ["Chuyển đổi trạng thái này không được phép."]
  }
}
```

---

## 5. Xóa lịch hẹn (Soft Delete Appointment)

Xóa mềm lịch hẹn. Dữ liệu được giữ lại trong cơ sở dữ liệu (soft delete) nhằm đảm bảo toàn vẹn báo cáo (BR-APPT-005).

| Đặc điểm | Chi tiết |
|---|---|
| **Endpoint** | `DELETE /api/appointments/{id}` |
| **Auth** | ✓ Yêu cầu Bearer Token |

### Path Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | integer | ✓ | ID của lịch hẹn. |

### Response `200` (Xóa thành công)
```json
{
  "success": true,
  "message": "Lịch hẹn đã được xóa thành công.",
  "errors": null,
  "data": null
}
```

### Response `404` (Không tìm thấy)
```json
{
  "message": "No query results for model [App\\Models\\Appointment]."
}
```

---

## Enum: AppointmentStatusEnum

| Value | Name | Mô tả |
|---|---|---|
| `1` | `BOOKED` | Đã đặt lịch (chờ xác nhận) |
| `2` | `CONFIRMED` | Đã xác nhận lịch hẹn |
| `3` | `CHECKED_IN` | Đã đến phòng khám (chờ khám) |
| `4` | `COMPLETED` | Đã hoàn thành cuộc khám |
| `5` | `CANCELLED` | Đã hủy lịch hẹn |
| `6` | `NO_SHOW` | Không đến hẹn |
