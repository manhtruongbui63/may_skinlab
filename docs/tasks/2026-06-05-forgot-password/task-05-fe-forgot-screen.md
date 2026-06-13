---
task_id: "05"
title: "FE S1 — Forgot Password Screen"
description: "Forgot-password screen (S1): email form + success notice, page integration at app/(auth)/forgot-password, all UI states, the 'Forgot password?' link on Login, and i18n."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: M
complexity: low
risk: low
depends_on: ["04"]
rule_refs:
  - PROPOSED_BR:reset-email-no-enumeration
date: "2026-06-05"
changelog:
  - version: 1.0
    date: "2026-06-05"
    summary: Initial task specification.
---

# Context
- **Requirement**: [03-forgot-password.md](../../requirements/03-forgot-password.md) — Screen **S1** (§9.2), component tree §9.3, UI states §9.6, UX §9.7
- **Parent Task**: [2026-06-05-forgot-password-implementation-tasks.md](../2026-06-05-forgot-password-implementation-tasks.md)
- **Layer**: **3b Components + 3c Integration** (single Flow-A screen, within budget)
- **Applicable Skills (MANDATORY)**: `bks-fe-implement-feature` (primary), `bks-fe-ds-sdk-consumer`
- **Feature subfolders / routes touched**: `frontend/features/auth/components/`; route `frontend/app/(auth)/forgot-password/page.tsx`
- **i18n (MANDATORY)**: `messages/{locale}/auth.json` — keys in §9.8. No hardcoded strings.

---

# Task 05: FE S1 — Forgot Password Screen

## Description
Build the **forgot-password** screen: a one-field email form that calls `useForgotPassword` (Task 04), and on success swaps to a "reset link sent" notice **without navigating** (so email existence is never revealed). Wire the route page and add the "Quên mật khẩu?" link on the existing Login screen. Flow A (form only), Standard complexity.

## Out of Scope
- **Data layer** — Task 04 (repo/hook/schema already exist).
- **Reset screen (S2)** — Task 06.
- **Tests** — Tasks 07/08.
- **No backend / no `app/` references.**

## Current State (Already Exists)
- `useForgotPassword` hook + `createForgotPasswordSchema` (Task 04).
- Existing Login screen (target for the new link) and `(auth)` route group.
- DS components available via `@bks/ds-system-sdk`.

## Requirements

### 1. Components (`features/auth/components/` — NEW) — ≤3, role + props contract
| Component | Role | Props (contract) | Notes |
|-----------|------|------------------|-------|
| `ForgotPasswordPage` | container | — | owns `useForgotPassword`; toggles form ↔ success notice |
| `ForgotPasswordForm` | presentational | `{ onSubmit(values), isPending }` | single `email` field, RHF + `createForgotPasswordSchema` (skill wires RHF) |
| `ResetLinkSentNotice` | presentational | `{ email? }` | success state shown after submit |

- Fill each role with the appropriate **DS component by purpose** (form field, button, alert/notice) — `bks-fe-ds-sdk-consumer` picks the exact components + tokens.

### 2. Page integration (`app/(auth)/forgot-password/page.tsx` — NEW)
- Compose `ForgotPasswordPage`. Mark interactive boundary `'use client'` per project convention (skill decides server/client split).

### 3. UI states (§9.6)
| State | Behavior |
|-------|----------|
| Loading | submit spinner; submit button disabled while pending (**UI-004**) |
| Error | field error + toast via `mapBackendErrors` |
| Permission | N/A (guest) |
| Success | hide form, render `ResetLinkSentNotice` (no navigation — **UI-001**) + toast `auth.toasts.reset_link_sent` |

### 4. Navigation
- Add a "Quên mật khẩu?" link on the existing **Login** screen pointing to `/forgot-password` (§9.8). Link text via i18n.

### 5. Interactions (UI-*)
- **UI-001**: on success, hide form → show `ResetLinkSentNotice` (no redirect) — anti-enumeration.
- **UI-004**: disable submit while request pending (prevent double-submit).

### 6. i18n keys (§9.8)
`auth.forgot.title`, `auth.forgot.submit`, `auth.toasts.reset_link_sent`, `auth.errors.email_invalid`, plus the Login link label — for **every** locale.

## Testing Hints
- **UI interactions**: submit toggles to success notice; submit disabled while pending.
- **Scenarios** (tests in Task 07): valid submit → success notice; invalid email → inline error; pending → disabled button.

## Status
- [ ] Create `ForgotPasswordForm`, `ResetLinkSentNotice`, `ForgotPasswordPage`.
- [ ] Create `app/(auth)/forgot-password/page.tsx`.
- [ ] Implement all UI states (loading/error/success per §9.6, UI-001, UI-004).
- [ ] Add "Quên mật khẩu?" link on the Login screen.
- [ ] Add `auth.*` i18n keys for every locale; verify no hardcoded strings.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm test`.

## Acceptance Criteria
1. `/forgot-password` renders the email form; valid submit → form hidden, `ResetLinkSentNotice` shown, success toast — **no navigation** (UI-001).
2. Invalid email → inline field error; no request fired.
3. Submit button disabled while the request is pending (UI-004).
4. Login screen shows a working "Quên mật khẩu?" link to `/forgot-password`.
5. All copy comes from `auth.*` i18n keys (every locale).

## Error Scenarios
- Invalid email format → inline Zod error.
- Backend `422` (rare for forgot) → toast via `mapBackendErrors`; form stays.

## Dependencies
- Task 04 (FE Data Layer) — `useForgotPassword`, `createForgotPasswordSchema`, MSW mocks.
