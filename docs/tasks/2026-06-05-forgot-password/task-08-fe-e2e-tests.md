---
task_id: "08"
title: "FE E2E Flow Tests — Forgot → Reset → Login"
description: "Playwright E2E covering the full forgot-password → reset-password → login journey plus invalid-link and error flows, via Page Objects."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: M
complexity: medium
risk: low
depends_on: ["05", "06"]
rule_refs:
  - PROPOSED_BR:reset-revoke-all-sessions
date: "2026-06-05"
changelog:
  - version: 1.0
    date: "2026-06-05"
    summary: Initial task specification.
---

# Context
- **Requirement**: [03-forgot-password.md](../../requirements/03-forgot-password.md) — Screens **S1**, **S2**, navigation §9.8
- **Parent Task**: [2026-06-05-forgot-password-implementation-tasks.md](../2026-06-05-forgot-password-implementation-tasks.md)
- **Layer**: **3d — Tests (E2E)**
- **Applicable Skills (MANDATORY)**: `bks-fe-create-tc-flow` (+ `bks-fe-webapp-testing` recon before selectors)
- **i18n**: select by role/test-id, not hardcoded copy.

## Description
Write Playwright E2E specs (with Page Objects) for the reset journey, per `bks-fe-create-tc-flow` (**≥10 TC**). Do **recon** on the running app before writing selectors. No overlap with the Vitest suite (Task 07).

## Out of Scope
- Component/unit tests — Task 07.
- Backend assertions beyond observable UI behavior — Task 03.

## Requirements
Page Objects for S1 (`/forgot-password`) and S2 (`/reset-password`), plus a spec covering at least:
- Login → "Quên mật khẩu?" link → S1.
- S1: submit email → success notice (no navigation, UI-001).
- S1: invalid email → inline error.
- S2: open with valid `token`+`email` params → form visible.
- S2: missing params → `InvalidLinkNotice` (UI-002).
- S2: password mismatch / < 8 → inline error.
- S2: success → toast + redirect to `/login` (UI-003).
- S2: expired/invalid token (`422`) → error banner.
- Post-reset login with the new password succeeds (and old session no longer valid — `PROPOSED_BR:reset-revoke-all-sessions`, observable as forced re-login).

## Status
- [ ] Recon the running screens (`bks-fe-webapp-testing`) before writing selectors.
- [ ] Create Page Objects for S1 and S2.
- [ ] Write ≥10 E2E TC covering the flows above.
- [ ] Run `pnpm lint`.
- [ ] Run the Playwright suite.

## Acceptance Criteria
1. ≥10 Playwright TC pass.
2. Full happy path Login → forgot → reset → login covered.
3. Invalid-link, validation, and 422 token-error flows covered.
4. Selectors are recon-derived (role/test-id), not hardcoded copy.

## Dependencies
- Task 05 (S1) and Task 06 (S2) — screens under test.
