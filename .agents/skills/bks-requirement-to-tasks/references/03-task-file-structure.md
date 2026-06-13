# Task File Structure

This document defines the mandatory structure for every individual task file.

---

## Header: YAML Frontmatter

**Template:**
```yaml
---
task_id: "{NN}"
title: "{Task Title}"
description: "{Short summary of the task}"
type: IMPLEMENTATION | COORDINATION | DOCUMENTATION
phase: 1 | 2 | 3 | 4
status: pending | in_progress | completed
estimated_effort: S | M | L | XL
complexity: low | medium | high
risk: low | medium | high
depends_on: []
rule_refs: []
date: "{YYYY-MM-DD}"
changelog:
  - version: 1.0
    date: "{YYYY-MM-DD}"
    summary: Initial task specification.
---
```

**Field Definitions:**

| Field | Description |
|---|---|
| `task_id` | Zero-padded task number (e.g., `"01"`, `"14"`). |
| `type` | Task type: `IMPLEMENTATION`, `COORDINATION`, or `DOCUMENTATION`. |
| `phase` | Phase number (1–4). |
| `status` | `pending` → `in_progress` → `completed`. |
| `estimated_effort` | `S` (~1-2h), `M` (~3-5h), `L` (~1-2 days), `XL` (~3+ days). |
| `complexity` | `low` (well-understood, no unknowns), `medium` (some design decisions), `high` (new tech, complex logic). |
| `risk` | `low` (routine), `medium` (some unknowns), `high` (3rd party integration, concurrency, new tech). |
| `depends_on` | Array of task IDs this task depends on (e.g., `["01", "03"]`). |
| `rule_refs` | Array of business rules used by this task (e.g., `["BR-G007", "BR-AUTH-004"]`; `PROPOSED_BR:{slug}` is allowed only while rule is pending registration). |
| `changelog` | Version history. Bump minor for clarifications, major for scope changes. |

---

## Section 1: Context Block (MANDATORY)

**Template:**
```markdown
# Context
- **Requirement**: [{requirement-filename}](../../requirements/{requirement-filename})
- **Parent Task**: [{index-filename}](../{index-filename})
- **Applicable Workflows**: `/workflow-1`, `/workflow-2`, ...
- **Applicable Skills**: `skill-1`, `skill-2`, ...

---
```

> [!IMPORTANT]
> **Workflows** (e.g., `/execute-api-task`) are complete execution processes — follow them step-by-step. **Skills** (e.g., `bks-be-api-standard`) are individual coding standards.
> 
> **Every implementation task MUST contain the applicable execution workflow and corresponding skill.** This context is the primary source of truth for implementation logic. If a task is missing these, the implementor will be blocked.

---

## Section 2: Title & Description

**Template:**
```markdown
# Task {NN}: {Title}

## Description
[2-3 sentences explaining WHAT this task delivers and WHY it matters. Include context about the current state of the codebase if relevant.]

## Out of Scope (Optional)
[Explicitly list what should NOT be done in this task to prevent AI from overstepping boundaries.]
```

---

## Section 3: Current State (Optional)

If modifying existing code, document what already exists:

**Template:**
```markdown
## Current State (Already Exists)
- **Tables**: [list existing tables]
- **Models**: [list existing models]
- **Enums**: [list existing enums with values]
- **Routes**: [list existing routes if relevant]
```

---

## Section 4: Requirements

The core of the task — detailed implementation instructions organized by component:

**Template:**
```markdown
## Requirements

### 1. {Component Name} ({Action: NEW/MODIFY/DELETE})

[Detailed instructions with:]
- **File path**: (relative to project root).
- **Class/Method signatures**: (Full signatures with types).
- **Logic flow**: (Numbered steps, linking to BR-XXX).
- **Validation (MANDATORY Table Format)**: MUST define all validation rules in a table.

| Field | Presence | Type | Boundaries | Format | Cross-field Rules | Notes |
|-------|----------|------|------------|--------|-------------------|-------|
| `name` | `required` | `string` | `max:50` | — | — | — |
| `tax_code` | `required_if:type,company` | `string` | `regex:/^\d{10,13}$/` | — | Required only when `type == 'company'` | — |
| `end_date` | `required` | `date` | `after:start_date` | `Y-m-d` | Must be after `start_date` | — |

- **Cross-field Validation Rules (MANDATORY if applicable)**: List all inter-field dependencies explicitly.

| Condition | Affected Fields | Rule | Error Message Key |
|-----------|----------------|------|-------------------|
| `type == 'company'` | `tax_code`, `company_name` | Required | `validation.tax_code_required_for_company` |
| `end_date` present | `end_date`, `start_date` | `end_date > start_date` | `validation.end_date_after_start` |
| `new_password` present | `new_password`, `old_password` | Must differ | `validation.password_must_differ` |

- **Localization Keys**: List all new/modified lang keys.
```

