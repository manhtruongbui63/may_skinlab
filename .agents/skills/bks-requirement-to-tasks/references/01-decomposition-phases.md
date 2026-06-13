# Decomposition Phases

This document details the 5-phase process for transforming requirement specifications into implementation tasks.

---

## Phase I: Requirement Absorption & Scope Understanding

1. Read the formal requirement document completely.
2. Identify and list:
   - All **entities/tables** affected (from DATA MODEL UPDATES).
   - All **processing flows** (from PROCESSING FLOWS).
   - All **business rules** (from BUSINESS RULES → `BR-*` resolved via `docs/system/br-registry.md`; unresolved rules may use `PROPOSED_BR:{slug}` in requirement/task stage only).
   - All **API endpoints** (from API ENDPOINT INVENTORY).
   - All **notifications** (from NOTIFICATIONS).
   - All **background jobs** and scheduled tasks.
   - All **third-party integrations** (e.g., Stripe, AWS).
3. Classify each item by **layer**: Database, Backend API, Service Logic, Background Job, Frontend, Testing, Documentation.

---

## Phase II: Codebase Audit

Before creating tasks, verify the current state of the codebase:

1. **Existing Code & Logic**: Search for existing Controllers, Services, Models, Migrations, and Enums related to the feature. 
   - **Logic Source Rule**: When auditing documentation, use ONLY `docs/logic/` as the source of truth for current system behavior. Do NOT read `docs/draft`, other `docs/requirements`, or existing `docs/tasks` during this audit to avoid confusion with implementation history.
   - For Frontend: check existing features, Redux stores, and shared UI components in `src/shared/components`.
