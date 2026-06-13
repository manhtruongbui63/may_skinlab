---
module: auth
title: Login Flow — Xác Thực Người Dùng
description: Luồng đăng nhập: rate limiting, credential validation, token generation.
type: workflow
priority: high
version: "1.0.0"
changelog:
  - version: "1.0.0"
    date: "2026-05-06"
    summary: "Initial login flow doc."
related_files:
  - backend/app/Http/Controllers/User/AuthController.php
  - backend/app/Services/User/AuthService.php
  - backend/app/Http/Requests/User/Auth/LoginRequest.php
  - backend/app/Http/Controllers/Traits/HasRateLimiter.php
  - backend/app/Models/User.php
  - backend/app/Enums/UserStatus.php
---

## OVERVIEW

API `POST /auth/login` xác thực email + password, trả về Sanctum token.

| Component | File |
|---|---|
| Route | `routes/api.php` |
| FormRequest | `LoginRequest.php` |
| Controller | `AuthController::login()` |
| Service | `AuthService::login()` |
| Resource | — (trả về `{ access_token, type_token }`) |

## CONTEXT

Login là entry point cho mọi phiên làm việc. Hệ thống áp dụng rate limiting để chống brute-force.

## ENTITIES

User → trạng thái `status` (UserStatus enum) không được kiểm tra tại login (chỉ kiểm tra credential).

## FLOW

1. **Request Validation** — `LoginRequest` validate `email` (required, email, max length) và `password` (required, string, max length).
2. **Rate Limit Check** — Tạo key = `strtolower(email)|user_login|ip`. Nếu vượt quá `MAX_ATTEMPTS_LOGIN = 5` lần trong `DECAY_SECONDS = 60` giây → trả 423 lockout response.
3. **Credential Verification** — `AuthService::login()` tìm user theo email, kiểm tra `Hash::check(password, user.password)`.
4. **Token Generation** — Nếu credential hợp lệ, tạo Sanctum token qua `createToken('authUserToken')`, clear rate limit attempts, trả `{ access_token, type_token: 'Bearer' }`.
5. **Failed Login** — Nếu credential sai, increment attempts. Nếu còn lượt thử → trả 401 unauthorized. Nếu hết lượt → throw InputException (throttle).

## RULES

- ALWAYS kiểm tra rate limit trước credential verification.
- ALWAYS tạo token mới khi login thành công (Sanctum `plainTextToken`).
- NEVER trả lý do cụ thể khi login fail (không tiết lộ email có tồn tại hay không).

## EDGE_CASES

- Email không tồn tại trong DB → trả failed login (giống như password sai).
- User INACTIVE → vẫn cho đăng nhập (không check status tại login; check sau nếu cần).

## EXAMPLES

**Input:** `{ "email": "alice@example.com", "password": "secret123" }`

**Output (success):**
```json
{
  "status": 200,
  "message": "",
  "data": {
    "access_token": "1|abc...",
    "type_token": "Bearer"
  }
}
```

**Output (fail — 5 lần sai):**
```json
{
  "status": 400,
  "message": "Too many login attempts. Please try again in 60 seconds.",
  "data": null
}
```
