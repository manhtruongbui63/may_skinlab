---
task_id: "09"
title: "3a — Customer Detail Data Layer"
description: "Types, Zod schemas, and TanStack Query hooks for retrieving customer details, visits, treatment plans, and invoices (Screen S2)."
type: IMPLEMENTATION
phase: 3
status: completed
estimated_effort: S
complexity: low
risk: low
depends_on: ["04"]
rule_refs: ["PROPOSED_BR:outstanding-calculation"]
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
- **Implements screens**: S2 (Customer Detail Page) — see requirement §9.2.

---

# Task 09: 3a — Customer Detail Data Layer

## Description
Develop the data layer for the Customer Detail page (S2): the detail types (including visits, treatment plans, and invoices), Zod verification schemas, and the query hooks.

## Out of Scope
- UI markup, tabs layouts, or component styling (Task 10).
- Page-integration, router hookups, or tabs state orchestrations (Task 11).

## Requirements

### 1. Types & Zod schemas (NEW) — `frontend/features/customers/schemas/`, `types/`
- **`CustomerDetail` type**: Extends `Customer` with nested or related arrays:
  - `visits: Visit[]`
  - `treatmentPlans: TreatmentPlan[]`
  - `invoices: Invoice[]`
- **`Visit` type**: `id: number`, `visitDate: string`, `doctorName: string`, `notes?: string`, `diagnosis?: string`.
- **`TreatmentPlan` type**: `id: number`, `planName: string`, `status: string`, `startDate: string`, `endDate?: string`.
- **`Invoice` type**: `id: number`, `invoiceNumber: string`, `amount: number`, `paidAmount: number`, `outstandingAmount: number`, `issueDate: string`, `status: string`.

### 2. Repository (MODIFY) — `frontend/features/customers/services/`
Extend `CustomerRepository` with the following method signatures (which can query the single customer detail API or stubbed sub-routes):
- `detail(id: number): Promise<CustomerDetail>` -> `GET /api/customers/{id}`
- `visits(id: number): Promise<Visit[]>` -> `GET /api/customers/{id}/visits` (or nested from detail)
- `treatmentPlans(id: number): Promise<TreatmentPlan[]>` -> `GET /api/customers/{id}/treatment-plans`
- `invoices(id: number): Promise<Invoice[]>` -> `GET /api/customers/{id}/invoices`

### 3. Hooks (NEW) — `frontend/features/customers/hooks/`
- `useCustomerDetail(id: number)`: Fetch general details.
- `useCustomerVisits(id: number)`: Fetch visits.
- `useCustomerTreatmentPlans(id: number)`: Fetch plans.
- `useCustomerInvoices(id: number)`: Fetch invoices.
- Mocks: Setup MSW handlers for mock visits, plans, and invoices to support frontend loading.

**i18n namespace**: `customers.toasts.*` (detail_load_failed).

## Testing Hints
- **Stores/Composables**: mock the repository; assert the hooks load sub-resources in parallel and surface errors when API fails.

## Status
- [x] Extend types in `frontend/features/customers/types.ts`.
- [x] Add detail schemas in `frontend/features/customers/schemas/customer-schema.ts`.
- [x] Extend `CustomerRepository` service file.
- [x] Create hooks `use-customer-detail.ts`, `use-customer-visits.ts`, etc.
- [x] Run `pnpm lint`.
- [x] Run `pnpm test:unit`.

## Acceptance Criteria
1. Custom hooks retrieve data in parallel from their respective repository endpoints.
2. Zod parsing handles missing sub-resource data gracefully.

## Error Scenarios
- Sub-resource fails (e.g. visits query throws 500) → main detail page still loads, only visits tab shows error.

## Dependencies
- Task 04 (Customer Read API) — provides `GET /api/customers/{id}`.
---
