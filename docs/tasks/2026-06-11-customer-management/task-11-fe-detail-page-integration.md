---
task_id: "11"
title: "3c — Customer Detail Page Integration"
description: "Integrate components and hooks into the dynamic page `/customers/[id]` with support for parallel tab fetching."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: M
complexity: medium
risk: low
depends_on: ["10"]
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
- **Applicable Skills**: `bks-fe-implement-feature`
- **Implements screens**: S2 (Customer Detail Page) — see requirement §9.2.

---

# Task 11: 3c — Customer Detail Page Integration

## Description
Integrate the customer detail profile card and parallel sub-resource tabs into the Next.js App Router dynamic page `/customers/[id]`.

## Out of Scope
- Listing page integration (`/customers`) (Task 08).

## Requirements

### 1. Route Page Integration (NEW) — `frontend/app/(dashboard)/customers/[id]/page.tsx`
- Layout: Split layout: Left column contains the `CustomerProfileCard`, Right column contains the `Tabs` component with tab triggers: `Thông tin chung` (Visits), `Liệu trình` (Treatment Plans), `Hoá đơn & Công nợ` (Invoices).
- State Orchestration:
  - Extract the customer `id` from the URL path.
  - Run query hooks for the profile detail and sub-resource data in parallel.
  - Sync active tab with search parameter `?tab=visits` (defaulting to visits/general) to preserve selected tab on page refresh.
- UI States:
  - Loading: Skeleton animation card and tab blocks.
  - Error: Error boundary or fallback text alerting if the main detail fetch fails.
  - Empty: Empty states inside each individual tab.

**i18n namespace**: `customers.messages.*` (loading_detail, tab_errors).

## Testing Hints
- **UI Interactions**: verify clicking tabs updates url search params, refreshing page loads the selected tab directly.

## Status
- [ ] Create route file `frontend/app/(dashboard)/customers/[id]/page.tsx`.
- [ ] Integrate tab parameter tracking and dynamic panel rendering.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm test:unit`.

## Acceptance Criteria
1. Detail page successfully loads based on url `id` param.
2. Tabs loading is independent; failing visits query doesn't crash the invoice query.
3. Refreshing the page preserves the currently active tab.

## Error Scenarios
- Customer ID not found → renders 404 page.

## Dependencies
- Task 10 (Customer Detail Components).
---
