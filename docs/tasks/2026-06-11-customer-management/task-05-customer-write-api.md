---
task_id: "05"
title: "Customer Write API"
description: "Implement write Customer APIs: POST /api/customers (create), PATCH /api/customers/{id} (update), and DELETE /api/customers/{id} (soft delete)."
type: IMPLEMENTATION
phase: 2
status: completed
estimated_effort: M
complexity: medium
risk: low
depends_on: ["04"]
rule_refs: ["PROPOSED_BR:customer-unique-phone"]
date: "2026-06-11"
changelog:
  - version: 1.0
    date: "2026-06-11"
    summary: Initial task specification.
  - version: 1.1
    date: "2026-06-11"
    summary: Task completed - all write endpoints implemented.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-11-customer-management-implementation-tasks.md](../2026-06-11-customer-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-api-task`
- **Applicable Skills**: `bks-be-api-standard`

---

# Task 05: Customer Write API

## Description
Develop the write endpoints of Customer module: creating new customers, updating details, changing statuses, and soft-deleting customer records.

## Requirements

### 1. Customer Write Endpoints
- **File**: `app/Http/Controllers/Api/CustomerController.php` (flat)
- **Method signatures**:
  - `public function store(StoreCustomerRequest $request): JsonResponse`
  - `public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse`
  - `public function destroy(Customer $customer): JsonResponse`

### 2. Service Logic
- **File**: `app/Services/Api/CustomerService.php` (flat)
- **Method signatures**:
  - `public function create(StoreCustomerData $dto): Customer`
  - `public function update(int $id, UpdateCustomerData $dto): Customer`
  - `public function delete(int $id): void`

### 3. DTOs
- **Store DTO**: `app/DTOs/Api/Customer/StoreCustomerData.php`
  - Fields: `full_name: string`, `phone: string`, `birth_date?: ?string`, `gender?: ?int`, `address?: ?string`, `source?: ?int`, `status?: ?int`
- **Update DTO**: `app/DTOs/Api/Customer/UpdateCustomerData.php`
  - Fields: `full_name?: string`, `phone?: string`, `birth_date?: ?string`, `gender?: ?int`, `address?: ?string`, `source?: ?int`, `status?: ?int`

### 4. FormRequest Validation

#### `StoreCustomerRequest`
| Field | Presence | Type | Boundaries | Format | Cross-field Rules | Notes |
|-------|----------|------|------------|--------|-------------------|-------|
| `full_name` | `required` | `string` | `max:255` | — | — | Customer name |
| `phone` | `required` | `string` | `max:50` | `regex:/^\+?[0-9]{7,15}$/` | Unique in `customers` table | (**PROPOSED_BR:customer-unique-phone**) |
| `birth_date` | `optional` | `date` | — | `Y-m-d` | — | Nullable |
| `gender` | `optional` | `integer` | `in:1,2,3` | — | — | Maps to GenderEnum |
| `address` | `optional` | `string` | `max:1000` | — | — | Nullable |
| `source` | `optional` | `integer` | `in:1,2,3,4,5` | — | — | Maps to CustomerSourceEnum |
| `status` | `optional` | `integer` | `in:0,1` | — | — | Maps to CustomerStatusEnum |

#### `UpdateCustomerRequest`
| Field | Presence | Type | Boundaries | Format | Cross-field Rules | Notes |
|-------|----------|------|------------|--------|-------------------|-------|
| `full_name` | `sometimes` | `string` | `max:255` | — | — | — |
| `phone` | `sometimes` | `string` | `max:50` | `regex:/^\+?[0-9]{7,15}$/` | Unique in `customers` table, ignoring current ID | (**PROPOSED_BR:customer-unique-phone**) |
| `birth_date` | `optional` | `date` | — | `Y-m-d` | — | — |
| `gender` | `optional` | `integer` | `in:1,2,3` | — | — | — |
| `address` | `optional` | `string` | `max:1000` | — | — | — |
| `source` | `optional` | `integer` | `in:1,2,3,4,5` | — | — | — |
| `status` | `optional` | `integer` | `in:0,1` | — | — | — |

## API Endpoints Summary
> Auth column is a semantic requirement. Endpoint routes and middleware are wired in route file per `bks-be-api-standard`.

| Method | URI | Description | Auth |
|--------|-----|-------------|------|
| `POST` | `/api/customers` | Create a new customer | Authenticated (`sanctum`) |
| `PATCH` | `/api/customers/{id}` | Update customer details | Authenticated (`sanctum`) |
| `DELETE` | `/api/customers/{id}` | Soft delete customer | Authenticated (`sanctum`) |

## Status
- [x] Create DTO `app/DTOs/Api/Customer/StoreCustomerData.php`.
- [x] Create DTO `app/DTOs/Api/Customer/UpdateCustomerData.php`.
- [x] Create FormRequest `app/Http/Requests/Customer/StoreCustomerRequest.php`.
- [x] Create FormRequest `app/Http/Requests/Customer/UpdateCustomerRequest.php`.
- [x] Update `app/Services/Api/CustomerService.php` with create, update, and delete methods.
- [x] Update `app/Http/Controllers/Api/CustomerController.php` with store, update, and destroy.
- [x] Wire write endpoints in `routes/api.php` under `auth:sanctum` group.
- [ ] Run `php artisan code:format`.
- [ ] Run `php .agents/scripts/validate-backend.php backend`.
- [ ] Run `php artisan test` (smoke tests only).

**Completed**: 2026-06-11

## Files Created/Modified
| File | Path |
|------|------|
| DTO (NEW) | `app/DTOs/Api/Customer/StoreCustomerData.php` |
| DTO (NEW) | `app/DTOs/Api/Customer/UpdateCustomerData.php` |
| FormRequest (NEW) | `app/Http/Requests/Customer/StoreCustomerRequest.php` |
| FormRequest (NEW) | `app/Http/Requests/Customer/UpdateCustomerRequest.php` |
| Service (MODIFY) | `app/Services/Api/CustomerService.php` |
| Controller (MODIFY) | `app/Http/Controllers/Api/CustomerController.php` |
| Routes (MODIFY) | `routes/api.php` |

## Acceptance Criteria
1. `POST /api/customers` creates customer and returns 201 with created object.
2. `PATCH /api/customers/{id}` updates fields correctly and ignores phone uniqueness validation for own record.
3. `DELETE /api/customers/{id}` soft-deletes the customer.
4. Attempting to create a customer with an existing phone number returns 422 validation error.

## Error Scenarios
- Phone number already exists → 422.
- Invalid input fields → 422.
- Customer not found on update/delete → 404.

## Dependencies
- Task 04 (Customer Read API) — Extends the controller/service created in Task 04.
