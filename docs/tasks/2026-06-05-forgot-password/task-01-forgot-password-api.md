---
task_id: "01"
title: "Forgot Password API — Request Reset Link"
description: "Guest endpoint POST /auth/forgot-password: validate email (no enumeration), issue a hashed single-active reset token with 60s cooldown, and dispatch a queued ResetPasswordNotification. Uniform 200 response regardless of email existence."
type: IMPLEMENTATION
phase: 2
status: pending
estimated_effort: M
complexity: medium
risk: medium
depends_on: []
rule_refs:
  - PROPOSED_BR:reset-token-hashed-at-rest
  - PROPOSED_BR:reset-one-active-token-per-email
  - PROPOSED_BR:reset-email-no-enumeration
  - PROPOSED_BR:reset-rate-limit
date: "2026-06-05"
changelog:
  - version: 1.0
    date: "2026-06-05"
    summary: Initial task specification.
---

# Context
- **Requirement**: [03-forgot-password.md](../../requirements/03-forgot-password.md)
- **Parent Task**: [2026-06-05-forgot-password-implementation-tasks.md](../2026-06-05-forgot-password-implementation-tasks.md)
- **Applicable Workflows (MANDATORY)**: `/execute-api-task`
- **Applicable Skills (MANDATORY)**: `bks-be-api-standard`

> [!NOTE]
> The `ResetPasswordNotification` is a **queued `Notification` dispatched by this HTTP request**, so it is created **inside this API task** (not a separate Phase 2a Job task) per the API+Job separation rule.

---

# Task 01: Forgot Password API — Request Reset Link

## Description
Add a new **guest** endpoint that lets a logged-out user request a password-reset link. The service issues a random token (stored hashed), enforces a one-active-token-per-email + 60s cooldown policy, and emails a reset link via a queued notification. To prevent account enumeration, the endpoint returns an identical `200` response whether or not the email exists. Implements Flow 1 (§8).

## Out of Scope
- **Token verification / password change** — Task 02 (`reset-password`).
- **No new migration** — `password_reset_tokens` already exists; reuse it as-is.
- **No changes** to `login` / `register` / `change-password` flows.
- **No frontend** — Tasks 04–06.

## Current State (Already Exists)
- **Service**: `App\Services\Api\AuthService` (extends `Service`, supports `withGuard`/`withUser`). No reset methods yet.
- **Controller**: `App\Http\Controllers\Api\AuthController` — auth middleware applied in `__construct` `->except(['login','register'])`; uses `ApiFactory::getAuthService()`.
- **Factory**: `App\Factories\ApiFactory` — already exposes `getAuthService()`. **Do NOT create a new factory.**
- **Table**: `password_reset_tokens` (`email` PK, `token`, `created_at`) — exists from default migration.
- **Model**: `App\Models\User` uses `Notifiable` trait.
- **Throttle**: an `auth` limiter (10 req/min/IP) is registered and a `throttle:auth` group already exists in `routes/api.php`.
- **Existing requests/DTOs** in `app/Http/Requests/Auth/` and `app/DTOs/Api/Auth/` (mirror `ChangePasswordRequest`/`ChangePasswordData`).

## Requirements

### 1. DTO — `ForgotPasswordData` (NEW)
- **File**: `app/DTOs/Api/Auth/ForgotPasswordData.php`
- `final readonly` DTO carrying the validated input.
- **Fields**: `email: string`.
- Built from validated request data; service method accepts the DTO, not a raw array.

### 2. FormRequest — `ForgotPasswordRequest` (NEW)
- **File**: `app/Http/Requests/Auth/ForgotPasswordRequest.php` (mirror sibling `ChangePasswordRequest`).
- **Auth**: public endpoint (guest) — `authorize()` returns `true`.
- **Validation**:

| Field | Presence | Type | Boundaries | Format | Cross-field | Notes |
|-------|----------|------|------------|--------|-------------|-------|
| `email` | `required` | `string` | `max:255` | `email` | — | **Do NOT add `exists:users`** — enumeration protection (`PROPOSED_BR:reset-email-no-enumeration`) |

- **Localization keys** (error messages): reuse framework `validation.*` keys; no custom keys needed here.

### 3. Service — `AuthService::sendResetLink` (MODIFY service, ADD method)
- **File**: `app/Services/Api/AuthService.php`
- **Signature** (contract only — implementor writes the body):
  ```php
  public function sendResetLink(ForgotPasswordData $dto): void
  ```
- **Logic flow** (Flow 1, steps 4–8):
  1. Look up `User` by lowercased `email`. If **no user** → return silently (uniform response). (`PROPOSED_BR:reset-email-no-enumeration`)
  2. **Cooldown**: if the existing `password_reset_tokens` row for this email has `created_at > now()-60s` → return silently without re-sending. (`PROPOSED_BR:reset-rate-limit`)
  3. Generate `$plain = Str::random(64)`; `updateOrInsert` keyed by `email` with `token = hash('sha256', $plain)` and `created_at = now()`. (`PROPOSED_BR:reset-token-hashed-at-rest`, `PROPOSED_BR:reset-one-active-token-per-email`)
  4. Dispatch `$user->notify(new ResetPasswordNotification($plain))`.
