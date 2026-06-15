---
task_id: "02"
title: "Database: Visit Infrastructure (visits, visit_services, visit_packages, Enums)"
description: "Tạo migrations, models, enums, factory cho entity Visit — thực thể trung tâm của module tiếp nhận."
type: IMPLEMENTATION
phase: 1
status: pending
estimated_effort: L
complexity: medium
risk: medium
depends_on: []
rule_refs:
  - "PROPOSED_BR:visit-code-daily-seq"
  - "PROPOSED_BR:visit-queue-number-daily"
  - "BR-G002"
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — §7.1 (visits, visit_services, visit_packages), §7.3 (RegistrationTypeEnum, VisitStatusEnum)
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-database-task`
- **Applicable Skills**: `bks-be-database-standard`

> **Justification for L effort**: Task tạo 3 bảng liên quan chặt chẽ (`visits` + 2 pivots), 2 Enums mới với state machine, Model phức tạp (boot logic sinh code/queue_number, relations, soft delete, LogsActivity), và Factory — đây là 1 cohesive foundation layer không thể tách nhỏ hơn mà không phá vỡ migration order.

---

# Task 02: Database — Visit Infrastructure

## Description
Tạo toàn bộ database infrastructure cho entity `Visit`: bảng `visits`, 2 bảng pivot (`visit_services`, `visit_packages`), 2 Enums mới (`RegistrationTypeEnum`, `VisitStatusEnum`), Model `Visit` với boot logic, và `VisitFactory`.

## Out of Scope
- Không tạo API endpoints (Tasks 06-08).
- Không tạo bảng master data (Task 01).
- Không modify `AppointmentStatusEnum` (Task 03).

---

## Requirements

### 1. Enum: `RegistrationTypeEnum` (NEW)

**File**: `app/Enums/RegistrationTypeEnum.php`

- Integer-backed enum.
- Cases: `WALK_IN = 1`, `SCHEDULED = 2`.
- Mandatory `label()` method using `trans('enums.registration_type.{case}')`.
- Use `HasEnumStaticMethods` trait (mirror existing enums).

**i18n keys** (`lang/vi/enums.php` và `lang/en/enums.php`):
```
enums.registration_type.walk_in = "Chờ khám"  / "Walk-in"
enums.registration_type.scheduled = "Đặt lịch" / "Scheduled"
```

### 2. Enum: `VisitStatusEnum` (NEW)

**File**: `app/Enums/VisitStatusEnum.php`

- Integer-backed enum.
- Cases: `WAITING = 1`, `IN_PROGRESS = 2`, `COMPLETED = 3`, `CANCELLED = 4`.
- Mandatory `label()` method using `trans('enums.visit_status.{case}')`.

**State machine** (enforced in `VisitService`, NOT in this task):
| From | To | Trigger |
|------|----|---------| 
| WAITING | IN_PROGRESS | Bác sĩ bắt đầu (scope sau) |
| WAITING | CANCELLED | Lễ tân hủy |
| IN_PROGRESS | COMPLETED | Bác sĩ hoàn thành (scope sau) |
| IN_PROGRESS | CANCELLED | Hủy khẩn cấp |

**ALLOWED_TRANSITIONS constant** (trên Enum hoặc trong Service — để Service reference):
```
WAITING → [IN_PROGRESS, CANCELLED]
IN_PROGRESS → [COMPLETED, CANCELLED]
COMPLETED → []
CANCELLED → []
```

**i18n keys**:
```
enums.visit_status.waiting = "Chờ khám" / "Waiting"
enums.visit_status.in_progress = "Đang khám" / "In Progress"
enums.visit_status.completed = "Đã hoàn thành" / "Completed"
enums.visit_status.cancelled = "Đã hủy" / "Cancelled"
```

### 3. Migration: `create_visits_table` (NEW)

**File**: `database/migrations/{timestamp}_create_visits_table.php`

| Column | Type | Length | Null | Unique | Default | Notes |
|--------|------|--------|------|--------|---------|-------|
| `id` | bigIncrements | — | NO | YES | — | PK |
| `code` | string | 20 | NO | YES | — | Format `KByyMMdd-NNNN` |
| `queue_number` | smallInteger | — | NO | NO | — | STT khám trong ngày/phòng |
| `customer_id` | foreignId | — | YES | NO | NULL | FK → customers.id, nullable |
| `appointment_id` | foreignId | — | YES | NO | NULL | FK → appointments.id, nullable |
| `clinic_room_id` | foreignId | — | YES | NO | NULL | FK → clinic_rooms.id, nullable |
| `registration_type` | tinyInteger | — | NO | NO | 1 | Enum RegistrationTypeEnum |
| `status` | tinyInteger | — | NO | NO | 1 | Enum VisitStatusEnum |
| `is_priority` | boolean | — | NO | NO | false | — |
| `visited_at` | dateTime | — | NO | NO | — | Thời điểm đăng ký |
| `appointment_date` | date | — | YES | NO | NULL | Chỉ SCHEDULED |
| `reason` | string | 500 | YES | NO | NULL | Lý do khám |
| `softDeletes` | — | — | — | — | — | deleted_at |
| `timestamps` | — | — | — | — | — | created_at, updated_at |

**Indexes**: `code` (unique), `customer_id`, `appointment_id`, `clinic_room_id`, `visited_at` (for daily queries), `status`.

`down()`: Drop bảng `visits`.

### 4. Migration: `create_visit_services_table` (NEW)

**File**: `database/migrations/{timestamp}_create_visit_services_table.php`

| Column | Type | Null | Notes |
|--------|------|------|-------|
| `id` | bigIncrements | NO | PK |
| `visit_id` | foreignId | NO | FK → visits.id, cascade delete |
| `service_id` | foreignId | NO | FK → services.id |
| `timestamps` | — | — | — |

`down()`: Drop bảng `visit_services`.

### 5. Migration: `create_visit_packages_table` (NEW)

**File**: `database/migrations/{timestamp}_create_visit_packages_table.php`

| Column | Type | Null | Notes |
|--------|------|------|-------|
| `id` | bigIncrements | NO | PK |
| `visit_id` | foreignId | NO | FK → visits.id, cascade delete |
| `service_package_id` | foreignId | NO | FK → service_packages.id |
| `timestamps` | — | — | — |

`down()`: Drop bảng `visit_packages`.

### 6. Model: `Visit` (NEW)

**File**: `app/Models/Visit.php`

- Soft deletes (`SoftDeletes` trait).
- `LogsActivity` trait (BR-G002) — exclude `deleted_at` from logged attributes.
- Fillable: `code`, `queue_number`, `customer_id`, `appointment_id`, `clinic_room_id`, `registration_type`, `status`, `is_priority`, `visited_at`, `appointment_date`, `reason`.
- Casts: `registration_type` → `RegistrationTypeEnum`, `status` → `VisitStatusEnum`, `is_priority` → boolean, `visited_at` → datetime, `appointment_date` → date.
- Relations:
  - `customer()`: `belongsTo(Customer::class)` (nullable)
  - `appointment()`: `belongsTo(Appointment::class)` (nullable)
  - `clinicRoom()`: `belongsTo(ClinicRoom::class)` (nullable)
  - `services()`: `belongsToMany(Service::class, 'visit_services')`
  - `packages()`: `belongsToMany(ServicePackage::class, 'visit_packages')`

**Boot logic** (code & queue_number sinh trong Service, NOT trong Model boot — để tránh silent failure trong bulk operations). Model chỉ expose `generateCode(date)` và `generateQueueNumber(date, clinicRoomId)` như static helpers nếu cần, hoặc để hoàn toàn trong Service.

### 7. Factory: `VisitFactory` (NEW)

**File**: `database/factories/VisitFactory.php`

- Default state: `registration_type = WALK_IN`, `status = WAITING`, `visited_at = now()`, `code = fake()->unique()->regexify('KB\d{6}-\d{4}')`, `queue_number = fake()->numberBetween(1, 50)`.
- States: `scheduled()`, `cancelled()`, `completed()`, `withCustomer(customerId)`, `withAppointment(appointmentId)`.

---

## Status
- [ ] Tạo `RegistrationTypeEnum` + i18n keys
- [ ] Tạo `VisitStatusEnum` + i18n keys + ALLOWED_TRANSITIONS
- [ ] Tạo migration `create_visits_table`
- [ ] Tạo migration `create_visit_services_table`
- [ ] Tạo migration `create_visit_packages_table`
- [ ] Tạo Model `Visit` với relations, casts, traits
- [ ] Tạo `VisitFactory` với states
- [ ] Chạy `php artisan migrate:rollback` và migrate lại để verify `down()`
- [ ] Chạy `php artisan code:format`
- [ ] Chạy `php .agents/scripts/validate-backend.php backend`
- [ ] Chạy `php artisan test --filter=VisitTest`

## Acceptance Criteria
1. Ba bảng visits/visit_services/visit_packages tồn tại sau migrate.
2. `RegistrationTypeEnum::WALK_IN->label()` trả về chuỗi localized.
3. `VisitStatusEnum::WAITING->label()` trả về chuỗi localized.
4. `VisitFactory::new()->create()` tạo thành công 1 Visit record.
5. `$visit->services()->attach($serviceId)` hoạt động đúng.
6. Soft delete hoạt động: `$visit->delete()` set `deleted_at`, `Visit::withTrashed()` vẫn thấy.

## Error Scenarios
- FK constraint fail nếu migrate `visits` trước `clinic_rooms` → đảm bảo migration order đúng (Task 01 trước Task 02).

## Dependencies
- Task 01 (Master Data Tables) — `visits.clinic_room_id` FK cần `clinic_rooms` tồn tại trước.
