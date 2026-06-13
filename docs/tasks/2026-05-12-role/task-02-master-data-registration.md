---
task_id: "02"
title: "Role Master Data Registration"
description: "Register user_roles resource in MasterDataService using enum driver so frontend can retrieve role list for dropdowns."
type: IMPLEMENTATION
phase: 1
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: ["01"]
rule_refs:
  - PROPOSED_BR:role-master-data
date: "2026-05-12"
changelog:
  - version: 1.0
    date: "2026-05-12"
    summary: Initial task specification.
---

# Context
- **Requirement**: [02-role.md](../../requirements/02-role.md)
- **Parent Task**: [2026-05-12-role-implementation-tasks.md](../2026-05-12-role-implementation-tasks.md)
- **Applicable Workflows (MANDATORY)**: `/execute-api-task`
- **Applicable Skills (MANDATORY)**: `bks-be-master-data-standard`

---

# Task 02: Role Master Data Registration

## Description
Register the `user_roles` resource in the existing `MasterDataService` using the enum driver. This enables frontend to call `GET /api/master-data?resources[user_roles]={}` and receive a list of available roles for dropdown rendering. References Flow 4 and PROPOSED_BR:role-master-data.

## Out of Scope
- **No new controller or route** — `GET /api/master-data` endpoint already exists.
- **No changes to MasterDataService base class** — only adding a resource entry.
- **No custom driver needed** — uses the standard `DRIVER_ENUM` pattern.

## Current State (Already Exists)
- **Service**: `App\Services\Api\MasterDataService` — extends `Base\MasterDataService`, has `$availableResources` array with existing resources (`user_statuses`, `date_formats`, `genders`, `users`, `active_users`, `users_paginated`, `countries`).
- **Enum**: `App\Enums\UserRole` (created in Task 01) — string-backed with `HasEnumStaticMethods` trait, provides `options()` returning `[['id' => 'admin', 'name' => 'Admin'], ['id' => 'member', 'name' => 'Member']]`.
- **Controller**: `App\Http\Controllers\User\MasterDataController` — has `show()` method that delegates to `MasterDataService`.
- **Route**: `GET /api/master-data` already registered in `routes/api.php`.

## Requirements

### 1. Register user_roles Resource (MODIFY)

**File**: `backend/app/Services/Api/MasterDataService.php`

Add the following entry to the `$availableResources` array:

```php
// ─── Enum Driver — User Roles ──────────────────────────
'user_roles' => [
    'driver' => self::DRIVER_ENUM,
    'target' => \App\Enums\UserRole::class,
],
```

**Placement**: Add after the existing `user_statuses` enum driver entry for logical grouping.

**Expected API Response** when calling `GET /api/master-data?resources[user_roles]={}`:

```json
{
  "user_roles": [
    { "id": "admin", "name": "Admin" },
    { "id": "member", "name": "Member" }
  ]
}
```

### 2. Verification

After registration, verify the response by:
1. Ensure `RoleSeeder` has been run (Task 01 dependency).
2. Call `GET /api/master-data?resources[user_roles]={}` and confirm the response contains both roles.

## API Endpoints Summary

| Method | URI | Description | Auth | Change |
|--------|-----|-------------|------|--------|
| `GET` | `/api/master-data` | Master data resources | guest | **MODIFIED** — added `user_roles` resource |

## Testing Hints
- **Key test scenarios**:
  - `GET /api/master-data?resources[user_roles]={}` returns 200 with array of 2 items.
  - Each item has `id` (string) and `name` (string) keys.
  - Response includes `{"id": "admin", "name": "Admin"}` and `{"id": "member", "name": "Member"}`.
  - Calling without `user_roles` in resources param returns `null` for that resource (existing behavior).
- **Assertions**: Check response structure, count, and individual item values.

## Status
- [ ] Add `user_roles` entry to `MasterDataService::$availableResources` array.
- [ ] Verify `GET /api/master-data?resources[user_roles]={}` returns correct response.
- [ ] Run `php artisan code:format`.
- [ ] Run `php artisan test --filter=MasterDataTest` (or relevant test class).

## Acceptance Criteria
1. `GET /api/master-data?resources[user_roles]={}` returns a JSON array with 2 role items.
2. Each role item has `id` (string value) and `name` (localized label) keys.
3. No changes to existing master data resources — they continue to work as before.

## Error Scenarios
- Resource key not in available → Returns `null` for `user_roles` in response (existing base service behavior).
- Enum class doesn't exist → Throws exception → 500 (prevented by Task 01 dependency).

## Dependencies
- Task 01 (RBAC Database Infrastructure) — `UserRole` enum must exist with `HasEnumStaticMethods` trait and `label()` method.
