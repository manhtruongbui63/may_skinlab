---
task_id: "01"
title: "Database Infrastructure"
description: "Tạo cấu trúc database cho module đặt lịch bao gồm migrations, model, enum và seeder."
type: IMPLEMENTATION
phase: 1
status: completed
estimated_effort: S
complexity: low
risk: low
depends_on: []
rule_refs: []
date: "2026-06-12"
changelog:
  - version: 1.0
    date: "2026-06-12"
    summary: Khởi tạo đặc tả task database.
---

# Context
- **Requirement**: [03-appointment-management.md](../../requirements/03-appointment-management.md)
- **Parent Task**: [2026-06-12-appointment-management-implementation-tasks.md](../2026-06-12-appointment-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-database-task`
- **Applicable Skills**: `bks-be-database-standard`

---

# Task 01: Database Infrastructure

## Description
Thiết lập database schema, model, enum trạng thái và seeders cần thiết cho Module Lịch hẹn. Cần cập nhật mối quan hệ 1-1/N-1 từ bảng `visits` hiện có sang bảng `appointments`.

## Requirements

### 1. Migration tạo bảng `appointments` (NEW)
- File: `database/migrations/YYYY_MM_DD_HHMMSS_create_appointments_table.php`
- Yêu cầu cấu trúc:
  - `id`: bigint unsigned, primary key, auto increment.
  - `customer_id`: bigint unsigned, foreign key liên kết với `customers(id)`, trigger `onDelete('cascade')` hoặc giữ nguyên tùy theo cấu hình soft-delete.
  - `appointment_at`: datetime, bắt buộc.
  - `appointment_date`: date, bắt buộc, phục vụ tìm kiếm/lọc nhanh.
  - `status`: tinyInteger, bắt buộc, mặc định là `1` (BOOKED).
  - `note`: text, cho phép NULL.
  - `created_at`, `updated_at`: timestamps.
  - `deleted_at`: timestamp, cho phép NULL (Soft Delete).
  - Indexes:
    - Index trên (`appointment_date`, `status`) để lọc lịch hẹn nhanh chóng.
    - Index trên `customer_id`.

### 2. Migration cập nhật bảng `visits` (MODIFY)
- File: `database/migrations/YYYY_MM_DD_HHMMSS_add_appointment_id_to_visits_table.php`
- Yêu cầu cấu trúc:
  - Thêm cột `appointment_id`: bigint unsigned, nullable, foreign key liên kết với `appointments(id)`, `onDelete('set null')`.

### 3. Enum `AppointmentStatusEnum` (NEW)
- File: `app/Enums/AppointmentStatusEnum.php`
- Yêu cầu cấu trúc:
  - Sử dụng integer backing:
    - `1` $\rightarrow$ `BOOKED`
    - `2` $\rightarrow$ `CONFIRMED`
    - `3` $\rightarrow$ `CHECKED_IN`
    - `4` $\rightarrow$ `COMPLETED`
    - `5` $\rightarrow$ `CANCELLED`
    - `6` $\rightarrow$ `NO_SHOW`
  - Triển khai hàm `label(): string` sử dụng localization helper (`trans('enums.appointment_status...')`).

### 4. Model `Appointment` (NEW)
- File: `app/Models/Appointment.php`
- Yêu cầu cấu trúc:
  - Sử dụng trait `SoftDeletes` và `LogsActivity` (BR-G002).
  - Định nghĩa cast cho trường `status` sang `AppointmentStatusEnum` và `appointment_at` sang `datetime`.
  - Định nghĩa quan hệ:
    - `customer()`: BelongsTo `Customer`.
    - `visit()`: HasOne `Visit` (hoặc quan hệ phù hợp với Visit).
  - Định nghĩa scope lọc nhanh lịch hẹn trong ngày.

### 5. Cập nhật Model `Customer` & `Visit` (MODIFY)
- Cập nhật `app/Models/Customer.php` để thêm quan hệ `appointments()` (HasMany).
- Cập nhật `app/Models/Visit.php` để thêm quan hệ `appointment()` (BelongsTo).

### 6. Seeder `AppointmentSeeder` (NEW)
- File: `database/seeders/AppointmentSeeder.php`
- Tạo dữ liệu lịch hẹn mẫu liên kết với các Customer hiện có cho tuần hiện tại (các trạng thái BOOKED, CONFIRMED, COMPLETED).

---

## Status
- [x] Tạo file migration bảng `appointments`
- [x] Tạo file migration cập nhật bảng `visits`
- [x] Tạo file Enum `AppointmentStatusEnum`
- [x] Tạo Model `Appointment` và cập nhật quan hệ ở `Customer` / `Visit`
- [x] Tạo Seeder cho `Appointment` và đăng ký trong `DatabaseSeeder`
- [x] Run `php artisan migrate:rollback` và migrate lại để xác nhận hàm `down()` hoạt động tốt.
- [x] Run `php artisan code:format`
- [x] Run `php .agents/scripts/validate-backend.php backend`
- [x] Run `php artisan test`

---

## Acceptance Criteria
1. Chạy migration thành công, kiểm tra cấu trúc bảng `appointments` và `visits` trong DB khớp hoàn toàn với thiết kế.
2. Rollback migrations thành công mà không gây lỗi khóa ngoại hay mất mát dữ liệu khác.
3. Seeder chạy thành công và tạo được dữ liệu lịch hẹn chuẩn.
4. Model `Appointment` sử dụng đúng `AppointmentStatusEnum` cho cột `status`.
