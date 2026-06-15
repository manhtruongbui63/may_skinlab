---
task_id: "22"
title: "3d — FE Tests: Vitest Component Tests + Playwright E2E"
description: "Vitest unit/integration tests cho RegistrationForm, ExaminationTable, AppointmentTable, customer search flow. Playwright E2E cho 2 happy-path flows."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: M
complexity: medium
risk: low
depends_on: ["21"]
rule_refs: []
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — §9 (screens, UI states, flows)
- **Screens**: S1, S2, S3, S4
- **Layer**: 3d — Tests
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Skills**: `bks-fe-create-tc-component`, `bks-fe-create-tc-flow`
- **Feature directory**: `frontend/features/reception/`

---

# Task 22: 3d — FE Tests

## Description
Tối thiểu 20 Vitest test cases + 10 Playwright E2E test cases cho module tiếp nhận. Vitest coverage: components + hooks + store. Playwright coverage: happy-path walk-in flow và tab 2 cancel flow.

---

## Requirements

### Vitest Tests — `RegistrationForm` (≥ 8 TCs)

**File**: `frontend/features/reception/components/__tests__/registration-form.test.tsx`

**Scenarios**:
1. Render form với default state (registration_type unselected).
2. Chọn WALK_IN → AppointmentDatePicker unmounts (UI-001).
3. Chọn SCHEDULED → AppointmentDatePicker mounts.
4. Submit WALK_IN thiếu clinic_room → validation error hiển thị.
5. Submit WALK_IN thiếu service → validation error.
6. Submit SCHEDULED thiếu appointment_date → error.
7. Submit SCHEDULED với today's date → error "date_must_be_future".
8. Submit thành công (MSW mock) → form reset + toast.
9. 422 response → field errors map đúng fields.
10. Priority toggle → store updates.

### Vitest Tests — `ExaminationTable` (≥ 5 TCs)

**File**: `frontend/features/reception/components/__tests__/examination-table.test.tsx`

**Scenarios**:
1. Render với WAITING Visit → yellow badge, Hủy enabled.
2. Render với COMPLETED Visit → green badge, Hủy disabled.
3. `canDelete = true` → Xóa button visible.
4. `canDelete = false` → Xóa button không render.
5. Click "Hủy" → `onCancel` callback gọi đúng visitId.

### Vitest Tests — `AppointmentTable` (≥ 5 TCs)

**File**: `frontend/features/reception/components/__tests__/appointment-table.test.tsx`

**Scenarios**:
1. Render với BOOKED appointment → Tiếp nhận + Hủy visible.
2. Render với CHECKED_IN appointment → actions hidden.
3. Render với OVERDUE appointment → orange badge, actions hidden.
4. Click "Tiếp nhận" (BOOKED) → `onCheckIn` gọi đúng id.
5. Click "Hủy" (BOOKED) → `onCancel` gọi đúng id.

### Vitest Tests — `useSearchCustomers` hook (≥ 5 TCs)

**File**: `frontend/features/reception/hooks/__tests__/use-search-customers.test.ts`

**Scenarios**:
1. `query = ""` → không gọi API.
2. `query = "a"` (length < 2) → không gọi API.
3. `query = "ab"` → gọi API sau 300ms debounce.
4. API trả về 1 result → `results.length === 1`.
5. API trả về 0 result → `results = []`.

### Vitest Tests — Design System (VT-DS, ≥ 5 TCs)

**Scenarios** (map token/DS rules):
1. Status badges render đúng màu DS token (WAITING=yellow, COMPLETED=green, CANCELLED=red, OVERDUE=orange).
2. `ReasonTextarea` char counter đúng.
3. `PriorityToggle` dùng đúng DS Switch component.
4. `AppointmentDatePicker` không cho chọn today/past.
5. `ExaminationFilters` DateRange enforce same-month.

### Playwright E2E (≥ 10 TCs)

**Page Object**: `frontend/e2e/pages/reception.page.ts`

**Spec file**: `frontend/e2e/reception.spec.ts`

**Scenarios**:
1. Navigate `/reception` → layout 2 cột render.
2. Chọn WALK_IN → AppointmentDatePicker ẩn.
3. Chọn SCHEDULED → AppointmentDatePicker hiện.
4. Chuyển tab → form không reset.
5. Tab 1 search → 1 kết quả → auto-fill.
6. Tab 1 search → nhiều kết quả → modal mở.
7. Tab 2 filter ngày → list cập nhật.
8. Tab 2 Cancel Visit → dialog → confirm → toast.
9. Tab 3 BOOKED appointment → Tiếp nhận → Visit xuất hiện Tab 2.
10. Tab 3 "Xem chi tiết" → drawer mở với activity log.

---

## Status
- [ ] Đọc `bks-fe-create-tc-component` SKILL.md
- [ ] Đọc `bks-fe-create-tc-flow` SKILL.md
- [ ] Viết `registration-form.test.tsx` (≥10 TCs)
- [ ] Viết `examination-table.test.tsx` (≥5 TCs)
- [ ] Viết `appointment-table.test.tsx` (≥5 TCs)
- [ ] Viết `use-search-customers.test.ts` (≥5 TCs)
- [ ] Viết VT-DS tests (≥5 TCs)
- [ ] Tạo `reception.page.ts` Page Object
- [ ] Viết `reception.spec.ts` (≥10 E2E TCs)
- [ ] Chạy `pnpm test:run`
- [ ] Chạy `pnpm test:e2e`

## Acceptance Criteria
1. Tối thiểu 20 Vitest TCs pass.
2. Tối thiểu 10 Playwright E2E TCs pass.
3. VT-DS tests verify status badge colors và DS component usage.
4. E2E tests cover happy-path Walk-in flow end-to-end.
5. No hardcoded strings (i18n validated).

## Dependencies
- Task 21 (Tab Integrations) — cần page hoàn chỉnh cho E2E.
