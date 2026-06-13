---
task_id: "07"
title: "3b — Customer List & Form Components"
description: "Build CustomerTable, CustomerFilters, and CustomerFormModal presentational and container components using Design System components."
type: IMPLEMENTATION
phase: 3
status: completed
estimated_effort: M
complexity: medium
risk: low
depends_on: ["06"]
rule_refs: []
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
- **Applicable Skills**: `bks-fe-implement-feature`, `bks-fe-ds-sdk-consumer`
- **Implements screens**: S1 (Customer List), S3 (Create/Edit Modal) — see requirement §9.2.

---

# Task 07: 3b — Customer List & Form Components

## Description
Construct the UI components for the customer list and form: `CustomerTable`, `CustomerFilters`, and `CustomerFormModal`. Use `@bks/ds-system-sdk` components, semantic tokens, and layout guidelines.

## Out of Scope
- Direct route page mapping, URL parameter syncing, and state integrations (Task 08).
- Data hooks and repository logic (Task 06).

## Requirements

### 1. UI Components (NEW) — `frontend/features/customers/components/`

- **`CustomerFilters`**:
  - Purpose: Accepts current filters and an `onChange` callback.
  - Inputs: Text input (search), Select dropdowns for Gender, Source, and Status.
  - Reset button to clear all inputs.
- **`CustomerTable`**:
  - Purpose: Renders rows of customer details, loading skeletons, and empty states.
  - Columns: Full Name, Phone, Age (calculated from birthDate), Gender, Source, Outstanding Amount, Status (Switch component), Actions (Menu with View, Edit, Delete).
- **`CustomerFormModal`**:
  - Purpose: Handles both Create and Edit states in a Dialog/Modal.
  - Inputs: Full Name (input), Phone (input), Birth Date (date picker/input), Gender (select), Source (select), Address (textarea).
  - Handles submitting state (disabled submit button, loading spinner).

**DS Components used**: `@bks/ds-system-sdk` components (Table, Dialog, Input, Select, Switch, Button, Badge).

**i18n namespace**: `customers.labels.*` (table headers, placeholders, button labels).

## Testing Hints
- **UI Interactions**: verify modal opens on click, checks form fields are rendered. Verify switch component status triggers callback.
- **Mocks**: supply mock lists and empty lists to verify empty/loading states.

## Status
- [x] Create `frontend/features/customers/components/customer-filters.tsx`.
- [x] Create `frontend/features/customers/components/customer-table.tsx`.
- [x] Create `frontend/features/customers/components/customer-form-modal.tsx`.
- [x] Run `pnpm lint` — 0 errors.
- [ ] Run `pnpm test:unit` for components. (deferred to Task 08 integration)

## Acceptance Criteria
1. UI components build without styling errors and respect typography and grid roles from BKS DS.
2. Forms validation errors are displayed inline beneath fields.
3. Switch toggle callback triggers with the correct customer ID and new status.

## Error Scenarios
- Invalid fields in form modal → shows corresponding red text errors inline.

## Dependencies
- Task 06 (Customer List & Form Data Layer) — Defines Zod schemas and types consumed by components.
---
