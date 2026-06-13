# Document Structure

Every requirement document in `docs/requirements/` MUST follow this structure.

> [!IMPORTANT]
> **Heading numbers.** The sections below are numbered with the **YAML Frontmatter as §1**. In the output document this means the first `##` heading is `## 2. OVERVIEW` and the FE section is `## 9. UI/UX & FRONTEND IMPLICATIONS` (with `### 9.1`–`### 9.8` subsections, exactly as templated below). This keeps `§9.x` stable for the downstream `bks-requirement-to-tasks` skill. Do NOT start OVERVIEW at §1 — that pushes UI/UX to §8 and breaks every `§9.x` cross-reference.

## 1. YAML Frontmatter

Used for categorization and status tracking.

```yaml
---
title: [Requirement Title]
description: [Short summary of the change]
status: pending_implementation | in_progress | completed
date: [YYYY-MM-DD]
version: 1.0
changelog:
  - version: 1.0
    date: [YYYY-MM-DD]
    summary: Initial requirement specification.
---
```

### Versioning Rules

- **Bump minor** (1.0 → 1.1) when clarifying or adding details without changing scope.
- **Bump major** (1.x → 2.0) when scope, data model, or core flows change significantly.
- **Always add a changelog entry** with date and summary when updating a requirement document.

## 2. OVERVIEW

A high-level summary of the requirement and its primary business goal. Must explain the **full scope** of the change, not just restate the draft's introduction.

## 3. CONTEXT

- **Modules**: Affected modules (e.g., User).
- **Features**: Key functional areas.
- **Guards**: Which authentication guards are involved (e.g., `user`).
- **Third-parties**: External integrations (e.g., Stripe, AWS).

## 4. OUT OF SCOPE

Explicitly list what is **NOT** included in this requirement to prevent scope creep. Focus on adjacent features the draft might imply but doesn't require immediately.

## 5. BUSINESS RULES

> [!IMPORTANT]
> **One layer-agnostic registry.** A business rule is a fact about the domain — it is NOT split into "frontend rules" and "backend rules". The same `BR-*` is referenced by both backend and frontend tasks. Most rules are enforced in BOTH layers (e.g. BE FormRequest + FE Zod). Pure UI/UX behavior (skeletons, debounce, toast choice, empty-state copy) is NOT a business rule — capture it in §9.7 (`UI-*`), not here.

A numbered list of business rules extracted from the draft and analysis, each rule standalone and testable. Add an **Enforced in** note so each rule's BE and FE enforcement points are explicit:

```markdown
- **BR-G001**: [Rule description]. Referenced in: Flow #{n}. Enforced in: BE `RegisterRequest`; FE `useAuthSchemas` (Zod).
- **BR-AUTH-003**: [Rule description]. Referenced in: Flow #{n}, Flow #{m}. Enforced in: BE `UserPolicy`; FE conditional render (S1 toolbar).
- **PROPOSED_BR:require-tenant-boundary**: [New rule pending registration]. Referenced in: Flow #{k}. Enforced in: BE only.
```

Or, for many rules, use a table:

```markdown
| BR | Rule | Referenced in | Enforced in (BE) | Enforced in (FE) |
|----|------|---------------|------------------|------------------|
| BR-G001 | Email required & valid format | Flow 1 | `RegisterRequest` | `useAuthSchemas` (Zod) |
| BR-AUTH-003 | Only `users.create` permission may create | Flow 2 | `UserPolicy` | Hide "Create" button (S1) |
```

### Rule ID Policy

- Use only IDs that already exist in `docs/system/br-registry.md`.
- For new, not-yet-registered rules, use `PROPOSED_BR:{slug}` (requirement/task stage only).
- `PROPOSED_BR` MUST be resolved to official `BR-*` before logic docs (`docs/logic/`) are finalized.
- **FE-only enforcement still uses a `BR-*`** when there is a real business rule behind it; only label something a UI behavior (`UI-*`, §9.7) when it has NO business meaning.

