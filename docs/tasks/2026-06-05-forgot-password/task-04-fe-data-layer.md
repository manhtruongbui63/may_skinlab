---
task_id: "04"
title: "FE Data Layer — Forgot/Reset Password"
description: "Frontend data layer for both reset screens: AuthRepository.forgotPassword/resetPassword methods (+ interface), Zod request/response schemas, useForgotPassword/useResetPassword hooks with 422 mapBackendErrors, and MSW mocks."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: []
rule_refs:
  - PROPOSED_BR:reset-password-policy
  - PROPOSED_BR:reset-email-no-enumeration
date: "2026-06-05"
changelog:
  - version: 1.0
    date: "2026-06-05"
    summary: Initial task specification.
---

# Context
- **Requirement**: [03-forgot-password.md](../../requirements/03-forgot-password.md) — Screens **S1** & **S2** (§9.2), Data Layer §9.4–9.5
- **Parent Task**: [2026-06-05-forgot-password-implementation-tasks.md](../2026-06-05-forgot-password-implementation-tasks.md)
- **Layer**: **3a — Data**
- **Applicable Skills (MANDATORY)**: `bks-fe-api-integration` (primary), `bks-fe-implement-feature`
- **Feature subfolders touched**: `frontend/features/auth/{schemas,services,hooks,mocks}/` + `types.ts`
- **i18n (MANDATORY)**: namespace `messages/{locale}/auth.json` — error/toast keys consumed by hooks (see §9.8). No hardcoded strings.

---

# Task 04: FE Data Layer — Forgot/Reset Password

## Description
Build the data layer that both reset screens consume: two new repository methods on the existing `AuthRepository` (with matching `IAuthRepository` contract entries), Zod schemas for request validation and response parsing, two hooks, and MSW mocks. Follows the established Repository → Service/hook pattern; 422 field errors are mapped via `mapBackendErrors`.

## Out of Scope
- **No components / pages** — Tasks 05 (S1), 06 (S2).
- **No backend** — Tasks 01/02. This task references `app/` only to describe the API contract consumed.

## Current State (Already Exists)
- `features/auth/services/auth.repository.ts` — `IAuthRepository` interface; `auth.repository.impl.ts` — `extends BaseRepository`.
- `features/auth/schemas/auth.schema.ts` — existing Zod schemas + `Backend*ResponseSchema` envelope pattern; `createLoginSchema(t)` factory style.
- `features/auth/mocks/auth.mock.ts` — MSW mock repository.
- `features/auth/hooks/use-auth.ts`; `features/auth/types.ts`.

## Requirements

### 1. Types (`features/auth/types.ts` — MODIFY)
Add request credential shapes (contracts only):
| Type | Fields |
|------|--------|
| `ForgotPasswordCredentials` | `email: string` |
| `ResetPasswordCredentials` | `email: string`, `token: string`, `password: string`, `password_confirmation: string` |

### 2. Zod schemas (`features/auth/schemas/auth.schema.ts` — MODIFY)
Add **request** schemas (factory style `createX(t)` like `createLoginSchema`), reusing §9.5 rules:
| Schema | Field | Rule | Error key |
|--------|-------|------|-----------|
| `createForgotPasswordSchema` | `email` | required, email | `auth.errors.email_invalid` |
| `createResetPasswordSchema` | `password` | required, min 8 | `auth.errors.password_min` |
| `createResetPasswordSchema` | `password_confirmation` | must equal `password` | `auth.errors.password_mismatch` |
| `createResetPasswordSchema` | `token` | required (hidden, from URL) | `auth.errors.token_required` |
| `createResetPasswordSchema` | `email` | required (hidden, from URL) | — |

Add **response** schemas reusing the existing envelope pattern (e.g. a `{ message }` payload schema for both endpoints).

### 3. Repository (`services/` — MODIFY)
Add to `IAuthRepository` (`auth.repository.ts`) and implement in `auth.repository.impl.ts` (`extends BaseRepository`). **Signatures only** — the skill writes the adapter body, response validation, and `mapBackendErrors`:
```ts
forgotPassword(credentials: ForgotPasswordCredentials): Promise<{ message?: string | null }>
resetPassword(data: ResetPasswordCredentials): Promise<{ message?: string | null }>
```
- **API contract consumed**:
  - `POST /api/v1/auth/forgot-password` → `{ message }`; always `200` (uniform, no-enumeration — FE shows the same success regardless).
  - `POST /api/v1/auth/reset-password` → `{ message }` on `200`; `422` with field errors (`auth.reset.invalid_token` / `expired_token` / `same_password`) mapped via `mapBackendErrors`.
- Validate responses with the Zod response schemas; map 422 server errors through `mapBackendErrors`.

### 4. Hooks (`hooks/` — NEW)
Signatures (contracts only — skill writes the implementation, toasts, store usage):
```ts
useForgotPassword(): { submit(values: ForgotPasswordCredentials): Promise<void>; isPending: boolean; ... }
useResetPassword(): { submit(values: ResetPasswordCredentials): Promise<void>; isPending: boolean; ... }
```
- No global/auth store mutation (guest flow; local state only — §9.8).

### 5. MSW mocks (`mocks/auth.mock.ts` — MODIFY)
Add mock handlers for both endpoints: forgot → uniform `200 { message }`; reset → `200` success and selectable `422` error cases (invalid/expired/same-password) for component/integration tests.

## Testing Hints
- **Stores/Composables**: hooks expose `isPending` + submit; no auth-store writes.
- **Key scenarios**: forgot success; reset success; reset 422 maps to field errors; response-schema parse failure handled.

## Status
- [ ] Add `ForgotPasswordCredentials` / `ResetPasswordCredentials` to `types.ts`.
- [ ] Add request + response Zod schemas to `auth.schema.ts`.
- [ ] Add `forgotPassword`/`resetPassword` to `IAuthRepository` + impl.
- [ ] Add `useForgotPassword` / `useResetPassword` hooks (422 via `mapBackendErrors`).
- [ ] Add MSW handlers (success + 422 cases).
- [ ] Add i18n keys `auth.errors.*` consumed here for every locale.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm test`.

## Acceptance Criteria
1. `AuthRepository.forgotPassword` / `resetPassword` exist on the interface + impl and parse responses with Zod.
2. `useForgotPassword` / `useResetPassword` expose a submit + pending state and surface 422 field errors via `mapBackendErrors`.
3. MSW mocks serve uniform forgot success and selectable reset `200`/`422` cases.
4. No hardcoded user-facing strings — all keys under `auth.*`.

## Dependencies
- None for building/mocking (mock-first). Real-API behavior aligns with Tasks 01/02 contracts.
