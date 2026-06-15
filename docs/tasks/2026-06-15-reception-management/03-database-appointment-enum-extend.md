---
task_id: "03"
title: "Database: Extend AppointmentStatusEnum — thêm OVERDUE(7)"
description: "Thêm case OVERDUE=7 vào AppointmentStatusEnum hiện có và cập nhật i18n key, transition matrix."
type: IMPLEMENTATION
phase: 1
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: []
rule_refs:
  - "PROPOSED_BR:overdue-auto-mark"
  - "BR-APPT-003"
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — §7.2, §7.3 (AppointmentStatusEnum OVERDUE)
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-database-task`
- **Applicable Skills**: `bks-be-database-standard`

---

# Task 03: Database — Extend AppointmentStatusEnum

## Description
Thêm case `OVERDUE = 7` vào `AppointmentStatusEnum` hiện có. Đây là prerequisite cho Task 05 (Job sử dụng OVERDUE) và Task 09 (Appointment Cancel API).

## Current State (Already Exists)
- **Enum**: `app/Enums/AppointmentStatusEnum.php`
  - Cases: BOOKED(1), CONFIRMED(2), CHECKED_IN(3), COMPLETED(4), CANCELLED(5), NO_SHOW(6)
  - i18n: `lang/vi/enums.php` và `lang/en/enums.php` key `enums.appointment_status.*`
- **Model**: `Appointment` — column `status` backed by `tinyInteger`

## Out of Scope
- Không thay đổi `ALLOWED_TRANSITIONS` trong `AppointmentService` (đó là logic trong Task 09 và Job Task 05).
- Không tạo migration thay đổi column type (tinyInteger đã đủ: max 127).

---

## Requirements

### 1. Enum: `AppointmentStatusEnum` (MODIFY)

**File**: `app/Enums/AppointmentStatusEnum.php`

Thêm case mới:
```
case OVERDUE = 7;
```

Thêm vào `label()` match:
```
self::OVERDUE => trans('enums.appointment_status.overdue'),
```

### 2. Localization Keys (MODIFY)

**Files**: `lang/vi/enums.php`, `lang/en/enums.php`

Thêm key trong section `appointment_status`:
```
'overdue' => 'Quá hẹn',   // vi
'overdue' => 'Overdue',    // en
```

### 3. Transition Matrix Update (DOCUMENTATION trong file này)

Các transitions mới thêm vào `ALLOWED_TRANSITIONS` trong `AppointmentService` (thực hiện ở Tasks 05 và 09):

| From | To | Trigger |
|------|----|---------|
| `BOOKED` | `OVERDUE` | `MarkOverdueAppointmentsJob` (Task 05) |
| `BOOKED` | `CHECKED_IN` | `VisitService::createFromAppointment()` (Task 07) |
| `BOOKED` | `CANCELLED` | `AppointmentService::cancel()` (Task 09) |

> **Note**: Không cần migration cho task này — `tinyInteger` column đã đủ chứa value 7.

---

## Status
- [ ] Thêm `case OVERDUE = 7` vào `AppointmentStatusEnum`
- [ ] Thêm `self::OVERDUE => trans(...)` vào `label()` match
- [ ] Thêm i18n key `enums.appointment_status.overdue` vào `lang/vi/enums.php`
- [ ] Thêm i18n key `enums.appointment_status.overdue` vào `lang/en/enums.php`
- [ ] Chạy `php artisan code:format`
- [ ] Chạy `php .agents/scripts/validate-backend.php backend`
- [ ] Chạy `php artisan test --filter=AppointmentStatusEnumTest`

## Acceptance Criteria
1. `AppointmentStatusEnum::OVERDUE->value === 7`.
2. `AppointmentStatusEnum::OVERDUE->label()` trả về chuỗi localized (không throw exception).
3. `AppointmentStatusEnum::from(7)` trả về `OVERDUE`.
4. Không có breaking change cho các case hiện có (1-6).

## Error Scenarios
- Không có risk cao — chỉ thêm case, không xóa.

## Dependencies
- Không có dependency (có thể chạy song song T01, T02).
