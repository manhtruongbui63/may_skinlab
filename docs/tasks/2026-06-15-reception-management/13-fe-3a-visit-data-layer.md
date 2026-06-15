---
task_id: "13"
title: "3a — Visit Data Layer (types, Zod schemas, repository, hooks)"
description: "Tạo toàn bộ data layer cho Visit: TypeScript types, Zod schemas (StoreVisitSchema), VisitRepository, 4 hooks (useCreateVisit, useVisits, useCancelVisit, useDeleteVisit), và MSW mocks."
type: IMPLEMENTATION
phase: 3
status: completed
estimated_effort: M
complexity: medium
risk: low
depends_on: ["06", "07", "08"]
rule_refs:
  - "PROPOSED_BR:visit-code-daily-seq"
  - "PROPOSED_BR:walkin-requires-room-service"
  - "PROPOSED_BR:scheduled-future-date-only"
  - "PROPOSED_BR:visit-list-date-same-month"
  - "PROPOSED_BR:visit-list-no-future-date"
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
  - version: 1.1
    date: "2026-06-15"
    summary: "Implemented Visit data layer: types, Zod schemas, VisitRepository, hooks, MSW mocks. Added i18n keys to vi/en/ja.json. Lint passed with 0 errors."
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — §9.4, §9.5 (Visit Zod schema), §9.6 (UI states S1, S3)
- **Screens**: S1 (create), S3 (list, cancel, delete)
- **Layer**: 3a — Data
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Skills**: `bks-fe-api-integration`, `bks-fe-implement-feature`
- **Feature directory**: `frontend/features/reception/`
- **i18n namespace**: `reception`

---

# Task 13: 3a — Visit Data Layer

## Description
Tạo Visit data layer: types, Zod validation schema cho form tạo phiếu, IVisitRepository interface + VisitRepository implementation, và các hooks TanStack Query. Đây là prerequisite cho Tasks 16 (form components), 18 (examination tab components), 20, 21 (page integration).

---

## Requirements

### 1. Types (NEW)

**File**: `frontend/features/reception/types/index.ts` (extend từ Task 12)

```ts
export interface Visit {
  id: number;
  code: string;
  queue_number: number;
  registration_type: { value: number; label: string };
  status: { value: number; label: string };
  is_priority: boolean;
  visited_at: string;
  appointment_date: string | null;
  reason: string | null;
  customer: { id: number; code: string; full_name: string } | null;
  clinic_room: { id: number; name: string } | null;
  services: { id: number; name: string }[];
  packages: { id: number; name: string }[];
  created_at: string;
}

export interface PaginatedVisits {
  data: Visit[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export interface ListVisitFilters {
  from?: string;    // ISO date
  to?: string;      // ISO date
  status?: number;  // VisitStatusEnum value
  per_page?: number;
  page?: number;
}
```

### 2. Zod Schema: `StoreVisitSchema` (NEW)

**File**: `frontend/features/reception/schemas/store-visit.schema.ts`

**Schema fields** (từ §9.5):

| Field | Zod Type | Client Rule | i18n Error Key |
|-------|----------|-------------|----------------|
| `registration_type` | `z.number()` | required, enum [1,2] | `reception:errors.registration_type_required` |
| `appointment_date` | `z.string().nullable()` | if type=2: required, date > today | `reception:errors.date_must_be_future` |
| `is_priority` | `z.boolean()` | optional, default false | — |
| `clinic_room_id` | `z.number().nullable()` | if type=1: required | `reception:errors.room_required` |
| `service_ids` | `z.array(z.number())` | if type=1: min length 1 | `reception:errors.service_required` |
| `service_package_ids` | `z.array(z.number())` | optional, default [] | — |
| `reason` | `z.string().nullable()` | optional, max 500 | `reception:errors.reason_too_long` |
| `customer_id` | `z.number().nullable()` | optional | — |

Cross-field refinements:
- `registration_type = 1 (WALK_IN)` → `clinic_room_id` required.
- `registration_type = 1` → `service_ids.length >= 1`.
- `registration_type = 2 (SCHEDULED)` → `appointment_date` required, must be future date.

