---
task_id: "05"
title: "3b — Frontend Components"
description: "Xây dựng các components UI cho Calendar View, Table View, Modal Tạo lịch và Modal Chi tiết/Chỉnh sửa lịch hẹn."
type: IMPLEMENTATION
phase: 3
status: completed
estimated_effort: M
complexity: medium
risk: low
depends_on: ["04"]
rule_refs: ["PROPOSED_BR:appointment-no-double-booking", "PROPOSED_BR:appointment-status-transition"]
date: "2026-06-12"
changelog:
  - version: 1.0
    date: "2026-06-12"
    summary: Khởi tạo đặc tả task frontend components.
---

# Context
- **Requirement**: [03-appointment-management.md](../../requirements/03-appointment-management.md)
- **Parent Task**: [2026-06-12-appointment-management-implementation-tasks.md](../2026-06-12-appointment-management-implementation-tasks.md)
- **Screen IDs**: S1, S2, S3
- **Applicable Skills**: `bks-fe-implement-feature`, `bks-fe-ds-sdk-consumer`

---

# Task 05: 3b — Frontend Components

## Description
Phát triển bộ giao diện UI thân thiện cho Lịch hẹn. Sử dụng thư viện UI của dự án để dựng Calendar View trực quan cùng Table View phân trang truyền thống. Tạo các Modals để phục vụ đặt lịch mới và chỉnh sửa nhanh.

## Requirements

### 1. `AppointmentsCalendarView` (NEW)
- File: `frontend/features/appointments/components/appointments-calendar-view.tsx`
- Hiển thị lịch hẹn dưới dạng ô lịch tuần/tháng.
- Mỗi ô ngày hiển thị danh sách các lịch hẹn tương ứng kèm badge màu theo trạng thái (BOOKED: Xám, CONFIRMED: Xanh dương, CHECKED_IN: Cam, COMPLETED: Xanh lá, CANCELLED: Đỏ, NO_SHOW: Đen).
- Cho phép click vào lịch hẹn để xem chi tiết (mở Modal S3).
- Cho phép double click vào ngày trống để mở Modal Tạo lịch hẹn (mở Modal S2).

### 2. `AppointmentsTableView` (NEW)
- File: `frontend/features/appointments/components/appointments-table-view.tsx`
- Hiển thị danh sách lịch hẹn dưới dạng Table có phân trang.
- Các cột: Khách hàng, Số điện thoại, Ngày hẹn, Giờ hẹn, Trạng thái (Badge), Hành động (Xem/Sửa).
- Sử dụng Design System components cho Table và Pagination.

### 3. `AppointmentCreateModal` (NEW)
- File: `frontend/features/appointments/components/appointment-create-modal.tsx`
- Dialog chứa form đặt lịch:
  - Chọn khách hàng (Dropdown tìm kiếm khách hàng có trạng thái `ACTIVE`).
  - Chọn ngày hẹn (DatePicker) và giờ hẹn (Select slot 30 phút).
  - Nhập ghi chú.
  - Tích hợp `react-hook-form` và Zod validation schema.
  - Hiển thị loader khi đang submit.

### 4. `AppointmentDetailModal` (NEW)
- File: `frontend/features/appointments/components/appointment-detail-modal.tsx`
- Dialog hiển thị chi tiết lịch hẹn:
  - Thông tin khách hàng và thông tin cuộc hẹn.
  - Các nút hành động thay đổi trạng thái (Xác nhận, Check-in, Hủy hẹn, Báo vắng - NO_SHOW) dựa trên trạng thái hiện tại (BR-APPT-003).
  - Nút "Bắt đầu khám" (Start Visit) hiển thị khi lịch hẹn ở trạng thái `CHECKED_IN`.
  - Hỗ trợ form chỉnh sửa thời gian/ghi chú trực tiếp nếu lịch hẹn chưa kết thúc.
  - Nút Xóa lịch hẹn (Soft Delete).

---

## Status
- [x] Xây dựng component `AppointmentsCalendarView`
- [x] Xây dựng component `AppointmentsTableView`
- [x] Xây dựng component `AppointmentCreateModal` (Form Tạo lịch)
- [x] Xây dựng component `AppointmentDetailModal` (Xem & Chuyển trạng thái)
- [x] Run `pnpm lint`
- [x] Run `pnpm test`

---

## Acceptance Criteria
1. UI hiển thị chính xác theo quy chuẩn thiết kế, responsive tốt trên cả Desktop và Mobile.
2. Các badge trạng thái đổi màu đúng như mô tả.
3. Modal tạo mới validate đầy đủ dữ liệu trước khi gửi lên API.
4. Modal chi tiết ẩn/hiển thị các nút chuyển trạng thái một cách hợp lệ theo ma trận vòng đời.
