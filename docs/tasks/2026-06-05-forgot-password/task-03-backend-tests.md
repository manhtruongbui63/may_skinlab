---
task_id: "03"
title: "Backend Tests — Forgot/Reset Non-Happy-Path & Security"
description: "PHPUnit Feature + Security tests asserting every Error Case, security guarantee (no-enumeration, rate-limit/cooldown, session revocation), token TTL/single-use, and concurrency for both reset endpoints."
type: IMPLEMENTATION
phase: 4
status: pending
estimated_effort: M
complexity: medium
risk: medium
depends_on: ["01", "02"]
rule_refs:
  - PROPOSED_BR:reset-token-hashed-at-rest
  - PROPOSED_BR:reset-token-ttl-60m
  - PROPOSED_BR:reset-token-single-use
  - PROPOSED_BR:reset-one-active-token-per-email
  - PROPOSED_BR:reset-email-no-enumeration
  - PROPOSED_BR:reset-revoke-all-sessions
  - PROPOSED_BR:reset-password-policy
  - PROPOSED_BR:reset-rate-limit
  - PROPOSED_BR:reset-new-password-must-differ
date: "2026-06-05"
changelog:
  - version: 1.0
    date: "2026-06-05"
    summary: Initial task specification.
---

# Context
- **Requirement**: [03-forgot-password.md](../../requirements/03-forgot-password.md) — Flow 1 & 2 Error Cases, §6 security analysis
- **Parent Task**: [2026-06-05-forgot-password-implementation-tasks.md](../2026-06-05-forgot-password-implementation-tasks.md)
- **Applicable Skills (MANDATORY)**: `bks-be-testing-standard`
- **Phase note**: conceptually **Phase 4 (Quality)**, but it depends only on Tasks 01–02 (no frontend), so it is numbered/scheduled right after the backend API tasks and runs **in parallel with the frontend track**.

> [!IMPORTANT]
> The inline happy-path smoke tests from Tasks 01/02 do **not** satisfy this coverage. This task asserts the **non-happy paths**: every Error Case row, each security guarantee, and concurrency.

## Description
Write PHPUnit Feature and Security tests covering both reset endpoints' non-happy-path behavior, the security rules (enumeration, rate-limit/cooldown, session revocation), token lifecycle (hashed-at-rest, 60m TTL, single-use, one-active-per-email), the password policy (incl. must-differ), and concurrency.

## Out of Scope
- Frontend tests — Tasks 07/08.
- Re-implementing the endpoints — Tasks 01/02.

## Requirements

### Forgot-password (`POST /auth/forgot-password`) — Flow 1
| Scenario | Assertion |
|----------|-----------|
| Existing email | one `password_reset_tokens` row, token stored as `sha256` (never plaintext); `ResetPasswordNotification` queued (`Notification::fake`) |
| Non-existent email | **identical** `200` body, no token row, no notification (`PROPOSED_BR:reset-email-no-enumeration`) |
| Second call within 60s | no second notification (`PROPOSED_BR:reset-rate-limit` cooldown) |
| One active token per email | repeated requests overwrite the row, never duplicate (`PROPOSED_BR:reset-one-active-token-per-email`) |
| Invalid email format | `422` |
| Over `throttle:auth` | `429` |
| No-enumeration parity | response shape/status identical for existing vs non-existent email |

### Reset-password (`POST /auth/reset-password`) — Flow 2
| Scenario | Assertion |
|----------|-----------|
| Valid + non-expired token | `200`; `users.password` changed; `password_reset_tokens` row deleted; **all** `personal_access_tokens` for the user deleted (`PROPOSED_BR:reset-revoke-all-sessions`); `PasswordChangedNotification` queued |
| Reused token | `422 auth.reset.invalid_token` (`PROPOSED_BR:reset-token-single-use`) |
| Expired token (created_at + 60m < now) | `422 auth.reset.expired_token` + row deleted (`PROPOSED_BR:reset-token-ttl-60m`) |
| Wrong/forged token | `422 auth.reset.invalid_token` (hash comparison) |
| Password < 8 / mismatch | `422` (`PROPOSED_BR:reset-password-policy`) |
| New password == current | `422 auth.reset.same_password` (`PROPOSED_BR:reset-new-password-must-differ`) |
| Concurrency | two simultaneous resets with same token → exactly one succeeds (lock + single-use) |
| Over `throttle:auth` | `429` |
| Post-reset auth | old tokens rejected; login works only with the new password |

## Testing Hints
- **Factory needs**: `UserFactory`; helper to insert a `password_reset_tokens` row with a known `hash('sha256', $plain)` and controllable `created_at` (to simulate expiry/cooldown).
- **Time control**: `travel()`/`Carbon::setTestNow()` for TTL and cooldown windows.
- **Mocks**: `Notification::fake()`; create Sanctum tokens via `createToken()` to assert revocation.
- **Concurrency**: simulate via DB-level race or sequential token-consumption assertions.

## Status
- [ ] Write Feature tests for all forgot-password Error Cases + cooldown + no-enumeration parity.
- [ ] Write Feature tests for all reset-password Error Cases + TTL + single-use + revoke-all-sessions.
- [ ] Write Security tests: enumeration parity, `429` rate-limit, token never stored plaintext.
- [ ] Write concurrency test for simultaneous reset with the same token.
- [ ] Run `php artisan code:format`.
- [ ] **Run `php .agents/scripts/validate-backend.php backend`** and fix every reported error.
- [ ] Run `php artisan test --filter=ForgotPasswordTest` and `--filter=ResetPasswordTest`.

## Acceptance Criteria
1. Every Error Case row from Flow 1 and Flow 2 has a passing assertion.
2. No-enumeration is proven (identical response for existing vs non-existent email; cooldown blocks re-send).
3. Token is verified hashed-at-rest, 60m-expiring, single-use, one-active-per-email.
4. Successful reset revokes **all** the user's `personal_access_tokens` and the consumed token row.
5. Rate-limit (`429`) and concurrency (single-winner) are covered.

## Dependencies
- Task 01 (Forgot Password API) and Task 02 (Reset Password API) — endpoints under test.
