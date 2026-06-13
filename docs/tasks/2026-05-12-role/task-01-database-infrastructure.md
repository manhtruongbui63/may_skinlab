---
task_id: "01"
title: "RBAC Database Infrastructure"
description: "Install Spatie Laravel Permission, create UserRole enum, update User model with HasRoles trait, and create RoleSeeder."
type: IMPLEMENTATION
phase: 1
status: pending
estimated_effort: M
complexity: medium
risk: medium
depends_on: []
rule_refs:
  - PROPOSED_BR:default-member-role
  - PROPOSED_BR:admin-full-access
  - PROPOSED_BR:member-read-only
date: "2026-05-12"
changelog:
  - version: 1.0
    date: "2026-05-12"
    summary: Initial task specification.
---

# Context
- **Requirement**: [02-role.md](../../requirements/02-role.md)
- **Parent Task**: [2026-05-12-role-implementation-tasks.md](../2026-05-12-role-implementation-tasks.md)
- **Applicable Workflows (MANDATORY)**: `/execute-database-task`
- **Applicable Skills (MANDATORY)**: `bks-be-database-standard`

---

# Task 01: RBAC Database Infrastructure

## Description
Install and configure the Spatie Laravel Permission package, create the `UserRole` string-backed enum for type safety and master data generation, add the `HasRoles` trait to the `User` model, and create a `RoleSeeder` to seed the two roles (`admin`, `member`) with an optional first admin user. This task lays the entire RBAC foundation that all subsequent tasks depend on.

## Out of Scope
- **No role column on `users` table** — roles are managed entirely via Spatie's `model_has_roles` pivot table.
- **No middleware registration on specific routes** — deferred to future feature implementations.
- **No permission-level granularity** — only role-level in this phase.
- **No API endpoints** — covered in Task 03.
- **No master data registration** — covered in Task 02.

## Current State (Already Exists)
- **Tables**: `users` (id, name, email, password, status, created_at, updated_at)
- **Models**: `App\Models\User` — uses `HasFactory`, `Notifiable`, `HasApiTokens` traits; casts `status` to `UserStatus` enum
- **Enums**: `App\Enums\UserStatus` (int-backed: INACTIVE=0, ACTIVE=1), uses `HasEnumStaticMethods` trait
- **Trait**: `App\Traits\HasEnumStaticMethods` — provides `values()`, `names()`, `options()`, `labels()`, `random()`, `fromValue()`
- **Seeders**: `DatabaseSeeder` only
- **Packages**: `spatie/laravel-permission` is **NOT** installed

## Requirements

### 1. Install Spatie Laravel Permission (NEW)

**Action**: Install the package via Composer.

```bash
composer require spatie/laravel-permission
```

Then publish the package's config and migration files:

```bash
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
```

This will generate:
- `config/permission.php` — package configuration
- Migration file creating tables: `roles`, `permissions`, `role_has_permissions`, `model_has_roles`, `model_has_permissions`

