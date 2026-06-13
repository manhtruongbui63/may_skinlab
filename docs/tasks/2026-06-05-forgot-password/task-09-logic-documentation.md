---
task_id: "09"
title: "Logic Documentation + BR Registration"
description: "Create docs/logic/auth/reset-password.md, update the auth logic index, and register the nine PROPOSED_BR:reset-* rules as official BR-AUTH-* codes in the BR registry."
type: DOCUMENTATION
phase: 4
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: ["01", "02", "04", "05", "06"]
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
- **Requirement**: [03-forgot-password.md](../../requirements/03-forgot-password.md) — §5 Business Rules, §8 Flows
- **Parent Task**: [2026-06-05-forgot-password-implementation-tasks.md](../2026-06-05-forgot-password-implementation-tasks.md)
- **Applicable Workflows (MANDATORY)**: None (documentation only)
- **Applicable Skills (MANDATORY)**: `bks-doc-logic-standard`

## Description
Document the forgot/reset-password business logic as a structured logic doc, link it in the auth index, and promote the nine `PROPOSED_BR:reset-*` rules to official `BR-AUTH-*` codes in `docs/system/br-registry.md` (then update references across the new logic doc).

## Out of Scope
- **No code changes** — documentation only.
- **No API-doc generation** (Scramble auto-generates from annotations).

## Requirements

### 1. Create logic doc (NEW)
- **File**: `docs/logic/auth/reset-password.md` — follow `bks-doc-logic-standard` (YAML frontmatter + FLOW / RULES / EDGE_CASES sections).
- **Cover**:
  - **OVERVIEW**: guest password reset via emailed token; two endpoints.
  - **FLOW 1** (request link): no-enumeration uniform response, 60s cooldown, hashed single-active token, queued `ResetPasswordNotification`.
  - **FLOW 2** (set password): hash compare, 60m TTL, single-use under row lock, password policy + must-differ, revoke all Sanctum tokens, `PasswordChangedNotification`.
  - **RULES**: list all nine rules with their now-official `BR-AUTH-*` codes.
  - **EDGE_CASES**: invalid/expired/reused token, non-existent email, concurrent reset, rate-limit.
  - **related_files**: `AuthService`, `AuthController`, `ForgotPasswordRequest`/`ResetPasswordRequest`, `ResetPasswordNotification`/`PasswordChangedNotification`, `password_reset_tokens` table.

### 2. Update auth logic index (MODIFY)
- **File**: `docs/logic/auth/index.md` — add a row: `[reset-password.md](reset-password.md) | Reset Password — Quên & Đặt Lại Mật Khẩu | high`.

### 3. Register Business Rules (MODIFY)
- **File**: `docs/system/br-registry.md` — add official `BR-AUTH-*` rows for each of the nine `PROPOSED_BR:reset-*` rules (status `active`, module `auth`, source = this logic doc).
- Replace `PROPOSED_BR:reset-*` references with the assigned `BR-AUTH-*` codes inside the new logic doc (the task files may retain `PROPOSED_BR` in their changelog history).

## Status
- [ ] Create `docs/logic/auth/reset-password.md` per `bks-doc-logic-standard`.
- [ ] Add the entry to `docs/logic/auth/index.md`.
- [ ] Register the nine rules as `BR-AUTH-*` in `docs/system/br-registry.md`.
- [ ] Update rule references in the new logic doc to the official codes.

## Acceptance Criteria
1. `docs/logic/auth/reset-password.md` exists and follows `bks-doc-logic-standard` structure.
2. The auth logic index links the new doc.
3. All nine reset rules appear in `docs/system/br-registry.md` with official `BR-AUTH-*` codes (status `active`).
4. The logic doc references the official `BR-AUTH-*` codes (no `PROPOSED_BR` left in it).

## Dependencies
- Tasks 01, 02 (backend behavior), 04, 05, 06 (frontend behavior) — implementation must be finalized so docs reflect the shipped logic.
