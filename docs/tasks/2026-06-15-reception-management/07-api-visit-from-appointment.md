---
task_id: "07"
title: "Visit API: From Appointment — POST /api/v1/visits/from-appointment"
description: "Implement endpoint tiếp nhận khách hàng từ lịch hẹn: tạo Visit mới liên kết appointment_id và cập nhật Appointment.status → CHECKED_IN trong 1 DB transaction với lockForUpdate."
type: IMPLEMENTATION
phase: 2
status: pending
estimated_effort: M
complexity: high
risk: high
depends_on: ["02"]
rule_refs:
  - "PROPOSED_BR:appointment-checkin-on-visit"
  - "PROPOSED_BR:visit-code-daily-seq"
  - "PROPOSED_BR:visit-queue-number-daily"
  - "BR-G002"
  - "BR-APPT-003"
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — Flow 5, §6.6
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-api-task`
- **Applicable Skills**: `bks-be-api-standard`

---

# Task 07: Visit API — From Appointment

## Description
Implement `POST /api/v1/visits/from-appointment` — endpoint tiếp nhận KH từ lịch hẹn. Điểm phức tạp nhất: `lockForUpdate()` trên `Appointment` để ngăn 2 lễ tân cùng tiếp nhận 1 appointment, atomic update `Appointment.status → CHECKED_IN` trong cùng transaction với tạo Visit.

## Out of Scope
- Tạo Visit walk-in/scheduled từ Cột 1 (Task 06).
- List, Cancel, Delete Visit (Task 08).

---

## Requirements

### 1. DTO: `CreateVisitFromAppointmentData` (NEW)

**File**: `app/DTOs/Api/Visit/CreateVisitFromAppointmentData.php`

```php
final readonly class CreateVisitFromAppointmentData {
    public int $appointment_id;
    public ?int $clinic_room_id;
    public bool $is_priority;
}
```

### 2. FormRequest: `StoreVisitFromAppointmentRequest` (NEW)

**File**: `app/Http/Requests/Reception/StoreVisitFromAppointmentRequest.php`

**Validation table**:

| Field | Presence | Type | Boundaries | Notes |
|-------|----------|------|------------|-------|
| `appointment_id` | required | integer | exists:appointments,id | — |
| `clinic_room_id` | optional | integer | exists:clinic_rooms,id | nullable |
| `is_priority` | optional | boolean | — | default false |

### 3. Service: `VisitService::createFromAppointment()` (MODIFY — add method)

**File**: `app/Services/Api/VisitService.php`

**Method signature**:
```php
public function createFromAppointment(CreateVisitFromAppointmentData $dto): Visit
```

**Logic** (trong DB transaction):
1. Load `Appointment` với `lockForUpdate()`.
2. Kiểm tra `Appointment.status === BOOKED` — nếu không → throw `UnprocessableEntityException` với key `reception.errors.appointment_not_bookable`.
3. Sinh `code` và `queue_number` tương tự `VisitService::create()`.
4. Tạo `Visit` với:
   - `appointment_id = $dto->appointment_id`
   - `customer_id` = appointment's customer_id
   - `clinic_room_id = $dto->clinic_room_id` (optional)
   - `registration_type = SCHEDULED`
   - `status = WAITING`
   - `visited_at = now()`
5. Cập nhật `Appointment.status = CHECKED_IN` (PROPOSED_BR:appointment-checkin-on-visit).
6. Activity Log trên cả Visit (created) và Appointment (status_changed).
7. Return `Visit` với relations.

**Concurrency**: `lockForUpdate()` đảm bảo sequential — request thứ 2 đọc status đã là `CHECKED_IN` → fail tại bước 2.

### 4. Controller: `VisitController::storeFromAppointment()` (MODIFY — add method)

**File**: `app/Http/Controllers/Api/VisitController.php`

- Auth: requires authenticated user.
- Method: `storeFromAppointment(StoreVisitFromAppointmentRequest $request): JsonResponse` → HTTP 201 với `VisitResource`.

### 5. API Endpoints Summary

| Method | URI | Description | Auth |
|--------|-----|-------------|------|
| `POST` | `/api/v1/visits/from-appointment` | Tiếp nhận KH từ lịch hẹn | Authenticated (sanctum) |

### 6. Localization Keys

```
reception.errors.appointment_not_bookable
```

---

## Testing Hints
- **Factory needs**: `VisitFactory`, `AppointmentFactory` (với state `booked()`), `CustomerFactory`.
- **Key test scenarios**:
  - Happy path: Appointment BOOKED → Visit created, Appointment CHECKED_IN.
  - Race condition: 2 concurrent requests cùng `appointment_id` → request thứ 2 nhận 422.
  - Appointment không tồn tại → 404.
  - Appointment status ≠ BOOKED (CHECKED_IN, CANCELLED...) → 422.
  - Transaction rollback: nếu Visit create fail → Appointment vẫn BOOKED.
  - Unauthenticated → 401.

---

## Status
- [ ] Tạo DTO `CreateVisitFromAppointmentData`
- [ ] Tạo `StoreVisitFromAppointmentRequest`
- [ ] Thêm method `createFromAppointment()` vào `VisitService`
- [ ] Thêm method `storeFromAppointment()` vào `VisitController`
- [ ] Đăng ký route `POST /api/v1/visits/from-appointment`
- [ ] Thêm i18n key `reception.errors.appointment_not_bookable`
- [ ] Chạy `php artisan code:format`
- [ ] Chạy `php .agents/scripts/validate-backend.php backend`
- [ ] Chạy `php artisan test --filter=CreateVisitFromAppointmentTest`

## Acceptance Criteria
1. `POST /api/v1/visits/from-appointment` với BOOKED appointment → HTTP 201, Visit created, Appointment → CHECKED_IN.
2. Race condition: 2 concurrent calls → 1 thành công, 1 nhận 422.
3. `appointment_id` không tồn tại → 404.
4. Appointment không phải BOOKED → 422 với message `appointment_not_bookable`.
5. Unauthenticated → 401.

## Error Scenarios
- `Appointment.status ≠ BOOKED` → 422 `reception.errors.appointment_not_bookable`.
- Race condition → lockForUpdate → request thứ 2 nhận 422.
- Appointment không tồn tại → 404.
- DB transaction fail → rollback (Visit không tạo, Appointment giữ nguyên BOOKED).

## Dependencies
- Task 02 (Visit Infrastructure) — Visit model, enums.
- Task 06 (Visit Create API) — `VisitService`, `VisitController`, `VisitResource` đã tồn tại.
