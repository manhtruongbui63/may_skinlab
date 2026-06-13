---
task_id: "02"
title: "Reset Password API — Set New Password"
description: "Guest endpoint POST /auth/reset-password: verify a hashed, non-expired (60m), single-use token under a row lock, enforce the new-password policy (incl. must-differ), update the password, revoke all Sanctum sessions, delete the token, and notify the user."
type: IMPLEMENTATION
phase: 2
status: pending
estimated_effort: M
complexity: high
risk: high
depends_on: ["01"]
rule_refs:
  - PROPOSED_BR:reset-token-hashed-at-rest
  - PROPOSED_BR:reset-token-ttl-60m
  - PROPOSED_BR:reset-token-single-use
  - PROPOSED_BR:reset-revoke-all-sessions
  - PROPOSED_BR:reset-password-policy
  - PROPOSED_BR:reset-new-password-must-differ
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
> `PasswordChangedNotification` is a **queued `Notification` dispatched by this HTTP request**, so it is created **inside this API task**, not as a Phase 2a Job task.

---

# Task 02: Reset Password API — Set New Password

## Description
Add the **guest** endpoint that consumes a reset token and sets a new password. The service verifies the token by hash comparison, enforces the 60-minute TTL and single-use semantics under a row lock, applies the password policy (min 8 + confirmed + must differ from current), persists the new password, **revokes every Sanctum access token** for the user, deletes the consumed token, and sends a security-alert notification. Implements Flow 2 (§8).

## Out of Scope
- **Link issuance / email sending of the reset link** — Task 01.
- **No new migration**; reuse `password_reset_tokens`.
- **No frontend** — Tasks 04–06.

## Current State (Already Exists)
- **Service**: `App\Services\Api\AuthService` — gains `sendResetLink` in Task 01; add `resetPassword` here.
- **Controller**: `App\Http\Controllers\Api\AuthController`.
- **Factory**: `ApiFactory::getAuthService()` — reuse; **no new factory**.
- **Exception**: `App\Exceptions\InputException` (used elsewhere in `AuthService`) for domain errors (renders `422`-style).
- **Model**: `User` — `tokens()` relation (Sanctum `personal_access_tokens`); `password` cast `hashed`.
- **Table**: `password_reset_tokens` (`email` PK, `token`, `created_at`).

## Requirements

### 1. DTO — `ResetPasswordData` (NEW)
- **File**: `app/DTOs/Api/Auth/ResetPasswordData.php`
- `final readonly`. **Fields**: `email: string`, `token: string`, `password: string`.
  *(`password_confirmation` is validation-only; not carried in the DTO.)*

### 2. FormRequest — `ResetPasswordRequest` (NEW)
- **File**: `app/Http/Requests/Auth/ResetPasswordRequest.php`
- **Auth**: public (guest) — `authorize()` returns `true`.
- **Validation**:

| Field | Presence | Type | Boundaries | Format | Cross-field | Notes |
|-------|----------|------|------------|--------|-------------|-------|
| `email` | `required` | `string` | `max:255` | `email` | — | identifies the token row |
| `token` | `required` | `string` | — | — | — | plaintext token from URL |
| `password` | `required` | `string` | `min:8` | — | `confirmed` | `PROPOSED_BR:reset-password-policy` |
| `password_confirmation` | `required` | `string` | — | — | must equal `password` | implied by `confirmed` |

- **Cross-field rules**:

| Condition | Affected Fields | Rule | Error Message Key |
|-----------|----------------|------|-------------------|
| `password` present | `password`, `password_confirmation` | must match | `validation.confirmed` |

> Must-differ-from-current is **not** checkable in the FormRequest (needs the user record); enforce it in the service (step 3e).

### 3. Service — `AuthService::resetPassword` (ADD method)
- **File**: `app/Services/Api/AuthService.php`
- **Signature**: `public function resetPassword(ResetPasswordData $dto): void`
- **Logic flow** (Flow 2, steps 3–7) — wrap steps a–f in a DB transaction with `lockForUpdate()` on the token row:
  - **a.** Fetch the `password_reset_tokens` row by `email`. Missing → throw `InputException('auth.reset.invalid_token')`.
  - **b.** Compare with `hash_equals($row->token, hash('sha256', $dto->token))`. Mismatch → `InputException('auth.reset.invalid_token')`. (`PROPOSED_BR:reset-token-hashed-at-rest`)
  - **c.** TTL check: if `created_at + 60 minutes < now()` → delete the row and throw `InputException('auth.reset.expired_token')`. (`PROPOSED_BR:reset-token-ttl-60m`)
  - **d.** Fetch `User` by `email`. Missing → `InputException('auth.reset.invalid_token')` (uniform, no leak).
  - **e.** If `Hash::check($dto->password, $user->password)` → `InputException('auth.reset.same_password')`. (`PROPOSED_BR:reset-new-password-must-differ`)
  - **f.** Update `users.password = Hash::make($dto->password)`; **revoke all sessions** `$user->tokens()->delete()` (`PROPOSED_BR:reset-revoke-all-sessions`); delete the token row (`PROPOSED_BR:reset-token-single-use`); dispatch `$user->notify(new PasswordChangedNotification())`.
