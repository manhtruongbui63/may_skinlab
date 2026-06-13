---
task_id: "08"
title: "3c — Customer List Page & Modal Integration"
description: "Compose components and hooks into the /customers route page. Integrate search/filter state sync with URL params."
type: IMPLEMENTATION
phase: 3
status: completed
estimated_effort: M
complexity: medium
risk: low
depends_on: ["07"]
rule_refs: ["PROPOSED_BR:customer-status-active"]
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
- **Applicable Skills**: `bks-fe-implement-feature`, `bks-fe-list-url-state`
- **Implements screens**: S1 (Customer List), S3 (Create/Edit Modal) — see requirement §9.2.

---

# Task 08: 3c — Customer List Page & Modal Integration

## Description
Wire the `CustomerFilters`, `CustomerTable`, and `CustomerFormModal` into the Next.js page `/customers`. Sync the page filters, pagination, and sorting with the browser's URL search parameters to support refresh and shared links.

## Out of Scope
- Customer Detail page (`/customers/[id]`) and its components/data layers (Tasks 09-11).

## Requirements

### 1. Page Integration (NEW) — `frontend/app/(dashboard)/customers/page.tsx`
- Layout: Sticky layout with title, "Add Customer" button, Filters bar, Table component, and Pagination footer.
- State orchestration:
  - Compose query parameters `search`, `gender`, `source`, `status`, `page`, `perPage` and sync them to URL search params using `usePathname`, `useRouter`, `useSearchParams` (per `bks-fe-list-url-state`).
  - Trigger `CustomerFormModal` dialogs on "Add" click, or "Edit" row action.
  - Manage confirmation modal for Delete action.
- UI States:
  - Loading: Skeleton rows in table.
  - Empty: Empty illustration with button to create.
  - Error: Error alert with Retry button.
  - Success: Success toasts using `sonner` when customer is created, updated, status-toggled, or deleted.

**i18n namespace**: `customers.messages.*` (titles, toasts, empty alerts).

## Testing Hints
- **UI Interactions**: verify clicking page numbers updates URL, clicking columns toggles sorting.
- **Assertions**: toast triggers on successful creation/edit.

## Status
- [x] Create dashboard route file `frontend/app/(dashboard)/customers/page.tsx`.
- [x] Implement URL search parameters sync logic using the project hook standards.
- [x] Integrate mutation success handlers to trigger `sonner` notifications.
- [x] Run `pnpm lint`.
- [x] Run `pnpm test:unit` for the integration page.

## Acceptance Criteria
1. Changing filters (search, selects) updates URL parameters instantly and fetches fresh data.
2. Back/Forward browser buttons restore previous filter state.
3. Creating or updating a customer shows a success toast and refreshes table data.

## Error Scenarios
- API query fails → displays error message box with a functional "Thử lại" (Retry) button.

## Dependencies
- Task 07 (Customer List & Form Components).
---
