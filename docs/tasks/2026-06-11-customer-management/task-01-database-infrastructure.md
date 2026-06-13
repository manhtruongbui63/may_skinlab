---
task_id: "01"
title: "Database Infrastructure"
description: "Create migration for customers table, define enums (GenderEnum, CustomerSourceEnum, CustomerStatusEnum), and define Customer model with activity logging and soft deletes."
type: IMPLEMENTATION
phase: 1
status: completed
estimated_effort: S
complexity: low
risk: low
depends_on: []
rule_refs: ["PROPOSED_BR:customer-unique-phone", "PROPOSED_BR:customer-status-active"]
date: "2026-06-11"
changelog:
  - version: 1.0
    date: "2026-06-11"
    summary: Initial task specification.
  - version: 1.1
    date: "2026-06-11"
    summary: Task completed - all files created and verified.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-11-customer-management-implementation-tasks.md](../2026-06-11-customer-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-database-task`
- **Applicable Skills**: `bks-be-database-standard`

---

# Task 01: Database Infrastructure

## Description
Create the database infrastructure for managing customers, including table structure, enums, soft deletes, indexes, and activity logging trait representation.

## Requirements

### 1. Enums (NEW)
Define the following backed enums under `app/Enums/` utilizing `HasEnumStaticMethods` trait and returning localized labels via `trans()`:

- **`GenderEnum`**: `app/Enums/GenderEnum.php`
  - Backing type: `int`
  - Cases: `MALE = 1` (trans: `enums.gender.male`), `FEMALE = 2` (trans: `enums.gender.female`), `OTHER = 3` (trans: `enums.gender.other`).
- **`CustomerSourceEnum`**: `app/Enums/CustomerSourceEnum.php`
  - Backing type: `int`
  - Cases: `FACEBOOK = 1`, `REFERRAL = 2`, `GOOGLE = 3`, `TIKTOK = 4`, `OTHER = 5` (appropriate trans keys under `enums.customer_source.*`).
- **`CustomerStatusEnum`**: `app/Enums/CustomerStatusEnum.php`
  - Backing type: `int`
  - Cases: `INACTIVE = 0`, `ACTIVE = 1` (appropriate trans keys under `enums.customer_status.*`).

### 2. Migration (NEW)
Create migration `database/migrations/xxxx_xx_xx_xxxxxx_create_customers_table.php` to define the table `customers`:
- `id` (bigIncrements)
- `full_name` (string, length 255, not null)
- `phone` (string, length 50, not null, unique index)
- `birth_date` (date, nullable)
- `gender` (tinyInteger, nullable)
- `address` (text, nullable)
- `source` (tinyInteger, default `5` - OTHER)
- `status` (tinyInteger, default `1` - ACTIVE)
- `deleted_at` (soft deletes)
- `timestamps`

### 3. Model `Customer` (NEW)
Create model `app/Models/Customer.php`:
- Use `HasFactory`, `SoftDeletes`, and Spatie's `LogsActivity` (per **BR-G002**).
- Configure cast types:
  - `gender` => `GenderEnum`
  - `source` => `CustomerSourceEnum`
  - `status` => `CustomerStatusEnum`
- Define scopes:
  - `scopeActive($query)` -> filter active customers (**PROPOSED_BR:customer-status-active**).
- Define relationships (stub classes if not existing, or standard hasMany definitions):
  - `visits()` -> hasMany `Visit` (future table)
  - `treatmentPlans()` -> hasMany `TreatmentPlan` (future table)
  - `invoices()` -> hasMany `Invoice` (future table)

## Status
- [x] Create `app/Enums/GenderEnum.php`.
- [x] Create `app/Enums/CustomerSourceEnum.php`.
- [x] Create `app/Enums/CustomerStatusEnum.php`.
- [x] Generate migration `create_customers_table` and run migrate (trong container `bks-app`, working directory `/var/www/backend`).
- [x] Create `backend/app/Models/Customer.php` casting enums and specifying activity logs.
- [x] Create `backend/database/factories/CustomerFactory.php` for generating fake customers.
- [x] Run `docker compose exec -it -u www-data app php artisan migrate:rollback` and migrate again to verify `down()` methods.
- [x] Run `docker compose exec -it -u www-data app php artisan code:format`.
- [x] Run `php .agents/scripts/validate-backend.php backend` and fix reported errors.
- [x] Run `docker compose exec -it -u www-data app php artisan test` to verify database boots correctly.

**Completed**: 2026-06-11

## Acceptance Criteria
1. [x] Migration runs and creates `customers` table with proper datatypes and indexes.
2. [x] `Customer` model successfully uses `SoftDeletes` and records activities.
3. [x] Enums are backed by `int` and map to localized translation keys.

## Files Created
| File | Path |
|------|------|
| Migration | `backend/database/migrations/2026_06_11_075110_create_customers_table.php` |
| GenderEnum | `backend/app/Enums/GenderEnum.php` |
| CustomerSourceEnum | `backend/app/Enums/CustomerSourceEnum.php` |
| CustomerStatusEnum | `backend/app/Enums/CustomerStatusEnum.php` |
| Customer Model | `backend/app/Models/Customer.php` |
| CustomerFactory | `backend/database/factories/CustomerFactory.php` |
| Translations | `backend/lang/en/enums.php` (updated) |
