---
task_id: "15"
title: "System Documentation Update"
description: "Register the business rules in the central BR registry and create logic documentation for the Customer module."
type: DOCUMENTATION
phase: 4
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: ["13"]
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
- **Applicable Workflows**: (none — documentation)
- **Applicable Skills**: `bks-doc-logic-standard`

---

# Task 15: System Documentation Update

## Description
Finalize the implementation by moving all `PROPOSED_BR` definitions to the centralized `docs/system/br-registry.md` and adding system intelligence logic docs for the Customer module.

## Requirements

### 1. Register Business Rules (MODIFY)
File: `docs/system/br-registry.md`
Register the following rules:
- **`BR-CUST-001`**: Customer unique phone (formerly `PROPOSED_BR:customer-unique-phone`)
- **`BR-CUST-002`**: Customer active status (formerly `PROPOSED_BR:customer-status-active`)
- **`BR-CUST-003`**: Outstanding amount calculation (formerly `PROPOSED_BR:outstanding-calculation`)

Replace all occurrences of these `PROPOSED_BR` references inside implementation files, requirements, and logic docs with the assigned `BR-CUST-xxx` codes.

### 2. Logic Documentation (NEW)
Create documentation: `docs/logic/customer/customer-management.md`:
- Summarize flows: creation, filter listing, soft delete, status patching, and job alerts.
- Document classes: `CustomerController`, `CustomerService`, enums, and repository references.
- Link to relevant business rules.
- Maintain formatting in accordance with the project's logic document standard.

### 3. Logic Index (MODIFY)
Update `docs/logic/index.md` to list the newly added customer management logic document.

## Status
- [ ] Add the three rules to `docs/system/br-registry.md`.
- [ ] Replace `PROPOSED_BR` strings inside markdown files.
- [ ] Create `docs/logic/customer/customer-management.md`.
- [ ] Add link to index in `docs/logic/index.md`.
- [ ] Check links inside files are clickable and resolve.

## Acceptance Criteria
1. The BR registry displays correct status, scopes, and source files.
2. The logic document accurately captures final implementation classes, DTOs, and workflows.
3. No lingering `PROPOSED_BR` references exist.
---
