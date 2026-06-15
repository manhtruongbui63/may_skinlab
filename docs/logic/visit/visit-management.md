---
module: visit
name: visit-management
description: |
  Luồng quản lý lượt khám (Visit) — Check-in từ lịch hẹn hoặc walk-in,
  theo dõi trạng thái hàng chờ, hủy lượt khám. Tích hợp tự động cập nhật
  trạng thái lịch hẹn sang CHECKED_IN.
type: workflow
priority: high
version: "1.0.0"
changelog:
  - version: "1.0.0"
    date: "2026-06-14"
    summary: "Initial Visit management logic — Walk-in, Check-in from appointment, Cancel, Delete."
related_files:
  - backend/app/Http/Controllers/Api/VisitController.php
  - backend/app/Services/Api/VisitService.php
  - backend/app/DTOs/Api/Visit/CreateVisitData.php
  - backend/app/DTOs/Api/Visit/CreateVisitFromAppointmentData.php
  - backend/app/DTOs/Api/Visit/ListVisitData.php
  - backend/app/Http/Requests/Reception/StoreVisitRequest.php
  - backend/app/Http/Requests/Reception/StoreVisitFromAppointmentRequest.php
  - backend/app/Http/Requests/Reception/IndexVisitRequest.php
  - backend/app/Http/Resources/Reception/VisitResource.php
  - backend/app/Models/Visit.php
  - backend/app/Models/Appointment.php
  - backend/app/Enums/VisitStatusEnum.php
  - backend/app/Enums/RegistrationTypeEnum.php
  - backend/routes/api.php
---

## OVERVIEW

API Visit quản lý toàn bộ vòng đời lượt khám: tạo walk-in mới, check-in từ lịch hẹn, theo dõi danh sách chờ, hủy lượt khám.

| Component | File |
|---|---|
| Route | `routes/api.php` |
| Controller | `Api/VisitController.php` |
| Service | `Api/VisitService.php` |
| DTOs | `Visit/CreateVisitData.php`, `CreateVisitFromAppointmentData.php`, `ListVisitData.php` |
| FormRequests | `Reception/StoreVisitRequest.php`, `StoreVisitFromAppointmentRequest.php`, `IndexVisitRequest.php` |
| Resource | `Reception/VisitResource.php` |
| Model | `Visit.php` |
| Enums | `VisitStatusEnum.php`, `RegistrationTypeEnum.php` |

## RBAC

Không có Policy riêng (ngoại trừ `destroy` dùng Gate). Tất cả người dùng đã đăng nhập đều có quyền thực hiện CRUD.

## CONTEXT

Yêu cầu auth middleware (`auth:sanctum`). Sử dụng `ApiFactory` để resolve service. Visit được tạo từ:
1. **Walk-in**: Khách vãng lai không có lịch hẹn
2. **Scheduled**: Check-in từ lịch hẹn đã đặt (Appointment status = BOOKED)

Khi check-in từ lịch hẹn, Appointment status tự động chuyển sang CHECKED_IN (BR-APPT-003).

## ENTITIES

**Visit** — Đại diện cho một lượt khám tại phòng khám.

| Field | Kiểu | Mô tả |
|---|---|---|
| `id` | int | Primary key |
| `code` | string | Mã lượt khám (format: KByyMMdd-NNNN) |
| `queue_number` | int | Số thứ tự trong ngày (theo phòng) |
| `customer_id` | int (FK) | ID khách hàng |
| `appointment_id` | int\|null (FK) | ID lịch hẹn liên kết (nếu có) |
| `clinic_room_id` | int\|null (FK) | ID phòng khám |
| `registration_type` | RegistrationTypeEnum | Loại đăng ký (Walk-in/Scheduled) |
| `status` | VisitStatusEnum | Trạng thái hiện tại |
| `is_priority` | bool | Cờ ưu tiên |
| `visited_at` | datetime | Thời điểm check-in |
| `appointment_date` | datetime\|null | Thời gian hẹn (Scheduled) hoặc thời gian tiếp nhận (Walk-in) |
| `reason` | string\|null | Lý do khám |
| `deleted_at` | datetime\|null | Soft delete timestamp |

