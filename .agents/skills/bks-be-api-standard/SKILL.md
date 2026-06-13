---
name: bks-be-api-standard
description: Use this skill when implementing or modifying API endpoints in this Laravel project. This skill defines the required architecture flow (Route → Middleware → FormRequest → Controller → Service → Resource → JSON Response), component responsibilities, and the step-by-step implementation workflow. This is the PRIMARY skill for all backend API development, CRUD operations, authentication endpoints, table services, and business logic implementation.
---

# Laravel API Development Standards

> [!WARNING]
> **MANDATORY**: When implementing ANY feature based on external code (task files, documentation examples, Stack Overflow, AI suggestions, other projects), you MUST apply **ALL** standards in this document. **NEVER** copy code verbatim without adapting it to project patterns.
> 
> This applies to EVERY implementation: DTOs, Services, Controllers, Requests, Routes, Resources. No exceptions.

This skill provides a single source of truth for all backend API development, covering architecture, coding standards, layer responsibilities, and the end-to-end implementation workflow.

---

## Quick Navigation

| Reference | Topic | When to Use |
|---|---|---|
| [01-architecture.md](./references/01-architecture.md) | Core Architecture & Global Standards | All backend code — FQN rules, localization, transactions, helpers, logging, enums |
| [02-controllers.md](./references/02-controllers.md) | Controller & Authentication | Implementing/modifying API Controllers, Auth endpoints, middleware, responses |
| [03-validation.md](./references/03-validation.md) | Validation Standards | FormRequests, 3-layer validation rules, FK validation, unique rules, business rules |
| [04-services.md](./references/04-services.md) | Service Layer | Service classes, DTOs, Factories, cross-service communication |
| [05-table-services.md](./references/05-table-services.md) | Table Service | Paginated list endpoints with search, filter, ordering |
| [06-background-jobs.md](./references/06-background-jobs.md) | Job Handover Protocol | Offloading API logic to background Jobs |
| [07-resources.md](./references/07-resources.md) | Resources & Collections | JsonResource/Collection for data transformation |
| [08-documentation.md](./references/08-documentation.md) | Documentation Standards | API docs (`docs/api/`) and Logic docs (`docs/logic/`) |
| [09-implementation-workflow.md](./references/09-implementation-workflow.md) | Implementation Workflow | Step-by-step workflow for any new API feature |

---

## Core Architecture Flow

**Unidirectional Data Flow** (applies to EVERY feature):

```
Route → Middleware → FormRequest → Controller → Service → Controller → JsonResource → JSON Response
```

---

## Implementation Workflow Summary

Follow this 11-step workflow when implementing any new API feature:

1. **Step 1**: Resource & Constants Setup (Migration, Model, Enums)
2. **Step 2**: Table Service (if list endpoint exists)
3. **Step 3**: Validation Layer (FormRequests with 3-layer rules)
4. **Step 4**: DTO Layer (typed Data Transfer Objects)
5. **Step 5**: Service Layer (business logic, transactions)
6. **Step 5a**: Service **smoke test** (happy path; fix code if it fails)
7. **Step 6**: Factory Registration (ApiFactory)
8. **Step 7**: Controller & Routing (thin orchestrator)
9. **Step 7a**: Endpoint **smoke test** — happy path + 401 + 422 (fix code if it fails)
10. **Step 8**: Data Transformation (Resources/Collections)
11. **Step 9**: Documentation (API docs + Logic docs + BR Registry)
12. **Step 10**: Final Audit & Polish (formatting, tests, scramble)

📖 **Full details**: [09-implementation-workflow.md](./references/09-implementation-workflow.md)

---

## Smoke Test vs Acceptance Test (mandatory boundary)

This skill writes **smoke tests only** after coding — NOT the full suite.

| | Smoke Test (**this skill** — Step 5a/7a) | Acceptance Test (`bks-be-testing-standard`) |
|---|---|---|
| Purpose | Confirm the code **runs** | Verify it **meets the requirement**, full coverage |
| Source | Happy path of the just-written code | The requirement input (task/requirement/BR/logic doc) |
| Scope | Minimal: 1 happy path + 1–2 obvious error cases (401/422) | Full: EP, BVA, Validation Matrix, security, edge cases |
| On FAIL | **FIX THE CODE NOW** — just-written code, a failure means a code bug | **NEVER fix** — only report pass/fail, the user decides |
| File | `{Resource}{Action}SmokeTest.php` | `{Resource}{Action}Test.php` (replaces the smoke test → delete `*SmokeTest.php`) |

> [!IMPORTANT]
> A failing smoke test = the code you just wrote is broken → **fix the code now** until the happy path is green. Then STOP; comprehensive, objective coverage is owned by `bks-be-testing-standard`, and that skill **must not auto-fix**.

---

## Key Principles at a Glance

| Principle | Rule |
|---|---|
| **Thin Controllers** | Controllers are orchestrators only — NO business logic |
| **DTO Input** | Service methods accept typed DTOs, not raw arrays |
| **3-Layer Validation** | Every field MUST have Presence + Type + Boundary rules |
| **No Cross-Calling** | Sibling services MUST NOT call each other directly |
| **Soft-Delete Awareness** | FK validation MUST exclude soft-deleted records |
| **Explicit Formatting** | Resources MUST use DateHelper/FileHelper for dates/files |
| **Method Length** | Methods MUST be ≤ 30 lines; longer methods MUST be split into private methods with descriptive names |
| **External Code** | Code from ANY source (tasks, docs, examples) MUST be fully adapted to ALL project standards in this skill — not just copied |
| **Documentation is DoD** | API docs and Logic docs are mandatory post-implementation |

---

## Final Completion Checklist (MANDATORY)

Before ending any API implementation session, verify:

- [ ] **Code Quality**: `php artisan code:format` has been run
- [ ] **Validation Audit**: All FormRequests pass the 3-layer validation checklist
- [ ] **Smoke tests**: Step 5a/7a smoke tests pass (happy path runs; any failure was a code bug and was fixed). Full objective coverage is delegated to `bks-be-testing-standard` (report-only, no auto-fix)
- [ ] **Audit Log** (BR-G002): Model has `LogsActivity` trait (Pattern A). If action is login/logout/permission-change/bulk/force-delete → `activity()->log()` added in Service (Pattern B)
- [ ] **API Docs**: Manual docs in `docs/api/modules/` are updated
- [ ] **Logic Docs**: Business logic docs in `docs/logic/` are created/updated
- [ ] **BR Registry**: `docs/system/br-registry.md` updated with new/modified rules
- [ ] **API Export**: `php artisan scramble:export` has been run
- [ ] **Task Update**: Task file status updated to `completed` (if applicable)

---

## Related Skills & Workflows

| Skill/Workflow | Purpose |
|---|---|
| `bks-be-database-standard` | Migrations, Models, Enums, Factories, Seeders |
| `bks-be-job-standard` | Background Jobs and Queue implementation |
| `bks-be-command-standard` | Artisan Commands and scheduled tasks |
| `bks-be-master-data-standard` | Master Data resources and lookup endpoints |
| `bks-be-testing-standard` | Feature tests, Unit tests, test patterns |
| `/execute-api-task` | Workflow for executing API tasks from `docs/tasks/` |

---

## Validation Scripts

Run these scripts to verify code compliance:

```bash
# Validate all backend structures (API, Command, Database, Job, Test)
php .agents/scripts/validate-backend.php /path/to/project

# Validate specific module
php .agents/scripts/validate-backend.php backend/app/Modules/{ModuleName}
```

See `.agents/scripts/validate-backend.php` for detailed validation rules.