This section enables developers to write unit/feature tests per rule across both layers.

## 6. REQUIREMENT ANALYSIS

Detailed breakdown of logic phases, rules, and conditions. Use tables or lists for clarity.

## 7. DATA MODEL UPDATES

Detailed changes to models and fields. This section must be **EXHAUSTIVE** and replace any data descriptions in the draft.

### Rules

- **Per-Table Breakdown**: List every table affected.
- **Primary Key Mandate**: EVERY table MUST explicitly define an `id` column as its Primary Key.
- **Technical Names**: Use English for technical names (Snake Case for DB).
- **Snapshot Logic**: Explicitly define which fields are copied from where (e.g., Plan to UserPlan).
- **Master-Data Table Rule**: A lookup table routed to Master Data (e.g. `categories`, `tags`, `roles`) is a **real physical table** — it MUST have its own full column-table here. The moment any artifact references it — an FK (`category_id → categories`), an `exists:categories,id` validation, or a "seed Master Data" task — its schema MUST be defined in this section. Master Data only controls *how the list is read* (`bks-be-master-data-standard`); it NEVER substitutes for defining the table. A `category_id` column without a `categories` table definition is an incomplete data model.

> [!IMPORTANT]
> **Stakeholder-Defined Schema Rule**: If the draft explicitly defines database columns, the AI MUST:
> 1. Preserve ALL columns exactly as defined — no silent omission, merge, or rename.
> 2. Flag perceived issues as "Suggested Modifications" requiring user approval.
> 3. Clearly distinguish between **stakeholder-defined columns** (mandatory) and **AI-proposed columns** (suggested).

### Enum Definition Rule

For every column identified as Enum type, include:

1. **Full list of enum values** (integers starting from 1) with their business names and descriptions.
2. **Database Type**: Specify `tinyInteger` (<= 127 cases) or `smallInteger`.
3. **Localization Keys**: Define the key path for labels used by the mandatory `label()` method.
4. **State transition table**: which value can transition to which.
5. **Transition triggers**: who/what triggers each transition (User action, System job, Webhook).
6. **API Structure**: API responses MUST return both the integer `value` and the localized `label`.

**Example:**

```markdown
#### Enum: `PaymentStatus`

| Value (int) | Name | Description | Localization Key |
|-------------|------|-------------|------------------|
| 1 | PENDING | Awaiting payment | `enums.payment_status.pending` |
| 2 | PAID | Payment confirmed | `enums.payment_status.paid` |
| 3 | FAILED | Payment attempt failed | `enums.payment_status.failed` |
| 4 | REFUNDED | Payment refunded | `enums.payment_status.refunded` |

**Transitions:**
| From | To | Trigger |
|------|----|---------|
| pending | paid | Stripe webhook `payment_intent.succeeded` |
| pending | failed | Stripe webhook `payment_intent.payment_failed` |
| paid | refunded | User action via dashboard |
```

## 8. PROCESSING FLOWS

Step-by-step atomic logic for **EVERY** scenario identified. Use numbered lists for sequential steps.

- **Exhaustive Scenarios**: Must cover all actions (e.g., User Create, User Update, System Auto-Action).
- **External Interactions**: Define exactly how Webhooks, 3rd-party APIs, and Background Jobs interact with the database.

> [!WARNING]
> **Explicit State Changes Rule**: Every step that modifies data MUST include a `State Changes` sub-list showing exactly which `table.column` changes and to what value.

### Example Flow

