---
task_id: "19"
title: "3b — S4 Appointment Tab + S8 Cancel Dialog + S9 Detail Drawer Components"
description: "Tạo components Tab 3 (AppointmentFilters, AppointmentTable với BOOKED-conditional actions) và S8 CancelAppointmentDialog, S9 AppointmentDetailDrawer với activity log."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: M
complexity: medium
risk: low
depends_on: ["14"]
rule_refs:
  - "PROPOSED_BR:appointment-cancel-precheck-only"
  - "PROPOSED_BR:overdue-auto-mark"
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — §9.3 (S4, S8, S9), §9.6 (S4, S9), §9.7 (UI-004, UI-008)
- **Screens**: S4 (Appointment Tab), S8 (Cancel Dialog), S9 (Detail Drawer)
- **Layer**: 3b — Components
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Skills**: `bks-fe-implement-feature`, `bks-fe-ds-sdk-consumer`
- **Feature directory**: `frontend/features/reception/components/`
- **i18n namespace**: `reception`

---

# Task 19: 3b — S4 Appointment Tab Components

## Description
Tạo component tree cho Tab 3 (Lịch hẹn). Multi-field filter bar, bảng appointment với BOOKED-only actions, cancel dialog, và detail drawer với activity log.

## Out of Scope
- URL state sync (Task 21).
- Check-in và cancel mutations wiring (Task 21).

---

## Requirements

### 1. Component: `AppointmentListTab` (container — NEW)

**File**: `frontend/features/reception/components/appointment-list-tab.tsx`

**Props**:
```ts
interface AppointmentListTabProps {
  appointments: PaginatedAppointments | undefined;
  isLoading: boolean;
  filters: ListAppointmentFilters;
  onFiltersChange: (f: ListAppointmentFilters) => void;
}
```

Composes: `AppointmentFilters` + `AppointmentTable` + `CancelAppointmentDialog` + `AppointmentDetailDrawer`.

**UI states** (§9.6 S4):
- Loading: table skeleton.
- Empty: "Không có lịch hẹn".
- Error: retry banner.

### 2. Component: `AppointmentFilters` (presentational — NEW)

**File**: `frontend/features/reception/components/appointment-filters.tsx`

**Props**: `value: ListAppointmentFilters`, `onChange: (f: ListAppointmentFilters) => void`

**Fields**: Search input (text — mã ĐK, mã KH, tên, SĐT) + DateRange picker + Status select.

**DS Role**: FilterBar layout với DS Input, DateRangePicker, Select.

### 3. Component: `AppointmentTable` (presentational — NEW)

**File**: `frontend/features/reception/components/appointment-table.tsx`

**Props**:
```ts
interface AppointmentTableProps {
  appointments: Appointment[];
  onCheckIn: (id: number) => void;
  onCancel: (id: number) => void;
  onViewDetail: (id: number) => void;
}
```

**Columns**: Mã ĐK / Mã KH / Tên KH / Ngày khám / Phòng khám / Dịch vụ / SĐT / Trạng thái / Ngày tạo / Hành động.

**UI-004**: Nút "Tiếp nhận" và "Hủy" chỉ visible khi `status.value === 1 (BOOKED)`.

**Status badges** (UI-008):
- BOOKED → blue badge
- CHECKED_IN → green badge
- OVERDUE → orange badge
- CANCELLED → red badge
- COMPLETED → gray badge

### 4. Component: `CancelAppointmentDialog` (S8 — NEW)

**File**: `frontend/features/reception/components/cancel-appointment-dialog.tsx`

**Props**: `isOpen: boolean`, `appointmentId: number | null`, `onConfirm: () => void`, `onClose: () => void`, `isPending: boolean`

**DS Role**: Confirm dialog "Bạn có chắc muốn hủy lịch hẹn này?".

### 5. Component: `AppointmentDetailDrawer` (S9 — NEW)

**File**: `frontend/features/reception/components/appointment-detail-drawer.tsx`

**Props**: `isOpen: boolean`, `appointmentId: number | null`, `onClose: () => void`, `appointment: Appointment | undefined`, `isLoading: boolean`

**Sections**:
1. Thông tin phiếu đăng ký (code, status, appointment_date, services).
2. Thông tin khách hàng (readonly).
3. Lịch sử thao tác — list `activity_log` entries: description + causer + created_at.

**UI state** (§9.6 S9): skeleton khi `isLoading`, error state nếu load fail.

### 6. i18n Keys (NEW)

```
reception:tab3.title
reception:tab3.empty_state
reception:tab3.search_placeholder
reception:tab3.date_from_label
reception:tab3.date_to_label
reception:tab3.status_label
reception:tab3.checkin_button
reception:tab3.cancel_button
reception:tab3.detail_button
reception:tab3.cancel_confirm_title
reception:tab3.cancel_confirm_message
reception:tab3.drawer_title
reception:tab3.activity_log_title
reception:tab3.column_code
reception:tab3.column_customer
reception:tab3.column_appointment_date
reception:tab3.column_room
reception:tab3.column_phone
reception:tab3.column_status
reception:tab3.column_created_at
reception:tab3.column_actions
```

---

## Status
- [ ] Tạo `AppointmentListTab` container
- [ ] Tạo `AppointmentFilters`
- [ ] Tạo `AppointmentTable` với BOOKED-only actions (UI-004) và status badges (UI-008)
- [ ] Tạo `CancelAppointmentDialog` (S8)
- [ ] Tạo `AppointmentDetailDrawer` (S9) với activity log section
- [ ] Thêm i18n keys
- [ ] Chạy `pnpm lint`
- [ ] Chạy `pnpm test`

## Acceptance Criteria
1. Nút "Tiếp nhận" và "Hủy" chỉ render khi `status.value === 1 (BOOKED)` (UI-004).
2. Badge OVERDUE hiển thị màu orange (UI-008).
3. `AppointmentDetailDrawer` hiển thị đúng `activity_log` list.
4. `AppointmentDetailDrawer` skeleton khi `isLoading`.

## Dependencies
- Task 14 (Appointment Data Layer) — types `Appointment`, `ActivityLogEntry`, `ListAppointmentFilters`.