**Rules for Requirements:**
- **WHAT, not HOW**: Describe **purpose, inputs + validation, outputs, business rules, and error cases**. Do NOT describe structural mechanics — routing, middleware placement, controller/class skeletons, or wiring. Those are HOW, owned by the execution skill. State auth as a *semantic requirement* (e.g. "requires authenticated user guard" / "public endpoint"), never as a route/middleware instruction. See the **Golden Boundary** in the skill overview.
  - **The line between the two**: *naming* an artifact, its **conventional target location**, its **contract** (signature/fields), and **constraints** (e.g. "register in the existing factory", "DTO required") is allowed — that is WHAT/decomposition. *Writing* the mechanics (route/middleware/guard placement, registration code, method bodies, JSX/fetch) is HOW — delegate it. The rules below name targets and constraints; they are NOT permission to write the code behind them.
- **Be Explicit**: Name the exact file paths, class names, and method names as the **intended targets/contracts** (not as code to paste).
- **Suggest, Don't Implement**: Code snippets illustrate the **expected shape** — method signatures, DTO fields, return types, or config structure. They are **NOT** complete implementations. Avoid writing full method bodies, business logic, or boilerplate. The implementor (AI agent) will generate production code following the referenced skill's standards.
- **Show Method Signatures**: Include method signatures with types as **guidance** (e.g., `register(RegisterData $dto): User`). Do NOT write the method body.
- **Service Location (FLAT — no feature subfolder)**: API services go directly in `app/Services/Api/` as `{Name}Service.php` (e.g. `app/Services/Api/UserService.php`), Background services in `app/Services/Background/{Name}Service.php`. NEVER `app/Services/Api/{Module}/…`, `app/Services/User/`, or any new per-feature directory.
- **File grouping is per-LAYER, not per-feature**: place each artifact by mirroring its layer's existing convention (flat: services & controllers; grouped-by-module: DTOs, FormRequests, Resources). Do NOT collect a feature's files under one new `{Feature}/` folder. See the **File Placement & Grouping** table in the skill overview; the codebase audit + `bks-be-api-standard` are authoritative.
- **DTO Before Service**: For every new service method, specify the DTO location and fields (`app/DTOs/{Layer}/{Module}/{Action}Data.php`). The method signature MUST accept the DTO, not a raw `array`.
  ```php
  // ✅ CORRECT — Signature suggestion in task requirement
  public function create(CreatePostData $dto): Post

  // ❌ FORBIDDEN — Full implementation in task requirement
  public function create(CreatePostData $dto): Post
  {
      $post = Post::create([...$dto->toArray()]);
      return $post;
  }
  ```
- **Factory — Register Only**: New services are ALWAYS registered as getter methods inside the **existing** `ApiFactory`, `BackgroundFactory`, or `CommonFactory`. NEVER create a new `XxxFactory.php` file.
- **Reference Business Rules**: Link to `BR-*`/`TR-XXX` from the requirement. `BR-*` must resolve in `docs/system/br-registry.md`.
- **Enum Standards (MANDATORY)**: Foundation tasks for Enums MUST specify:
  - **Backing type**: Integer (`tinyInteger`/`smallInteger`) or String — as dictated by the storage design.
  - **Class implementation**: Mandatory `label()` method using `trans()`.
  - **API Response**: JsonResources MUST return both value and label fields.

### Code Usage Policy in Task Files

| Usage Level | When to Use | Example |
|---|---|---|
| **Method Signature** | Always — shows expected interface (I/O contract) | `public function register(RegisterData $dto): User` |
| **DTO Fields List** | When creating new DTOs | `fields: email: string, name: string` |
| **Short Snippet** | To clarify a tricky pattern or config shape | 3-5 lines showing trait usage or array structure |
| **Full Implementation** | **NEVER** — the implementor writes this | ❌ Complete method bodies, business logic |
| **Routing / Middleware / Wiring code** | **NEVER** — owned by the execution skill (HOW) | ❌ `Route::post(...)`, `->middleware('auth:user')`, `$this->middleware(...)`, factory binding code |
| **Controller / class scaffolding** | **NEVER** — owned by the execution skill (HOW) | ❌ `class XController extends ... { public function __construct() {...} }` |

