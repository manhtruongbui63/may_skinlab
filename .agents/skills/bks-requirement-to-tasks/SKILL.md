---
name: bks-requirement-to-tasks
description: Use this skill when breaking down a formal requirement specification (from docs/requirements/) into granular, implementation-ready task files (in docs/tasks/). Defines the decomposition methodology, task structure, dependency management, and quality standards.
---

# Requirement-to-Tasks Decomposition Methodology

This skill defines a structured process for transforming formal requirement specifications (`docs/requirements/`) into granular, actionable implementation tasks (`docs/tasks/`). Each task must be self-contained, testable, and detailed enough for a developer (or AI agent) to implement without ambiguity.

> [!CAUTION]
> **Task Files Are Specifications, Not Code**: Task files describe **WHAT** to implement, not the exact code to write. Code snippets in task files serve as **suggestions and guidance** — they illustrate the expected shape, interfaces, and patterns. The implementor (AI agent using execution skills) will write the actual code following the project's coding standards. Do NOT write complete, production-ready code inside task files.

> [!CAUTION]
> **The Golden Boundary — Task = WHAT, Skill = HOW.** A task file is a **logic & contract specification**, not a container for code or wiring. This skill is intentionally **convention-agnostic about HOW**: it does NOT know (and must NOT guess) the project's structural conventions — that knowledge lives in the execution skills (`bks-be-api-standard`, `bks-be-database-standard`, etc.). When a task prescribes HOW, it inevitably contradicts the real convention.
>
> | A task MUST specify (WHAT) | A task MUST NOT specify (HOW — owned by the execution skill) |
> |---|---|
> | **Purpose** — why this exists, the user/business outcome | Route definitions, route files, route groups |
> | **Inputs + validation rules** (presence, type, boundaries, cross-field) | **Middleware placement / wiring** (auth, throttle, guards) |
> | **Output / response shape** (fields, status codes, resource fields) | Controller scaffolding, `__construct`, class skeletons |
> | **Business rules** (`BR-*`) and processing logic (numbered steps) | Service/method **bodies**, query building, factory registration code |
> | **Error scenarios** (condition → HTTP status) | File-by-file boilerplate, imports, namespacing mechanics |
> | **Auth requirement** as a *semantic fact* (e.g. "requires authenticated user guard" / "public") | *Where/how* that auth is enforced |
> | Method **signatures** as I/O contracts (no bodies) | The implementation behind the signature |
> | **(FE)** screen purpose, types/data shape, **client validation (Zod fields)**, API contract consumed, **UI states** (loading/empty/error/permission/success), interactions (`UI-*`), i18n namespace, which DS component by role | **(FE)** component/JSX code, styling, RHF/`useForm` wiring, the repository **adapter** (fetch/axios) body, runtime-validation/`mapBackendErrors` code, URL-state sync code, toast call sites, server/client-component & data-fetch strategy |
>
> **Worked example — backend (the recurring mistake).** A task needs an authenticated "list users" endpoint.
> - ❌ **Wrong (prescribes HOW):** the task writes `Route::get('/users', ...)->middleware('auth:user')` — this hard-codes middleware **into the route**, which contradicts this project (auth middleware belongs in the controller `__construct`; only throttle lives on routes).
> - ✅ **Right (states WHAT):** the task says *"Endpoint: list users. **Auth: requires authenticated user.** Input: filters (see validation table). Output: paginated `UserResource`."* — then references `bks-be-api-standard`, which decides middleware placement.
>
> **Worked example — frontend (the same mistake, FE flavour).** A task needs a "create user" form.
> - ❌ **Wrong (prescribes HOW):** the task writes a `<form>` with `useState` + `fetch('/api/users', {method:'POST'})` and inline styles — this hard-codes data-fetching and markup, contradicting the project (data goes through the **repository pattern**; forms use **RHF + Zod**; UI uses **DS components + tokens**; 422 → `mapBackendErrors`).
> - ✅ **Right (states WHAT):** the task says *"Screen S2 create-user dialog. Fields + client validation: see Zod table. Consumes `POST /api/v1/users`. UI states: submitting, field errors (422 mapped), success toast. i18n: `users.*`."* — then references `bks-fe-implement-feature` + `bks-fe-api-integration`, which decide the code.
>
> If you ever feel the urge to write a route, a `->middleware(...)`, a controller/service body, a JSX component, a `useForm`/`fetch` call, or styling in a task — stop. State the requirement and delegate the mechanics to the named skill.

