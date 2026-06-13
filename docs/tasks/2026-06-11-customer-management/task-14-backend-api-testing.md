---
task_id: "14"
title: "Backend API Testing"
description: "Develop comprehensive PHPUnit feature tests for Customer Read and Write API endpoints, asserting validation, business rules, and error scenarios."
type: IMPLEMENTATION
phase: 4
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: ["04", "05"]
rule_refs: ["PROPOSED_BR:customer-unique-phone", "PROPOSED_BR:customer-status-active", "PROPOSED_BR:outstanding-calculation"]
date: "2026-06-11"
changelog:
  - version: 1.0
    date: "2026-06-11"
    summary: Initial task specification.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-11-customer-management-implementation-tasks.md](../2026-06-11-customer-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-api-task`
- **Applicable Skills**: `bks-be-testing-standard`

---

# Task 14: Backend API Testing

## Description
Write PHPUnit feature tests to fully cover the customer API endpoints. Ensure that all validations, error cases, and business rules are exhaustively tested.

## Requirements

### 1. Test Class (NEW)
- File: `tests/Feature/CustomerApiTest.php`

### 2. Test Coverage
- **Authentication & Authorization**:
  - Unauthenticated requests to any Customer API returns 401.
  - Authenticated user can read, create, update, and delete customers.
- **Read Operations (`GET /api/customers`, `GET /api/customers/{id}`)**:
  - Paginated list output.
  - Filtering by `status`, `gender`, and `source` works.
  - Searching by `fullName` or `phone` works (LIKE query).
  - Single customer detail returns all expected fields, including enums value + labels, and correct `outstanding_amount` calculation (**PROPOSED_BR:outstanding-calculation**).
- **Write Operations (`POST /api/customers`, `PATCH /api/customers/{id}`, `DELETE /api/customers/{id}`)**:
  - Validations for phone number formatting and uniqueness (**PROPOSED_BR:customer-unique-phone**).
  - Proper soft delete behavior (checking `deleted_at` field and ensuring customer doesn't appear in list query but remains in DB).
  - Status patch changes status and records activities.
- **Error Cases**:
  - Return 422 for invalid phone, missing full_name, or invalid enum integer codes.
  - Return 404 if customer ID does not exist on show/update/delete.

## Status
- [ ] Create `tests/Feature/CustomerApiTest.php`.
- [ ] Run `php artisan code:format`.
- [ ] Run `php .agents/scripts/validate-backend.php backend` and resolve structure issues.
- [ ] Run test suite: `php artisan test --filter=CustomerApiTest`.

## Acceptance Criteria
1. Feature tests cover all endpoints (GET, POST, PATCH, DELETE).
2. Tests pass successfully with no deprecations or assertions failures.
3. Database seeding and cleanups run cleanly after each test runs.

## Dependencies
- Task 04 (Customer Read API) & Task 05 (Customer Write API).
---
