---
module: appointment
title: Appointment Management — Quản Lý Lịch Hẹn
description: Luồng CRUD lịch hẹn bao gồm đặt lịch, kiểm tra trùng slot, chuyển trạng thái, tích hợp Visit, và xóa mềm.
type: workflow
priority: high
version: "1.0.0"
changelog:
  - version: "1.0.0"
    date: "2026-06-12"
    summary: "Initial appointment management logic doc — CRUD, state machine (BR-APPT-001 → 005), Visit integration (BR-APPT-004)."
related_files:
  - backend/app/Http/Controllers/Api/AppointmentController.php
  - backend/app/Services/Api/AppointmentService.php
  - backend/app/DTOs/Api/Appointment/CreateAppointmentData.php
  - backend/app/DTOs/Api/Appointment/UpdateAppointmentData.php
  - backend/app/Http/Requests/Appointment/IndexAppointmentRequest.php
  - backend/app/Http/Requests/Appointment/StoreAppointmentRequest.php
  - backend/app/Http/Requests/Appointment/UpdateAppointmentRequest.php
  - backend/app/Http/Resources/Appointment/AppointmentResource.php
  - backend/app/Models/Appointment.php
  - backend/app/Enums/AppointmentStatusEnum.php
  - backend/app/Factories/ApiFactory.php
  - backend/database/migrations/2026_06_12_080000_create_appointments_table.php
  - backend/database/migrations/2026_06_12_080001_add_appointment_id_to_visits_table.php
  - backend/routes/api.php
---

## OVERVIEW

API Appointment quản lý toàn bộ vòng đời lịch hẹn: đặt lịch cho khách hàng đang hoạt động, xem danh sách và chi tiết, đổi lịch với kiểm tra trùng slot, chuyển trạng thái theo state machine, và xóa mềm.

| Component | File |
|---|---|
| Route | `routes/api.php` |
| Controller | `Api/AppointmentController.php` |
| Service | `Api/AppointmentService.php` |
| DTOs | `Appointment/CreateAppointmentData.php`, `UpdateAppointmentData.php` |
| FormRequests | `Appointment/IndexAppointmentRequest.php`, `StoreAppointmentRequest.php`, `UpdateAppointmentRequest.php` |
| Resource | `Appointment/AppointmentResource.php` |
| Model | `Appointment.php` |
| Enum | `AppointmentStatusEnum.php` |

## RBAC

Không có Policy riêng. Tất cả người dùng đã đăng nhập (bất kỳ role) đều có quyền thực hiện đầy đủ CRUD lịch hẹn.

## CONTEXT

Yêu cầu auth middleware (`auth:sanctum`). Sử dụng `ApiFactory` để resolve service. Tất cả trạng thái trả về dạng object `{value, label}`. Lịch hẹn chỉ có thể được đặt cho khách hàng có status `ACTIVE`. Mỗi slot 30 phút chỉ được phép có một lịch hẹn đang hoạt động tại cùng một thời điểm.

## ENTITIES

**Appointment** — Đại diện cho một lịch hẹn giữa phòng khám và khách hàng.

| Field | Kiểu | Mô tả |
|---|---|---|
| `id` | int | Primary key |
| `customer_id` | int (FK) | ID khách hàng (bắt buộc ACTIVE) |
| `appointment_at` | datetime | Thời điểm chính xác của lịch hẹn (`Y-m-d H:i:00`) |
| `appointment_date` | date | Ngày hẹn (redundant field cho phép filter hiệu quả) |
| `status` | AppointmentStatusEnum | Trạng thái hiện tại |
| `note` | string\|null | Ghi chú thêm |
| `deleted_at` | datetime\|null | Soft delete timestamp |

**AppointmentStatusEnum:**

| Value | Name | Mô tả |
|---|---|---|
| 1 | `BOOKED` | Đã đặt lịch |
| 2 | `CONFIRMED` | Đã xác nhận |
| 3 | `CHECKED_IN` | Đã check-in tại phòng khám |
| 4 | `COMPLETED` | Đã hoàn thành khám |
| 5 | `CANCELLED` | Đã hủy |
| 6 | `NO_SHOW` | Không đến hẹn |

## FLOW

### 1. List Appointments (GET /api/appointments)

1. **Auth Check** — Middleware `auth:sanctum` đảm bảo user đã đăng nhập.
2. **Validation** — `IndexAppointmentRequest` validate query params:
   - `date`: optional, date format `Y-m-d`.
   - `status`: optional, integer, in AppointmentStatusEnum values.
   - `search`: optional, string.
   - `per_page`: optional, integer, min 1, max 100, default 15.
