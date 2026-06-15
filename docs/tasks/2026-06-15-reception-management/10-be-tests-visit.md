---
task_id: "10"
title: "BE Tests: Visit CRUD — Non-Happy Path Coverage"
description: "PHPUnit Feature Tests cho tất cả non-happy paths của Visit API (Flow 1-5): validation, concurrency/lockForUpdate, auth/policy, state machine, edge cases."
type: IMPLEMENTATION
phase: 4
status: pending
estimated_effort: M
complexity: high
risk: medium
depends_on: ["06", "07", "08"]
rule_refs:
  - "PROPOSED_BR:visit-code-daily-seq"
  - "PROPOSED_BR:visit-queue-number-daily"
  - "PROPOSED_BR:walkin-requires-room-service"
  - "PROPOSED_BR:scheduled-future-date-only"
  - "PROPOSED_BR:visit-cancel-condition"
  - "PROPOSED_BR:visit-delete-permission"
  - "PROPOSED_BR:appointment-checkin-on-visit"
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — Error Cases tables: Flow 1, 2, 3, 4, 5
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-api-task`
- **Applicable Skills**: `bks-be-testing-standard`

> **Note**: Task này Phase 4 nhưng chạy song song với frontend track — phụ thuộc chỉ vào Task 06, 07, 08.

---

# Task 10: BE Tests — Visit CRUD Non-Happy Path

## Description
Viết comprehensive PHPUnit Feature Tests cho Visit API. Các inline happy-path tests từ `/execute-api-task` chỉ là smoke tests — task này bổ sung **tất cả non-happy paths**, security checks, concurrency scenarios, và state machine validations.

---

## Requirements

### Test Class: `CreateVisitTest` (NEW/EXTEND)

**File**: `tests/Feature/Reception/CreateVisitTest.php`

**Coverage**:
1. **Validation — WALK_IN**:
   - Thiếu `clinic_room_id` → 422 `reception.errors.room_required`
   - Thiếu `service_ids` → 422 `reception.errors.service_required`
   - `clinic_room_id` không tồn tại → 422
   - `clinic_room_id` inactive → 422 `reception.errors.room_invalid`
   - `service_ids` có ID không tồn tại → 422
2. **Validation — SCHEDULED**:
   - `appointment_date = today` → 422 `reception.errors.date_must_be_future`
   - `appointment_date = yesterday` → 422 `reception.errors.date_must_be_future`
   - `appointment_date` sai format → 422
   - Thiếu `appointment_date` khi SCHEDULED → 422
3. **Code & Queue Number**:
   - `code` đúng format `KB{yy}{MM}{dd}-{NNNN}`.
   - `queue_number` tăng dần trong cùng ngày + phòng.
   - `queue_number` reset theo phòng khác nhau.
4. **Auth**:
   - Unauthenticated → 401.
5. **Happy paths** (smoke): WALK_IN, SCHEDULED.

### Test Class: `CreateVisitFromAppointmentTest` (NEW/EXTEND)

**File**: `tests/Feature/Reception/CreateVisitFromAppointmentTest.php`

**Coverage**:
1. Appointment không tồn tại → 404.
2. Appointment status = CHECKED_IN → 422 `appointment_not_bookable`.
3. Appointment status = CANCELLED → 422.
4. Appointment status = OVERDUE → 422.
5. **Concurrency**: Simulate 2 requests cùng appointment_id (dùng database transaction test hoặc mock).
6. **Atomicity**: Visit create fail → Appointment vẫn BOOKED.
7. Unauthenticated → 401.

### Test Class: `VisitListCancelDeleteTest` (NEW/EXTEND)

**File**: `tests/Feature/Reception/VisitListCancelDeleteTest.php`

**Coverage**:
1. **List**:
   - Filter `from`/`to` khác tháng → 422.
   - Filter `to` = tomorrow → 422.
   - No filter → visits hôm nay only.
   - Filter đúng → đúng records.
2. **Cancel**:
   - Cancel COMPLETED → 422 `visit_already_completed`.
   - Cancel CANCELLED → 422 `visit_already_cancelled`.
   - Visit không tồn tại → 404.
   - Unauthenticated → 401.
3. **Delete**:
   - Admin role → 204, soft-deleted.
   - Manager role → 204.
   - Receptionist role → 403.
   - Visit không tồn tại → 404.
   - Verify soft delete: Visit::withTrashed() vẫn có, Visit::all() không có.

### Test Helpers
- Dùng `VisitFactory` states.
- Dùng `RefreshDatabase` trait.
- Seed master data (ClinicRoomSeeder, ServiceSeeder) trong setUp().

---

## Status
- [ ] Tạo `tests/Feature/Reception/CreateVisitTest.php`
- [ ] Tạo `tests/Feature/Reception/CreateVisitFromAppointmentTest.php`
- [ ] Tạo `tests/Feature/Reception/VisitListCancelDeleteTest.php`
- [ ] Chạy `php artisan code:format`
- [ ] Chạy `php .agents/scripts/validate-backend.php backend`
- [ ] Chạy `php artisan test --filter=Reception`

## Acceptance Criteria
1. Tất cả test cases trong 3 test classes đều pass.
2. Coverage: tất cả Error Cases từ requirement Flow 1-5 có test.
3. Concurrency test (lockForUpdate) verify không có duplicate queue_number.
4. Policy test verify admin/manager có thể delete, other roles không.

## Dependencies
- Task 06 (Visit Create API) — source code cần test.
- Task 07 (Visit from-Appointment API) — source code cần test.
- Task 08 (Visit List/Cancel/Delete) — source code cần test.
