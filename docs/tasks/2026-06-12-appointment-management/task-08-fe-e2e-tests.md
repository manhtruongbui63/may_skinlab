---
task_id: "08"
title: "3d — Frontend E2E Tests"
description: "Viết kịch bản test Playwright E2E cho luồng đặt lịch hẹn, kiểm tra trùng lịch và luồng Checked-in chuyển sang hồ sơ khám (Visit)."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: ["07", "03"]
rule_refs: ["PROPOSED_BR:appointment-no-double-booking", "PROPOSED_BR:appointment-visit-creation"]
date: "2026-06-12"
changelog:
  - version: 1.0
    date: "2026-06-12"
    summary: Khởi tạo đặc tả task E2E test.
---

# Context
- **Requirement**: [03-appointment-management.md](../../requirements/03-appointment-management.md)
- **Parent Task**: [2026-06-12-appointment-management-implementation-tasks.md](../2026-06-12-appointment-management-implementation-tasks.md)
- **Screen IDs**: S1, S2, S3
- **Applicable Skills**: `bks-fe-create-tc-flow`

---

# Task 08: 3d — Frontend E2E Tests

## Description
Xây dựng các testcase Playwright E2E hoàn chỉnh chạy trên trình duyệt ảo để kiểm tra toàn bộ trải nghiệm người dùng của module Lịch hẹn, từ việc tạo lịch cho đến khi khách đến khám và bắt đầu phiên khám bệnh.

## Requirements

### 1. Page Object `AppointmentPageObject` (NEW)
- File: `frontend/e2e/pages/appointment.page.ts`
- Định nghĩa các locators và methods tương tác:
  - `goToAppointments()`: Chuyển sang route `/appointments`.
  - `openCreateModal()`: Click nút đặt lịch.
  - `fillAppointmentForm(customerName, date, time)`: Nhập liệu.
  - `submitForm()`: Click lưu lịch.
  - `clickCalendarEvent(eventName)`: Click vào lịch hẹn trên Calendar.
  - `changeStatus(statusLabel)`: Click nút đổi trạng thái trong modal chi tiết.

### 2. Spec File `appointment.spec.ts` (NEW)
- File: `frontend/e2e/specs/appointment.spec.ts`
- Các luồng testcase bắt buộc (tối thiểu 10 testcases hoặc flow hoàn chỉnh):
  - **Flow 1: Đặt lịch hẹn mới thành công**:
    - Vào trang lịch hẹn $\rightarrow$ Mở modal đặt lịch $\rightarrow$ Chọn khách hàng Active, chọn ngày & giờ $\rightarrow$ Submit $\rightarrow$ Đóng modal, hiển thị Toast thành công, và xuất hiện sự kiện trên Calendar.
  - **Flow 2: Validation đặt lịch trùng giờ**:
    - Tạo lịch hẹn A lúc 09:00 ngày X thành công.
    - Cố gắng tạo tiếp lịch hẹn B lúc 09:00 ngày X cho khách hàng khác $\rightarrow$ Đợi API trả về lỗi và assert hiển thị thông báo lỗi trùng lịch trên màn hình.
  - **Flow 3: Vòng đời Lịch hẹn & Bắt đầu khám**:
    - Chọn một lịch hẹn `CONFIRMED` $\rightarrow$ Đổi trạng thái sang `CHECKED_IN` $\rightarrow$ Assert nút "Bắt đầu khám" xuất hiện.
    - Click "Bắt đầu khám" $\rightarrow$ Hệ thống chuyển hướng sang trang tạo Visit `/visits/create?appointment_id={id}`.
    - Nhập thông tin Visit và lưu thành công $\rightarrow$ Quay lại trang Appointments và xác nhận trạng thái của lịch hẹn đó đã tự động chuyển thành `COMPLETED`.

---

## Status
- [ ] Tạo Page Object `AppointmentPageObject`
- [ ] Viết spec test cho luồng đặt lịch mới thành công
- [ ] Viết spec test cho luồng validate trùng lịch
- [ ] Viết spec test cho luồng Checked-in và liên kết Visit
- [ ] Run `docker compose exec -it node pnpm test:e2e`

---

## Acceptance Criteria
1. Bộ E2E test chạy pass 100% trên môi trường Playwright (không bị flaky).
2. Kiểm thử thành công các phản hồi từ API bao gồm cả case báo lỗi 422 trùng lịch từ Backend.
