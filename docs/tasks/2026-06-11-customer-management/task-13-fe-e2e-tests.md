---
task_id: "13"
title: "3d — Frontend E2E Tests"
description: "Write Playwright E2E tests for the customer CRUD flow: list, filter, create, edit, toggle status, detail tabs, and soft delete."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: ["12"]
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
- **Applicable Skills**: `bks-fe-create-tc-flow`
- **Implements screens**: S1, S2, S3 — see requirement §9.2.

---

# Task 13: 3d — Frontend E2E Tests

## Description
Develop Playwright End-to-End tests simulating complete customer lifecycles on the dynamic browser interface.

## Out of Scope
- Vitest unit tests (Task 12).

## Requirements

### 1. Page Object Model (NEW)
- File: `frontend/e2e/pages/customer-page.ts`
- Encapsulate page elements: search filters, row select cells, form fields in modal, dialog submit, and detail tabs triggers.

### 2. Test Scenarios (Minimum 10 Test Cases)
- **TC-01**: Authenticated user navigates to `/customers`, redirects/shows title.
- **TC-02**: Open create modal, fill form fields, submit → verifies success toast and new row added.
- **TC-03**: Form validation assertions (submitting empty forms displays error text).
- **TC-04**: Edit customer information, submit → verifies details updated in table.
- **TC-05**: Status toggle interaction updates switch state and displays correct toast.
- **TC-06**: Filter search by keyword or dropdown category refetches correct records.
- **TC-07**: Navigating to details `/customers/[id]` displays correct profile card.
- **TC-08**: Switching tabs (visits, treatment plans, invoices) renders sub-resource tables.
- **TC-09**: Soft-deleting a customer displays verification dialog, confirms, row disappears from list.
- **TC-10**: Pagination controls retrieve correct page results.

## Status
- [ ] Create `frontend/e2e/pages/customer-page.ts`.
- [ ] Create E2E spec file `frontend/e2e/customer-flow.spec.ts`.
- [ ] Run E2E tests: `pnpm test:e2e`.

## Acceptance Criteria
1. All 10 browser scenarios complete successfully on local container runner.
2. Screenshots/traces are preserved on test failure.

## Dependencies
- Task 12 (Frontend Unit & Integration Tests).
---