> [!IMPORTANT]
> **Prerequisite**: This skill assumes the input requirement has already been analyzed and finalized using the `bks-requirement-analysis` methodology. Never decompose a raw draft — only decompose formal requirement documents from `docs/requirements/`.

## 1. Standard Directory Structure

| Path | Purpose |
|---|---|
| `docs/logic/` | **System Intelligence**: The single source of truth for existing business logic, workflows, and technical patterns. |
| `docs/requirements/{date}-{feature}.md` | **Input**: Formal requirement specification (source of truth). |
| `docs/tasks/{date}-{feature}-implementation-tasks.md` | **Output**: Task index file — master list of all task modules with links, phases, and status. |
| `docs/tasks/{date}-{feature}/` | **Output**: Directory containing individual task files. |

> [!CAUTION]
> **Logic Lookup Rule**: ALWAYS use `docs/logic/` to understand the current system. Do NOT read `docs/draft/`, existing `docs/requirements/` (other than the input), or `docs/tasks/` for project logic unless explicitly mentioned.

**Naming Conventions:**
- `{date}` = Requirement date from frontmatter (e.g., `2026-04-01`).
- `{NN}` = Zero-padded task number (e.g., `01`, `02`, `14`).
- `{slug}` = Kebab-case short description (e.g., `database-infrastructure`, `api-registration-flow`).

## 2. Objective

Transform the structured PROCESSING FLOWS, DATA MODEL, and BUSINESS RULES from a requirement specification into a set of independent, ordered, and phased implementation tasks. Each task must represent a **complete, deployable unit of work**.

> [!WARNING]
> **Decomposition, not Duplication**: Do NOT copy-paste entire sections from the requirement into tasks. Instead, **extract**, **reorganize**, and **enrich** the requirement content into task-specific instructions.
>
> **Specifications, not Code**: Task files define the **intent, constraints, and expected outcomes**. Code snippets are **illustrative examples** showing the general shape of the solution — method signatures, data structures, or API shapes. The implementor writes the actual implementation code following the referenced skill's standards.

## 3. Task Types

Every task MUST be classified into one of the following types:

| Type | Description | Delivers Code? |
|---|---|---|
| **IMPLEMENTATION** | Creates or modifies actual source code. Can be deployed independently. | ✅ Yes |
| **COORDINATION** | Aggregates cross-cutting logic across multiple tasks. Does NOT contain unique code — its requirements are **delegated** to other tasks. | ❌ No (delegates) |
| **DOCUMENTATION** | Produces documentation only (API docs, logic docs, test plans). | ❌ No |

**Key Rules:**
- Every task file MUST declare its type in the YAML frontmatter (`type` field).
- **IMPLEMENTATION tasks** MUST map to exactly **one** execution workflow and **one** skill.
- **COORDINATION tasks** MUST include a **Delegation Map** section.
- **COORDINATION dependency rule**: When an IMPLEMENTATION task lists a COORDINATION task in its `depends_on`, the implementor MUST read the COORDINATION task's **Delegation Map** and **Cross-cutting Business Rules** before starting.

## 4. Implementation Workflow