```markdown
### Flow 1: User Registration (Free Plan)
1. User selects a Free plan and submits. (BR-001)
2. System creates `UserPlan` record. (BR-002)
   **State Changes:**
   - `user_plans.payment_type` = `free`
   - `user_plans.is_free` = `true`
3. System activates the user. (BR-003)
   **State Changes:**
   - `users.plan_id` = `{new_plan_id}`
   - `users.is_premium` = `false`
   - `users.payment_status` = `paid`
   - `users.expired_date` = calculated from plan config

**Concurrency Handling:**
- **Mechanism**: No DB lock needed for free registration. 
- **Atomic Lock**: Cache lock `register-user-{email}` to prevent double-submit.

**Acceptance Criteria (Happy Path):**
- [ ] User successfully selects the free plan and is redirected to the dashboard.
- [ ] User status reflects the new free plan without requiring payment.
- [ ] Localization key `auth.register_success` is displayed.
```

### Error Handling Per Flow

Each Processing Flow MUST end with an **Error Cases** sub-section:

```markdown
**Error Cases:**
| Error Condition | System Behavior | State Changes |
|-----------------|-----------------|---------------|
| Stripe API timeout | Retry 3 times, then mark failed | `status` = `failed` |
| Duplicate webhook | Idempotent check via `stripe_payment_id` | No change |
| User not found | Log error, return 404 | No change |
```

At minimum, address: network failure, duplicate request, invalid state, authorization failure, and third-party API error.

## 9. UI/UX & FRONTEND IMPLICATIONS (Next.js App Router)

> [!IMPORTANT]
> **This section is the source the `bks-requirement-to-tasks` skill slices into small frontend tasks.** It MUST be detailed enough that each screen, data hook, and component can become its own bite-sized task that a single AI session can finish without losing context. A vague FE section forces oversized tasks downstream. Aim for a breakdown so granular that no single task needs more than ~4 components + 1–2 hooks.

Project FE layout (confirm against the codebase): route groups live in `frontend/app/(group)/...`; feature logic lives in `frontend/features/{feature}/` with subfolders `services/` (repositories), `hooks/`, `components/`, `schemas/` (Zod), `stores/`, `mocks/`. Cross-feature UI lives in `frontend/shared/`.

### 9.1 FE Scope Classification
State the classification decided in Phase IV so downstream sizing is unambiguous:
- **Complexity tier**: Simple | Standard | Complex.
- **Flow type**: A (form only) | B (list only) | C (full CRUD) | D (detail/read view).
- **Data mode**: `http` (API ready) | `mock` (UI-first) | `http+mock`.

### 9.2 Screen & Route Inventory (MANDATORY)
One row per distinct screen, dialog, or drawer. This is the **primary split axis** for tasks.

| # | Screen / Dialog | Route (App Router) | Flow | Renders | Primary API | Notes |
|---|-----------------|--------------------|------|---------|-------------|-------|
| S1 | User list | `app/(main)/users/page.tsx` | B | Table + filters + pagination | `GET /api/v1/users` | URL-synced filters (see `bks-fe-list-url-state`) |
| S2 | Create user dialog | (modal on S1) | A | Form | `POST /api/v1/users` | Opened from S1 toolbar |
| S3 | User detail | `app/(main)/users/[id]/page.tsx` | D | Read sections + inline edit | `GET /api/v1/users/{id}` | — |

### 9.3 Component Tree (per screen)
Break **every** screen into small, single-responsibility components — never one monolith. Mark each as a container (data/state) or presentational unit. This determines how many sub-tasks a screen yields.

```markdown
S1 — User list (`features/users/`)
- UsersPage (container)              → owns hook, layout
  - UsersToolbar (presentational)    → search input, "Create" button
  - UsersFilters (presentational)    → status select, role select (URL state)
  - UsersTable (presentational)      → columns, row actions
  - UsersPagination (presentational) → page/perPage controls
  - DeleteUserAlert (presentational) → confirm dialog
```

### 9.4 Data Layer (repositories, hooks, mapping)
Map each screen to the data it needs. Refer to `bks-fe-api-integration` for the repository + Zod runtime-validation + 422 (`mapBackendErrors`) pattern.

