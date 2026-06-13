---
task_id: "06"
title: "3a — Customer List & Form Data Layer"
description: "Types, Zod validation schemas, CustomerRepository, and hooks (useCustomers, useCustomerMutations) for screen S1 and S3."
type: IMPLEMENTATION
phase: 3
status: completed
estimated_effort: S
complexity: low
risk: low
depends_on: ["04", "05"]
rule_refs: ["PROPOSED_BR:customer-unique-phone", "PROPOSED_BR:customer-status-active"]
date: "2026-06-11"
changelog:
  - version: 1.0
    date: "2026-06-11"
    summary: Initial task specification.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-11-customer-management-implementation-tasks.md](../2026-06-11-customer-management-implementation-tasks.md)
- **Applicable Workflows**: (none — frontend)
- **Applicable Skills**: `bks-fe-implement-feature`, `bks-fe-api-integration`
- **Implements screens**: S1 (Customer List), S3 (Create/Edit Modal) — see requirement §9.2.

---

# Task 06: 3a — Customer List & Form Data Layer

## Description
Develop the types, Zod schemas for validation, `CustomerRepository`, and custom hooks (`useCustomers`, `useCustomerMutations`) for fetching and mutating customer records.

## Out of Scope
- UI markup, layouts, or component styling (Task 07).
- Page-integration, router hookups, or URL state-syncing (Task 08).

## Requirements

### 1. Types & Zod schemas (NEW) — `frontend/features/customers/schemas/`, `types/`
- **`Customer` type**: `id: number`, `fullName: string`, `phone: string`, `birthDate?: string`, `gender?: { value: number, label: string }`, `address?: string`, `source?: { value: number, label: string }`, `status: { value: number, label: string }`, `outstandingAmount: number`.
- **`customerFilterSchema`**: Zod schema for listing filters: `search?: string`, `gender?: number`, `source?: number`, `status?: number`, `page: number`, `perPage: number`.
- **`customerFormSchema`**: Zod schema for Create/Edit validation:

| Field | Presence | Type | Boundaries | Format | Cross-field Rules | Notes |
|-------|----------|------|------------|--------|-------------------|-------|
| `fullName` | `required` | `string` | `min:1, max:255` | — | — | Dịch lỗi: `customers.errors.fullName_required` |
| `phone` | `required` | `string` | `regex:/^\+?[0-9]{7,15}$/` | — | — | Dịch lỗi: `customers.errors.phone_invalid` |
| `birthDate` | `optional` | `string` | — | `YYYY-MM-DD` | — | Dịch lỗi: `customers.errors.birthDate_invalid` |
| `gender` | `optional` | `number` | `in:1,2,3` | — | — | — |
| `address` | `optional` | `string` | `max:1000` | — | — | — |
| `source` | `optional` | `number` | `in:1,2,3,4,5` | — | — | — |
| `status` | `optional` | `number` | `in:0,1` | — | — | — |

### 2. Repository (NEW) — `frontend/features/customers/services/`
- `CustomerRepository` extending `BaseRepository` with:
  - `list(filters: CustomerFilters): Promise<Paginated<Customer>>` -> `GET /api/customers`
  - `create(data: StoreCustomerInput): Promise<Customer>` -> `POST /api/customers`
  - `update(id: number, data: UpdateCustomerInput): Promise<Customer>` -> `PATCH /api/customers/{id}`
  - `delete(id: number): Promise<void>` -> `DELETE /api/customers/{id}`
- Response verification using Zod; mapping 422 errors via `mapBackendErrors`.

### 3. Hooks (NEW) — `frontend/features/customers/hooks/`
- `useCustomers(filters)`: query hook returning customer paginated list.
- `useCustomerMutations()`: mutation hooks for create, update, and delete operations (using TanStack Query `useMutation` with invalidateQueries).

**i18n namespace**: `customers.errors.*`, `customers.toasts.*`.

## Testing Hints
- **Stores/Composables**: mock `CustomerRepository`; verify hooks return correct state (loading, data, error) and trigger invalidation on mutation success.

## Status
- [x] Create `frontend/features/customers/types.ts` defining types.
- [x] Create `frontend/features/customers/schemas/customer-schema.ts`.
- [x] Create `frontend/features/customers/services/customer-repository.ts`.
- [x] Create `frontend/features/customers/hooks/use-customers.ts` and `use-customer-mutations.ts`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm test:unit` to verify data layer.

## Acceptance Criteria
1. Zod schema correctly validates phone numbers and full names.
2. Repository methods issue exact REST API queries.
3. Mutations successfully trigger cache invalidation.

## Error Scenarios
- API validation fail (422) → correctly parsed by `mapBackendErrors` and thrown for forms to consume.

## Dependencies
- Task 04 (Customer Read API) & Task 05 (Customer Write API).