**VisitStatusEnum:**

| Value | Name | Mô tả | Allowed Transitions |
|---|---|---|---|
| 1 | `WAITING` | Đang chờ | IN_PROGRESS, CANCELLED |
| 2 | `IN_PROGRESS` | Đang khám | COMPLETED, CANCELLED |
| 3 | `COMPLETED` | Đã hoàn thành | — |
| 4 | `CANCELLED` | Đã hủy | — |

**RegistrationTypeEnum:**

| Value | Name | Mô tả |
|---|---|---|
| 1 | `WALK_IN` | Vãng lai |
| 2 | `SCHEDULED` | Đặt lịch trước |

## FLOW

### 1. List Visits (GET /api/visits)

1. **Auth Check** — Middleware `auth:sanctum`.
2. **Validation** — `IndexVisitRequest` validate:
   - `from`, `to`: optional, date format `Y-m-d`.
   - `status`: optional, in VisitStatusEnum values.
   - `per_page`: optional, integer, min 1, max 100.
3. **DTO Conversion** — `ListVisitData::from()`.
4. **Service Layer** — `VisitService::list()`:
   - Filter by date range (default: today → today).
   - Filter by status if provided.
   - Eager load `customer`, `clinicRoom`, `services`, `packages`.
   - Order by `queue_number ASC`.
   - Return `LengthAwarePaginator`.
5. **Response** — `VisitResource::collection()` với pagination meta.

### 2. Create Walk-in Visit (POST /api/visits) — Flow 1

1. **Auth Check** — Middleware `auth:sanctum`.
2. **Validation** — `StoreVisitRequest`:
   - `customer_id`: required, exists.
   - `clinic_room_id`: required if `registration_type = 1`.
   - `registration_type`: required, in [1, 2].
   - `is_priority`: boolean.
   - `service_ids`: array of exists.
   - `service_package_ids`: array of exists.
   - `reason`: nullable, string.
3. **DTO Conversion** — `CreateVisitData::from()`.
4. **Service Layer** — `VisitService::create()` trong DB transaction:
   a. **Generate Code** — Format `KB{yyMMdd}-{sequence:4}`.
   b. **Generate Queue Number** — Per room, per day (incremental).
   c. **Create Visit** — With `status = WAITING`, `visited_at = now()`.
   d. **Sync Services/Packages** — Attach nếu có.
   e. **Activity Log** — Ghi log tạo visit.
5. **Response** — `VisitResource` với HTTP 201.

### 3. Create Visit from Appointment (POST /api/visits/from-appointment) — Flow 2

1. **Auth Check** — Middleware `auth:sanctum`.
2. **Validation** — `StoreVisitFromAppointmentRequest`:
   - `appointment_id`: required, exists in appointments.
   - `clinic_room_id`: required, exists.
   - `is_priority`: boolean.
3. **DTO Conversion** — `CreateVisitFromAppointmentData::from()`.
4. **Service Layer** — `VisitService::createFromAppointment()` trong DB transaction:
   a. **Lock Appointment** — `lockForUpdate()` để tránh race condition.
   b. **Verify Status** — Appointment phải có `status = BOOKED`. Nếu không → throw 422.
   c. **Generate Code & Queue Number** — Như Flow 1.
   d. **Create Visit** — With `appointment_id`, `registration_type = SCHEDULED`.
   e. **Update Appointment** — Set `status = CHECKED_IN` (BR-APPT-003).
   f. **Activity Log** — Ghi log tạo visit và cập nhật appointment.
5. **Response** — `VisitResource` với HTTP 201.

> **Race Condition Handling**: `lockForUpdate()` đảm bảo chỉ một request thắng khi nhiều người cùng check-in một appointment.

### 4. Cancel Visit (POST /api/visits/{id}/cancel) — Flow 3

1. **Auth Check** — Middleware `auth:sanctum`.
2. **Service Layer** — `VisitService::cancel()`:
   - Load visit by ID.
   - Kiểm tra `status` phải là `WAITING` hoặc `IN_PROGRESS`.
   - Nếu `COMPLETED` hoặc `CANCELLED` → throw 422.
   - Update `status = CANCELLED`.
