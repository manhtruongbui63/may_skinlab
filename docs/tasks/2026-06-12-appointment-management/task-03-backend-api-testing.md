---
task_id: "03"
title: "Backend API Testing"
description: "Viết Feature Tests (PHPUnit) kiểm tra toàn bộ các luồng nghiệp vụ của lịch hẹn, bao gồm cả case happy và unhappy path."
type: IMPLEMENTATION
phase: 4
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: ["02"]
rule_refs: ["PROPOSED_BR:appointment-no-double-booking", "PROPOSED_BR:appointment-status-transition", "PROPOSED_BR:appointment-customer-active-only", "PROPOSED_BR:appointment-visit-creation"]
date: "2026-06-12"
changelog:
  - version: 1.0
    date: "2026-06-12"
    summary: Khởi tạo đặc tả task backend testing.
---

# Context
- **Requirement**: [03-appointment-management.md](../../requirements/03-appointment-management.md)
- **Parent Task**: [2026-06-12-appointment-management-implementation-tasks.md](../2026-06-12-appointment-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-api-task`
- **Applicable Skills**: `bks-be-testing-standard`

---

# Task 03: Backend API Testing

## Description
Viết bộ testcase Feature Test (PHPUnit) đầy đủ để xác minh các quy tắc nghiệp vụ của lịch hẹn. Kiểm thử nâng cao bao gồm kiểm tra validation trùng lịch dưới điều kiện race condition (mô phỏng đặt cùng lúc) và kiểm tra ma trận chuyển trạng thái.

## Requirements

### 1. Feature Test `AppointmentApiTest` (NEW)
- File: `tests/Feature/AppointmentApiTest.php`
- Các testcases cần viết:
  - **Happy Paths**:
    - Tạo lịch hẹn thành công cho khách hàng ACTIVE.
    - Cập nhật thời gian hẹn thành công sang slot trống.
    - Đổi trạng thái lịch hẹn theo các bước hợp lệ (`BOOKED` $\rightarrow$ `CONFIRMED` $\rightarrow$ `CHECKED_IN` $\rightarrow$ `COMPLETED`).
    - Soft delete lịch hẹn và kiểm tra dữ liệu không hiển thị trong danh sách thông thường nhưng vẫn tồn tại ở DB.
  - **Unhappy Paths**:
    - Tạo lịch hẹn cho khách hàng `INACTIVE` $\rightarrow$ Trả về lỗi validation 422.
    - Đặt trùng lịch (2 lịch hẹn active cùng một slot thời gian) $\rightarrow$ Trả về lỗi validation 422.
    - Chuyển đổi trạng thái sai quy tắc (ví dụ: `CANCELLED` $\rightarrow$ `COMPLETED`) $\rightarrow$ Trả về lỗi validation 422.
    - Truy cập lịch hẹn không tồn tại $\rightarrow$ Trả về 404.
    - Xóa/Sửa lịch hẹn không thuộc quyền sở hữu (nếu có phân quyền sau này).

### 2. Integration Test cho luồng tạo Visit từ Lịch hẹn (MODIFY / NEW)
- Đảm bảo viết testcase: Khi gửi request tạo Visit kèm `appointment_id` $\rightarrow$ Visit được tạo thành công và trạng thái của Appointment tương ứng tự động đổi sang `COMPLETED`.

---

## Testing Hints
- Sử dụng các model factory để sinh dữ liệu mẫu (`Customer::factory()`, `Appointment::factory()`).
- Sử dụng mock hoặc chuẩn bị dữ liệu cẩn thận cho các mốc thời gian slot 30 phút để test trùng lịch.
- Assert database bằng `assertSoftDeleted('appointments', ...)` để xác nhận tính năng soft delete.

---

## Status
- [ ] Tạo file test `tests/Feature/AppointmentApiTest.php`
- [ ] Viết các testcase cho luồng Tạo mới (happy & unhappy path)
- [ ] Viết các testcase cho luồng Cập nhật & Chuyển trạng thái
- [ ] Viết các testcase cho luồng Soft Delete
- [ ] Viết các testcase cho liên kết Visit & Appointment
- [ ] Run `php artisan code:format`
- [ ] Run `php .agents/scripts/validate-backend.php backend`
- [ ] Run `php artisan test --filter=AppointmentApiTest`

---

## Acceptance Criteria
1. Chạy toàn bộ các testcase trong `AppointmentApiTest` đều pass 100%.
2. Code coverage cho các hàm kiểm tra trùng lịch và chuyển trạng thái tại `AppointmentService` đạt tối thiểu 90%.
