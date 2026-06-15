---
task_id: "06"
title: "Visit API: Create — POST /api/v1/visits (Walk-in + Scheduled)"
description: "Implement endpoint tạo phiếu khám mới cho cả 2 hình thức walk-in và scheduled, bao gồm auto-gen code, queue_number, và pivot inserts."
type: IMPLEMENTATION
phase: 2
status: pending
estimated_effort: M
complexity: high
risk: high
depends_on: ["01", "02", "04"]
rule_refs:
  - "PROPOSED_BR:visit-code-daily-seq"
  - "PROPOSED_BR:visit-queue-number-daily"
  - "PROPOSED_BR:walkin-no-appointment-date"
  - "PROPOSED_BR:walkin-requires-room-service"
  - "PROPOSED_BR:scheduled-future-date-only"
  - "BR-G002"
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — Flow 1, Flow 2, §5 Business Rules
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-api-task`
- **Applicable Skills**: `bks-be-api-standard`

---

# Task 06: Visit API — Create

## Description
Implement `POST /api/v1/visits` để tạo phiếu khám. Cùng một endpoint xử lý cả Walk-in (PROPOSED_BR:walkin-requires-room-service) và Scheduled (PROPOSED_BR:scheduled-future-date-only). Core logic phức tạp nhất: auto-gen `code` (format `KByyMMdd-NNNN`) và `queue_number` (đếm theo ngày + phòng) trong DB transaction với `lockForUpdate()`.

## Out of Scope
- `POST /api/v1/visits/from-appointment` (Task 07).
- List, Cancel, Delete Visit (Task 08).

---

## Requirements

### 1. DTO: `CreateVisitData` (NEW)

**File**: `app/DTOs/Api/Visit/CreateVisitData.php`

```php
final readonly class CreateVisitData {
    public int $registration_type;        // RegistrationTypeEnum value
    public ?string $appointment_date;     // null for WALK_IN
    public bool $is_priority;
    public ?int $clinic_room_id;
    public array $service_ids;            // int[]
    public array $service_package_ids;   // int[]
    public ?string $reason;
    public ?int $customer_id;
}
```

### 2. FormRequest: `StoreVisitRequest` (NEW)

**File**: `app/Http/Requests/Reception/StoreVisitRequest.php`

**Validation table**:

| Field | Presence | Type | Boundaries | Cross-field Rules | Error Key |
|-------|----------|------|------------|-------------------|-----------|
| `registration_type` | required | integer | enum [1,2] | — | `reception.errors.registration_type_required` |
| `appointment_date` | required_if:registration_type,2 | date | after:today | Only when SCHEDULED | `reception.errors.date_must_be_future` |
| `appointment_date` | — | — | — | Must be null when WALK_IN | `reception.errors.date_must_be_future` |
| `is_priority` | optional | boolean | — | default: false | — |
| `clinic_room_id` | required_if:registration_type,1 | integer | exists:clinic_rooms,id | WALK_IN only, room must be active | `reception.errors.room_required` |
| `service_ids` | required_if:registration_type,1 | array | min:1 | WALK_IN only | `reception.errors.service_required` |
| `service_ids.*` | — | integer | exists:services,id | — | `reception.errors.service_invalid` |
| `service_package_ids` | optional | array | — | — | — |
| `service_package_ids.*` | — | integer | exists:service_packages,id | — | — |
| `reason` | optional | string | max:500 | — | `reception.errors.reason_too_long` |
| `customer_id` | optional | integer | exists:customers,id | — | — |

**Cross-field rules**:

| Condition | Affected Fields | Rule | Error Key |
|-----------|-----------------|------|-----------|
| `registration_type = WALK_IN` | `appointment_date` | Must be absent/null | — |
| `registration_type = WALK_IN` | `clinic_room_id`, `service_ids` | Required, min 1 service | `reception.errors.room_required`, `reception.errors.service_required` |
| `registration_type = SCHEDULED` | `appointment_date` | Required, > today | `reception.errors.date_must_be_future` |
| `clinic_room_id` present | `clinic_rooms.is_active` | Must be true | `reception.errors.room_invalid` |

### 3. Service: `VisitService::create()` (NEW — in ApiFactory)

**File**: `app/Services/Api/VisitService.php`

**Method signature**:
```php
public function create(CreateVisitData $dto): Visit
```

**Logic** (in DB transaction):
1. `lockForUpdate()` khi đếm queue_number để tránh race condition.
2. Đếm `queue_number`: `Visit::whereDate('visited_at', today())->where('clinic_room_id', $dto->clinic_room_id)->lockForUpdate()->count() + 1`.
3. Sinh `code`: format `KB{yy}{MM}{dd}-{NNNN}` — NNNN = count of all visits today + 1 (padded to 4 digits).
4. Tạo `Visit` record với `registration_type`, `status = WAITING`, `visited_at = now()` (WALK_IN) hoặc `appointment_date` (SCHEDULED).
5. Insert `visit_services` pivot: `$visit->services()->sync($dto->service_ids)`.
6. Insert `visit_packages` pivot nếu có.
7. Return `Visit` with relations loaded.

**Register** trong `ApiFactory` như getter method `visit(): VisitService`.

### 4. Controller: `VisitController::store()` (NEW — in ApiFactory flow)

**File**: `app/Http/Controllers/Api/VisitController.php`

- Auth: requires authenticated user (`auth:sanctum`).
- Method: `store(StoreVisitRequest $request): JsonResponse` → HTTP 201 với `VisitResource`.

### 5. Resource: `VisitResource` (NEW)

**File**: `app/Http/Resources/Reception/VisitResource.php`

Response fields:
```json
{
  "id": 1,
  "code": "KB260615-0001",
  "queue_number": 1,
  "registration_type": { "value": 1, "label": "Chờ khám" },
  "status": { "value": 1, "label": "Chờ khám" },
  "is_priority": false,
  "visited_at": "2026-06-15T10:00:00+07:00",
  "appointment_date": null,
  "reason": null,
  "customer": { "id": 1, "code": "BN000001", "full_name": "..." } | null,
  "clinic_room": { "id": 1, "name": "Phòng 1" } | null,
  "services": [{ "id": 1, "name": "Khám da" }],
  "packages": [{ "id": 1, "name": "Gói cơ bản" }],
  "created_at": "..."
}
```

### 6. API Endpoints Summary

| Method | URI | Description | Auth |
|--------|-----|-------------|------|
| `POST` | `/api/v1/visits` | Tạo phiếu khám mới | Authenticated (sanctum) |

### 7. Localization Keys (backend validation)

```
reception.errors.registration_type_required
reception.errors.date_must_be_future
reception.errors.date_format_invalid
reception.errors.room_required
reception.errors.room_invalid
reception.errors.service_required
reception.errors.reason_too_long
```

---

## Testing Hints
- **Factory needs**: `VisitFactory` (Task 02), `ClinicRoomFactory`, `ServiceFactory`, `CustomerFactory`.
- **Key test scenarios**:
  - WALK_IN happy path: có `clinic_room_id` + `service_ids` → 201.
  - SCHEDULED happy path: có `appointment_date` > today → 201.
  - Race condition: 2 concurrent requests → `queue_number` sequential (test với DB transaction).
  - `code` format đúng `KByyMMdd-NNNN`.
  - WALK_IN thiếu `clinic_room_id` → 422.
  - WALK_IN thiếu `service_ids` → 422.
  - SCHEDULED `appointment_date = today` → 422.
  - `clinic_room_id` inactive → 422.
  - Unauthenticated → 401.

---

## Status
- [ ] Tạo DTO `app/DTOs/Api/Visit/CreateVisitData.php`
- [ ] Tạo `StoreVisitRequest` với đầy đủ validation + cross-field rules
- [ ] Tạo `VisitService` với method `create(CreateVisitData $dto): Visit`
- [ ] Register `VisitService` trong `ApiFactory`
- [ ] Tạo `VisitController::store()`
- [ ] Tạo `VisitResource`
- [ ] Đăng ký route `POST /api/v1/visits`
- [ ] Thêm i18n keys vào `lang/vi/reception.php`, `lang/en/reception.php`
- [ ] Chạy `php artisan code:format`
- [ ] Chạy `php .agents/scripts/validate-backend.php backend`
- [ ] Chạy `php artisan test --filter=CreateVisitTest`

## Acceptance Criteria
1. `POST /api/v1/visits` với WALK_IN payload hợp lệ → HTTP 201, `code` format `KByyMMdd-NNNN`.
2. `POST /api/v1/visits` với SCHEDULED payload hợp lệ → HTTP 201, `appointment_date` đúng.
3. `queue_number` tăng dần chính xác trong cùng ngày + phòng.
4. Pivot `visit_services` được insert đúng số records.
5. WALK_IN thiếu clinic_room → 422 với error key đúng.
6. Unauthenticated → 401.

## Error Scenarios
- Thiếu `clinic_room_id` (WALK_IN) → 422.
- Thiếu `service_id` (WALK_IN) → 422.
- `clinic_room_id` không tồn tại / inactive → 422.
- `appointment_date` = today → 422.
- `appointment_date` = past → 422.
- DB transaction fail → rollback, 500.

## Dependencies
- Task 01 (Master Data Tables) — FK clinic_rooms.
- Task 02 (Visit Infrastructure) — bảng visits, enums, model.
- Task 04 (Master Data Registration) — cần thiết cho integration testing.