3. **DTO Conversion** — `IndexAppointmentData::from()` tạo DTO.
4. **Service Layer** — `AppointmentService::list()`:
   - Eager load `customer:id,full_name,phone`.
   - Apply `whereDate('appointment_date', $filter)` nếu có `date`.
   - Apply `where('status', $filter)` nếu có `status`.
   - Apply `whereHas('customer', fn($q) => LIKE %% trên full_name và phone)` nếu có `search`.
   - Order by `appointment_at ASC`.
   - Return `LengthAwarePaginator`.
5. **Response** — `AppointmentResource::collection()` với pagination meta.

### 2. Show Appointment (GET /api/appointments/{id})

1. **Auth Check** — Middleware `auth:sanctum`.
2. **Route Model Binding** — Laravel resolve `Appointment` từ ID (bao gồm `customer`).
3. **Response** — `AppointmentResource` trả về chi tiết.

### 3. Create Appointment (POST /api/appointments) — Flow 1

1. **Auth Check** — Middleware `auth:sanctum`.
2. **Validation** — `StoreAppointmentRequest` validate:
   - `customer_id`: required, integer, `exists(customers, id)` với điều kiện `deleted_at IS NULL` và `status = ACTIVE` (BR-APPT-002).
   - `appointment_date`: required, date, format `Y-m-d`.
   - `appointment_time`: required, string, format `H:i`, regex `/^\d{2}:(00|30)$/`.
   - `note`: nullable, string, max theo config.
3. **DTO Conversion** — `CreateAppointmentData::from()`.
4. **Service Layer** — `AppointmentService::create()` trong DB transaction:
   a. **Build Carbon** — `Carbon::createFromFormat('Y-m-d H:i', "$date $time")`.
   b. **Double-Booking Check** (BR-APPT-001) — `lockForUpdate()` query để kiểm tra có appointment nào ở trạng thái `BOOKED|CONFIRMED|CHECKED_IN` tại đúng `appointment_at` không. Nếu có → throw `ValidationException` với key `appointment_time`.
   c. **Create Record** — `Appointment::create()` với `status = BOOKED`.
5. **Response** — `AppointmentResource` với HTTP 201.
6. **Activity Log** (BR-G002) — Spatie ActivityLog tự động ghi `created` event.

### 4. Update Appointment (PUT /api/appointments/{id}) — Flow 2 / Flow 3

1. **Auth Check** — Middleware `auth:sanctum`.
2. **Route Model Binding** — Laravel resolve `Appointment`.
3. **Validation** — `UpdateAppointmentRequest` validate (tất cả `sometimes`):
   - `appointment_date`: nullable, date, format `Y-m-d`.
   - `appointment_time`: nullable, regex `/^\d{2}:(00|30)$/`.
   - `status`: nullable, integer, in AppointmentStatusEnum.
   - `note`: nullable, string, max theo config.
4. **DTO Conversion** — `UpdateAppointmentData::from()`.
5. **Service Layer** — `AppointmentService::update()` trong DB transaction:
   a. **Status Transition Validation** (BR-APPT-003) — Nếu `status` được gửi, kiểm tra `ALLOWED_TRANSITIONS[current] contains new`. Nếu không hợp lệ → throw `ValidationException` với key `status`.
   b. **Rescheduling** — Nếu `appointment_date` hoặc `appointment_time` được gửi, build Carbon mới. Nếu slot mới khác slot cũ → chạy Double-Booking Check (BR-APPT-001) với `excludeId = $appointment->id`.
   c. **Update Record** — `$appointment->update(...)` và `$appointment->fresh(['customer'])`.
6. **Response** — `AppointmentResource` với HTTP 200.
7. **Activity Log** (BR-G002) — Spatie ActivityLog tự động ghi `updated` event.

### 5. Delete Appointment (DELETE /api/appointments/{id}) — Flow 4

1. **Auth Check** — Middleware `auth:sanctum`.
2. **Route Model Binding** — Laravel resolve `Appointment`.
3. **Service Layer** — `AppointmentService::delete()`:
   - Gọi `$appointment->delete()` → soft delete (set `deleted_at`).
4. **Response** — HTTP 200 với message.

### 6. Mark Completed by Visit (Internal — BR-APPT-004)

> Đây là method nội bộ được gọi bởi `VisitService` khi tạo Visit, không phải HTTP endpoint.

