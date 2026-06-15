---
task_id: "12"
title: "3a — Reception Store + Master Data Hook"
description: "Tạo Zustand store useReceptionFormStore (persistent Cột 1 state across tabs) và hook useReceptionMasterData (batch fetch clinic_rooms, services, service_packages)."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: ["04"]
rule_refs: []
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — §9.4, §9.8 (Global State, Master Data batch)
- **Screens**: S1 (RegistrationForm)
- **Layer**: 3a — Data
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Skills**: `bks-fe-api-integration`, `bks-fe-implement-feature`
- **Feature directory**: `frontend/features/reception/`
- **i18n namespace**: `reception`

---

# Task 12: 3a — Reception Store + Master Data Hook

## Description
Tạo `useReceptionFormStore` (Zustand) để lưu state form Cột 1 persistent khi chuyển tab (UI-002), và hook `useReceptionMasterData()` để batch-fetch lookup data cho S1 dropdowns. Đây là foundation cho Task 16 (RegistrationForm components) và Task 20 (Page Integration).

## Out of Scope
- Visit/Appointment repository, hooks (Tasks 13, 14).
- RegistrationForm component (Task 16).
- Page integration (Task 20).

---

## Requirements

### 1. Zustand Store: `useReceptionFormStore` (NEW)

**File**: `frontend/features/reception/stores/reception-form-store.ts`

**State shape**:
```ts
interface ReceptionFormState {
  registrationType: number | null;      // RegistrationTypeEnum value
  appointmentDate: string | null;       // ISO date string
  isPriority: boolean;
  clinicRoomId: number | null;
  serviceIds: number[];
  servicePackageIds: number[];
  reason: string;
  customerId: number | null;
  // Actions:
  setField: (field: keyof ReceptionFormState, value: unknown) => void;
  reset: () => void;
}
```

- Default state: tất cả null/false/[].
- Store KHÔNG persist giữa page reload (session-only, không dùng `persist` middleware).
- Action `reset()` để clear form sau khi submit thành công.

### 2. Hook: `useReceptionMasterData()` (NEW)

**File**: `frontend/features/reception/hooks/use-reception-master-data.ts`

**Signature**:
```ts
function useReceptionMasterData(): {
  clinicRooms: ClinicRoom[];
  services: Service[];
  servicePackages: ServicePackage[];
  isLoading: boolean;
  error: Error | null;
}
```

**Consumes**: `GET /api/v1/master-data?resources[]=clinic_rooms&resources[]=services&resources[]=service_packages`

**Behavior**: fetch once khi mount, cache via TanStack Query (`staleTime: Infinity` — master data hiếm thay đổi).

### 3. Types (NEW)

**File**: `frontend/features/reception/types/index.ts`

```ts
export interface ClinicRoom { id: number; name: string; code: string | null; }
export interface Service { id: number; name: string; code: string | null; price: string | null; }
export interface ServicePackage { id: number; name: string; code: string | null; price: string | null; }
```

### 4. MSW Mock (NEW)

**File**: `frontend/features/reception/mocks/master-data.mock.ts`

Mock handler cho `GET /api/v1/master-data` trả về fixture data gồm 2-3 clinic_rooms, 3-5 services, 2-3 service_packages.

### 5. i18n

Không có i18n mới trong task này (labels từ BE response `name` field).

---

## Status
- [x] Tạo types `ClinicRoom`, `Service`, `ServicePackage` trong `frontend/features/reception/types/`
- [x] Tạo `useReceptionFormStore` Zustand store
- [x] Tạo `useReceptionMasterData` hook (với TanStack Query)
- [x] Tạo MSW mock cho master-data endpoint
- [x] Chạy `pnpm lint` ✓ (9 warnings từ các file khác, 0 errors từ feature mới)
- [x] Chạy `pnpm test`

status: completed

## Acceptance Criteria
1. `useReceptionFormStore` lưu state và `setField` cập nhật đúng field.
2. `reset()` xóa toàn bộ state về default.
3. `useReceptionMasterData()` gọi endpoint đúng URL với params.
4. MSW mock trả về fixture data trong test environment.

## Dependencies
- Task 04 (Master Data Registration) — endpoint phải tồn tại.
