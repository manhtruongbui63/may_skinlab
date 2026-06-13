---
module: auth
title: Update Profile — Cập Nhật Thông Tin
description: Luồng cập nhật tên của user đã đăng nhập.
type: workflow
priority: medium
version: "1.0.0"
changelog:
  - version: "1.0.0"
    date: "2026-05-06"
    summary: "Initial profile update flow doc."
related_files:
  - backend/app/Http/Controllers/User/AuthController.php
  - backend/app/Services/User/AuthService.php
  - backend/app/Http/Requests/User/Auth/UpdateProfileRequest.php
---

## OVERVIEW

API `POST /auth/profile` cập nhật tên của user hiện tại.

| Component | File |
|---|---|
| Route | `routes/api.php` |
| FormRequest | `UpdateProfileRequest.php` |
| Controller | `AuthController::updateProfile()` |
| Service | `AuthService::update()` |

## CONTEXT

Yêu cầu auth middleware. Chỉ cho phép cập nhật `name`.

## FLOW

1. **Auth Check** — Middleware đảm bảo user đã đăng nhập.
2. **Validation** — `UpdateProfileRequest` validate `name` (required).
3. **Check User** — `AuthService::update()` kiểm tra `$this->user` tồn tại; nếu không → throw `InputException('not_found')`.
4. **Check Status** — Nếu user `INACTIVE` → throw `InputException('invalid')`.
5. **Update** — Gọi `User::query()->where('id', $user->id)->update($data)`.
6. **Return** — Trả kết quả update + message `update_successfully`.

## RULES

- ONLY cho phép cập nhật `name`.
- Không cho phép cập nhật nếu user INACTIVE.

## EDGE_CASES

- User INACTIVE → reject với message `response.invalid`.
- User null (token hợp lệ nhưng user đã bị xóa mềm) → throw `response.not_found`.
