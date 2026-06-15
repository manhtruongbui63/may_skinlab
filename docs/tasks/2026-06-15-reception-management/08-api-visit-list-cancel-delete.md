---
task_id: "08"
title: "Visit API: List + Cancel + Delete"
description: "Implement 3 endpoints: GET danh sách phiếu khám với filter, PATCH hủy phiếu (state machine), DELETE xóa mềm (admin/manager only)."
type: IMPLEMENTATION
phase: 2
status: pending
estimated_effort: M
complexity: medium
risk: medium
depends_on: ["02"]
rule_refs:
  - "PROPOSED_BR:visit-cancel-condition"
  - "PROPOSED_BR:visit-delete-permission"
  - "PROPOSED_BR:visit-delete-soft"
  - "PROPOSED_BR:visit-list-date-same-month"
  - "PROPOSED_BR:visit-list-no-future-date"
  - "BR-G002"
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — Flow 3, Flow 4, Flow 8
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-api-task`
- **Applicable Skills**: `bks-be-api-standard`

---

# Task 08: Visit API — List, Cancel, Delete

## Description
Implement 3 endpoints liên quan đến quản lý danh sách Visit: list với filter (Tab 2), cancel (state machine), và delete với policy check (admin/manager only). Tất cả nằm trong `VisitController` và `VisitService` đã tạo ở Task 06.

## Out of Scope
- Create Visit (Task 06, 07).
- Appointment endpoints (Task 09).

---

## Requirements

### 1. DTOs (NEW)

**File**: `app/DTOs/Api/Visit/ListVisitData.php`
```php
final readonly class ListVisitData {
    public ?string $from;       // date, default = today
    public ?string $to;         // date, default = today
    public ?int $status;        // VisitStatusEnum value
    public int $per_page;       // default 20
    public int $page;
}
```

**File**: `app/DTOs/Api/Visit/CancelVisitData.php`
```php
final readonly class CancelVisitData {
    public int $visit_id;
}
```

### 2. FormRequests (NEW)

**`IndexVisitRequest`** — `app/Http/Requests/Reception/IndexVisitRequest.php`

| Field | Presence | Type | Boundaries | Cross-field | Error Key |
|-------|----------|------|------------|-------------|-----------|
| `from` | optional | date | before_or_equal:to, ≤ today, ≥ first day of `to`'s month | Same month as `to` | `reception.errors.date_range_same_month` |
| `to` | optional | date | after_or_equal:from, ≤ today | Same month as `from` | `reception.errors.date_no_future` |
| `status` | optional | integer | enum [1,2,3,4] | — | — |
| `per_page` | optional | integer | between:1,100 | — | — |
| `page` | optional | integer | min:1 | — | — |

**Cross-field rules**:

| Condition | Rule | Error Key |
|-----------|------|-----------|
| `from` và `to` khác tháng | Reject | `reception.errors.date_range_same_month` |
| `to` > today | Reject | `reception.errors.date_no_future` |
| Default (no params) | `from = to = today` | — |

### 3. Service Methods (MODIFY `VisitService`)

**`list(ListVisitData $dto): LengthAwarePaginator`**
- Query với filter `from/to` (DATE range trên `visited_at`), `status`.
- Eager load: `customer`, `clinicRoom`, `services`, `packages`.
- Order: `queue_number ASC`.

**`cancel(int $visitId): Visit`**
- Load Visit, check `status ∈ {WAITING, IN_PROGRESS}` — nếu không → throw `UnprocessableEntityException`.
- Update `status = CANCELLED`.
- Activity log.

**`delete(int $visitId, User $actor): void`**
- Load Visit (not deleted).
- Auth check qua `VisitPolicy::delete()`.
- Soft delete.
- Activity log.

### 4. Policy: `VisitPolicy::delete()` (NEW)

**File**: `app/Policies/VisitPolicy.php`

- `delete(User $user, Visit $visit): bool` → true nếu `$user->hasRole(['admin', 'manager'])`.

### 5. Controller Methods (MODIFY `VisitController`)

- `index(IndexVisitRequest $request): JsonResponse` → `VisitResource::collection(...)` paginated, HTTP 200.
- `cancel(int $id): JsonResponse` → `VisitResource` HTTP 200.
- `destroy(int $id): JsonResponse` → HTTP 204 No Content.

### 6. API Endpoints Summary

| Method | URI | Description | Auth |
|--------|-----|-------------|------|
| `GET` | `/api/v1/visits` | Danh sách phiếu khám với filter | Authenticated (sanctum) |
| `PATCH` | `/api/v1/visits/{id}/cancel` | Hủy phiếu khám | Authenticated (sanctum) |
| `DELETE` | `/api/v1/visits/{id}` | Xóa mềm phiếu khám | Authenticated (sanctum), admin/manager |

### 7. Localization Keys

```
reception.errors.date_range_same_month
reception.errors.date_no_future
reception.errors.visit_already_completed
reception.errors.visit_already_cancelled
reception.errors.unauthorized_delete
```

---

## Testing Hints
- **Factory needs**: `VisitFactory` (states: WAITING, COMPLETED, CANCELLED, SCHEDULED).
- **Key test scenarios**:
  - List với no filter → trả về visits hôm nay.
  - List với `from`/`to` cùng tháng → đúng.
  - List với `from`/`to` khác tháng → 422.
  - List với `to` = ngày mai → 422.
  - Cancel WAITING Visit → 200, status = CANCELLED.
  - Cancel COMPLETED Visit → 422.
  - Delete với admin role → 204.
  - Delete với non-admin role → 403.

---

## Status
- [ ] Tạo `ListVisitData`, `CancelVisitData` DTOs
- [ ] Tạo `IndexVisitRequest` với same-month validation
- [ ] Thêm method `list()` vào `VisitService`
- [ ] Thêm method `cancel()` vào `VisitService`
- [ ] Thêm method `delete()` vào `VisitService`
- [ ] Tạo `VisitPolicy::delete()`
- [ ] Thêm methods `index()`, `cancel()`, `destroy()` vào `VisitController`
- [ ] Đăng ký routes `GET /visits`, `PATCH /visits/{id}/cancel`, `DELETE /visits/{id}`
- [ ] Thêm i18n keys
- [ ] Chạy `php artisan code:format`
- [ ] Chạy `php .agents/scripts/validate-backend.php backend`
- [ ] Chạy `php artisan test --filter=VisitListCancelDeleteTest`

## Acceptance Criteria
1. `GET /api/v1/visits` default (no filter) → trả về visits hôm nay, paginated.
2. Filter `from`/`to` khác tháng → 422.
3. `PATCH /visits/{id}/cancel` với WAITING Visit → 200, status = CANCELLED.
4. Cancel COMPLETED Visit → 422.
5. `DELETE /visits/{id}` admin role → 204, Visit soft-deleted.
6. `DELETE /visits/{id}` non-admin → 403.

## Error Scenarios
- `from`/`to` khác tháng → 422 `reception.errors.date_range_same_month`.
- `to` > today → 422 `reception.errors.date_no_future`.
- Cancel COMPLETED → 422 `reception.errors.visit_already_completed`.
- Cancel CANCELLED → 422 `reception.errors.visit_already_cancelled`.
- Delete non-admin → 403.
- Visit không tồn tại → 404.

## Dependencies
- Task 02 (Visit Infrastructure).
- Task 06 (Visit Create API) — `VisitService`, `VisitController`, `VisitResource` base.