**Post-install verification**: Ensure the published migration uses guard `api` (matching the project's Sanctum guard). Verify `config/permission.php` has `'guard' => env('PERMISSION_GUARD', 'api')` or update accordingly.

### 2. UserRole Enum (NEW)

**File**: `backend/app/Enums/UserRole.php`

```php
<?php

namespace App\Enums;

use App\Traits\HasEnumStaticMethods;

enum UserRole: string
{
    use HasEnumStaticMethods;

    case ADMIN = 'admin';
    case MEMBER = 'member';

    public function label(): string
    {
        return match ($this) {
            self::ADMIN => trans('enums.user_role.admin'),
            self::MEMBER => trans('enums.user_role.member'),
        };
    }
}
```

**Key Design Decisions**:
- **String-backed** (`: string`) — because Spatie stores role names as strings in `roles.name`. This enum is NOT used as an Eloquent cast; it exists for type safety, IDE completion, master data generation, and seeder configuration.
- Uses `HasEnumStaticMethods` trait — provides `options()` method that returns `[['id' => 'admin', 'name' => 'Admin'], ['id' => 'member', 'name' => 'Member']]` for master data.
- `label()` method uses `trans()` for localization.

### 3. User Model — Add HasRoles Trait (MODIFY)

**File**: `backend/app/Models/User.php`

**Changes**:
1. Add import: `use Spatie\Permission\Traits\HasRoles;`
2. Add trait usage inside the class body: `use HasRoles;`

**Updated imports**:
```php
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Enums\UserStatus;
use Spatie\Permission\Traits\HasRoles;
```

**Updated class body** (trait section):
```php
use HasFactory;
use Notifiable;
use HasApiTokens;
use HasRoles;
```

**Docblock update** — add role-related properties:
```php
/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $password
 * @property UserStatus $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection|\Spatie\Permission\Models\Role[] $roles
 */
```

### 4. RoleSeeder (NEW)

**File**: `backend/database/seeders/RoleSeeder.php`

```php
<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create roles with guard 'api'
        foreach (UserRole::cases() as $case) {
            Role::firstOrCreate(
                ['name' => $case->value, 'guard_name' => 'api']
            );
        }

        // Optional: Create first admin user
        $adminEmail = config('app.admin_email', 'admin@example.com');
        $adminPassword = config('app.admin_password', 'password');

        $admin = User::firstOrCreate(
            ['email' => $adminEmail],
            [
                'name' => 'Admin',
                'password' => bcrypt($adminPassword),
                'status' => UserStatus::ACTIVE,
            ]
        );

        $admin->assignRole(UserRole::ADMIN->value);
    }
}
```

**Key design**:
- Uses `firstOrCreate` to be idempotent — safe to run multiple times.
- Iterates `UserRole::cases()` so adding new roles to the enum automatically seeds them.
- Admin user credentials are configurable via `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).

### 5. Localization Keys (NEW)

**File**: `backend/lang/en/enums.php`

Add the following keys to the existing enums language file:

```php
'user_role' => [
    'admin' => 'Admin',
    'member' => 'Member',
],
```

## Testing Hints
- **Factory needs**: `UserFactory` (should already exist).
- **Key test scenarios**:
  - Seeder creates exactly 2 roles: `admin`, `member` in `roles` table.
  - Running seeder twice does not create duplicate roles (idempotent).
  - Admin user is created with `admin` role assigned in `model_has_roles`.
  - Running seeder twice does not create duplicate admin user.
  - User model `HasRoles` trait works: `$user->assignRole('member')` succeeds.
  - User model `HasRoles` trait works: `$user->getRoleNames()` returns assigned role names.
- **Assertions**: Check `roles` table count, `model_has_roles` records, `$user->hasRole('admin')` returns true.

## Status
- [ ] Install `spatie/laravel-permission` via Composer.
- [ ] Publish package config and migrations (`vendor:publish`).
- [ ] Verify/update guard configuration in `config/permission.php` to use `api`.
- [ ] Run `php artisan migrate` to create Spatie permission tables.
- [ ] Create `backend/app/Enums/UserRole.php` (string-backed enum with `HasEnumStaticMethods` + `label()`).
- [ ] Add `HasRoles` trait to `backend/app/Models/User.php`.
- [ ] Update User model docblock with `$roles` property.
- [ ] Create `backend/database/seeders/RoleSeeder.php`.
- [ ] Add `user_role` localization keys to `backend/lang/en/enums.php`.
- [ ] Run `php artisan db:seed --class=RoleSeeder` and verify roles exist.
- [ ] Run `php artisan migrate:rollback` and migrate again to verify `down()` methods.
- [ ] Run `php artisan code:format`.
- [ ] Run `php artisan test --filter=RoleSeeder` (or relevant test class).

## Acceptance Criteria
1. `spatie/laravel-permission` is installed and its migrations have run successfully.
2. `UserRole` enum exists at `app/Enums/UserRole.php` with cases `ADMIN='admin'` and `MEMBER='member'`, using `HasEnumStaticMethods` trait and `label()` method.
3. `User` model uses `HasRoles` trait from Spatie — `$user->assignRole()` and `$user->getRoleNames()` work correctly.
4. `RoleSeeder` creates 2 roles (`admin`, `member`) with guard `api`, and an optional admin user with `admin` role assigned.
5. Localization keys `enums.user_role.admin` and `enums.user_role.member` resolve correctly.
6. No `role` column exists on `users` table — roles are managed via Spatie's pivot table only.

## Error Scenarios
- Spatie migration fails → Check guard configuration, ensure `api` guard is properly set.
- `assignRole()` throws `RoleNotFoundException` → Role must be seeded first via `RoleSeeder`.
- Enum `label()` returns raw key → Ensure `lang/en/enums.php` has the `user_role` section.

## Dependencies
- None — this is the foundation task.
