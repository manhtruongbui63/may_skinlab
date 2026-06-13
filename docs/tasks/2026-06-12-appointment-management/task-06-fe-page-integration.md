---
task_id: "06"
title: "3c — Frontend Page Integration"
description: "Tích hợp các components, hooks và quản lý URL state vào trang danh sách lịch hẹn chính."
type: IMPLEMENTATION
phase: 3
status: completed
estimated_effort: M
complexity: medium
risk: low
depends_on: ["05"]
rule_refs: ["PROPOSED_BR:appointment-no-double-booking", "PROPOSED_BR:appointment-status-transition", "PROPOSED_BR:appointment-visit-creation"]
date: "2026-06-12"
changelog:
  - version: 1.0
    date: "2026-06-12"
    summary: Khởi tạo đặc tả task page integration.
---

# Context
- **Requirement**: [03-appointment-management.md](../../requirements/03-appointment-management.md)
- **Parent Task**: [2026-06-12-appointment-management-implementation-tasks.md](../2026-06-12-appointment-management-implementation-tasks.md)
- **Screen IDs**: S1, S2, S3
- **Applicable Skills**: `bks-fe-implement-feature`, `bks-fe-list-url-state`

---

# Task 06: 3c — Frontend Page Integration

## Description
Tích hợp các view Calendar, Table và các Modals vào route `app/(main)/appointments/page.tsx`. Xử lý việc đồng bộ hóa bộ lọc thời gian và trạng thái lên URL, quản lý các state loading/error và tích hợp luồng chuyển hướng khi bác sĩ click "Bắt đầu khám".

## Requirements

### 1. File Page `/appointments` (NEW)
- File: `frontend/app/(main)/appointments/page.tsx`
- Layout trang bao gồm:
  - Tiêu đề trang và nút "Đặt lịch hẹn mới" (Mở modal S2).
  - Nút chuyển đổi (Tabs/Buttons) giữa view Calendar và view Table.
  - Toolbar chứa bộ lọc: Ngày (Hôm nay/Tuần này/Tháng này hoặc DatePicker lọc cụ thể), trạng thái lịch hẹn, và ô tìm kiếm khách hàng (tên/sđt).
- Đồng bộ hóa các bộ lọc và view được chọn lên URL Search Params dùng helper từ `bks-fe-list-url-state`.

### 2. Quản lý UI States
- Loading State: Hiển thị skeleton Calendar hoặc Table skeleton tùy theo view đang chọn.
- Empty State: Hiển thị hình vẽ minh họa cùng nút "Đặt lịch hẹn mới" khi không có lịch nào trong ngày/tháng được chọn.
- Error State: Hiển thị banner báo lỗi kết nối kèm nút bấm thử lại (Retry).

### 3. Tích hợp tương tác & Chuyển trạng thái
- Khi lưu lịch hẹn thành công (Tạo/Sửa), đóng modal, hiển thị Toast thông báo và tự động reload danh sách.
- Khi người dùng click nút "Bắt đầu khám" tại Modal chi tiết lịch (đã check-in):
  - Chuyển hướng người dùng sang trang tạo Visit mới: `/visits/create?appointment_id={id}`.
  - Form tạo Visit trên FE sẽ tự động điền thông tin khách hàng từ Appointment, và khi lưu Visit thành công sẽ kích hoạt callback chuyển Appointment sang `COMPLETED`.

### 4. i18n & Localization (MANDATORY)
- Cập nhật các bản dịch vào file ngôn ngữ (ví dụ: `messages/vi.json` hoặc file dịch tương ứng của dự án):
  - `appointments.title`: "Quản lý lịch hẹn"
  - `appointments.toasts.created`: "Đặt lịch hẹn thành công"
  - `appointments.toasts.updated`: "Cập nhật lịch hẹn thành công"
  - `appointments.toasts.deleted`: "Xóa lịch hẹn thành công"
  - `appointments.errors.double_booking`: "Khung giờ này đã có lịch hẹn được xác nhận. Vui lòng chọn khung giờ khác!"

---

## Status
- [x] Thiết lập route `frontend/app/(main)/appointments/page.tsx`
- [x] Tích hợp view switcher và toolbar lọc đồng bộ URL State
- [x] Wire-up các modals S2, S3 vào page
- [x] Triển khai loading skeleton, empty state và error states
- [x] Tích hợp luồng chuyển hướng "Bắt đầu khám" sang Visit
- [x] Đăng ký các i18n localization keys cần thiết
- [x] Run `pnpm lint`
- [x] Run `pnpm test`

---

## Acceptance Criteria
1. Giao diện trang hoạt động mượt mà, reload trang hoặc copy link gửi đi vẫn khôi phục chính xác bộ lọc và view đang hiển thị.
2. Form Đặt lịch và form Chi tiết hoạt động đúng, đóng modal và bắn Toast thành công.
3. Không có bất kỳ chuỗi cứng (hardcoded strings) nào trên UI, tất cả đều qua `next-intl`.