Follow these phases to decompose requirements into tasks:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REQUIREMENT-TO-TASKS WORKFLOW                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PHASE I: REQUIREMENT ABSORPTION                                      │
│  ├── Read formal requirement document completely                      │
│  ├── Identify: entities, flows, business rules, API endpoints         │
│  ├── Identify: notifications, background jobs, third-party services   │
│  └── Classify each item by layer (DB, API, Job, Frontend)             │
│                         ↓                                             │
│  PHASE II: CODEBASE AUDIT                                             │
│  ├── Search for existing Controllers, Services, Models, Migrations    │
│  ├── Use ONLY docs/logic/ as source of truth                          │
│  ├── Map workflows and skills to each task category                   │
│  └── Annotate: ADD vs MODIFY vs DELETE                                │
│                         ↓                                             │
│  PHASE III: TASK GROUPING & PHASING                                   │
│  ├── Group by: One Task = One Skill + One Workflow                    │
│  ├── Assign to phases: 1→2a→2b→3→4                                     │
│  ├── Apply size guidelines (500–2000 words per task)                  │
│  └── Create COORDINATION tasks for cross-cutting concerns             │
│                         ↓                                             │
│  PHASE IV: DEPENDENCY RESOLUTION                                      │
│  ├── Build dependency graph (Mermaid format)                          │
│  ├── Ensure no circular dependencies                                  │
│  └── Define execution order maximizing parallelism                      │
│                         ↓                                             │
│  PHASE V: TASK DETAIL GENERATION                                      │
│  ├── Generate task files with mandatory structure                     │
│  ├── Generate index file with progress tracking                       │
│  └── Run quality checklist validation                                 │
│                         ↓                                             │
│  PHASE VI: PRESENTATION & REFINEMENT                                  │
│  ├── Present Task Index to user                                       │
│  ├── Highlight decisions and ask for feedback                         │
│  ├── Iterate based on feedback (max 2 rounds)                         │
│  └── Generate final task files after approval                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Critical Architecture Rules

> [!NOTE]
> **How these relate to the Golden Boundary.** These are **decomposition invariants & constraints** — facts the task *states* so work is split, classified, and routed to the right skill (which layer, which phase, that a DTO exists, which factory). They are the **WHAT of structure**, not licence to write code. The task **names** a target (e.g. "service in `App\Services\Api`", "register in the existing `ApiFactory`") and the execution skill **writes the mechanics** (the file, the registration code, the wiring). The task still NEVER writes enforcement/wiring itself — routes, `->middleware(...)`/guard placement, factory-registration code, class bodies. Naming a *conventional location* is fine; dictating a *mechanic or enforcement placement* (the middleware-in-route trap) is not.

