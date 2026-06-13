---
task_id: "07"
title: "FE Component/Unit Tests — Reset Screens"
description: "Vitest + Testing Library tests for the forgot/reset forms, success/invalid-link notices, hooks, and DS-token mapping (VT + VT-DS) for screens S1 and S2."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: M
complexity: low
risk: low
depends_on: ["05", "06"]
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
- **Requirement**: [03-forgot-password.md](../../requirements/03-forgot-password.md) — Screens **S1**, **S2**
- **Parent Task**: [2026-06-05-forgot-password-implementation-tasks.md](../2026-06-05-forgot-password-implementation-tasks.md)
- **Layer**: **3d — Tests (unit/integration)**
- **Applicable Skills (MANDATORY)**: `bks-fe-create-tc-component`
- **Feature subfolders touched**: `frontend/features/auth/` test files (co-located/`__tests__` per project convention)
- **i18n**: assert keys render via the i18n provider (no hardcoded strings).

## Description
Write Vitest + Testing Library tests for the reset screens' components, hooks, and schemas, using the MSW mocks from Task 04. Per `bks-fe-create-tc-component`, deliver **≥10 VT (behavioral) + ≥10 VT-DS (design-token/SDK mapping) = ≥20 TC**. No E2E here (that's Task 08).

## Out of Scope
- E2E/Playwright — Task 08.
- Backend tests — Task 03.

## Requirements
Cover, at minimum:
- **ForgotPasswordForm / ForgotPasswordPage (S1)**: valid submit → success notice (UI-001); invalid email → inline error; submit disabled while pending (UI-004); uniform success regardless of email (`PROPOSED_BR:reset-email-no-enumeration`).
- **ResetPasswordForm / ResetPasswordPage (S2)**: missing `token`/`email` → `InvalidLinkNotice` (UI-002); password < 8 → error; mismatch → error (`PROPOSED_BR:reset-password-policy`); valid submit → success toast + redirect intent (UI-003); `422` (expired/invalid/same-password) → banner via `mapBackendErrors`.
- **Hooks**: `useForgotPassword`/`useResetPassword` pending state + error mapping.
- **VT-DS**: assert components map to the correct DS design tokens / SDK rules per `bks-fe-ds-sdk-consumer` (spacing, typography roles, button/alert variants).

## Status
- [ ] Write ≥10 VT behavioral tests across S1+S2 components/hooks.
- [ ] Write ≥10 VT-DS tests asserting design-token/SDK mapping.
- [ ] Use Task 04 MSW mocks for success + 422 cases.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm test`.

## Acceptance Criteria
1. ≥20 TC total (≥10 VT + ≥10 VT-DS) pass under Vitest.
2. All §9.6 UI states and UI-001..004 interactions are asserted for S1 and S2.
3. 422 error mapping and invalid-link guard are covered.
4. No hardcoded strings — i18n keys verified.

## Dependencies
- Task 05 (S1 screen) and Task 06 (S2 screen) — components under test.
- Task 04 — MSW mocks + hooks.
