---
task_id: "09"
title: "Appointment API: Cancel — PATCH /api/v1/appointments/{id}/cancel"
description: "Thêm route chuyên biệt /cancel cho Appointment để hủy từ module tiếp nhận (Tab 3), distinct với generic update endpoint."
type: IMPLEMENTATION
phase: 2
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: ["03"]
rule_refs:
  - "PROPOSED_BR:appointment-cancel-precheck-only"
  - "BR-APPT-003"
  - "BR-APPT-005"
  - "BR-G002"
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — Flow 6, §11 (API chuyên biệt)
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-api-task`
- **Applicable Skills**: `bks-be-api-standard`

---

# Task 09: Appointment API — Cancel (Reception Module)

## Description
Thêm `PATCH /api/v1/appointments/{id}/cancel` — route chuyên biệt để hủy appointment từ module tiếp nhận. Khác với generic update: chỉ cho phép hủy BOOKED appointment và ghi activity log. Không nên dùng generic `PATCH /appointments/{id}` vì cần business validation riêng.

## Current State (Already Exists)
- **Controller**: `app/Http/Controllers/Api/AppointmentController.php` — đã có (audit để biết methods hiện tại).
- **Service**: `app/Services/Api/AppointmentService.php` — đã có method `cancel()` (audit để xem hiện tại đã có chưa, nếu có thì chỉ cần thêm route).
- **Resource**: `app/Http/Resources/Appointment/AppointmentResource.php` — đã có.

## Out of Scope
- CRUD quản lý Appointment (đã có ở module khác).
- `GET /appointments` list với extended filter (sẽ audit xem có cần thêm filter không).
- Tiếp nhận từ appointment (Task 07).

---

## Requirements

### 1. DTO: `CancelAppointmentData` (NEW nếu chưa có)

**File**: `app/DTOs/Api/Appointment/CancelAppointmentData.php`

```php
final readonly class CancelAppointmentData {
    public int $appointment_id;
}
```

> Audit `app/DTOs/Api/Appointment/` trước — nếu đã có DTO tương tự thì tái sử dụng.

### 2. Service: `AppointmentService::cancel()` (ADD nếu chưa có / VERIFY)

**File**: `app/Services/Api/AppointmentService.php`

**Method signature**:
```php
public function cancel(int $appointmentId): Appointment
```

**Logic**:
1. Load Appointment.
2. Kiểm tra `status === BOOKED` — nếu không → throw `UnprocessableEntityException` với key `reception.errors.appointment_not_cancellable`.
3. Validate transition theo `BR-APPT-003` (ALLOWED_TRANSITIONS: BOOKED → CANCELLED).
4. Update `status = CANCELLED`.
5. Activity log.
6. Return updated `Appointment`.

### 3. Controller: `AppointmentController::cancel()` (ADD nếu chưa có)

**File**: `app/Http/Controllers/Api/AppointmentController.php`

- Auth: requires authenticated user.
- Method: `cancel(int $id): JsonResponse` → `AppointmentResource` HTTP 200.

### 4. API Endpoints Summary

| Method | URI | Description | Auth |
|--------|-----|-------------|------|
| `PATCH` | `/api/v1/appointments/{id}/cancel` | Hủy lịch hẹn từ tiếp nhận | Authenticated (sanctum) |

### 5. Localization Keys

```
reception.errors.appointment_not_cancellable
```

---

## Status
- [ ] Audit `AppointmentService`, `AppointmentController`, `app/DTOs/Api/Appointment/` để tránh duplicate
- [ ] Tạo/verify DTO `CancelAppointmentData`
- [ ] Thêm/verify method `cancel()` trong `AppointmentService`
- [ ] Thêm method `cancel()` trong `AppointmentController`
- [ ] Đăng ký route `PATCH /api/v1/appointments/{id}/cancel`
- [ ] Thêm i18n key `reception.errors.appointment_not_cancellable`
- [ ] Chạy `php artisan code:format`
- [ ] Chạy `php .agents/scripts/validate-backend.php backend`
- [ ] Chạy `php artisan test --filter=AppointmentCancelTest`

## Acceptance Criteria
1. `PATCH /api/v1/appointments/{id}/cancel` với BOOKED appointment → HTTP 200, status = CANCELLED.
2. Appointment status ≠ BOOKED → 422 `appointment_not_cancellable`.
3. Appointment không tồn tại → 404.
4. Unauthenticated → 401.
5. Activity log được ghi.

## Error Scenarios
- `status ≠ BOOKED` → 422 `reception.errors.appointment_not_cancellable`.
- Appointment không tồn tại → 404.
- Unauthenticated → 401.

## Dependencies
- Task 03 (Extend AppointmentStatusEnum) — cần `OVERDUE` case trong enum cho ALLOWED_TRANSITIONS update.
