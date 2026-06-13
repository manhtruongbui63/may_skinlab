---
module: auth
title: Change Password — Đổi Mật Khẩu
description: Luồng đổi mật khẩu: xác thực mật khẩu hiện tại, hash mật khẩu mới.
type: workflow
priority: medium
version: "1.0.0"
changelog:
  - version: "1.0.0"
    date: "2026-05-06"
    summary: "Initial change password flow doc."
related_files:
  - backend/app/Http/Controllers/User/AuthController.php
  - backend/app/Services/User/AuthService.php
  - backend/app/Http/Requests/User/Auth/ChangePasswordRequest.php
  - backend/app/Models/User.php
---

## OVERVIEW

API `POST /auth/change-password` cho phép user đổi mật khẩu sau khi xác thực mật khẩu hiện tại.

| Component | File |
|---|---|
| Route | `routes/api.php` |
| FormRequest | `ChangePasswordRequest.php` |
| Controller | `AuthController::changePassword()` |
| Service | `AuthService::changePassword()` |

## CONTEXT

Yêu cầu auth middleware. User phải cung cấp `current_password` đúng mới được đổi.

## FLOW

1. **Auth Check** — Middleware đảm bảo user đã đăng nhập.
2. **Validation** — `ChangePasswordRequest` validate `current_password`, `password` (required, string).
3. **Verify Current Password** — `AuthService::changePassword()` kiểm tra `Hash::check(current_password, user.password)`. Sai → throw `InputException('auth.password')`.
4. **Update Password** — Hash mật khẩu mới bằng `Hash::make`, gọi `$user->update(['password' => $hash])`.
5. **Return** — Trả success với message `auth.logout_success`.

## RULES

- ALWAYS xác thực `current_password` trước khi cho phép đổi.
- ALWAYS hash mật khẩu mới bằng `Hash::make`.

## EDGE_CASES

- Current password sai → throw `InputException('auth.password')` (401-like behavior).
- User null → không xảy ra vì đã qua middleware.