> [!IMPORTANT]
> **Rule of thumb**: If a code block exceeds **10 lines**, it's likely too detailed for a task file. Reduce it to a signature + comment describing the logic flow.

> [!CAUTION]
> **Never write HOW-code.** Routes, middleware placement (auth/guard/throttle), controller class bodies, and factory-registration code are **structural conventions owned by the execution skill** (e.g. `bks-be-api-standard`). A task that writes `->middleware('auth:user')` on a route is the canonical bug: it hard-codes a placement that contradicts this project (auth → controller `__construct`; throttle → route). State the **auth requirement** (e.g. "requires authenticated user") and the **endpoints**, then let the skill wire them.

### Frontend Task Requirements (FE tasks only)

The DTO/Factory/Service-location rules above are **backend-only**. Frontend tasks (Phase 3a/3b/3c/3d) use a different shape. Each FE task MUST:

- **Name the screen ID(s)** it implements (from requirement §9.2) in the Context block, plus the layer (3a Data / 3b Components / 3c Integration / 3d Tests).
- **State the exact `frontend/features/{feature}/` subfolders** it touches (`schemas/`, `services/`, `hooks/`, `components/`, `stores/`, `mocks/`) and, for 3c, the `app/(group)/.../page.tsx` route file.
- Organize Requirements by FE artifact, not by BE component. For each layer, the task states the **WHAT (contracts)** and delegates the **HOW (code)** to the named skill:

| Layer | Task specifies (WHAT — contracts, not code) | Delegates HOW to |
|-------|---------------------------------------------|------------------|
| **3a Data** | `User` type shape; **Zod schema fields** (reuse the Validation table); repository method **signatures** (`UserRepository.list(filters): Promise<Paginated<User>>`); hook **signature** (`useUsers(filters)`); the API contract consumed (endpoint + request/response shape); that 422 maps via `mapBackendErrors`. | `bks-fe-api-integration` writes the adapter, runtime validation, and error mapping |
| **3b Components** | Component list (≤4) with role (container/presentational) and props **signatures**; which DS component fills each role *by purpose*; what mock/placeholder shape lets it build without the API. | `bks-fe-implement-feature` + `bks-fe-ds-sdk-consumer` write the JSX, tokens, styling |
| **3c Integration** | Which `page.tsx`/dialog composes which components + hooks; navigation target; and **every UI state** (loading/empty/error/permission/success) from §9.6; whether list URL-state applies. | `bks-fe-implement-feature` (+ `bks-fe-list-url-state`) wires composition, routing, URL sync, toasts |
| **3d Tests** | The scenarios to cover (happy/edge/error) per screen. | `bks-fe-create-tc-component` / `bks-fe-create-tc-flow` write the tests |

- **Reference shared `BR-*`** (never a frontend-only rule registry); capture pure UX behavior as `UI-*`.
- **List the `messages/` i18n namespace** — i18n is MANDATORY, no hardcoded strings.
- **Status checklist uses `pnpm lint` / `pnpm test`** (not `php artisan`); omit the migration-rollback item.

> [!CAUTION]
> **FE tasks state WHAT, not HOW** (same Golden Boundary as backend). A frontend task MUST NOT contain **JSX/component code, `useState`/`useEffect`/`useForm` wiring, `fetch`/`axios` calls, styling/CSS, the repository adapter body, `mapBackendErrors`/runtime-validation code, URL-state sync code, or toast call sites**. These are owned by the `bks-fe-*` skills. The canonical FE mistake mirrors the backend one: a task hard-codes `fetch('/api/...')` inside a component instead of stating *"consumes `GET /api/v1/users` via the repository"* and letting the skill implement it.
> Allowed in FE tasks: **types/data shape, Zod field tables (input validation), repository/hook signatures (I/O contracts), API contract, UI states, interactions (`UI-*`), i18n namespace.**

> [!CAUTION]
> An FE task that needs DTOs, FormRequests, or a Factory is misclassified — that is backend work. FE tasks never reference `app/`, `ApiFactory`, or `php artisan`.

---

## Section 4a: Delegation Map (COORDINATION Tasks Only)

COORDINATION tasks do not implement code directly. Instead, they MUST include a delegation map showing which implementation tasks handle each sub-requirement:

