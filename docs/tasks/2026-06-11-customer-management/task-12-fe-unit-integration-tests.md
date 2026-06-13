---
task_id: "12"
title: "3d — Frontend Unit & Integration Tests"
description: "Write unit and integration test scripts using Vitest and React Testing Library for customer filters, table, forms, stores, and hooks."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: ["08", "11"]
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
- **Applicable Skills**: `bks-fe-create-tc-component`
- **Implements screens**: S1, S2, S3 — see requirement §9.2.

---

# Task 12: 3d — Frontend Unit & Integration Tests

## Description
Develop unit and integration tests (Vitest + React Testing Library) to verify validation rules, hooks, components layout design alignment, and stores.

## Out of Scope
- Playwright E2E browser tests (Task 13).

## Requirements

### 1. Test Targets (NEW)
Create the following test specs:
- `frontend/features/customers/schemas/customer-schema.test.ts` (validate fields, telephone regex validation rules).
- `frontend/features/customers/hooks/use-customers.test.tsx` (MSW query mock response tests).
- `frontend/features/customers/components/customer-form-modal.test.tsx` (Form inputs validation, button states).
- `frontend/features/customers/components/customer-table.test.tsx` (renders rows, status switches, edit buttons).

### 2. Test Specifications (Minimum 20 Test Cases)
- **10 Unit / Logic tests (VT)**:
  - Zod validation for correct/incorrect phone numbers, blank full name.
  - Hook state transitions (idle -> loading -> success).
  - Mutating triggers (create/update API payloads).
- **10 Design System / Layout verification tests (VT-DS)**:
  - Assert that typography and badge colors map correctly for statuses (ACTIVE vs INACTIVE).
  - Check Dialog modal ARIA attributes and focus traps.
  - Assert sticky table header styling is applied.

## Status
- [ ] Create test files under `frontend/features/customers/` mirroring source locations.
- [ ] Implement MSW mock handlers for customers APIs.
- [ ] Run `pnpm test:unit` to execute all tests.

## Acceptance Criteria
1. At least 20 test cases run and pass.
2. Code coverage on `customers` feature directory is verified.

## Dependencies
- Task 08 (Customer List Integration) & Task 11 (Customer Detail Integration).
---
