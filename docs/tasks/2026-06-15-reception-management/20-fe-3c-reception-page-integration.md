---
task_id: "20"
title: "3c — ReceptionPage Layout Integration (S1 + Tab Navigation)"
description: "Tạo ReceptionPage (app router), ReceptionLayout 2-cột, wiring RegistrationForm với useReceptionFormStore + useCreateVisit, TabNavigation với URL-synced tab state (UI-002)."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: M
complexity: medium
risk: medium
depends_on: ["16"]
rule_refs: []
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — §6.1, §9.2 (S1), §9.6 (S1 UI states), §9.7 (UI-001, UI-002), §9.8 (route, navigation)
- **Screens**: S1 (ReceptionPage layout + RegistrationForm)
- **Layer**: 3c — Page Integration
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Skills**: `bks-fe-implement-feature`, `bks-fe-list-url-state`
- **Route**: `frontend/app/(main)/reception/page.tsx`
- **Feature directory**: `frontend/features/reception/`
- **i18n namespace**: `reception`

---

# Task 20: 3c — ReceptionPage Layout Integration

## Description
Tạo page route `/reception` với 2-cột layout: Cột 1 (RegistrationForm always visible) + Cột 2 (TabPanel). Wire `RegistrationForm` với `useReceptionFormStore` + `useCreateVisit` mutation. Tab state synced với URL `?tab=1|2|3` (UI-002).

## Out of Scope
- Nội dung các tabs (Task 21).
- Không xử lý cancel/delete Visit hay appointment actions ở task này.

---

## Requirements

### 1. Route/Page: `ReceptionPage` (NEW)

**File**: `frontend/app/(main)/reception/page.tsx`

- `'use client'` component.
- Render `ReceptionLayout`.
- Metadata: `title = "Tiếp nhận | ClinicName"`, `description` cho SEO.

### 2. Component: `ReceptionLayout` (container — NEW)

**File**: `frontend/features/reception/components/reception-layout.tsx`

**Layout**: 2-column CSS Grid (e.g. 40%/60% hoặc theo design system).

**State**: Tab state từ URL query param `?tab=1|2|3` (default: `tab=1`).

**UI-002**: Tab switch KHÔNG reset `useReceptionFormStore` — store persistent across tab changes.

**Sub-components**:
- Cột 1: `RegistrationForm` (wired, always rendered).
- Cột 2: `TabNavigation` (switcher) + `TabPanel` (dynamic render S2/S3/S4 dựa vào active tab).

### 3. RegistrationForm Wiring

**`RegistrationForm`** được wire tại đây:
- Bind `useReceptionFormStore` state → form fields via RHF `defaultValues`.
- On change → `setField(...)` in store.
- On submit → `useCreateVisit().mutate(formValues)`.
- On success → `useReceptionFormStore.reset()`, toast `reception:toasts.visit_created`.
- `mapBackendErrors(error)` → field errors via RHF `setError`.

### 4. Component: `TabNavigation` (presentational — NEW)

**File**: `frontend/features/reception/components/tab-navigation.tsx`

**Props**: `activeTab: 1 | 2 | 3`, `onTabChange: (tab: 1 | 2 | 3) => void`

**DS Role**: Tab group với 3 tabs: "Thông tin KH" (1), "Danh sách khám" (2), "Lịch hẹn đặt trước" (3).

### 5. Component: `TabPanel` (container — NEW)

**File**: `frontend/features/reception/components/tab-panel.tsx`

**Props**: `activeTab: 1 | 2 | 3`

Render:
- `activeTab = 1` → `<CustomerSearchTab />` (lazy loaded).
- `activeTab = 2` → `<ExaminationListTab />` (lazy loaded).
- `activeTab = 3` → `<AppointmentListTab />` (lazy loaded).

### 6. URL State Sync

- Tab state: `?tab=1|2|3` synced via `useSearchParams` (Next.js App Router).
- Khi tab thay đổi → `router.replace(?tab=N)` không navigate (giữ form state).
- Tham khảo `bks-fe-list-url-state` cho pattern sync.

### 7. i18n Keys (NEW)

```
reception:page.title
reception:tab1.tab_label
reception:tab2.tab_label
reception:tab3.tab_label
```

---

## Status
- [ ] Tạo `frontend/app/(main)/reception/page.tsx` với metadata
- [ ] Tạo `ReceptionLayout` 2-column layout
- [ ] Tạo `TabNavigation` với 3 tabs
- [ ] Tạo `TabPanel` với lazy rendering của S2/S3/S4
- [ ] Wire `RegistrationForm` với store + `useCreateVisit` + `mapBackendErrors`
- [ ] Sync tab state với URL `?tab=`
- [ ] Thêm i18n keys
- [ ] Chạy `pnpm lint`
- [ ] Chạy `pnpm test`

## Acceptance Criteria
1. Route `/reception` render 2-column layout.
2. Chuyển tab không reset RegistrationForm (UI-002).
3. Tab state synced với URL: reload trang giữ đúng tab.
4. Submit form → toast success + form reset.
5. Submit form với lỗi 422 → field errors hiển thị đúng field.
6. `AppointmentDatePicker` ẩn khi `registration_type = WALK_IN` (UI-001).

## Error Scenarios
- Submit 422 → `mapBackendErrors` → field-level errors.
- Submit 500 → generic error toast.

## Dependencies
- Task 16 (RegistrationForm Components).
