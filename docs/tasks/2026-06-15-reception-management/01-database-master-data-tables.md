---
task_id: "01"
title: "Database: Master Data Tables (clinic_rooms, services, service_packages)"
description: "Tạo migrations, models, và seeders cho 3 bảng master data mới phục vụ dropdown trong form phiếu đăng ký khám."
type: IMPLEMENTATION
phase: 1
status: pending
estimated_effort: M
complexity: low
risk: low
depends_on: []
rule_refs: []
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — §7.1 (Tables: clinic_rooms, services, service_packages)
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-database-task`
- **Applicable Skills**: `bks-be-database-standard`

---

# Task 01: Database — Master Data Tables

## Description
Tạo infrastructure database cho 3 bảng lookup mới: `clinic_rooms` (phòng khám), `services` (dịch vụ khám), `service_packages` (gói khám). Đây là prerequisite cho Task 04 (Master Data Registration) và Task 06 (Visit Create API).

## Out of Scope
- Không tạo API CRUD cho các bảng này (scope riêng).
- Không đăng ký Master Data resources (Task 04).
- Không tạo bảng `visits` hay pivots (Task 02).

---

## Requirements

### 1. Migration: `create_clinic_rooms_table` (NEW)

**File**: `database/migrations/{timestamp}_create_clinic_rooms_table.php`

| Column | Type | Length | Null | Unique | Default | Notes |
|--------|------|--------|------|--------|---------|-------|
| `id` | bigIncrements | — | NO | YES | — | PK |
| `name` | string | 100 | NO | NO | — | Tên phòng khám |
| `code` | string | 20 | YES | YES | NULL | Mã phòng |
| `is_active` | boolean | — | NO | NO | true | Trạng thái |
| `timestamps` | — | — | — | — | — | created_at, updated_at |

`down()`: Drop bảng `clinic_rooms`.

### 2. Migration: `create_services_table` (NEW)

**File**: `database/migrations/{timestamp}_create_services_table.php`

| Column | Type | Length | Null | Unique | Default | Notes |
|--------|------|--------|------|--------|---------|-------|
| `id` | bigIncrements | — | NO | YES | — | PK |
| `name` | string | 255 | NO | NO | — | Tên dịch vụ |
| `code` | string | 30 | YES | YES | NULL | Mã dịch vụ |
| `price` | decimal | 12,2 | YES | NO | NULL | Giá |
| `is_active` | boolean | — | NO | NO | true | — |
| `timestamps` | — | — | — | — | — | — |

`down()`: Drop bảng `services`.

### 3. Migration: `create_service_packages_table` (NEW)

**File**: `database/migrations/{timestamp}_create_service_packages_table.php`

| Column | Type | Length | Null | Unique | Default | Notes |
|--------|------|--------|------|--------|---------|-------|
| `id` | bigIncrements | — | NO | YES | — | PK |
| `name` | string | 255 | NO | NO | — | Tên gói khám |
| `code` | string | 30 | YES | YES | NULL | Mã gói |
| `price` | decimal | 12,2 | YES | NO | NULL | Giá |
| `is_active` | boolean | — | NO | NO | true | — |
| `timestamps` | — | — | — | — | — | — |

`down()`: Drop bảng `service_packages`.

### 4. Models (NEW)

- `app/Models/ClinicRoom.php` — fillable: `name`, `code`, `is_active`. Cast `is_active` → boolean.
- `app/Models/Service.php` — fillable: `name`, `code`, `price`, `is_active`. Cast `price` → decimal:2.
- `app/Models/ServicePackage.php` — fillable: `name`, `code`, `price`, `is_active`. Cast `price` → decimal:2.

Không có soft delete cho các bảng master data này.

### 5. Seeders (NEW)

- `ClinicRoomSeeder` — 3–5 phòng mẫu (Phòng 1, Phòng 2, Phòng Da Liễu...).
- `ServiceSeeder` — 5–8 dịch vụ mẫu (Khám da, Tư vấn, Laser...).
- `ServicePackageSeeder` — 3–5 gói mẫu (Gói cơ bản, Gói nâng cao...).

Đăng ký trong `DatabaseSeeder`.

### 6. Localization Keys

Không cần i18n cho model labels (chỉ là data). Master Data sẽ trả về `name` trực tiếp.

---

## Status
- [ ] Tạo migration `create_clinic_rooms_table`
- [ ] Tạo migration `create_services_table`
- [ ] Tạo migration `create_service_packages_table`
- [ ] Tạo Model `ClinicRoom`
- [ ] Tạo Model `Service`
- [ ] Tạo Model `ServicePackage`
- [ ] Tạo Seeders + đăng ký vào `DatabaseSeeder`
- [ ] Chạy `php artisan migrate:rollback` và migrate lại để verify `down()`
- [ ] Chạy `php artisan code:format`
- [ ] Chạy `php .agents/scripts/validate-backend.php backend`
- [ ] Chạy `php artisan test --filter=ClinicRoomTest`

## Acceptance Criteria
1. Ba bảng tồn tại trong DB sau khi migrate.
2. `migrate:rollback` xóa sạch 3 bảng.
3. Seeder chạy thành công, mỗi bảng có ít nhất 3 records.
4. Models load được qua `ClinicRoom::first()`, `Service::first()`, `ServicePackage::first()`.

## Error Scenarios
- Migration conflict (timestamp trùng) → đặt timestamp cách nhau ít nhất 1 giây.

## Dependencies
- Không có dependency.
