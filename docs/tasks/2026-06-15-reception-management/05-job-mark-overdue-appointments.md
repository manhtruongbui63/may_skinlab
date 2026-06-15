---
task_id: "05"
title: "Job: MarkOverdueAppointmentsJob"
description: "Tạo scheduled job chạy hàng ngày lúc 00:01 để bulk-update các Appointment quá ngày (BOOKED → OVERDUE)."
type: IMPLEMENTATION
phase: 2
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: ["03"]
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
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — §6.8 (Tự động đánh dấu quá hẹn), Flow 7
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-job-task`
- **Applicable Skills**: `bks-be-job-standard`

---

# Task 05: Job — MarkOverdueAppointmentsJob

## Description
Implement `MarkOverdueAppointmentsJob` và Background Service `MarkOverdueAppointmentsService` để bulk-update tất cả `Appointment` có `appointment_date < TODAY` và `status = BOOKED` sang `status = OVERDUE`. Job được schedule chạy hàng ngày lúc 00:01.

## Out of Scope
- Không gửi notification (out of scope §4).
- Không xử lý appointment cancel (Task 09).

---

## Requirements

### 1. Background Service: `MarkOverdueAppointmentsService` (NEW)

**File**: `app/Services/Background/MarkOverdueAppointmentsService.php`

**Method signature**:
```php
public function markOverdue(): int  // returns count of updated records
```

**Logic**:
1. Query: `appointments WHERE appointment_date < CURDATE() AND status = BOOKED AND deleted_at IS NULL`.
2. Bulk update: `status = AppointmentStatusEnum::OVERDUE`.
3. Log: số lượng records đã cập nhật (via `Log::info()`).
4. Return: count của records đã cập nhật.

> Dùng `Appointment::query()->whereDate('appointment_date', '<', now()->toDateString())->where('status', AppointmentStatusEnum::BOOKED)->whereNull('deleted_at')`.
> Bulk update phải dùng `->update(['status' => AppointmentStatusEnum::OVERDUE->value])` (không dùng Eloquent events để tránh N+1).

**Register** trong `BackgroundFactory` như getter method.

### 2. Job: `MarkOverdueAppointmentsJob` (NEW)

**File**: `app/Jobs/MarkOverdueAppointmentsJob.php`

- `implements ShouldQueue`.
- `$tries = 3`, `$backoff = [60, 300, 600]` (retry sau 1min, 5min, 10min).
- Inject và call `MarkOverdueAppointmentsService::markOverdue()`.
- Handle exception: log error với context, không re-throw (job sẽ retry tự động).
- Không cần `uniqueId()` — job không cần idempotency key (safe để re-run vì bulk update là idempotent).

### 3. Schedule Registration (MODIFY)

**File**: `routes/console.php`

Đăng ký schedule:
- `Schedule::job(MarkOverdueAppointmentsJob::class)->dailyAt('00:01')->withoutOverlapping()->runInBackground()`.

### 4. Localization Keys

Không có i18n (job không render UI).

---

## Testing Hints
- **Factory needs**: `AppointmentFactory` (đã có), states: `booked()`, với `appointment_date` quá khứ.
- **Key test scenarios**:
  - Happy path: Job chạy → N records BOOKED với past date → all updated to OVERDUE.
  - No records: Job chạy → 0 records thỏa điều kiện → return 0, không error.
  - Appointments với status khác (CONFIRMED, COMPLETED...) → không bị update.
  - Appointments với appointment_date = today → không bị update (chỉ `< TODAY`).

---

## Status
- [ ] Tạo `MarkOverdueAppointmentsService` trong `app/Services/Background/`
- [ ] Register service trong `BackgroundFactory`
- [ ] Tạo `MarkOverdueAppointmentsJob` trong `app/Jobs/`
- [ ] Đăng ký schedule trong `routes/console.php` (`dailyAt('00:01')->withoutOverlapping()`)
- [ ] Chạy `php artisan code:format`
- [ ] Chạy `php .agents/scripts/validate-backend.php backend`
- [ ] Chạy `php artisan test --filter=MarkOverdueAppointmentsJobTest`

## Acceptance Criteria
1. Job có thể dispatch thành công: `MarkOverdueAppointmentsJob::dispatch()`.
2. Sau khi job run: tất cả appointments có `appointment_date < today AND status = BOOKED` → `status = OVERDUE`.
3. Appointments với status khác hoặc `appointment_date >= today` → không thay đổi.
4. Schedule được đăng ký: `php artisan schedule:list` hiển thị job này ở 00:01.
5. `withoutOverlapping()` ngăn job chạy song song.

## Error Scenarios
- DB timeout trong bulk update → Log error, job retry sau interval.
- Job overlap → `withoutOverlapping()` ngăn chặn.

## Dependencies
- Task 03 (Extend AppointmentStatusEnum) — cần `AppointmentStatusEnum::OVERDUE` tồn tại.