> [!CAUTION]
> These rules MUST be reflected in every IMPLEMENTATION task:
>
> **1. Service Namespaces (services are FLAT — the module is the *filename*, not a folder):**
> | Layer | Namespace (flat) | Example file | Factory |
> |---|---|---|---|
> | API business logic | `App\Services\Api\` | `app/Services/Api/UserService.php` | `ApiFactory` |
> | Background logic | `App\Services\Background\` | `app/Services/Background/ReportService.php` | `BackgroundFactory` |
> | Shared utilities | `App\Services\Common\` | `app/Services/Common/FileService.php` | `CommonFactory` |
>
> ⚠️ Do NOT write `App\Services\Api\{Module}\...` — there is **no per-feature subfolder** for services or controllers. `UserService` lives at `app/Services/Api/UserService.php`, never `app/Services/Api/User/UserService.php`.
>
> **2. FORBIDDEN — New Factory Files**: NEVER create `XxxFactory.php`. Add getter methods to existing factories only.
>
> **3. MANDATORY — DTOs**: Every method in `Api\` and `Background\` services MUST use `final readonly` DTOs (`app/DTOs/{Layer}/{Module}/{Action}Data.php`).
>
> **3b. File Placement & Grouping — mirror the repo, never dump a feature into one folder.** Grouping is **per-layer**, not per-feature. Some layers are flat, some are grouped by module. The recurring decomposition bug is collecting *all* of a feature's files under a new `…/{Feature}/` directory — that is wrong. The current project convention (the **execution skill `bks-be-api-standard` is authoritative**; confirm via the Phase II codebase audit and mirror existing siblings):
> | Layer | Grouping | Path pattern |
> |---|---|---|
> | Services / Table services | **FLAT** | `app/Services/{Api,Background,Common}/{Name}Service.php` |
> | Controllers | **FLAT** | `app/Http/Controllers/Api/{Name}Controller.php` |
> | Jobs | **FLAT** | `app/Jobs/{Name}Job.php` |
> | Console Commands | **FLAT** | `app/Console/Commands/{Name}Command.php` |
> | DTOs | **grouped by module** | `app/DTOs/{Api,Background}/{Module}/{Action}Data.php` |
> | FormRequests | **grouped by module** | `app/Http/Requests/{Module}/{Name}Request.php` |
> | Resources | **grouped by module** | `app/Http/Resources/{Module}/{Name}Resource.php` |
> | Frontend | **grouped by feature** | `frontend/features/{feature}/{schemas,services,hooks,components}/` |
> Rule: for a **flat** layer never create a feature subfolder; for a **grouped** layer reuse the existing module folder (add a new module folder only when the work is genuinely a new module). When the audit shows the repo differs from this table, **mirror the repo** — the table is a snapshot, the codebase + execution skill are the source of truth.
>
> **4. Task Separation Rules:**
> - **API + Job**: Split into separate tasks (Job in Phase 2a, API in Phase 2b)
> - **Notifications & Mailables are NOT Jobs**: A queued `Notification`/`Mailable` (`implements ShouldQueue`) is created **inside the API task that dispatches it** (Phase 2b, `bks-be-api-standard`) — it is part of that service's flow, **not** a separate Phase 2a task, and it does **not** map to `bks-be-job-standard`. The API+Job split above applies ONLY to an explicit `app/Jobs/{Name}Job.php` + its Background Service. Split a notification out only when it is dispatched by a **Job/Command** (Phase 2a) rather than by an HTTP request.
> - **Master Data**: Separate task in Phase 1 using `bks-be-master-data-standard` — only for **read-only reusable lookup lists** (selects/dropdowns/pickers, incl. search/exclusion/selected; several batched into ONE call). A list that the screen *manages/mutates* (CRUD) or that returns a `JsonResource` is a **dedicated API task** (Phase 2b), NOT master data. This routing is decided upstream in `bks-requirement-analysis` (Technical Mapping → Master Data vs Dedicated API) — honor the requirement's classification.
> - **Phase 2a MUST precede Phase 2b** when both are needed
> - **Frontend**: Split by **Screen × Layer** — 3a Data, 3b Components, 3c Integration, 3d Tests. Each FE task is **S/M only** and within the FE budget (≤4 components OR ≤2 hooks OR 1 page-integration; ≤3 endpoints; ≤~1200 words). An L/XL FE task is a decomposition failure — split further. See [references/01-decomposition-phases.md → Frontend Task Decomposition Strategy](./references/01-decomposition-phases.md).
> - **Backend tests**: a feature with non-happy-path scenarios (an Error Cases table, security rules, concurrency/idempotency) gets a **separate Phase 4 backend test task** (`bks-be-testing-standard`) that asserts those paths — the execution workflow's inline tests are **happy-path smoke only** and do NOT substitute. Do not fold this coverage into the API task. See [references/01-decomposition-phases.md](./references/01-decomposition-phases.md) Phase II note.
>   - **Schedule it right after Phase 2b, not at the very end.** The backend test task's `phase` field stays `4` (it *is* Quality), but it depends ONLY on its Phase 2b API task(s) — never on any frontend task. So order it (and **number it**) immediately after the API tasks it covers, and let it run **in parallel with the entire frontend track**. Do NOT place its task number after the Phase 3 frontend block: that misleads readers into thinking backend code can't be tested until the UI is done. **Task numbers follow recommended execution order; the `phase` field records the conceptual phase; the dependency graph is the single source of truth for ordering.**

### Standard Phases

| Phase | Description | Typical Tasks |
|---|---|---|
| **Phase 1: Foundation** | Database schema, Enums, Models | Migrations, model updates, enum definitions |
| **Phase 2a: Background Jobs & Commands** | Async / CLI business logic | Background Services, Jobs, Artisan Commands |
| **Phase 2b: Backend API** | HTTP API layer | Controllers, Services, FormRequests, Resources |
| **Phase 3a: FE Data Layer** | Types, Zod schemas, repositories, hooks | `schemas/`, `services/`, `hooks/` (one task per screen's data, or per shared hook) |
| **Phase 3b: FE Components** | Presentational + container components | Small single-responsibility components (one task ≈ one screen's tree, ≤~4 components) |
| **Phase 3c: FE Page Integration** | Route wiring, composition, navigation, UI states | `app/(group)/.../page.tsx`, dialogs, loading/empty/error/permission states |
| **Phase 3d: FE Tests** | Unit/integration + E2E | `bks-fe-create-tc-component`, `bks-fe-create-tc-flow` |
| **Phase 4: Quality & Documentation** | Testing and docs | PHPUnit tests, API docs, Logic docs |

> [!IMPORTANT]
> **Phase ≠ task number.** Phases are the *conceptual* layering above; **task numbers reflect recommended execution order** (governed by the dependency graph). The two usually coincide, with one common exception: a **backend test task is Phase 4 but should be numbered right after its Phase 2b API task** (it depends only on the backend, so it runs in parallel with the whole frontend track — see Task Separation Rule §4 "Backend tests"). When you group the index, group by **build track** (Backend = API + its tests; Frontend = 3a→3d; Docs) rather than strictly by phase number, so an early-numbered Phase 4 backend-test task reads naturally.

## 5. Reference Documentation

| Document | Purpose |
|---|---|
| [references/01-decomposition-phases.md](./references/01-decomposition-phases.md) | Detailed breakdown of all 5 decomposition phases + **Frontend Task Decomposition Strategy** |
| [references/02-task-types.md](./references/02-task-types.md) | Complete task type definitions (IMPLEMENTATION, COORDINATION, DOCUMENTATION) |
| [references/03-task-file-structure.md](./references/03-task-file-structure.md) | Mandatory structure for individual task files (YAML + 10 sections) |
| [references/04-index-file-structure.md](./references/04-index-file-structure.md) | Structure for the master task index file (progress tracking, dependency graph) |
| [references/05-task-lifecycle.md](./references/05-task-lifecycle.md) | Status transitions, modification protocols, escalation procedures |
| [references/06-quality-validation.md](./references/06-quality-validation.md) | Pre-presentation checklist and post-generation validation steps |
| [references/07-examples.md](./references/07-examples.md) | Complete examples: IMPLEMENTATION task, COORDINATION task, and Index file |

## 6. Quick Reference

### Workflow → Skill Mapping

| Category | Workflow | Skill |
|---|---|---|
| Database Infrastructure | `/execute-database-task` | `bks-be-database-standard` |
| API (CRUD, Single, List) | `/execute-api-task` | `bks-be-api-standard` |
| Artisan Commands | `/execute-command-task` | `bks-be-command-standard` |
| Background Jobs | `/execute-job-task` | `bks-be-job-standard` |
| Master Data Registration | `/execute-api-task` | `bks-be-master-data-standard` |
| Frontend Features | (None) | `bks-fe-implement-feature` (+ sisters `bks-fe-api-integration`, `bks-fe-ds-sdk-consumer`, `bks-fe-list-url-state`) |
| Frontend Unit/Integration Tests | (None) | `bks-fe-create-tc-component` |
| Frontend E2E Tests | (None) | `bks-fe-create-tc-flow` |

### Task Size Guidelines

- **Ideal**: Requirements section = 500–2000 words
- **Split signal**: >2000 words or >5 endpoints
- **Merge signal**: <3 checklist items or <200 words

> [!IMPORTANT]
> **Word count is a *secondary* proxy.** The real driver of "the implementing AI session forgets earlier decisions" is **how many distinct files × distinct conventions** one task forces into a single context. A 1,500-word task touching 12 files across 5 conventions is more likely to overflow than a 2,100-word task touching 4 files. Size by **files + conventions first**, words second.

> [!IMPORTANT]
> **Backend "one session, no context loss" budget (MANDATORY — symmetric with FE).** Cap every **backend IMPLEMENTATION** task at:
> - **≤ 8 files created/modified** (Controller, Service, DTO(s), FormRequest(s), Resource(s), Notification, migration, etc. — count them).
> - **≤ 5 endpoints**.
> - **One flow / module / one foundation layer** (do not span unrelated flows).
> - **Effort: S/M/L only — XL is FORBIDDEN** (an XL backend task is a decomposition failure → split by operation, sub-flow, or pull the foundation layer out). **`L` is allowed ONLY** for a genuine single-flow API or a foundation task (migration + model + enum + factory + seeder for one cohesive area) **and MUST carry a one-line justification** in the task's Description explaining why it cannot be split smaller.
>
> When a task would exceed any cap, split it (by CRUD operation, by sub-flow, or by extracting Phase 1 foundation / Phase 2a job / notification). Two M tasks beat one L.

> [!IMPORTANT]
> **Frontend tasks are stricter still.** FE work is context-heavy (many small files + project conventions), so an oversized FE task makes the implementing AI session lose context mid-way. Cap every FE task at **≤4 components OR ≤2 hooks/repositories OR 1 screen's page-integration**, **≤3 endpoints**, **≤~1200 words**, and **effort S/M only**. An FE task estimated L/XL is a decomposition failure — split it. Default split = **Screen × Layer** (3a Data / 3b Components / 3c Integration / 3d Tests). See [references/01-decomposition-phases.md → Frontend Task Decomposition Strategy](./references/01-decomposition-phases.md).

### Effort Estimates

| Code | Effort | Duration |
|---|---|---|
| `S` | Small | ~1-2 hours |
| `M` | Medium | ~3-5 hours |
| `L` | Large | ~1-2 days |
| `XL` | Extra Large | ~3+ days |

## 7. Quality Gates

> [!IMPORTANT]
> **MANDATORY**: Run this validation before presenting tasks to the user:

1. ✅ Every IMPLEMENTATION task maps to exactly ONE workflow + ONE skill
2. ✅ No task mixes API code and Job code (split if needed)
3. ✅ Job tasks appear before API tasks that trigger them
4. ✅ Every COORDINATION task has a Delegation Map
5. ✅ Mermaid dependency graph has no circular dependencies
6. ✅ Every `BR-*` is registered in `docs/system/br-registry.md`
7. ✅ Every enum has integer backing, `label()` method, API returns value+label
8. ✅ No new factory files proposed (use existing factories)
9. ✅ Every service method uses DTOs, not raw arrays
10. ✅ Every FE task is S/M effort and within the FE budget (≤4 components OR ≤2 hooks OR 1 page-integration; ≤3 endpoints; ≤~1200 words) — no L/XL FE tasks
11. ✅ Every **backend** IMPLEMENTATION task is within the backend budget (**≤8 files, ≤5 endpoints, one flow/module/foundation layer**) and **no backend task is XL**; any `L` backend task carries a one-line justification for why it can't be split smaller
12. ✅ FE tasks are split by Screen × Layer (3a/3b/3c/3d) and each references the correct `bks-fe-*` skill(s) + the screen ID from requirement §9.2
13. ✅ Every backend IMPLEMENTATION task's Status checklist includes `php .agents/scripts/validate-backend.php backend` (right before the test command) — the structural-convention gate implementors most often forget
14. ✅ **No task prescribes HOW** — backend: no route definitions, no `->middleware(...)` / middleware placement, no controller/service class bodies, no factory-registration code (auth stated as a *semantic requirement*); frontend: no JSX/component code, no `fetch`/`axios`/`useForm` wiring, no styling, no repository-adapter body. All structure/wiring is delegated to the referenced execution skill (see the Golden Boundary above)
15. ✅ **Backend non-happy-path coverage exists** — if the requirement has an Error Cases table, security rules, or concurrency/idempotency scenarios, there is a **dedicated Phase 4 backend test task** (`bks-be-testing-standard`) asserting those paths. Inline happy-path tests from the execution workflow do NOT satisfy this gate

For complete validation checklist, see [references/06-quality-validation.md](./references/06-quality-validation.md).