3. **Response** — `VisitResource` với HTTP 200.

### 5. Delete Visit (DELETE /api/visits/{id}) — Flow 4

1. **Auth Check** — Middleware `auth:sanctum`.
2. **Authorization** — Gate `delete` kiểm tra quyền.
3. **Service Layer** — `VisitService::delete()`:
   - Load visit by ID.
   - Gọi `$visit->delete()` → soft delete.
4. **Response** — HTTP 204 (No Content).

## RULES

- **BR-VISIT-001** — Code lượt khám phải unique theo format `KByyMMdd-NNNN` (yy = năm 2 chữ số, MM = tháng, dd = ngày, NNNN = sequence 4 chữ số).
- **BR-VISIT-002** — Queue number tính theo room và ngày. Reset mỗi ngày. Nếu không có `clinic_room_id` (trường hợp scheduled chưa assign room), queue_number = 0.
- **BR-VISIT-003** — Chỉ được hủy visit khi status là `WAITING` hoặc `IN_PROGRESS`.
- **BR-VISIT-004** — Visit từ appointment chỉ tạo được khi appointment có `status = BOOKED`. Sau khi tạo visit, appointment chuyển sang `CHECKED_IN`.
- **BR-VISIT-005** — Race condition khi check-in appointment được xử lý bằng `lockForUpdate()`. Request thua sẽ nhận lỗi 422.
- **BR-APPT-003** — Khi visit được tạo từ appointment, appointment tự động chuyển sang `CHECKED_IN`.
- **BR-G002** — Tất cả thao tác tạo, cập nhật, hủy đều ghi Activity Log.
- ALWAYS dùng `DB::transaction()` cho create và update.
- ALWAYS dùng `lockForUpdate()` khi check-in từ appointment.
- ALWAYS eager load relations trong VisitResource.
- ALWAYS format enum thành object `{value, label}`.

## EDGE CASES

- **Race condition check-in**: Hai staff cùng check-in một appointment. `lockForUpdate()` chỉ cho phép một request thành công.
- **Appointment already checked-in**: Nếu appointment đã có status khác BOOKED, request sẽ nhận lỗi 422.
- **Cancel completed visit**: Visit đã COMPLETED hoặc CANCELLED không thể cancel thêm.
- **Soft delete**: Visit dùng SoftDeletes, dữ liệu được giữ lại cho báo cáo.
- **Queue number overflow**: Sequence không giới hạn, sẽ tăng theo số lượng visit trong ngày.

## EXAMPLES

### Input: Tạo walk-in visit
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

### Input: Check-in từ appointment
```json
{
  "appointment_id": 42,
  "clinic_room_id": 1,
  "is_priority": true
}
```

### Output: Visit Detail
```json
{
  "id": 1,
  "code": "KB260701-0001",
  "queue_number": 1,
  "registration_type": { "value": 2, "label": "Đặt lịch trước" },
  "status": { "value": 1, "label": "Đang chờ" },
  "is_priority": false,
  "visited_at": "2026-07-01T08:00:00+07:00",
  "appointment_date": "2026-07-01T08:00:00+07:00",
  "reason": null,
  "customer": { "id": 10, "code": "BN000001", "full_name": "Nguyễn Văn A" },
  "clinic_room": { "id": 1, "name": "Phòng Da Liễu" },
  "services": [{ "id": 1, "name": "Khám Da Cơ Bản" }],
  "packages": [],
  "created_at": "2026-07-01T08:00:00+07:00",
  "updated_at": "2026-07-01T08:00:00+07:00"
}
```

## API ENDPOINTS

| Method | URI | Description | Auth |
|--------|-----|-------------|------|
| `GET` | `/api/visits` | Danh sách lượt khám | sanctum |
| `POST` | `/api/visits` | Tạo walk-in visit | sanctum |
| `POST` | `/api/visits/from-appointment` | Check-in từ appointment | sanctum |
| `POST` | `/api/visits/{id}/cancel` | Hủy lượt khám | sanctum |
| `DELETE` | `/api/visits/{id}` | Xóa mềm | sanctum |