### 3. Interface & Repository (NEW)

**File**: `frontend/features/reception/services/i-visit-repository.ts`
```ts
interface IVisitRepository {
  create(data: StoreVisitInput): Promise<Visit>;
  list(filters: ListVisitFilters): Promise<PaginatedVisits>;
  cancel(id: number): Promise<Visit>;
  delete(id: number): Promise<void>;
}
```

**File**: `frontend/features/reception/services/visit-repository.ts`
- `extends BaseRepository`, `implements IVisitRepository`.
- `create` → `POST /api/v1/visits`.
- `list` → `GET /api/v1/visits?...`.
- `cancel` → `PATCH /api/v1/visits/{id}/cancel`.
- `delete` → `DELETE /api/v1/visits/{id}`.
- 422 errors → `mapBackendErrors(error)`.

### 4. Hooks (NEW)

**File**: `frontend/features/reception/hooks/use-visits.ts`

```ts
// Hooks signatures:
function useCreateVisit(): { mutate: (data: StoreVisitInput) => void; isPending: boolean; error: ... }
function useVisits(filters: ListVisitFilters): { data: PaginatedVisits | undefined; isLoading: boolean; ... }
function useCancelVisit(): { mutate: (id: number) => void; isPending: boolean; ... }
function useDeleteVisit(): { mutate: (id: number) => void; isPending: boolean; ... }
```

- `useCreateVisit`: mutation, on success → toast `reception:toasts.visit_created`, invalidate `useVisits`.
- `useVisits`: query với TanStack Query `queryKey: ['visits', filters]`.
- `useCancelVisit`: mutation, on success → toast `reception:toasts.visit_cancelled`, invalidate `useVisits`.
- `useDeleteVisit`: mutation, on success → toast `reception:toasts.visit_deleted`, invalidate `useVisits`.

### 5. MSW Mocks (NEW)

**File**: `frontend/features/reception/mocks/visit.mock.ts`

Handlers:
- `POST /api/v1/visits` → 201 với Visit fixture.
- `GET /api/v1/visits` → 200 với paginated fixtures.
- `PATCH /api/v1/visits/:id/cancel` → 200.
- `DELETE /api/v1/visits/:id` → 204.
- `POST /api/v1/visits/from-appointment` → 201 (dùng trong Task 14).

### 6. i18n Keys (NEW)

**File**: `messages/{locale}/reception.json` (thêm keys):
```
toasts.visit_created
toasts.visit_cancelled
toasts.visit_deleted
errors.registration_type_required
errors.date_must_be_future
errors.room_required
errors.service_required
errors.reason_too_long
```

---

## Status
- [ ] Tạo/extend types Visit, PaginatedVisits, ListVisitFilters
- [ ] Tạo `StoreVisitSchema` với cross-field refinements
- [ ] Tạo `IVisitRepository` interface
- [ ] Tạo `VisitRepository` với `mapBackendErrors`
- [ ] Tạo hooks: `useCreateVisit`, `useVisits`, `useCancelVisit`, `useDeleteVisit`
- [ ] Tạo MSW mocks
- [ ] Thêm i18n keys vào `messages/vi/reception.json` và `messages/en/reception.json`
- [ ] Chạy `pnpm lint`
- [ ] Chạy `pnpm test`

## Acceptance Criteria
1. `StoreVisitSchema` validate đúng WALK_IN (cần room + service) và SCHEDULED (cần future date).
2. `useCreateVisit` mutation gọi đúng `POST /api/v1/visits`.
3. `useVisits` query gọi đúng `GET /api/v1/visits?from=...&to=...`.
4. MSW mocks intercept đúng các endpoints.
5. 422 errors từ BE → `mapBackendErrors` → field errors.

## Dependencies
- Task 06, 07, 08 (Visit API) — cần biết endpoint contracts.
- Task 12 (Reception Store) — types có thể extend.