- **Concurrency**: `updateOrInsert` on PK `email` is atomic → concurrent requests for the same email cannot create duplicate rows. No extra lock needed.
- **State changes**: upsert one `password_reset_tokens` row (`email`, hashed `token`, `created_at`).

### 4. Controller — `AuthController::forgotPassword` (MODIFY controller, ADD action)
- **File**: `app/Http/Controllers/Api/AuthController.php`
- **Signature**: `public function forgotPassword(ForgotPasswordRequest $request): JsonResponse`
- Builds `ForgotPasswordData`, calls `ApiFactory::getAuthService()->...->sendResetLink($dto)`, and **always** returns `200` with message `auth.reset.link_sent` — identical on every branch.
- **Auth requirement**: **guest / public** (logged-out user), under the credential-sensitive `throttle:auth` limiter. *(State only — the skill decides route/middleware placement; this is a public action like `login`/`register`.)*

### 5. Notification — `ResetPasswordNotification` (NEW, queued)
- **File**: `app/Notifications/ResetPasswordNotification.php`
- `implements ShouldQueue`; mail channel via `Notifiable`.
- **Constructor input**: the plaintext token.
- **Content variables**: `{reset_url}`, `{expires_minutes: 60}`, `{user_name}`.
- **Reset URL shape**: `{frontend_url}/reset-password?token={plain}&email={urlencoded email}` where `{frontend_url}` = `config('app.frontend_url')`.
- **Subject/body**: localized "Đặt lại mật khẩu". (§10)

### 6. Config — `frontend_url` (MODIFY if absent)
- Ensure `config('app.frontend_url')` resolves from `env('FRONTEND_URL')` (add the config entry if not already present). Used to build the reset link.

### 7. Backend localization keys (NEW)
- Add to the auth lang file: `auth.reset.link_sent`.

## API Endpoints Summary

| Method | URI | Description | Input | Output | Auth |
|--------|-----|-------------|-------|--------|------|
| `POST` | `/api/auth/forgot-password` | Issue reset link (uniform response) | `email` (required, email, max:255) | `200 { message: "auth.reset.link_sent" }` | Public (guest), `throttle:auth` |

> The Auth column is a *semantic requirement only*. Do NOT write route/middleware code in this task — `bks-be-api-standard` places the route in the existing `throttle:auth` group.

## Testing Hints
- **Backend Requirements**:
  - **Factory needs**: `UserFactory` (active user).
  - **Mock requirements**: `Notification::fake()` to assert `ResetPasswordNotification` queued; `Queue`/mail fake as needed.
- **Key test scenarios** (full non-happy-path coverage lives in Task 03):
  - Existing email → one hashed `password_reset_tokens` row + notification queued.
  - Non-existent email → identical `200`, **no** token row, **no** notification.
  - Second call within 60s → no second notification.
- **Assertions**: token stored as `hash('sha256', plain)` (never plaintext); response body identical across branches.

## Status
- [ ] Create `ForgotPasswordData` DTO.
- [ ] Create `ForgotPasswordRequest` (no `exists:users`).
- [ ] Add `AuthService::sendResetLink(ForgotPasswordData): void`.
- [ ] Add `AuthController::forgotPassword()` returning uniform `200`.
- [ ] Create queued `ResetPasswordNotification` building the reset URL from `config('app.frontend_url')`.
- [ ] Ensure `config('app.frontend_url')` / `FRONTEND_URL` is wired.
- [ ] Add `auth.reset.link_sent` lang key.
- [ ] Run `php artisan code:format`.
- [ ] **Run `php .agents/scripts/validate-backend.php backend`** and fix every reported error.
- [ ] Run `php artisan test --filter=ForgotPasswordTest` (happy-path smoke).

## Acceptance Criteria
1. `POST /auth/forgot-password` with a registered email → `200 { message: "auth.reset.link_sent" }`, one `password_reset_tokens` row with a **sha256-hashed** token, and `ResetPasswordNotification` queued.
2. Same request with an **unregistered** email → byte-identical `200` response, **no** token row, **no** notification (no enumeration).
3. A repeat request within **60s** for the same email → no second notification (cooldown), still `200`.
4. Invalid email format → `422`.
5. Exceeding `throttle:auth` (10/min/IP) → `429`.

## Error Scenarios
- Email wrong format → `ForgotPasswordRequest` rejects `422`.
- Over `throttle:auth` → `429`.
- Email not found → uniform `200` (no enumeration), no state change.
- Mail/queue failure at worker time → job retries per queue config; user sees no synchronous error; token row persists.

## Dependencies
- None. (Task 02 depends on this task for the shared `AuthService`/token contract.)
