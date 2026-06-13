---
task_id: "03"
title: "Auth API — Role Assignment & Exposure"
description: "Modify AuthService::register() to assign member role on registration, and update MeResource to include role field in GET /auth/me response."
type: IMPLEMENTATION
phase: 2
status: pending
estimated_effort: M
complexity: low
risk: low
depends_on: ["01", "02"]
rule_refs:
  - PROPOSED_BR:default-member-role
  - PROPOSED_BR:role-api-exposure
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
- **Applicable Skills (MANDATORY)**: `bks-be-api-standard`

---

# Task 03: Auth API — Role Assignment & Exposure

## Description
Modify the existing `AuthService::register()` method to automatically assign the `member` role to newly registered users via Spatie's `assignRole()`. Update `MeResource` to include a `role` field in the `GET /auth/me` response, exposing the user's current role. References Flow 1, Flow 3, PROPOSED_BR:default-member-role, and PROPOSED_BR:role-api-exposure.

## Out of Scope
- **No changes to registration request/response structure** — the `POST /auth/register` endpoint response remains unchanged (role info is retrieved via `GET /auth/me`).
- **No middleware changes** — route-level authorization is deferred to future feature implementations.
- **No admin user creation** — handled by `RoleSeeder` in Task 01.
- **No frontend changes** — deferred to future tasks.

## Current State (Already Exists)
- **Service**: `App\Services\Api\AuthService` — `register(RegisterData $dto): User` creates user with `status = UserStatus::ACTIVE`. Currently does NOT assign any role.
- **Resource**: `App\Http\Resources\Auth\MeResource` — returns `['name' => ..., 'email' => ...]`. Currently does NOT include role.
- **Controller**: `App\Http\Controllers\User\AuthController` — `register()` calls `AuthService::register()`, `me()` returns `MeResource`.
- **Routes**: `POST /api/auth/register` and `GET /api/auth/me` already registered.
- **Model**: `User` model has `HasRoles` trait (added in Task 01).

## Requirements

### 1. AuthService — Add Role Assignment (MODIFY)

**File**: `backend/app/Services/Api/AuthService.php`

**Current code** (lines 48-61):
```php
public function register(RegisterData $dto): User
{
    $newUser = User::query()->create([
        'name' => $dto->name,
        'email' => Str::lower($dto->email),
        'password' => Hash::make($dto->password),
        'status' => UserStatus::ACTIVE,
    ]);

    if (!$newUser) {
        throw new InputException(trans('auth.register_fail'));
    }

    return $newUser;
}
```

**Updated code**:
```php
public function register(RegisterData $dto): User
{
    $newUser = User::query()->create([
        'name' => $dto->name,
        'email' => Str::lower($dto->email),
        'password' => Hash::make($dto->password),
        'status' => UserStatus::ACTIVE,
    ]);

    if (!$newUser) {
        throw new InputException(trans('auth.register_fail'));
    }

    // PROPOSED_BR:default-member-role — Assign default member role
    $newUser->assignRole(UserRole::MEMBER->value);

    return $newUser;
}
```

**Changes**:
1. Add import: `use App\Enums\UserRole;`
2. Add `$newUser->assignRole(UserRole::MEMBER->value);` after user creation and before return.
3. This inserts a record into `model_has_roles` table linking the new user to the `member` role.

**State Changes**:
- `model_has_roles` = INSERT `{role_id: member_role_id, model_type: App\Models\User, model_id: new_user_id}`

### 2. MeResource — Add Role Field (MODIFY)

**File**: `backend/app/Http/Resources/Auth/MeResource.php`

**Current code** (lines 16-24):
```php
public function toArray(Request $request): array
{
    $data = $this->resource;

    return [
        'name' => $data->name,
        'email' => $data->email,
    ];
}
```

**Updated code**:
```php
public function toArray(Request $request): array
{
    $data = $this->resource;

    return [
        'name' => $data->name,
        'email' => $data->email,
        'role' => $data->getRoleNames()->first(),
    ];
}
```

**Changes**:
1. Add `'role' => $data->getRoleNames()->first()` to the return array.
2. `$data->getRoleNames()` returns a `Collection` of role name strings. `->first()` returns the first role name or `null` if no roles assigned.

**Expected API Response** for `GET /auth/me`:
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "role": "member"
}
```

**For user without role**:
```json
{
  "name": "Bob",
  "email": "bob@example.com",
  "role": null
}
```

**For admin user**:
```json
{
  "name": "Admin",
  "email": "admin@example.com",
  "role": "admin"
}
```

## API Endpoints Summary

| Method | URI | Description | Change | Auth |
|--------|-----|-------------|--------|------|
| `POST` | `/api/auth/register` | Register new user | **MODIFIED** — assigns `member` role | guest |
| `GET` | `/api/auth/me` | Get current user info | **MODIFIED** — adds `role` field | api |

## Testing Hints
- **Factory needs**: `UserFactory` — ensure it creates users without pre-assigned roles for clean tests.
- **Key test scenarios**:
  - **Register + role**: POST `/auth/register` with valid data → user created with `member` role. Query `model_has_roles` to verify.
  - **MeResource + role**: Login as user with `member` role → GET `/auth/me` → response includes `"role": "member"`.
  - **MeResource + admin role**: Login as admin → GET `/auth/me` → response includes `"role": "admin"`.
  - **MeResource + no role**: User without assigned role → GET `/auth/me` → response includes `"role": null`.
  - **Register response unchanged**: POST `/auth/register` response structure does not change (role is NOT in register response).
- **Mock requirements**: None — Spatie's `assignRole()` works directly with database.
- **Assertions**: Verify `role` field value in `/auth/me` response, verify `model_has_roles` records after registration.

## Status
- [ ] Add `use App\Enums\UserRole;` import to `AuthService.php`.
- [ ] Add `$newUser->assignRole(UserRole::MEMBER->value);` in `AuthService::register()`.
- [ ] Add `'role' => $data->getRoleNames()->first()` to `MeResource::toArray()`.
- [ ] Run `php artisan code:format`.
- [ ] Run `php artisan test --filter=AuthTest` (or relevant test class).

## Acceptance Criteria
1. New user registered via `POST /auth/register` automatically receives the `member` role (verified in `model_has_roles` table).
2. `GET /auth/me` response includes `role` field with value `"admin"` or `"member"`.
3. User without assigned role → `GET /auth/me` returns `"role": null`.
4. Registration response (`POST /auth/register`) structure does not change — role info is retrieved via `/auth/me`.
5. Existing auth flows (login, logout, profile update, change password) continue to work without regression.

## Error Scenarios
- Role `member` not seeded yet → `assignRole()` throws `RoleNotFoundException` → 500. **Prevention**: Task 01 (RoleSeeder) must be run first.
- User already has role → `assignRole()` is additive (adds another role). This is acceptable for current scope.

## Dependencies
- Task 01 (RBAC Database Infrastructure) — `UserRole` enum must exist, `HasRoles` trait on User model, `RoleSeeder` must have been run.
- Task 02 (Role Master Data Registration) — ensures master data endpoint serves role list (functional dependency, not code dependency).
