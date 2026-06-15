---
task_id: "16"
title: "3b — S1 RegistrationForm Components (Cột 1)"
description: "Tạo component tree của Cột 1: RegistrationForm container và 7 presentational components (RegistrationTypeSelect, AppointmentDatePicker, ClinicRoomSelect, ServiceMultiSelect, PackageMultiSelect, PriorityToggle, ReasonTextarea)."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: M
complexity: medium
risk: low
depends_on: ["12", "13"]
rule_refs:
  - "PROPOSED_BR:walkin-no-appointment-date"
  - "PROPOSED_BR:walkin-requires-room-service"
  - "PROPOSED_BR:scheduled-future-date-only"
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — §9.3 (S1 component tree), §9.5 (StoreVisitSchema), §9.7 (UI-001)
- **Screens**: S1 (RegistrationForm)
- **Layer**: 3b — Components
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Skills**: `bks-fe-implement-feature`, `bks-fe-ds-sdk-consumer`
- **Feature directory**: `frontend/features/reception/components/`
- **i18n namespace**: `reception`

---

# Task 16: 3b — S1 RegistrationForm Components

## Description
Tạo component tree cho Cột 1 (RegistrationForm). Components thuần presentational dùng DS tokens và MSW mock data. Wiring với store và submit handler ở Task 20.

## Out of Scope
- Page integration, submit wiring (Task 20).
- Tab 1, 2, 3 components (Tasks 17, 18, 19).

---

## Requirements

### 1. Component: `RegistrationForm` (container — NEW)

**File**: `frontend/features/reception/components/registration-form.tsx`

**Role**: container cho toàn bộ Cột 1.

**Props**:
```ts
interface RegistrationFormProps {
  onSubmitSuccess?: () => void;
}
```

**Responsibilities**: orchestrate sub-components, own RHF form context (wired ở Task 20), hiển thị submit spinner.

**UI States**: submit loading spinner trên nút Lưu; field errors via `mapBackendErrors`.

### 2. Component: `RegistrationTypeSelect` (presentational — NEW)

**File**: `frontend/features/reception/components/registration-type-select.tsx`

**Props**: `value: number | null`, `onChange: (v: number) => void`, `error?: string`

**DS Role**: Select/RadioGroup với 2 options: WALK_IN (1) = "Chờ khám", SCHEDULED (2) = "Đặt lịch".

### 3. Component: `AppointmentDatePicker` (presentational — NEW)

**File**: `frontend/features/reception/components/appointment-date-picker.tsx`

**Props**: `value: string | null`, `onChange: (v: string | null) => void`, `error?: string`

**UI-001**: Unmount hoàn toàn khi `registration_type = WALK_IN`. Hiển thị khi SCHEDULED.

**DS Role**: DatePicker với `minDate = tomorrow` (only future dates).

### 4. Component: `ClinicRoomSelect` (presentational — NEW)

**File**: `frontend/features/reception/components/clinic-room-select.tsx`

**Props**: `options: ClinicRoom[]`, `value: number | null`, `onChange: (v: number | null) => void`, `error?: string`

**DS Role**: Select dropdown. Nhận data từ `useReceptionMasterData()` (parent truyền vào).

### 5. Component: `ServiceMultiSelect` (presentational — NEW)

**File**: `frontend/features/reception/components/service-multi-select.tsx`

**Props**: `options: Service[]`, `value: number[]`, `onChange: (v: number[]) => void`, `error?: string`

**DS Role**: Multi-select component với checkboxes hoặc tag-style.

### 6. Component: `PackageMultiSelect` (presentational — NEW)

**File**: `frontend/features/reception/components/package-multi-select.tsx`

**Props**: `options: ServicePackage[]`, `value: number[]`, `onChange: (v: number[]) => void`

Similar to ServiceMultiSelect, không có required validation.

### 7. Component: `PriorityToggle` (presentational — NEW)

**File**: `frontend/features/reception/components/priority-toggle.tsx`

**Props**: `value: boolean`, `onChange: (v: boolean) => void`

**DS Role**: Toggle switch "Ưu tiên".

### 8. Component: `ReasonTextarea` (presentational — NEW)

**File**: `frontend/features/reception/components/reason-textarea.tsx`

**Props**: `value: string`, `onChange: (v: string) => void`, `error?: string`

**DS Role**: Textarea với char counter (max 500, UI-008: show remaining).

### 9. i18n Keys (NEW)

```
reception:form.registration_code_label
reception:form.registration_type_label
reception:form.appointment_date_label
reception:form.priority_label
reception:form.clinic_room_label
reception:form.service_label
reception:form.package_label
reception:form.reason_label
reception:form.submit_button
```

---

## Status
- [ ] Tạo `RegistrationForm` container (scaffold, no submit logic yet)
- [ ] Tạo `RegistrationTypeSelect`
- [ ] Tạo `AppointmentDatePicker` với unmount logic (UI-001)
- [ ] Tạo `ClinicRoomSelect`
- [ ] Tạo `ServiceMultiSelect`
- [ ] Tạo `PackageMultiSelect`
- [ ] Tạo `PriorityToggle`
- [ ] Tạo `ReasonTextarea` với char counter
- [ ] Thêm i18n keys
- [ ] Chạy `pnpm lint`
- [ ] Chạy `pnpm test`

## Acceptance Criteria
1. `AppointmentDatePicker` unmount khi `registration_type = WALK_IN`, mount khi SCHEDULED (UI-001).
2. `ServiceMultiSelect` cho phép chọn nhiều services.
3. `ReasonTextarea` hiển thị remaining chars.
4. Components render đúng với mock data (không cần real API).

## Dependencies
- Task 12 (Reception Store) — store types.
- Task 13 (Visit Data Layer) — types `ClinicRoom`, `Service`, `ServicePackage`.