**Template:**
```markdown
## Delegation Map

| Requirement | Delegated To | Section | Status |
|---|---|---|---|
| {Sub-requirement 1} | Task {NN} | Requirements §{N} | ⏳ Pending |
| {Sub-requirement 2} | Task {NN} | Requirements §{N} | ⏳ Pending |
```

**Rules:**
- Every sub-requirement of a COORDINATION task MUST be delegated to exactly one IMPLEMENTATION task.
- The delegation must reference the specific section within the target task.
- Status should be updated as delegated tasks are completed.

---

## Section 5: API Endpoints Summary (For API Tasks Only)

**Template:**
```markdown
## API Endpoints Summary

| Method | URI | Description | Input Parameters | Output Response | Auth |
|--------|-----|-------------|------------------|-----------------|------|
| `POST` | `/api/v1/...` | ... | `key` (type, presence, boundaries) | `{ "id": 1, ... }` | Authenticated (user) / Public |
```

> [!IMPORTANT]
> The **Auth** column states a *semantic requirement only* — `Authenticated (<guard>)`, `Public`, or `Guest-only`. It is **NOT** a routing or middleware instruction. Do NOT write route definitions or `->middleware(...)` here or anywhere in the task; the execution skill (`bks-be-api-standard`) decides placement (auth → controller `__construct`, throttle → route).

---

## Section 6: Testing Hints (Optional, for IMPLEMENTATION Tasks)

Provide guidance for the testing task to reference:

**Template:**
```markdown
## Testing Hints
- **Backend Requirements**:
  - **Factory needs**: [list required factories and their key states]
  - **Mock requirements**: [external services to mock, e.g., Stripe, Email]
- **Frontend Requirements**:
  - **Stores/Composables**: [state to mock or verify]
  - **UI Interactions**: [expected DOM changes, dialogs, or navigation]
- **Key test scenarios**:
  - [Happy path scenario]
  - [Edge case scenario]
  - [Error scenario]
- **Assertions**: [key state changes to verify]
```

---

## Section 7: Status Checklist

**Template:**
```markdown
## Status
- [ ] {Actionable item 1}
- [ ] {Actionable item 2}
- [ ] Run `php artisan migrate:rollback` and migrate again to verify `down()` methods (If modifying DB).
- [ ] Run `php artisan code:format` (Backend) OR `pnpm lint` (Frontend).
- [ ] **(Backend only) Run `php .agents/scripts/validate-backend.php backend`** and fix every reported error before continuing.
- [ ] Run `php artisan test --filter={RelatedTestClass}` (Backend) OR `pnpm test` (Frontend).
```

**Rules:**
- Each checkbox = one concrete, verifiable action.
- Order should follow logical implementation sequence.
- **Always include** the appropriate formatting/linting command as the second-to-last item.
- **Migration rollback check**: For tasks modifying the database schema (Phase 1), ALWAYS include a manual check to run `php artisan migrate:rollback`.
- **MANDATORY — Backend structure validation**: For **every backend IMPLEMENTATION task** (Phases 1, 2a, 2b, and backend tests in Phase 4), ALWAYS include `php .agents/scripts/validate-backend.php backend` **immediately before** the test command. This script validates the project's structural conventions (Routes, Controllers, Services, DTOs, Resources, FormRequests, Commands, Migrations, Models, Enums, Factories, Jobs, Tests, Master Data) — implementors frequently forget to run it, so it MUST be an explicit, non-optional checklist item. Omit it only for FE-only and DOCUMENTATION tasks.
- **Conditional test command**:
  - For IMPLEMENTATION tasks: include `php artisan test --filter={RelatedTestClass}`.
  - For DOCUMENTATION tasks: omit the test command.

---

## Section 8: Acceptance Criteria

**Template:**
```markdown
## Acceptance Criteria
1. {Numbered, testable criterion}
2. {Another criterion with specific expected values/behaviors}
```

**Rules:**
- Each criterion must be **testable**.
- Include specific HTTP status codes, expected state changes, and edge cases.
- Cover both happy path and key error paths.

---

## Section 9: Error Scenarios

**Template:**
```markdown
## Error Scenarios
- {Condition} → {Expected HTTP status/behavior}.
```

Map directly from the requirement's Error Cases tables.

---

## Section 10: Dependencies

**Template:**
```markdown
## Dependencies
- Task {NN} ({Title}) — {Why it's needed}.
```

**Note for COORDINATION tasks**: When an IMPLEMENTATION task depends on a COORDINATION task, add a note reminding implementors to read the COORD task's Delegation Map and Cross-cutting Business Rules.
