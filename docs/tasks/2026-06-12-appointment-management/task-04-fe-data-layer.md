---
task_id: "04"
title: "3a — Frontend Data Layer"
description: "Định nghĩa TypeScript types, Zod schemas, Repository và các React Query hooks cho API Lịch hẹn."
type: IMPLEMENTATION
phase: 3
status: completed
estimated_effort: S
complexity: low
risk: low
depends_on: ["02"]
rule_refs: ["PROPOSED_BR:appointment-no-double-booking", "PROPOSED_BR:appointment-customer-active-only"]
date: "2026-06-12"
changelog:
  - version: 1.0
    date: "2026-06-12"
    summary: Khởi tạo đặc tả frontend data layer.
---

# Context
- **Requirement**: [03-appointment-management.md](../../requirements/03-appointment-management.md)
- **Parent Task**: [2026-06-12-appointment-management-implementation-tasks.md](../2026-06-12-appointment-management-implementation-tasks.md)
- **Screen IDs**: S1, S2, S3
- **Applicable Skills**: `bks-fe-api-integration`

---

# Task 04: 3a — Frontend Data Layer

## Description
Thiết lập các cấu trúc dữ liệu cho module Lịch hẹn ở frontend. Bao gồm định nghĩa kiểu dữ liệu TS, Zod schemas để validate form phía client, Repository kết nối API và hooks (React Query) để quản lý state cache.

## Requirements

### 1. File types (NEW)
- File: `frontend/features/appointments/types/index.ts`
- Định nghĩa các interface:
  - `Appointment`: Chứa trường `id`, `customer_id`, `appointment_at`, `status` (kiểu object `{ value: number, label: string }`), `note`, và quan hệ `customer` (nếu có).
  - Kiểu dữ liệu lọc `AppointmentFilters`: `date`, `status`, `search`.

### 2. Zod Schema `AppointmentFormSchema` (NEW)
- File: `frontend/features/appointments/schemas/appointment-form.schema.ts`
- Định nghĩa `appointmentFormSchema` dùng cho cả Tạo mới và Cập nhật:
  - `customer_id`: number, bắt buộc.
  - `appointment_date`: string, định dạng YYYY-MM-DD, bắt buộc.
  - `appointment_time`: string, định dạng HH:MM, bắt buộc.
  - `note`: string, optional, tối đa 500 ký tự.
- Định nghĩa các chuỗi khóa bản địa hóa (localization keys) cho thông báo lỗi.

### 3. Repository `AppointmentRepository` (NEW)
- File: `frontend/features/appointments/services/appointment.repository.ts`
- Định nghĩa interface `IAppointmentRepository` và class implementation kế thừa từ `BaseRepository`.
- Các methods cần triển khai:
  - `list(filters: AppointmentFilters): Promise<Appointment[]>`
  - `create(data: AppointmentFormData): Promise<Appointment>`
  - `update(id: number, data: AppointmentFormData): Promise<Appointment>`
  - `delete(id: number): Promise<void>`

### 4. React Query Hooks (NEW)
- File: `frontend/features/appointments/hooks/use-appointments.ts`
- Định nghĩa:
  - `useAppointments(filters)`: Query danh sách lịch hẹn.
  - `useCreateAppointment()`: Mutation tạo lịch hẹn mới, xử lý invalidation cache danh sách khi thành công.
  - `useUpdateAppointment()`: Mutation cập nhật lịch hẹn và cập nhật cache khi thành công.
  - `useDeleteAppointment()`: Mutation xóa lịch hẹn và cập nhật cache khi thành công.

---

## Status
- [x] Định nghĩa TS types cho Lịch hẹn
- [x] Xây dựng Zod validation schema cho Form Lịch hẹn
- [x] Xây dựng `AppointmentRepository` kết nối backend APIs
- [x] Triển khai các React Query hooks (`useAppointments`, `useCreateAppointment`, v.v.)
- [x] Run `pnpm lint`
- [x] Run `pnpm test`

---

## Acceptance Criteria
1. Cấu trúc interfaces và types đầy đủ, khớp với database schema và API Response.
2. Zod schema validate chính xác các trường bắt buộc, hiển thị đúng localization key khi validation thất bại.
3. Các hooks của React Query tự động cập nhật/invalidate cache dữ liệu khi thêm/sửa/xóa thành công.
