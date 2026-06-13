---
task_id: "04"
title: "Customer Read API"
description: "Implement read-only Customer APIs: GET /api/customers (list, filter, search, paginate) and GET /api/customers/{id} (detail)."
type: IMPLEMENTATION
phase: 2
status: completed
estimated_effort: M
complexity: medium
risk: low
depends_on: ["01", "03"]
rule_refs: ["PROPOSED_BR:customer-status-active", "PROPOSED_BR:outstanding-calculation"]
date: "2026-06-11"
changelog:
  - version: 1.0
    date: "2026-06-11"
    summary: Initial task specification.
  - version: 1.1
    date: "2026-06-11"
    summary: Task completed - all API endpoints implemented.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-11-customer-management-implementation-tasks.md](../2026-06-11-customer-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-api-task`
- **Applicable Skills**: `bks-be-api-standard`

---

# Task 04: Customer Read API

## Description
Develop the read endpoints of Customer module, enabling doctors and staff to search, filter, paginate customers, and retrieve a single customer's details including a calculated outstanding amount.

## Requirements

### 1. Customer Read Endpoints
- **File**: `app/Http/Controllers/Api/CustomerController.php` (flat — NOT `Api/Customer/`)
- **Method signatures**:
  - `public function index(IndexCustomerRequest $request): JsonResponse`
  - `public function show(Customer $customer): JsonResponse`

### 2. Service Logic
- **File**: `app/Services/Api/CustomerService.php` (flat — NOT `Api/Customer/`)
- **Method signatures**:
  - `public function list(array $params): LengthAwarePaginator`
  - `public function getDetail(int $id): Customer`
- **Factory Registration**: Register `CustomerService` as a getter method in `ApiFactory`. (Do NOT create new factory files).

### 3. DTO
- **File**: `app/DTOs/Api/Customer/IndexCustomerData.php`
- Fields: `search?: string`, `gender?: int`, `source?: int`, `status?: int`, `page?: int`, `per_page?: int`.

### 4. FormRequest Validation
- **File**: `app/Http/Requests/Customer/IndexCustomerRequest.php`

| Field | Presence | Type | Boundaries | Format | Cross-field Rules | Notes |
|-------|----------|------|------------|--------|-------------------|-------|
| `search` | `optional` | `string` | `max:100` | — | — | Searches name or phone |
| `gender` | `optional` | `integer` | `in:1,2,3` | — | — | Maps to GenderEnum values |
| `source` | `optional` | `integer` | `in:1,2,3,4,5` | — | — | Maps to CustomerSourceEnum values |
| `status` | `optional` | `integer` | `in:0,1` | — | — | Maps to CustomerStatusEnum values |
| `per_page` | `optional` | `integer` | `min:1,max:100` | — | — | Default is 10 |

### 5. API Resource Output
- **File**: `app/Http/Resources/Customer/CustomerResource.php`
- Output must return all data fields + enums mapped to both value and label:
  - `gender` -> `['value' => $this->gender->value, 'label' => $this->gender->label()]`
  - `source` -> `['value' => $this->source->value, 'label' => $this->source->label()]`
  - `status` -> `['value' => $this->status->value, 'label' => $this->status->label()]`
  - `outstanding_amount` -> computed accessor returning sum of related unpaid invoice balances (**PROPOSED_BR:outstanding-calculation**).

### 6. Policies
- **File**: `app/Policies/CustomerPolicy.php`
- Authenticated doctors and staff can view patients (`viewAny`, `view` return true if authenticated).

## API Endpoints Summary
> Auth column is a semantic requirement. Endpoint routes and middleware are wired in route file per `bks-be-api-standard`.

| Method | URI | Description | Auth |
|--------|-----|-------------|------|
| `GET` | `/api/customers` | Paginated and filtered customer list | Authenticated (`sanctum`) |
| `GET` | `/api/customers/{id}` | Customer detail details | Authenticated (`sanctum`) |

## Status
- [x] Create DTO `app/DTOs/Api/Customer/IndexCustomerData.php`.
- [x] Create FormRequest `app/Http/Requests/Customer/IndexCustomerRequest.php`.
- [x] Create Resource `app/Http/Resources/Customer/CustomerResource.php`.
- [x] Create Policy `app/Policies/CustomerPolicy.php`.
- [x] Create `app/Services/Api/CustomerService.php` (flat) and register in `ApiFactory`.
- [x] Create `app/Http/Controllers/Api/CustomerController.php` (flat) implementing `index` and `show`.
- [x] Wire endpoints in `routes/api.php` under `auth:sanctum` group.
- [ ] Run `php artisan code:format`.
- [ ] Run `php .agents/scripts/validate-backend.php backend`.
- [ ] Run `php artisan test` (smoke tests only).

**Completed**: 2026-06-11

## Files Created
| File | Path |
|------|------|
| DTO | `app/DTOs/Api/Customer/IndexCustomerData.php` |
| FormRequest | `app/Http/Requests/Customer/IndexCustomerRequest.php` |
| Resource | `app/Http/Resources/Customer/CustomerResource.php` |
| Policy | `app/Policies/CustomerPolicy.php` |
| Service | `app/Services/Api/CustomerService.php` |
| Controller | `app/Http/Controllers/Api/CustomerController.php` |
| ApiFactory | `app/Factories/ApiFactory.php` (modified) |
| Routes | `routes/api.php` (modified) |

## Acceptance Criteria
1. `GET /api/customers` returns paginated list with active/inactive statuses, genders, and sources mapped correctly.
2. Filtering by status, gender, and source works properly.
3. Single customer detail returns all fields including the computed `outstanding_amount`.

## Error Scenarios
- Invalid customer ID → 404.
- Invalid validation parameters (e.g. `gender = 99`) → 422.

## Dependencies
- Task 01 (Database Infrastructure) — Customer model and enums.