1. `AppointmentService::markCompleted($appointment)` — Force-set `status = COMPLETED` cho appointment liên kết.
2. Thao tác này bypass state machine (không gọi `assertValidTransition`).
3. **Kích hoạt khi**: `VisitService::create()` thành công với `appointment_id` hợp lệ.

## RULES

- **BR-APPT-001** — Mỗi slot 30 phút chỉ được phép có một lịch hẹn đang hoạt động (status: `BOOKED`, `CONFIRMED`, `CHECKED_IN`). Vi phạm → 422 với key `appointment_time`.
- **BR-APPT-002** — Chỉ được đặt lịch cho khách hàng có status `ACTIVE`. Khách `INACTIVE` bị từ chối ở tầng validation (Rule exists với where clause).
- **BR-APPT-003** — Chuyển trạng thái phải theo ma trận `ALLOWED_TRANSITIONS`. Trạng thái `COMPLETED`, `CANCELLED`, `NO_SHOW` là trạng thái cuối — không thể chuyển tiếp.
- **BR-APPT-004** — Khi `Visit` được tạo thành công với `appointment_id`, `AppointmentService::markCompleted()` phải được gọi để chuyển appointment sang `COMPLETED`. (Implement khi Visit API hoàn thiện.)
- **BR-APPT-005** — Appointment không bao giờ được hard-delete. Luôn dùng soft delete (`$appointment->delete()`). Các báo cáo và lịch sử phải giữ nguyên dữ liệu.
- **BR-G002** — Tất cả thao tác tạo và cập nhật phải tự động ghi Activity Log thông qua Spatie `LogsActivity` trait.
- ALWAYS dùng `DB::transaction()` cho `create` và `update` để đảm bảo atomicity của double-booking check.
- ALWAYS dùng `lockForUpdate()` trong double-booking check để tránh race condition.
- ALWAYS format `status` thành object `{value, label}` trong response.
- ALWAYS eager load `customer:id,full_name,phone` trong mọi response của AppointmentResource.

## EDGE_CASES

- **Double booking race condition**: `lockForUpdate()` trong transaction ngăn chặn hai requests đồng thời đặt cùng slot. Một request sẽ thắng, một request trả về 422.
- **Reschedule sang chính slot cũ**: Nếu `appointment_at` mới bằng slot cũ, hệ thống bỏ qua double-booking check (tránh false positive tự block mình).
- **Update không thay đổi gì**: Request hợp lệ với body rỗng / tất cả fields `null` — không có validation error, record không thay đổi.
- **Appointment không tồn tại**: Route model binding tự throw 404.
- **Khách hàng không load**: `AppointmentResource::formatCustomer()` trả về `null` an toàn nếu relation chưa được eager load.
- **Visit chưa implement (BR-APPT-004)**: `markCompleted()` đã sẵn sàng trong service. HTTP integration test sẽ được thêm khi Visit API hoàn thiện.

## EXAMPLES

### Input: Tạo lịch hẹn
```json
{
  "customer_id": 10,
  "appointment_date": "2026-07-15",
  "appointment_time": "10:00",
  "note": "Khám da định kỳ"
}
```

### Input: Chuyển trạng thái BOOKED → CONFIRMED
```json
{
  "status": 2
}
```

### Input: Đổi lịch (reschedule)
```json
{
  "appointment_date": "2026-07-16",
  "appointment_time": "14:30"
}
```

### Output: Appointment Detail
```json
{
  "id": 42,
  "customer": {
    "id": 10,
    "full_name": "Nguyễn Văn A",
    "phone": "0987654321"
  },
  "appointment_at": "2026-07-15T10:00:00+07:00",
  "appointment_date": "2026-07-15",
  "appointment_time": "10:00",
  "status": { "value": 2, "label": "Đã xác nhận" },
  "note": "Khám da định kỳ",
  "created_at": "2026-06-12T14:00:00+07:00",
  "updated_at": "2026-06-12T15:00:00+07:00"
}
```

## API Endpoints

| Method | URI | Description | Auth |
|--------|-----|-------------|------|
| `GET` | `/api/appointments` | Danh sách lịch hẹn có phân trang, filter | sanctum |
| `GET` | `/api/appointments/{id}` | Chi tiết lịch hẹn | sanctum |
| `POST` | `/api/appointments` | Tạo lịch hẹn mới | sanctum |
| `PUT` | `/api/appointments/{id}` | Cập nhật / chuyển trạng thái / đổi lịch | sanctum |
| `DELETE` | `/api/appointments/{id}` | Xóa mềm lịch hẹn | sanctum |
