---
task_id: "04"
title: "RBAC Logic Documentation"
description: "Create logic documentation for role assignment and update the user module logic index."
type: DOCUMENTATION
phase: 4
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: ["01", "02", "03"]
rule_refs:
  - PROPOSED_BR:default-member-role
  - PROPOSED_BR:admin-full-access
  - PROPOSED_BR:member-read-only
  - PROPOSED_BR:role-api-exposure
  - PROPOSED_BR:role-master-data
date: "2026-05-12"
changelog:
  - version: 1.0
    date: "2026-05-12"
    summary: Initial task specification.
---

# Context
- **Requirement**: [02-role.md](../../requirements/02-role.md)
- **Parent Task**: [2026-05-12-role-implementation-tasks.md](../2026-05-12-role-implementation-tasks.md)
- **Applicable Workflows (MANDATORY)**: None (documentation only)
- **Applicable Skills (MANDATORY)**: `bks-doc-logic-standard`

---

# Task 04: RBAC Logic Documentation

## Description
Create structured logic documentation for the RBAC role system following the `bks-doc-logic-standard` skill. This includes a new logic doc for role assignment behavior and updating the user module logic index to reference the new documentation.

## Out of Scope
- **No code changes** — documentation only.
- **No API docs generation** — Scramble auto-generates from annotations.
- **No changes to domain-model.md or architecture.md** — those are system docs, not logic docs.

## Requirements

### 1. Create Role Assignment Logic Doc (NEW)

**File**: `docs/logic/user/user-role.md`

Follow the `bks-doc-logic-standard` YAML frontmatter and markdown structure. The document must cover:

**Content sections**:
1. **Overview**: Summary of the RBAC role system — 2 roles (Admin, Member), Spatie package integration, UserRole enum.
2. **Role Storage Strategy**: Roles stored in Spatie's `roles` table, linked via `model_has_roles` pivot. No `role` column on `users` table.
3. **UserRole Enum**: String-backed enum (`admin`, `member`) with `label()` method and `HasEnumStaticMethods` trait. Used for type safety, master data, and seeder config — NOT as Eloquent cast.
4. **Default Role Assignment**: On registration (`AuthService::register()`), new users receive `member` role via `assignRole()`. Reference PROPOSED_BR:default-member-role.
5. **First Admin Creation**: Via `RoleSeeder` — creates both roles and optional admin user. Credentials configurable via `.env`.
6. **Role API Exposure**: `MeResource` includes `role` field from `getRoleNames()->first()`. Reference PROPOSED_BR:role-api-exposure.
7. **Master Data**: `user_roles` resource registered in `MasterDataService` with enum driver. Reference PROPOSED_BR:role-master-data.
8. **State Transitions**: Role is static assignment — no state machine. Changes only via admin action (future).

### 2. Update User Module Logic Index (MODIFY)

**File**: `docs/logic/user/index.md`

Add the new logic doc to the index table:

```markdown
| [user-role.md](user-role.md) | RBAC Role — Phân Quyền Theo Vai Trò | high |
```

### 3. Update Logic Root Index (MODIFY)

**File**: `docs/logic/index.md`

Add reference to the new user-role logic doc if it has a module-level entry for auth/role.

## Status
- [ ] Create `docs/logic/user/user-role.md` following `bks-doc-logic-standard`.
- [ ] Update `docs/logic/user/index.md` with new entry.
- [ ] Verify `docs/logic/index.md` references correctly.

## Acceptance Criteria
1. `docs/logic/user/user-role.md` exists with valid YAML frontmatter (module, title, description, type, priority, version, changelog, related_files).
2. Logic doc covers all 5 business rules from the requirement.
3. Logic doc references actual file paths and class names from implementation.
4. `docs/logic/user/index.md` includes the new doc entry with correct priority.

## Error Scenarios
- YAML frontmatter invalid → Follow `bks-doc-logic-standard` examples strictly.
- Missing related_files → Include all files modified in Tasks 01-03.

## Dependencies
- Task 01 (RBAC Database Infrastructure) — Need actual enum, model, seeder file paths.
- Task 02 (Role Master Data Registration) — Need MasterDataService resource registration details.
- Task 03 (Auth API — Role Assignment & Exposure) — Need AuthService and MeResource changes.
