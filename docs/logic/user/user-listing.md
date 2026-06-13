---
module: user
title: User Listing — Danh Sách Người Dùng
description: Luồng lấy danh sách user với search, filter, order, pagination.
type: workflow
priority: high
version: "1.0.0"
changelog:
  - version: "1.0.0"
    date: "2026-05-06"
    summary: "Initial user listing flow doc."
related_files:
  - backend/app/Http/Controllers/User/UserController.php
  - backend/app/Services/User/UserTableService.php
  - backend/app/Http/Requests/User/IndexRequest.php
  - backend/app/Http/Resources/User/UserCollection.php
  - backend/app/Http/Resources/User/UserResource.php
  - backend/routes/api.php
---

## OVERVIEW

API `GET /users` trả về danh sách user hỗ trợ search, filter, order, pagination.

| Component | File |
|---|---|
| Route | `routes/api.php` |
| FormRequest | `IndexRequest.php` |
| Controller | `UserController::index()` |
| Service | `UserTableService::data()` |
| Resource | `UserCollection.php`, `UserResource.php` |

## CONTEXT

Yêu cầu auth middleware. Sử dụng `TableService` pattern để xây dựng query động.

## ENTITIES

User → lưu ý field `status` (UserStatus enum) có thể filter.

## FLOW

1. **Auth Check** — Middleware `auth:user` đảm bảo user đã đăng nhập.
2. **Request Conversion** — `Controller::convertRequest()` parse `search`, `orders`, `filters`, `per_page` thành array params.
3. **Build Query** — `UserTableService::data()` gọi `buildQuery()`:
   - `makeNewQuery()` — select raw `users.id, name, email, status, created_at, updated_at`
   - `applySearchToQuery()` — search `name` hoặc `email` (LIKE %%)
   - `applyFilterToQuery()` — filter `status` (exact match), `created_from`, `created_to`
   - `applyOrderToQuery()` — order `id`, `name`, `email`, `created_at` (asc/desc)
4. **Pagination** — Mặc định `per_page = 10`, trả về `LengthAwarePaginator`.
5. **Response** — Wrap trong `UserCollection` → `UserResource`.

## RULES

- ALWAYS filter exact match cho `status`.
- ALWAYS search LIKE %% cho `name` và `email`.
- DEFAULT `per_page = 10`.

## EDGE_CASES

- Không có user nào khớp → trả empty collection (total = 0).
- `per_page` vượt quá giới hạn → vẫn dùng giá trị đó (chưa có max cap).

## EXAMPLES

**Input:** `GET /users?search=alice&filters[0][key]=status&filters[0][data]=1&orders[0][key]=created_at&orders[0][dir]=desc&per_page=5`

**Output:**
```json
{
  "status": 200,
  "data": {
    "data": [ /* UserResource items */ ],
    "current_page": 1,
    "per_page": 5,
    "total": 12
  }
}
```
