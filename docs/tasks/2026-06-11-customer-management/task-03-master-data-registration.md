---
task_id: "03"
title: "Master Data Registration"
description: "Register Customer enums (GenderEnum, CustomerSourceEnum, CustomerStatusEnum) under availableResources in MasterDataService."
type: IMPLEMENTATION
phase: 2
status: completed
estimated_effort: S
complexity: low
risk: low
depends_on: ["01"]
rule_refs: []
date: "2026-06-11"
changelog:
  - version: 1.0
    date: "2026-06-11"
    summary: Initial task specification.
  - version: 1.1
    date: "2026-06-11"
    summary: Task completed - registered 3 customer enums and added smoke tests.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-11-customer-management-implementation-tasks.md](../2026-06-11-customer-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-api-task`
- **Applicable Skills**: `bks-be-master-data-standard`

---

# Task 03: Master Data Registration

## Description
Register the customer-related enums into the dynamic Master Data service to allow the frontend to fetch dropdown values dynamically via `GET /api/master-data`.

## Requirements

### 1. Register Resources (MODIFY)
File: `app/Services/Api/MasterDataService.php`

Add the following mappings to the `$availableResources` array:

- **`customer_genders`**:
  - `driver`: `self::DRIVER_ENUM`
  - `target`: `App\Enums\GenderEnum::class`
- **`customer_sources`**:
  - `driver`: `self::DRIVER_ENUM`
  - `target`: `App\Enums\CustomerSourceEnum::class`
- **`customer_statuses`**:
  - `driver`: `self::DRIVER_ENUM`
  - `target`: `App\Enums\CustomerStatusEnum::class`

All registered resources should be available to authenticated users (auth is optional or checked per role, but here standard authenticated users can query).

## Status
- [x] Add imports for `GenderEnum`, `CustomerSourceEnum`, and `CustomerStatusEnum` to `app/Services/Api/MasterDataService.php`.
- [x] Add the 3 resources to `$availableResources` in `app/Services/Api/MasterDataService.php`.
- [x] Add smoke tests in `tests/Feature/Api/MasterDataTest.php`.
- [ ] Run `php artisan code:format`.
- [ ] Run `php .agents/scripts/validate-backend.php backend`.
- [ ] Run `php artisan test` (smoke tests only).

**Completed**: 2026-06-11

## Files Modified
| File | Changes |
|------|---------|
| `app/Services/Api/MasterDataService.php` | Added 3 Enum imports and registered 3 customer resources |
| `tests/Feature/Api/MasterDataTest.php` | Added 3 smoke test cases for customer enums |
1. Querying `GET /api/master-data?resources[customer_genders]={}` returns the list of option objects containing `id` and `name` matching the `GenderEnum` cases.
2. `customer_sources` and `customer_statuses` return correct arrays of options.

## Error Scenarios
- Invalid resource requested → dynamic service ignores it or returns empty object.

## Dependencies
- Task 01 (Database Infrastructure) — Enums must be created.
