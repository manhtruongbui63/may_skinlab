---
task_id: "11"
title: "BE Tests: Appointment Cancel + MarkOverdueJob"
description: "PHPUnit tests cho AppointmentCancelAPI và MarkOverdueAppointmentsJob — coverage error cases, job idempotency, state transitions."
type: IMPLEMENTATION
phase: 4
status: pending
estimated_effort: S
complexity: medium
risk: low
depends_on: ["05", "09"]
rule_refs:
  - "PROPOSED_BR:appointment-cancel-precheck-only"
  - "PROPOSED_BR:overdue-auto-mark"
  - "BR-APPT-003"
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — Flow 6, Flow 7
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-api-task`
- **Applicable Skills**: `bks-be-testing-standard`

---

# Task 11: BE Tests — Appointment Cancel + MarkOverdue Job

## Description
Non-happy-path tests cho `PATCH /api/v1/appointments/{id}/cancel` và unit tests cho `MarkOverdueAppointmentsJob`.

---

## Requirements

### Test Class: `AppointmentCancelTest` (NEW/EXTEND)

**File**: `tests/Feature/Reception/AppointmentCancelTest.php`

**Coverage**:
1. Happy path: BOOKED → 200, status = CANCELLED.
2. Status = CHECKED_IN → 422 `appointment_not_cancellable`.
3. Status = COMPLETED → 422.
4. Status = CANCELLED (already) → 422.
5. Status = OVERDUE → 422.
6. Appointment không tồn tại → 404.
7. Unauthenticated → 401.
8. Activity log được ghi khi cancel thành công.

### Test Class: `MarkOverdueAppointmentsJobTest` (NEW)

**File**: `tests/Unit/Jobs/MarkOverdueAppointmentsJobTest.php`

**Coverage**:
1. Happy path: 3 BOOKED appointments với past date → tất cả OVERDUE.
2. No eligible records → return 0, không error.
3. Appointments với status khác (CONFIRMED, COMPLETED...) → không thay đổi.
4. Appointments với `appointment_date = today` → không thay đổi (chỉ `< today`).
5. Appointments với `appointment_date = yesterday` → thay đổi.
6. Idempotency: chạy job 2 lần → không có side effects (OVERDUE stay OVERDUE, không exception).

---

## Status
- [ ] Tạo `tests/Feature/Reception/AppointmentCancelTest.php`
- [ ] Tạo `tests/Unit/Jobs/MarkOverdueAppointmentsJobTest.php`
- [ ] Chạy `php artisan code:format`
- [ ] Chạy `php .agents/scripts/validate-backend.php backend`
- [ ] Chạy `php artisan test --filter=AppointmentCancelTest,MarkOverdueAppointmentsJobTest`

## Acceptance Criteria
1. Tất cả test cases pass.
2. Job idempotency verified (re-run safe).
3. Mọi status transitions theo đúng BR-APPT-003.

## Error Scenarios
- Appointment status ≠ BOOKED → 422.
- Job re-run → no error, OVERDUE records unchanged.

## Dependencies
- Task 05 (MarkOverdueAppointmentsJob).
- Task 09 (Appointment Cancel API).
