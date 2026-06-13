---
task_id: "06"
title: "FE S2 — Reset Password Screen"
description: "Reset-password screen (S2): password + confirm form reading token/email from searchParams, invalid-link guard, page integration at app/(auth)/reset-password, all UI states, redirect to /login on success, and i18n."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: M
complexity: medium
risk: low
depends_on: ["04"]
rule_refs:
  - PROPOSED_BR:reset-password-policy
  - PROPOSED_BR:reset-revoke-all-sessions
date: "2026-06-05"
changelog:
  - version: 1.0
    date: "2026-06-05"
    summary: Initial task specification.
---

# Context
- **Requirement**: [03-forgot-password.md](../../requirements/03-forgot-password.md) — Screen **S2** (§9.2), component tree §9.3, UI states §9.6, UX §9.7
- **Parent Task**: [2026-06-05-forgot-password-implementation-tasks.md](../2026-06-05-forgot-password-implementation-tasks.md)
- **Layer**: **3b Components + 3c Integration** (single Flow-A screen, within budget)
- **Applicable Skills (MANDATORY)**: `bks-fe-implement-feature` (primary), `bks-fe-ds-sdk-consumer`
- **Feature subfolders / routes touched**: `frontend/features/auth/components/`; route `frontend/app/(auth)/reset-password/page.tsx`
- **i18n (MANDATORY)**: `messages/{locale}/auth.json` — keys in §9.8. No hardcoded strings.

---

# Task 06: FE S2 — Reset Password Screen

## Description
Build the **reset-password** screen: it reads `token` and `email` from `searchParams`, renders an `InvalidLinkNotice` immediately when either is missing, otherwise shows a password + confirmation form calling `useResetPassword` (Task 04). On success it toasts and redirects to `/login` (all old sessions were revoked server-side). Flow A (form only), Standard complexity.

## Out of Scope
- **Data layer** — Task 04.
- **Forgot screen (S1)** — Task 05.
- **Tests** — Tasks 07/08.
- **No backend / no `app/` references.**

## Current State (Already Exists)
- `useResetPassword` hook + `createResetPasswordSchema` (Task 04).
- `(auth)` route group; DS components via `@bks/ds-system-sdk`.

## Requirements

### 1. Components (`features/auth/components/` — NEW) — ≤3, role + props contract
| Component | Role | Props (contract) | Notes |
|-----------|------|------------------|-------|
| `ResetPasswordPage` | container | — | reads `searchParams` (`token`,`email`); owns `useResetPassword`; guards invalid link |
| `ResetPasswordForm` | presentational | `{ onSubmit(values), isPending, token, email }` | `password` + `password_confirmation` fields; `token`/`email` hidden, prefilled from URL; RHF + `createResetPasswordSchema` |
| `InvalidLinkNotice` | presentational | — | shown when `token`/`email` missing or token invalid |

- DS component selection (form fields, button, alert/banner) → `bks-fe-ds-sdk-consumer`.

### 2. Page integration (`app/(auth)/reset-password/page.tsx` — NEW)
- Compose `ResetPasswordPage`; read `token`/`email` from `searchParams`. Interactive boundary `'use client'` per convention (skill decides).

### 3. UI states (§9.6)
| State | Behavior |
|-------|----------|
| Loading | submit spinner; submit disabled while pending (**UI-004**) |
| Empty/Invalid | missing `token` or `email` → render `InvalidLinkNotice`, **do not render the form** (**UI-002**) |
| Error | field errors / `auth.reset.expired_token` & `invalid_token` surfaced (banner + `mapBackendErrors`) |
| Permission | N/A (guest) |
| Success | toast `auth.toasts.reset_success`, then `router.push('/login')` after ~1.5s (**UI-003**) |

### 4. Interactions (UI-*)
- **UI-002**: missing URL params → `InvalidLinkNotice` immediately (no form).
- **UI-003**: success → toast then redirect to `/login` after ~1.5s.
- **UI-004**: disable submit while pending.

### 5. i18n keys (§9.8)
`auth.reset.title`, `auth.reset.submit`, `auth.reset.invalid_link_notice`, `auth.reset.expired_token`, `auth.reset.invalid_token`, `auth.reset.same_password`, `auth.toasts.reset_success`, `auth.errors.{password_min,password_mismatch,token_required}` — for **every** locale.

## Testing Hints
- **UI interactions**: missing param → invalid notice; valid submit → toast + redirect; expired/invalid token 422 → banner.
- **Scenarios** (tests in Task 07): no token param; password mismatch; expired token error; success redirect.

## Status
- [ ] Create `ResetPasswordForm`, `InvalidLinkNotice`, `ResetPasswordPage`.
- [ ] Create `app/(auth)/reset-password/page.tsx` reading `searchParams`.
- [ ] Implement all UI states (UI-002 invalid link, UI-003 success redirect, UI-004 disable).
- [ ] Surface `422` token errors (expired/invalid/same-password) via banner + `mapBackendErrors`.
- [ ] Add `auth.*` i18n keys for every locale; verify no hardcoded strings.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm test`.

## Acceptance Criteria
1. Missing `token` or `email` in URL → `InvalidLinkNotice` shown, form not rendered (UI-002).
2. Valid token + matching passwords (≥8) → success toast then redirect to `/login` after ~1.5s (UI-003).
3. Password < 8 or mismatch → inline Zod errors; no request.
4. Backend `422` (`expired_token`/`invalid_token`/`same_password`) → error banner via `mapBackendErrors`.
5. Submit disabled while pending (UI-004); all copy via `auth.*` i18n.

## Error Scenarios
- Missing URL params → invalid-link state (no submit).
- Expired/invalid/single-use token → `422` mapped to banner.
- Same-as-current password → `422 auth.reset.same_password` banner.

## Dependencies
- Task 04 (FE Data Layer) — `useResetPassword`, `createResetPasswordSchema`, MSW reset mocks (200 + 422 cases).