| Hook | Repository method | API endpoint | Returns | Used by |
|------|-------------------|--------------|---------|---------|
| `useUsers(filters)` | `UserRepository.list` | `GET /api/v1/users` | paginated `User[]` | S1 |
| `useCreateUser()` | `UserRepository.create` | `POST /api/v1/users` | `User` | S2 |
| `useUser(id)` | `UserRepository.get` | `GET /api/v1/users/{id}` | `User` | S3 |

### 9.5 Forms & Zod Schemas
For every form, define the schema field-by-field with **localized** error keys. This table maps 1:1 to a `schemas/` file.

| Form | Field | Type | Client Rule | Error Key |
|------|-------|------|-------------|-----------|
| Create user | `email` | string | required, email | `users.errors.email_invalid` |
| Create user | `role_id` | number | required | `users.errors.role_required` |

### 9.6 UI States (per screen — MANDATORY)
Every screen MUST enumerate its non-happy states; these are common sources of missed work and extra tasks.

| Screen | Loading | Empty | Error | Permission-denied | Success feedback |
|--------|---------|-------|-------|-------------------|------------------|
| S1 | table skeleton | empty-state illustration | inline retry banner | hide "Create" button | — |
| S2 | submit spinner | — | field errors via `mapBackendErrors` + toast | dialog not openable | toast `users.toasts.created` |

### 9.7 Presentation & UX Behavior (NOT business rules)

> [!IMPORTANT]
> **Business rules are NOT duplicated here.** If a screen behavior reflects a domain rule (permission-gated action, conditional-required field, etc.), it is a `BR-*` from §5 — reference that `BR-*`, do NOT invent a frontend-only rule. Examples: "hide Create unless `can('users.create')`" → reflects the auth `BR-*`; "show `tax_code` only when `type=company`" → reflects the `required_if` `BR-*`. Both reference the existing `BR-*`.

This sub-section captures only **pure UI/UX behavior with no business meaning** — things the backend neither knows nor enforces. Number them `UI-{n}` and reference them from screens. If a behavior turns out to encode a domain rule, move it to §5 as a `BR-*` instead.
- **UI-001**: List uses a skeleton loader (not a spinner) while `useUsers` is pending. Used by: S1.
- **UI-002**: Search input is debounced 300ms before triggering `useUsers`. Used by: S1.
- **UI-003**: After a successful create, the dialog closes and the list optimistically refreshes. Used by: S2.

### 9.8 Navigation, Global State & i18n
- **Navigation**: how screens link (route pushes, dialog open/close, redirect after submit).
- **Global state**: only if cross-feature state is needed (auth/workspace/notifications) — per `bks-fe-implement-feature`. Default to feature-local hook state.
- **i18n keys**: list every new key namespace (`messages/{locale}/...`). i18n is MANDATORY — no hardcoded strings.

## 10. NOTIFICATIONS

If the feature involves any notification, email, or communication, include a notification inventory table.

## 11. API ENDPOINT INVENTORY

List all new or modified endpoints.

```markdown
| Method | Endpoint | Guard | Description | Related Flow |
|--------|----------|-------|-------------|--------------|
| POST | `/api/v1/register` | guest | User registration | Flow 1 |
| GET | `/api/v1/profile` | api | Get personal profile | Flow 2 |
```

## 12. IMPLEMENTATION TASKS

A high-level phased TODO list to guide the transition into development tasks.

## 13. DRAFT COVERAGE MATRIX (Optional for high-density drafts)

Map each section/bullet from the draft to the corresponding requirement section to ensure nothing is silently dropped:

```markdown
| Draft Section | Draft Item | Requirement Section | Status |
|---------------|-----------|---------------------|--------|
| "Registration Flow" | Email invitation | Flow 1, Step 1 | ✅ Covered |
| "Plan Types" | Installment payment_times | BR-005, Data Model | ✅ Covered |
| "Model: User" | show_warning column | Data Model: users | ✅ Covered |
```