- **Concurrency**: the `lockForUpdate()` on the token row + single-use delete guarantees two simultaneous resets cannot both consume the same token — the second finds no row → `invalid_token`.
- **State changes**: `users.password` updated; `personal_access_tokens` rows for the user **DELETED**; `password_reset_tokens` row **DELETED**.

### 4. Controller — `AuthController::resetPassword` (ADD action)
- **Signature**: `public function resetPassword(ResetPasswordRequest $request): JsonResponse`
- Builds `ResetPasswordData`, calls the service, returns `200 { message: "auth.reset.success" }`.
- **Auth requirement**: **guest / public**, under `throttle:auth`. *(State only — skill places route/middleware.)*

### 5. Notification — `PasswordChangedNotification` (NEW, queued)
- **File**: `app/Notifications/PasswordChangedNotification.php`
- `implements ShouldQueue`; mail channel. Security alert: "Mật khẩu đã được thay đổi".
- **Content variables**: `{user_name}`, `{changed_at}`, `{support_contact}`. (§10)

### 6. Backend localization keys (NEW)
- `auth.reset.success`, `auth.reset.invalid_token`, `auth.reset.expired_token`, `auth.reset.same_password`.

## API Endpoints Summary

| Method | URI | Description | Input | Output | Auth |
|--------|-----|-------------|-------|--------|------|
| `POST` | `/api/auth/reset-password` | Verify token + set new password | `email`, `token`, `password`, `password_confirmation` | `200 { message: "auth.reset.success" }` | Public (guest), `throttle:auth` |

## Testing Hints
- **Backend Requirements**:
  - **Factory needs**: `UserFactory`; ability to seed a `password_reset_tokens` row with a known hashed token + `created_at`.
  - **Mock requirements**: `Notification::fake()` for `PasswordChangedNotification`; create Sanctum tokens to assert revocation.
- **Key scenarios** (exhaustive coverage in Task 03):
  - Valid, non-expired token → password changed, token row deleted, all `personal_access_tokens` for the user deleted, notification queued.
  - Reused token → `auth.reset.invalid_token`.
  - Token older than 60m → `auth.reset.expired_token`.
  - New password equals current → `auth.reset.same_password`.
- **Assertions**: post-reset, the user can authenticate only with the new password; old tokens rejected.

## Status
- [ ] Create `ResetPasswordData` DTO.
- [ ] Create `ResetPasswordRequest` (min:8, confirmed).
- [ ] Add `AuthService::resetPassword(ResetPasswordData): void` with transaction + `lockForUpdate()`.
- [ ] Add `AuthController::resetPassword()` returning `200 auth.reset.success`.
- [ ] Create queued `PasswordChangedNotification`.
- [ ] Add `auth.reset.{success,invalid_token,expired_token,same_password}` lang keys.
- [ ] Run `php artisan code:format`.
- [ ] **Run `php .agents/scripts/validate-backend.php backend`** and fix every reported error.
- [ ] Run `php artisan test --filter=ResetPasswordTest` (happy-path smoke).

## Acceptance Criteria
1. Valid + non-expired token → `200 auth.reset.success`; `users.password` updated; **every** `personal_access_tokens` row for the user deleted; `password_reset_tokens` row deleted; `PasswordChangedNotification` queued.
2. Token reuse (already consumed) → `422 auth.reset.invalid_token`.
3. Token older than 60 minutes → `422 auth.reset.expired_token` and the stale row is deleted.
4. New password equal to current password → `422 auth.reset.same_password`.
5. `password` < 8 chars or confirmation mismatch → `422` (validation).
6. Two concurrent resets with the same token → exactly one succeeds; the other → `auth.reset.invalid_token`.
7. Exceeding `throttle:auth` → `429`.

## Error Scenarios
- Token missing/incorrect → `auth.reset.invalid_token` (`422`), no change.
- Token expired → `auth.reset.expired_token` (`422`) + token row deleted.
- Password policy fail → `422` (FormRequest).
- New password == current → `auth.reset.same_password` (`422`).
- Concurrent reset → second request finds no token (lock) → invalid; only one password change occurs.
- Over `throttle:auth` → `429`.

## Dependencies
- Task 01 (Forgot Password API) — shares `AuthService` and defines the token-issuance contract this task consumes; ensures the `password_reset_tokens` workflow + `config('app.frontend_url')` exist.
