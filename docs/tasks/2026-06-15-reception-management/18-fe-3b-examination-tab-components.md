---
task_id: "18"
title: "3b — S3 Examination Tab + S6 Cancel Dialog + S7 Delete Dialog Components"
description: "Tạo components Tab 2 (ExaminationFilters, ExaminationTable với badges, status indicators) và 2 confirm dialogs (CancelVisitDialog S6, DeleteVisitDialog S7 với role-based visibility)."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: M
complexity: medium
risk: low
depends_on: ["13"]
rule_refs:
  - "PROPOSED_BR:visit-cancel-condition"
  - "PROPOSED_BR:visit-delete-permission"
  - "PROPOSED_BR:visit-list-date-same-month"
  - "PROPOSED_BR:visit-list-no-future-date"
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — §6.5, §9.3 (S3), §9.6 (UI states S3), §9.7 (UI-005, UI-006, UI-008)
- **Screens**: S3 (Examination List Tab), S6 (Cancel Dialog), S7 (Delete Dialog)
- **Layer**: 3b — Components
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Skills**: `bks-fe-implement-feature`, `bks-fe-ds-sdk-consumer`
- **Feature directory**: `frontend/features/reception/components/`
- **i18n namespace**: `reception`

---

# Task 18: 3b — S3 Examination Tab Components

## Description
Tạo component tree cho Tab 2 (Danh sách khám). ExaminationFilters với same-month enforcement, ExaminationTable với colored status badges, và 2 dialogs confirm. Role-based nút Xóa (UI-006).

## Out of Scope
- URL state sync cho filters (Task 21).
- Cancel/Delete mutations wiring (Task 21).

---

## Requirements

### 1. Component: `ExaminationListTab` (container — NEW)

**File**: `frontend/features/reception/components/examination-list-tab.tsx`

**Props**:
```ts
interface ExaminationListTabProps {
  visits: PaginatedVisits | undefined;
  isLoading: boolean;
  filters: ListVisitFilters;
  onFiltersChange: (f: ListVisitFilters) => void;
}
```

Composes: `ExaminationFilters` + `ExaminationTable` + `CancelVisitDialog` + `DeleteVisitDialog`.

**UI states** (§9.6 S3):
- Loading: table skeleton.
- Empty: "Không có phiếu khám trong khoảng thời gian này".
- Error: retry banner.
- Permission: ẩn nút Xóa với non-admin/manager.

### 2. Component: `ExaminationFilters` (presentational — NEW)

**File**: `frontend/features/reception/components/examination-filters.tsx`

**Props**: `value: ListVisitFilters`, `onChange: (f: ListVisitFilters) => void`

**DS Role**: DateRangePicker + StatusSelect.

**UI-005**: Nếu `to` sang tháng khác so với `from` → auto clamp `to` về cuối tháng của `from`.

### 3. Component: `ExaminationTable` (presentational — NEW)

**File**: `frontend/features/reception/components/examination-table.tsx`

**Props**: `visits: Visit[]`, `onCancel: (id: number) => void`, `onDelete: (id: number) => void`, `canDelete: boolean`

**Columns**: STT khám / Mã KH / Mã phiếu / Tên KH / Thời gian đăng ký / Giới tính / SĐT / Trạng thái / Hành động.

**Status badges** (UI-008):
- WAITING → yellow badge
- IN_PROGRESS → blue badge
- COMPLETED → green badge
- CANCELLED → red badge

**UI-006**: Nút Xóa chỉ render khi `canDelete = true`. Nút Hủy disabled khi `status = COMPLETED`.

### 4. Component: `CancelVisitDialog` (S6 — NEW)

**File**: `frontend/features/reception/components/cancel-visit-dialog.tsx`

**Props**: `isOpen: boolean`, `visitId: number | null`, `onConfirm: () => void`, `onClose: () => void`, `isPending: boolean`

**DS Role**: Confirm dialog "Bạn có chắc muốn hủy phiếu khám này?".

### 5. Component: `DeleteVisitDialog` (S7 — NEW)

**File**: `frontend/features/reception/components/delete-visit-dialog.tsx`

**Props**: `isOpen: boolean`, `visitId: number | null`, `onConfirm: () => void`, `onClose: () => void`, `isPending: boolean`

**DS Role**: Confirm dialog với warning color.

### 6. i18n Keys (NEW)

```
reception:tab2.title
reception:tab2.empty_state
reception:tab2.date_from_label
reception:tab2.date_to_label
reception:tab2.status_label
reception:tab2.cancel_confirm_title
reception:tab2.cancel_confirm_message
reception:tab2.delete_confirm_title
reception:tab2.delete_confirm_message
reception:tab2.column_queue
reception:tab2.column_customer_code
reception:tab2.column_visit_code
reception:tab2.column_name
reception:tab2.column_registered_at
reception:tab2.column_gender
reception:tab2.column_phone
reception:tab2.column_status
reception:tab2.column_actions
```

---

## Status
- [ ] Tạo `ExaminationListTab` container
- [ ] Tạo `ExaminationFilters` với same-month auto-clamp (UI-005)
- [ ] Tạo `ExaminationTable` với status badges (UI-008) và role-based delete (UI-006)
- [ ] Tạo `CancelVisitDialog` (S6)
- [ ] Tạo `DeleteVisitDialog` (S7)
- [ ] Thêm i18n keys
- [ ] Chạy `pnpm lint`
- [ ] Chạy `pnpm test`

## Acceptance Criteria
1. `ExaminationFilters` auto-clamp `to` date khi chọn sang tháng khác (UI-005).
2. Status badges render đúng màu (UI-008).
3. Nút Xóa ẩn khi `canDelete = false` (UI-006).
4. Nút Hủy disabled khi `visit.status.value === 3 (COMPLETED)`.

## Dependencies
- Task 13 (Visit Data Layer) — types `Visit`, `PaginatedVisits`, `ListVisitFilters`.
