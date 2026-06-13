---
module: auth
title: Register Flow — Tạo Tài Khoản Mới
description: Luồng đăng ký tài khoản người dùng mới với status ACTIVE.
type: workflow
priority: high
version: "1.0.0"
changelog:
  - version: "1.0.0"
    date: "2026-05-06"
    summary: "Initial register flow doc."
related_files:
  - backend/app/Http/Controllers/User/AuthController.php
  - backend/app/Services/User/AuthService.php
  - backend/app/Http/Requests/User/Auth/RegisterRequest.php
  - backend/app/Models/User.php
  - backend/app/Enums/UserStatus.php
---

## OVERVIEW

API `POST /auth/register` tạo user mới với status ACTIVE.

| Component | File |
|---|---|
| Route | `routes/api.php` |
| FormRequest | `RegisterRequest.php` |
| Controller | `AuthController::register()` |
| Service | `AuthService::register()` |

## CONTEXT

Register không yêu cầu xác thực (guest middleware). User mới luôn ACTIVE.

## ENTITIES

User → `status` được set thành `UserStatus::ACTIVE`.

## FLOW

1. **Request Validation** — `RegisterRequest` validate `name`, `email` (unique), `password`.
2. **Create User** — `AuthService::register()` tạo record với `name`, `email` (strtolower), `password` (Hash::make), `status = UserStatus::ACTIVE`.
3. **Return User** — Trả về user object (hoặc thông báo thành công).

## RULES

- ALWAYS lowercase email trước khi lưu.
- ALWAYS hash password bằng `Hash::make`.
- ALWAYS set `status = UserStatus::ACTIVE`.

## EDGE_CASES

- Email đã tồn tại → `RegisterRequest` reject (unique rule).
- Create thất bại → throw `InputException('auth.register_fail')`.

## EXAMPLES

**Input:** `{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }`

**Output:**
```json
{
  "status": 200,
  "message": "Register successfully.",
  "data": { /* User object */ }
}
```
