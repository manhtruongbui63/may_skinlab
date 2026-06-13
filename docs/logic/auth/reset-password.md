---
module: auth
title: Reset Password — Quên & Đặt Lại Mật Khẩu
description: Luồng đặt lại mật khẩu qua email cho guest — phát hành token hash (TTL 60', single-use, rate-limit), đặt mật khẩu mới và thu hồi toàn bộ phiên.
type: workflow
priority: high
version: "1.0.0"
changelog:
  - version: "1.0.0"
    date: "2026-06-08"
    summary: "Initial forgot/reset password flow doc; promoted PROPOSED_BR:reset-* to BR-AUTH-001..009."
related_files:
  - backend/app/Http/Controllers/Api/AuthController.php
  - backend/app/Services/Api/AuthService.php
  - backend/app/Http/Requests/Auth/ForgotPasswordRequest.php
  - backend/app/Http/Requests/Auth/ResetPasswordRequest.php
  - backend/app/DTOs/Api/Auth/ForgotPasswordData.php
  - backend/app/DTOs/Api/Auth/ResetPasswordData.php
  - backend/app/Notifications/ResetPasswordNotification.php
  - backend/app/Notifications/PasswordChangedNotification.php
  - backend/routes/api.php
  - backend/app/Models/User.php
---

## OVERVIEW

Hai endpoint **guest** cho phép user **chưa đăng nhập** khôi phục mật khẩu qua email:

| Method | Endpoint | Mục đích |
|---|---|---|
| `POST` | `/api/auth/forgot-password` | Phát hành link reset (gửi email); 422 nếu email chưa đăng ký |
| `POST` | `/api/auth/reset-password` | Xác thực token + đặt mật khẩu mới |

| Component | File |
|---|---|
| Routes | `routes/api.php` (nhóm `throttle:auth`) |
| FormRequests | `ForgotPasswordRequest.php`, `ResetPasswordRequest.php` |
| Controller | `AuthController::forgotPassword()`, `AuthController::resetPassword()` |
| Service | `AuthService::sendResetLink()`, `AuthService::resetPassword()` |
| Notifications | `ResetPasswordNotification` (link), `PasswordChangedNotification` (cảnh báo) |
| Bảng | `password_reset_tokens` (`email` PK, `token`, `created_at`) — tái dùng, không migration mới |

## CONTEXT

- Cả 2 endpoint là **guest**, nằm dưới limiter `throttle:auth` (10 req/phút/IP).
- Token plaintext (`Str::random(64)`) được nhúng vào link gửi mail; bảng chỉ lưu `hash('sha256', token)`.
- Link reset trỏ về frontend: `config('app.frontend_url') . '/reset-password?token=...&email=...'`.
- Sau khi reset thành công, **toàn bộ Sanctum token** của user bị thu hồi.

## FLOW

### Flow 1 — Yêu cầu link (`forgot-password`)

1. **Validation** — `ForgotPasswordRequest` validate `email` (required, email, max:255, **`exists:users`**). Email chưa đăng ký → `422 auth.reset.email_not_found` (quyết định sản phẩm: BR-AUTH-005 đã gỡ).
2. **Lookup** — `AuthService::sendResetLink()` tra user theo email (lowercased).
3. **Cooldown** — Nếu token hiện tại của email có `created_at` < 60s trước → bỏ qua gửi mail ([[BR-AUTH-008]]).
4. **Issue token** — `Str::random(64)`; `updateOrInsert` theo `email` với `token = sha256(plain)`, `created_at = now()` ([[BR-AUTH-001]], [[BR-AUTH-004]]).
5. **Notify** — `$user->notify(new ResetPasswordNotification($plain))` (queued).
6. **Return** — `200 { message: auth.reset.link_sent }`.

### Flow 2 — Đặt mật khẩu mới (`reset-password`)

1. **Validation** — `ResetPasswordRequest` validate `email`, `token`, `password` (required, min:8, confirmed) ([[BR-AUTH-007]]).
2. **Fetch token row** — theo `email`. Không có / hash không khớp (`hash_equals`) → `422 auth.reset.invalid_token` ([[BR-AUTH-001]]).
3. **TTL check** — `created_at + 60m < now()` → xóa dòng token + `422 auth.reset.expired_token` ([[BR-AUTH-002]]).
4. **Transaction (lockForUpdate)** — đọc lại token dưới row-lock (chống race), tra user:
   - `Hash::check(password, user.password)` đúng → `422 auth.reset.same_password` ([[BR-AUTH-009]]).
   - Cập nhật `users.password = Hash::make(password)`.
   - `$user->tokens()->delete()` — thu hồi mọi phiên ([[BR-AUTH-006]]).
   - Xóa dòng `password_reset_tokens` — single-use ([[BR-AUTH-003]]).
5. **Notify** — `PasswordChangedNotification` (sau commit, queued).
6. **Return** — `200 { message: auth.reset.success }`.

## RULES

| BR | Rule | Enforced in |
|---|---|---|
| BR-AUTH-001 | Token lưu dạng `sha256`, không bao giờ plaintext; so khớp bằng `hash_equals`. | `AuthService::sendResetLink/resetPassword` |
| BR-AUTH-002 | Token hết hạn sau 60 phút kể từ `created_at`. | `AuthService::resetPassword` |
| BR-AUTH-003 | Token bị xóa ngay sau khi reset thành công (single-use). | `AuthService::resetPassword` |
| BR-AUTH-004 | Mỗi email chỉ giữ 1 token active; request mới ghi đè (`updateOrInsert`). | `AuthService::sendResetLink` |
| ~~BR-AUTH-005~~ | **Đã gỡ** — `forgot-password` validate `exists:users`, trả 422 khi email chưa đăng ký (lộ email theo quyết định sản phẩm). | `ForgotPasswordRequest` |
| BR-AUTH-006 | Reset thành công → thu hồi toàn bộ `personal_access_tokens` của user. | `AuthService::resetPassword` |
| BR-AUTH-007 | Mật khẩu mới: tối thiểu 8 ký tự + `password_confirmation` khớp. | `ResetPasswordRequest` |
| BR-AUTH-008 | `forgot-password`: ≤ 10 req/phút/IP (`throttle:auth`) + cooldown 60s/email. | Route `throttle:auth` + `AuthService::sendResetLink` |
| BR-AUTH-009 | Mật khẩu mới phải khác mật khẩu hiện tại. | `AuthService::resetPassword` |

## EDGE_CASES

- **Email không tồn tại** → `422 auth.reset.email_not_found`, không token, không mail.
- **Gọi lại trong 60s** → không gửi mail thứ 2 ([[BR-AUTH-008]]).
- **Token sai/giả mạo** → `422 auth.reset.invalid_token`, không tiêu thụ token thật.
- **Token hết hạn** → `422 auth.reset.expired_token`, dòng token bị xóa.
- **Dùng lại token đã reset** → `422 auth.reset.invalid_token` (đã bị xóa).
- **2 request reset đồng thời cùng token** → đúng 1 thành công nhờ `lockForUpdate` + single-use; request sau → invalid.
- **Mật khẩu mới trùng mật khẩu cũ** → `422 auth.reset.same_password` ([[BR-AUTH-009]]).
- **Vượt rate-limit** → `429 Too Many Requests`.
- **Queue/mail lỗi lúc worker chạy** → job retry; user không thấy lỗi đồng bộ; dòng token vẫn còn.
