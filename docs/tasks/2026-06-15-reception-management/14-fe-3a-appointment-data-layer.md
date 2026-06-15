---
task_id: "14"
title: "3a — Appointment Data Layer (types, repository, hooks)"
description: "Tạo data layer cho Appointment dùng trong Tab 3: IAppointmentRepository, AppointmentRepository, hooks useAppointments/useCancelAppointment/useAppointmentDetail/useCreateVisitFromAppointment."
type: IMPLEMENTATION
phase: 3
status: completed
estimated_effort: S
complexity: low
risk: low
depends_on: ["09"]
rule_refs:
  - "PROPOSED_BR:appointment-cancel-precheck-only"
  - "PROPOSED_BR:appointment-checkin-on-visit"
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
  - version: 1.1
    date: "2026-06-15"
    summary: "Implemented Appointment data layer: types, IReceptionAppointmentRepository, hooks (useAppointments, useAppointmentDetail, useCancelAppointment, useCreateVisitFromAppointment), MSW mocks. Added i18n keys to vi/en/ja.json. Lint passed with 0 errors."
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — §9.4 (Appointment hooks), Flow 6, Flow 9, Flow 10
- **Screens**: S4 (Appointment list), S8 (Cancel dialog), S9 (Detail drawer)
- **Layer**: 3a — Data
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Skills**: `bks-fe-api-integration`, `bks-fe-implement-feature`
- **Feature directory**: `frontend/features/reception/`
- **i18n namespace**: `reception`

---

# Task 14: 3a — Appointment Data Layer

## Description
Tạo appointment data layer cho Tab 3 (S4). Audit `frontend/features/appointment/` trước — có thể tái sử dụng types/repository hiện có, chỉ thêm hooks mới nếu chưa có. Ưu tiên tái sử dụng over tạo mới.

## Out of Scope
- Visit data layer (Task 13).
- Appointment CRUD quản lý (module khác).

---

## Requirements

### 1. Types (AUDIT/EXTEND)

**Audit**: `frontend/features/appointment/types/` — nếu `Appointment` type đã có, tái sử dụng.

Nếu chưa có trong context reception:
```ts
export interface Appointment {
  id: number;
  code: string;
  status: { value: number; label: string };
  appointment_date: string;
  customer: { id: number; code: string; full_name: string; phone: string } | null;
  clinic_room: { id: number; name: string } | null;
  services: { id: number; name: string }[];
  created_at: string;
  // Activity log (cho S9):
  activity_log?: ActivityLogEntry[];
}

export interface ActivityLogEntry {
  id: number;
  description: string;
  causer: { name: string } | null;
  created_at: string;
}

export interface ListAppointmentFilters {
  search?: string;        // code, customer code, name, phone
  date_from?: string;
  date_to?: string;
  status?: number;
  per_page?: number;
  page?: number;
}
```

### 2. Repository (AUDIT/NEW in reception context)

**File**: `frontend/features/reception/services/appointment-repository.ts`

> Nếu `AppointmentRepository` đã tồn tại ở `frontend/features/appointment/`, tạo thin wrapper hoặc extend trong reception context.

**Methods**:
```ts
interface IReceptionAppointmentRepository {
  list(filters: ListAppointmentFilters): Promise<PaginatedAppointments>;
  get(id: number): Promise<Appointment>;
  cancel(id: number): Promise<Appointment>;
  checkIn(data: { appointment_id: number; clinic_room_id?: number; is_priority?: boolean }): Promise<Visit>;
}
```

- `list` → `GET /api/v1/appointments?search=...&date_from=...&status=...`.
- `get` → `GET /api/v1/appointments/{id}`.
- `cancel` → `PATCH /api/v1/appointments/{id}/cancel`.
- `checkIn` → `POST /api/v1/visits/from-appointment`.

### 3. Hooks (NEW)

**File**: `frontend/features/reception/hooks/use-appointments.ts`

```ts
function useAppointments(filters: ListAppointmentFilters): QueryResult<PaginatedAppointments>
function useAppointmentDetail(id: number): QueryResult<Appointment>
function useCancelAppointment(): Mutation
function useCreateVisitFromAppointment(): Mutation  // check-in
```

- `useCancelAppointment`: on success → toast `reception:toasts.appointment_cancelled`, invalidate `useAppointments`.
- `useCreateVisitFromAppointment`: on success → toast `reception:toasts.checkin_success`, invalidate `useAppointments` + `useVisits`.

### 4. MSW Mocks (NEW)

**File**: `frontend/features/reception/mocks/appointment.mock.ts`

Handlers:
- `GET /api/v1/appointments` → paginated fixtures với `BOOKED`, `OVERDUE` statuses.
- `GET /api/v1/appointments/:id` → detail với activity_log.
- `PATCH /api/v1/appointments/:id/cancel` → 200.

### 5. i18n Keys (NEW)

```
toasts.appointment_cancelled
toasts.checkin_success
errors.appointment_not_cancellable
errors.appointment_not_bookable
```

---

## Status
- [ ] Audit `frontend/features/appointment/` để tái sử dụng types/repository
- [ ] Tạo/extend Appointment types cho reception context
- [ ] Tạo `IReceptionAppointmentRepository` + implementation
- [ ] Tạo hooks: `useAppointments`, `useAppointmentDetail`, `useCancelAppointment`, `useCreateVisitFromAppointment`
- [ ] Tạo MSW mocks
- [ ] Thêm i18n keys
- [ ] Chạy `pnpm lint`
- [ ] Chạy `pnpm test`

## Acceptance Criteria
1. `useAppointments` query gọi đúng endpoint với filters.
2. `useCancelAppointment` mutation → toast + invalidate query.
3. `useCreateVisitFromAppointment` mutation gọi `POST /api/v1/visits/from-appointment`.
4. `useAppointmentDetail` load đủ `activity_log`.

## Dependencies
- Task 09 (Appointment Cancel API).
- Task 07 (Visit from-Appointment API) — `checkIn` action.
