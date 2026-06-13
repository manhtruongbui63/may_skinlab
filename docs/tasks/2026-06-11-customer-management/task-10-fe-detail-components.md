---
task_id: "10"
title: "3b — Customer Detail Components"
description: "Build CustomerProfileCard, VisitsTab, TreatmentPlansTab, and InvoicesTab using Design System elements for screen S2."
type: IMPLEMENTATION
phase: 3
status: completed
estimated_effort: M
complexity: medium
risk: low
depends_on: ["09"]
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
- **Implements screens**: S2 (Customer Detail Page) — see requirement §9.2.

---

# Task 10: 3b — Customer Detail Components

## Description
Develop the tab views and information panels for the patient detail page: `CustomerProfileCard`, `VisitsTab`, `TreatmentPlansTab`, and `InvoicesTab` utilizing the DS tokens and layout spacing rules.

## Out of Scope
- URL route page orchestration (`page.tsx`) and parallel request sync (Task 11).
- Data hooks and API repository methods (Task 09).

## Requirements

### 1. UI Components (NEW) — `frontend/features/customers/components/`

- **`CustomerProfileCard`**:
  - Displays patient avatar, name, age, gender, contact number, source, address, and status.
  - Large display of `outstandingAmount` highlighted in color matching BKS guidelines (e.g. Amber/Red for unpaid balances).
- **`VisitsTab`**:
  - Displays a timeline or list of visits. Shows visit date, attending doctor, diagnosis, and notes.
- **`TreatmentPlansTab`**:
  - Table showing treatment plan names, start/end dates, and status badges.
- **`InvoicesTab`**:
  - Table showing invoices. Columns: invoice number, issue date, amount, paid amount, outstanding, status.

**DS Components used**: `@bks/ds-system-sdk` components (Card, Table, Timeline, Badge, Button, Tabs).

**i18n namespace**: `customers.labels.*` (tab labels, fields, headers).

## Testing Hints
- **UI Interactions**: verify tabs switch content and display empty messages if lists are empty.
- **Mocks**: supply mock arrays for visits, plans, and invoices to check layout rendering.

## Status
- [x] Create `frontend/features/customers/components/customer-profile-card.tsx`.
- [x] Create `frontend/features/customers/components/visits-tab.tsx`.
- [x] Create `frontend/features/customers/components/treatment-plans-tab.tsx`.
- [x] Create `frontend/features/customers/components/invoices-tab.tsx`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm test:unit`.

## Acceptance Criteria
1. Profile details and outstanding debt are clearly readable and use BKS Design System spacing tokens.
2. Tables in tabs render loading states when data is fetched.
3. Appropriate status badges are assigned (e.g. Paid = Green, Overdue = Red).

## Error Scenarios
- Invoice list empty → renders custom empty state inside the tab.

## Dependencies
- Task 09 (Customer Detail Data Layer).
---
