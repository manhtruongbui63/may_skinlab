---
module: auth
title: Logout Flow — Thu Hồi Token
description: Luồng đăng xuất: xóa current access token của user.
type: workflow
priority: high
version: "1.0.0"
changelog:
  - version: "1.0.0"
    date: "2026-05-06"
    summary: "Initial logout flow doc."
related_files:
  - backend/app/Http/Controllers/User/AuthController.php
  - backend/routes/api.php
---

## OVERVIEW

API `POST /auth/logout` xóa token hiện tại của user đã đăng nhập.

| Component | File |
|---|---|
| Route | `routes/api.php` |
| Controller | `AuthController::logout()` |
| Model | `User` (Sanctum `HasApiTokens`) |

## CONTEXT

Yêu cầu auth middleware. User phải đăng nhập (token hợp lệ).

## FLOW

1. **Auth Check** — Middleware `auth:sanctum` đảm bảo user hợp lệ.
2. **Delete Token** — Gọi `$user->currentAccessToken()->delete()`.
3. **Return Success** — Trả thông báo logout thành công.

## RULES

- ALWAYS xóa token hiện tại (không xóa tất cả token của user).

## EDGE_CASES

- Không có token nào để xóa → vẫn trả success (không throw exception).

## EXAMPLES

**Input:** (Bearer token trong header)

**Output:**
```json
{
  "status": 200,
  "message": "Logout successfully.",
  "data": null
}
```
