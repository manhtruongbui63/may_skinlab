---
task_id: "07"
title: "3d — Frontend Unit & Integration Tests"
description: "Viết kịch bản test bằng Vitest và React Testing Library cho các component, hooks và store của module Lịch hẹn."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: ["06"]
rule_refs: ["PROPOSED_BR:appointment-no-double-booking", "PROPOSED_BR:appointment-status-transition"]
date: "2026-06-12"
changelog:
  - version: 1.0
    date: "2026-06-12"
    summary: Khởi tạo đặc tả task frontend unit test.
---

# Context
- **Requirement**: [03-appointment-management.md](../../requirements/03-appointment-management.md)
- **Parent Task**: [2026-06-12-appointment-management-implementation-tasks.md](../2026-06-12-appointment-management-implementation-tasks.md)
- **Screen IDs**: S1, S2, S3
- **Applicable Skills**: `bks-fe-create-tc-component`

---

# Task 07: 3d — Frontend Unit & Integration Tests

## Description
Viết bộ unit test và integration test hoàn chỉnh bằng Vitest và React Testing Library cho các component và hooks của module Lịch hẹn. Đảm bảo đạt độ phủ tối thiểu 20 testcases, bao gồm kiểm tra ánh xạ design tokens (màu sắc badge theo trạng thái).

## Requirements

### 1. File test Components & Hooks (NEW)
- File: `frontend/features/appointments/components/__tests__/appointment-components.test.tsx`
- Các kịch bản test bắt buộc:
  - **AppointmentsCalendarView**:
    - Render đúng các ngày trong tuần/tháng hiện tại.
    - Hiển thị đúng các badge lịch hẹn kèm màu sắc CSS tương thích với trạng thái (ví dụ: `BOOKED` có class CSS màu xám, `CONFIRMED` màu xanh...).
    - Double click vào ô ngày trống gọi đúng trigger mở Modal Tạo mới.
  - **AppointmentCreateModal**:
    - Hiển thị đầy đủ các trường nhập liệu (Khách hàng, Ngày, Giờ, Ghi chú).
    - Validate bắt buộc hiển thị thông báo lỗi khi submit form rỗng.
    - Chọn khách hàng và nhập đúng thông tin gọi đúng API mutation.
  - **AppointmentDetailModal**:
    - Render đúng thông tin lịch hẹn.
    - Hiển thị đúng các nút đổi trạng thái hợp lệ dựa trên trạng thái hiện tại (ví dụ: trạng thái `CONFIRMED` thì nút "Check-in" hiển thị, nút "Bắt đầu khám" bị ẩn).
    - Trạng thái `CHECKED_IN` hiển thị nút "Bắt đầu khám" với đường dẫn chuẩn.
    - Trạng thái terminal (`COMPLETED`...) vô hiệu hóa toàn bộ các nút thay đổi dữ liệu hoặc thay đổi trạng thái.

### 2. MSW Mocks (NEW)
- File: `frontend/features/appointments/mocks/appointment.handlers.ts`
- Định nghĩa MSW mock handlers cho các API endpoint của `appointments` để chạy tests không phụ thuộc API thật:
  - `GET /api/v1/appointments`
  - `POST /api/v1/appointments`
  - `PUT /api/v1/appointments/:id`
  - `DELETE /api/v1/appointments/:id`

---

## Status
- [ ] Thiết lập MSW handlers cho API Lịch hẹn
- [ ] Viết các unit tests cho view Calendar và Table
- [ ] Viết các unit tests cho Modal Tạo lịch hẹn (form validation)
- [ ] Viết các unit tests cho Modal Chi tiết và Chuyển trạng thái
- [ ] Run `pnpm test`

---

## Acceptance Criteria
1. Chạy tất cả các vitest pass 100%.
2. Tổng số testcases $\ge 20$ (bao gồm cả test UI map đúng design token).
3. Đạt coverage tối thiểu 80% cho các component và hooks thuộc feature `appointments`.