2. **Current State Annotation**: For each affected file, note:
   - Does it exist? What's its current state?
   - What needs to be ADDED vs. MODIFIED vs. DELETED?
   - **Where it goes (mirror, don't invent)**: derive each new file's path from the **existing siblings in that layer**, not from the feature name. Grouping is per-layer: services & controllers are **flat** (`app/Services/Api/{Name}Service.php`), while DTOs / FormRequests / Resources are **grouped by module**. Never create a new `…/{Feature}/` folder to hold all of a feature's files. See the **File Placement & Grouping** table in the skill overview.
3. **Workflow & Skill Mapping**: Identify which project **workflows** (complete processes) and **skills** (individual standards) apply to each task category. This is a **MANDATORY** step for all IMPLEMENTATION tasks:

| Category | Workflow | Skill |
|---|---|---|
| **Database Infrastructure** | `/execute-database-task` | `bks-be-database-standard` |
| **API (CRUD, Single, List)** | `/execute-api-task` | `bks-be-api-standard` |
| **Artisan Commands** | `/execute-command-task` | `bks-be-command-standard` |
| **Background Jobs** | `/execute-job-task` | `bks-be-job-standard` |
| **Master Data Registration** | `/execute-api-task` | `bks-be-master-data-standard` |
| **Frontend Features** | (None) | `bks-fe-implement-feature` (+ sisters `bks-fe-api-integration`, `bks-fe-ds-sdk-consumer`, `bks-fe-list-url-state`) |
| **Frontend Unit/Integration Tests** | (None) | `bks-fe-create-tc-component` |
| **Frontend E2E Tests** | (None) | `bks-fe-create-tc-flow` |

> [!CAUTION]
> **CRITICAL ARCHITECTURE RULES — Must be reflected in every task file:**
>
> **1. Service Namespaces are Fixed (services are FLAT — module is the *filename*, not a folder):**
> | Layer | Namespace (flat) | Example file | Factory | Used by |
> |---|---|---|---|---|
> | API business logic | `App\Services\Api\` | `app/Services/Api/UserService.php` | `ApiFactory` | HTTP Controllers |
> | Background logic | `App\Services\Background\` | `app/Services/Background/ReportService.php` | `BackgroundFactory` | Jobs & Commands |
> | Shared utilities | `App\Services\Common\` | `app/Services/Common/FileService.php` | `CommonFactory` | Any layer |
>
> ⚠️ Do NOT write `App\Services\Api\{Module}\…` — there is **no per-feature subfolder** for services or controllers. (DTOs are the opposite — grouped by module, see rule 3.)
>
> **2. FORBIDDEN — New Factory Files**: The three factories (`ApiFactory`, `BackgroundFactory`, `CommonFactory`) are **permanent**. NEVER propose creating a new `XxxFactory.php` file. New services are **added as getter methods** to the existing factory.
>
> **3. MANDATORY — DTOs for all business service inputs**: Every method in `Api\` and `Background\` services that accepts structured input MUST use a `final readonly` DTO (`app/DTOs/{Layer}/{Module}/{Action}Data.php`). Tasks MUST include DTO creation in their checklist and requirements.
>
> **4. No cross-calling within a layer**: An `Api\` service must NOT call another `Api\` service. Shared logic belongs in `Common\`.

> [!IMPORTANT]
> **Backend tests: happy-path inline ≠ adequate coverage.** A feature's execution workflow (e.g. `/execute-api-task`) writes only **happy-path smoke tests** alongside the code. That does NOT cover the cases that actually break in production. **Whenever the requirement has an Error Cases table, security rules (auth, enumeration, rate-limit, IDOR), or concurrency/idempotency scenarios — which is almost always — a dedicated Phase 4 backend test task using `bks-be-testing-standard` is MANDATORY.** That task must assert the **non-happy paths**: every Error Case row, each security guarantee (e.g. no-enumeration response/timing parity, 429 on rate-limit, expired/invalid token, ownership checks), and concurrency/locking. Do NOT let the inline happy-path tests stand in for it. (Logic/API documentation may still ride along with the execution workflow unless separated into its own Phase 4 DOC task.)

---

## Phase III: Task Grouping & Phasing

Group related work into **task modules** and assign them to implementation phases:

### Standard Phases

| Phase | Description | Typical Tasks |
|---|---|---|
| **Phase 1: Foundation** | Database schema, Enums, Models | Migrations, model updates, enum definitions |
| **Phase 2a: Background Jobs & Commands** | Async / CLI business logic | Background Services, Jobs, Artisan Commands |
| **Phase 2b: Backend API** | HTTP API layer | Controllers, Services, FormRequests, Resources, Webhooks |
| **Phase 3a: FE Data Layer** | Types, Zod schemas, repositories, hooks | `schemas/`, `services/`, `hooks/` — one task per screen's data (or per shared hook) |
| **Phase 3b: FE Components** | Presentational + container components | Small single-responsibility components — one task ≈ one screen's tree (≤~4 components) |
| **Phase 3c: FE Page Integration** | Route wiring, composition, navigation, UI states | `app/(group)/.../page.tsx`, dialogs, loading/empty/error/permission states |
| **Phase 3d: FE Tests** | Unit/integration + E2E | `bks-fe-create-tc-component`, `bks-fe-create-tc-flow` |
| **Phase 4: Quality & Documentation** | Backend testing and docs | PHPUnit tests, API docs, Logic docs |

> [!IMPORTANT]
> **Phase 2a MUST come before Phase 2b.** When a feature involves both a Background Job AND an API trigger, the Job task MUST be created and completed first. The API task that dispatches the job lists the Job task as its dependency.

> [!IMPORTANT]
> **Backend test task: Phase 4 by label, but scheduled right after Phase 2b.** The mandatory backend test task (see the Phase II note below) keeps `phase: 4`, yet it depends ONLY on its Phase 2b API task(s) and **never** on any frontend task — so it can run **in parallel with the entire frontend track**. Number/order it immediately after the API tasks it covers, NOT after the Phase 3 frontend block. **Task numbers express recommended execution order; the `phase` field records the conceptual phase; the dependency graph is authoritative.** Group the index by build track (Backend = API + tests; Frontend = 3a→3d; Docs) so an early-numbered Phase 4 backend-test task reads naturally.

### Grouping Rules

1. **One Task = One Skill + One Workflow (MANDATORY)**: Each IMPLEMENTATION task MUST map to exactly **one** execution workflow and **one** skill. This is the primary grouping constraint.

   > [!CAUTION]
   > **FORBIDDEN: A single task MUST NOT mix API code and Job code.** If a feature requires BOTH an HTTP endpoint (API layer) AND a background Job, these MUST be decomposed into separate tasks:
   > - Task A — **Job task** (`bks-be-job-standard`, Phase 2a) — implements the Background Service + Job stub.
   > - Task B — **API task** (`bks-be-api-standard`, Phase 2b) — implements the Controller + Service dispatch call, with `depends_on: ["Task A"]`.
   >
   > **Execution Order**: Job task ALWAYS precedes the API task that triggers it.
   >
   > **NOT a Job — queued Notifications/Mailables**: A `Notification`/`Mailable` that `implements ShouldQueue` is dispatched to the queue but is **not** an `app/Jobs/{Name}Job.php` class. Create it **inside the API task that calls `notify()`/`Mail::send()`** (Phase 2b, `bks-be-api-standard`); do **not** make it a Phase 2a task and do **not** route it to `bks-be-job-standard`. Only when the notification is dispatched by a Job/Command does it belong with that Phase 2a task.
   >
   > **MANDATORY — Master Data Task Separation**: If a requirement introduces new enums, lookup tables, or tree structures, these MUST be registered in `MasterDataService`. This registration MUST be a separate task in **Phase 1 (Foundation)**:
   > - Task A — **Master Data task** (`bks-be-master-data-standard`, Phase 1) — registers resources and implements custom drivers.
   > - Task B — **API task** (`bks-be-api-standard`, Phase 2b) — uses the resources, with `depends_on: ["Task A"]`.
   >
   > **Execution Order**: Master Data registration ALWAYS precedes the API task that uses it.

2. **One Task = One Functional Unit**: Each task should represent a logically cohesive piece of work that can be implemented and tested independently.
3. **Maximum Scope**: A single task should NOT span more than one of these categories:
   - Database schema + Enums + Models (foundation layer)
   - One API flow/feature module (e.g., Registration, Payment)
   - One background job or one Artisan command
   - **One frontend screen × one layer** (data / components / integration / tests) — NOT a whole "feature area". See the Frontend Task Decomposition Strategy below.
4. **Minimum Scope**: A single backend task should NOT be smaller than a complete endpoint or a complete model setup. Avoid micro-tasks like "Add one column" or "Create one enum". (Frontend tasks are intentionally finer-grained — one screen's data layer or one component subtree is a valid task.)
5. **Cross-Cutting Concerns**: Features that span multiple modules (e.g., Email Notifications, Activity Logging) should be separate **COORDINATION** tasks, referenced by other tasks as dependencies.

### Size Guidelines

- **Ideal task size**: A task's Requirements section should be **500–2000 words** of implementation detail.
- **Split signal**: If a task's Requirements section exceeds **2000 words** or covers more than **5 endpoints**, consider splitting into sub-tasks.
- **Merge signal**: If a task has **fewer than 3 checklist items** or its Requirements section is under **200 words**, consider merging into a related task.

> [!IMPORTANT]
> **Primary sizing criterion = files × conventions, not words.** What makes an implementing AI session "forget" earlier decisions is the number of **distinct files** it must hold AND the number of **distinct conventions** (DTO + FormRequest + Resource + Service + Notification + migration…) it must apply at once — not raw word count. Word count is a secondary proxy. A short task spanning many files/conventions still overflows; size by files+conventions first.

#### Backend "one session, no context loss" budget (MANDATORY)

Symmetric to the Frontend budget below. Cap every **backend IMPLEMENTATION** task at:

| Cap | Limit |
|---|---|
| Files created/modified | **≤ 8** (count Controller, Service, each DTO, each FormRequest, each Resource, Notification, migration, model, enum…) |
| Endpoints | **≤ 5** |
| Scope | **one flow / module / one foundation layer** — never span unrelated flows |
| Effort | **S / M / L only — XL is FORBIDDEN.** `L` allowed ONLY for a genuine single-flow API or a cohesive foundation task (migration + model + enum + factory + seeder for one area), and the task's Description MUST carry a **one-line justification** for why it can't be split smaller |

When any cap is exceeded, split: **by CRUD operation** (List / Create / Update / Delete as separate API tasks), **by sub-flow**, or **by extracting** the Phase 1 foundation, a Phase 2a job, or a notification into its own task. Two `M` tasks beat one `L`; an `L` that should have been two tasks is a decomposition failure.

---

## Phase IV: Dependency Resolution

1. Build a **dependency graph** between tasks using Mermaid format.
2. Ensure no circular dependencies exist.
3. For each task, explicitly list:
   - **Depends on**: Which task(s) must be completed first.
   - **Required by**: Which task(s) depend on this task.
4. Identify tasks that can be **parallelized** (no dependencies between them).
5. Define a **recommended execution order** that respects dependencies while maximizing parallelism.

---

## Phase V: Task Detail Generation

For each task, generate a detailed task file following the Mandatory Task File Structure.

> [!IMPORTANT]
> **Specification Precision**: Every IMPLEMENTATION task must include concrete structural details — actual class names, method signatures (no bodies), file paths (relative to project root), validation rules, and expected API responses. A developer reading the task should know **WHAT** to create/modify and **WHERE**, but NOT see the full code. Code snippets are **suggestive** — showing signatures, DTO fields, or config shapes only.
>
> **Remember**: Task files are NOT source code. They are **implementation blueprints**. The implementor (AI agent using execution skills like `bks-be-api-standard`, `bks-be-database-standard`) will write the actual production code.
>
> **Traceability**: Every requirement item MUST reference at least one `BR-*` (resolved in `docs/system/br-registry.md`) or `TR-XXX` (Technical Requirement). Unregistered rules MAY use `PROPOSED_BR:{slug}` in requirement/task stage, but MUST be resolved to official `BR-*` before finalizing `docs/logic/`.
> 
> **Localization**: Every task MUST define its required **Localization Keys** (for backend lang files and frontend UI/Zod).
>
> **Frontend Architecture** (Next.js App Router):
> - Routes live in `frontend/app/(group)/...`; mark interactive files `'use client'`.
> - Feature logic lives in `frontend/features/{name}/` with `services/` (repositories), `hooks/`, `components/`, `schemas/` (Zod), `stores/`, `mocks/`. Cross-feature UI lives in `frontend/shared/`.
> - Use **Zod** for all form registrations and validation schemas (per `bks-fe-api-integration`).
> - i18n is MANDATORY — every user-facing string uses a localized key under `messages/`.

---

## Frontend Task Decomposition Strategy

Frontend work is the most context-heavy part of a feature: many small files (schemas, repos, hooks, components, page wiring, i18n), each with project-specific conventions. If a task is too large, the implementing AI session **loses context** halfway — it forgets earlier decisions, re-derives types, or skips UI states. The goal of FE decomposition is therefore **small tasks that one AI session can finish end-to-end without losing context.**

> [!IMPORTANT]
> **The "one session, no context loss" budget (MANDATORY).** Size every FE task so a single agent session can complete it without re-reading the whole requirement. Hard caps per task:
> - **≤ 4 components**, OR **≤ 2 hooks/repositories**, OR **1 screen's page-integration** — never all three at once.
> - **≤ 3 API endpoints** touched.
> - **Requirements section ≤ ~1200 words** (stricter than the generic 2000-word BE limit).
> - **Effort S or M only.** An FE task estimated **L/XL is a decomposition failure** — split it further before presenting.
>
> When unsure, split. Two small tasks always beat one task that overflows context.

### Default decomposition: split by Screen × Layer

The `bks-requirement-analysis` §9 Screen & Route Inventory gives the rows; the layers give the columns. Generate one task per non-empty cell, in this order:

| Layer (phase) | Task scope | Skill | Typical effort |
|---|---|---|---|
| **3a — Data** | Types + Zod schema(s) + repository method(s) + hook(s) for **one screen** (or one shared hook). Includes 422 `mapBackendErrors` wiring. | `bks-fe-api-integration` | S |
| **3b — Components** | The component tree of **one screen** (≤4 small components). Presentational first; mock/placeholder data ok. | `bks-fe-implement-feature` + `bks-fe-ds-sdk-consumer` | S–M |
| **3c — Integration** | Wire **one** `page.tsx`/dialog: compose components + hooks, navigation, and ALL UI states (loading/empty/error/permission/success). | `bks-fe-implement-feature` (+ `bks-fe-list-url-state` for list filters) | S–M |
| **3d — Tests** | Unit/integration (`bks-fe-create-tc-component`) and/or E2E (`bks-fe-create-tc-flow`) for the screen. | test skills | S–M |

A simple Flow-A/B screen may collapse 3a+3b+3c into **one S task** when it stays under the budget caps. A Flow-C (full CRUD) screen MUST be split per layer **and** per operation (see below).

### Additional split axes (apply when a layer is still too big)

| Axis | When to use | Example |
|------|-------------|---------|
| **By operation (CRUD)** | Full-CRUD screens | Separate tasks for List, Create dialog, Edit dialog, Delete confirm |
| **By component subtree** | A screen with >4 components | Task: table + columns; Task: filters/toolbar |
| **By form section** | Multi-step / long forms | One task per step or per fieldset |
| **By state concern** | Heavy async/error logic | UI states + error boundaries as their own integration task |

### Worked example — Flow C (User CRUD), 1 list screen + 2 dialogs

```text
3a-01  Data: User types + list/create/update/delete repo methods + hooks   (S)
3b-02  Components: UsersTable + columns + UsersToolbar + UsersFilters       (M)  depends_on 3a-01
3b-03  Components: CreateUserForm + EditUserForm fields (Zod-bound)         (S)  depends_on 3a-01
3c-04  Integration: users/page.tsx — compose table+filters+pagination,
       URL state, list UI states (loading/empty/error/permission)          (M)  depends_on 3b-02
3c-05  Integration: Create + Edit dialogs wiring + 422 mapping + toasts     (S)  depends_on 3a-01,3b-03
3c-06  Integration: Delete confirm + optimistic refresh                     (S)  depends_on 3a-01,3b-02
3d-07  Tests: component tests for table/filters/forms                       (M)  depends_on 3b-*
3d-08  Tests: E2E happy-path + error flows                                  (M)  depends_on 3c-*
```

Eight small tasks instead of one "build the Users feature" task — each fits a single session.

### What must NOT be combined in one task

| Anti-pattern | Why it loses context | Fix |
|-------------|-----|----------|
| Data layer + components + page in one task | 3 conventions at once → session forgets early files | Split into 3a/3b/3c |
| >4 components | Too many files to hold | Split by subtree |
| Multiple screens/routes | Scope too broad | One task per screen |
| CRUD all operations in one task | Overlapping state/error logic | One task per operation |
| Building UI + integrating real API together | Constant context switching | UI-first (mock), then integrate |

### FE Dependency shape

```text
3a Data (types, schema, repo, hooks)
   ├──→ 3b Components (can use mock data; parallel per subtree)
   └──→ 3c Integration (page wiring + UI states)  ──→ 3d Tests
```

- **3a precedes 3c** (integration needs hooks/types).
- **3b can run in parallel** with 3a when components use mock/placeholder data.
- **i18n keys**: defined in whichever task introduces the string, but a final pass verifies no hardcoded text remains.

### Reference Skill Context

> [!IMPORTANT]
> Every FE task MUST, in its Context block, list the applicable FE skill(s) and include:
> - `bks-fe-implement-feature` as the primary skill, plus the layer-specific sister skill (`bks-fe-api-integration` for 3a, `bks-fe-ds-sdk-consumer` for 3b, `bks-fe-list-url-state` for list integration, `bks-fe-create-tc-component`/`bks-fe-create-tc-flow` for 3d).
> - The exact `frontend/features/{feature}/` subfolders the task touches (`schemas/`, `services/`, `hooks/`, `components/`, `stores/`, `mocks/`) and the `app/(group)/...` route file for integration tasks.
> - A reminder that i18n is MANDATORY and the relevant `messages/` namespace.
> - The screen ID(s) from the requirement's §9.2 Screen Inventory this task implements.
