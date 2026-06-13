# Technical Mapping

Map business concepts to technical components using project standards.

## Persistence

Propose table schema changes or new tables. Refer to `bks-be-database-standard`.

### Column Table Format

Each table MUST use this format:

```markdown
#### Table: `table_name`

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| id | bigint | 20 | NO | YES | — | KEPT | Primary key | — |
| name | string | 255 | NO | NO | — | ADDED | Display name | Set to 'Default' |
| email | string | 255 | NO | YES | — | ADDED | User email | — |
| balance | decimal | 12,2 | NO | NO | 0 | MODIFIED | User balance | **Lock**: uses `lockForUpdate` |
| status | tinyInteger| — | NO | NO | 1 | ADDED | User status | See Enum: `UserStatus` |
| deleted_at | timestamp | — | YES | NO | NULL | ADDED | Soft delete | — |
```

**Action values**: `KEPT` | `ADDED` | `MODIFIED` | `DELETED` | `MOVED_TO:{table}` | `MOVED_FROM:{table}` | `SNAPSHOT`

### Primary Key Mandate

EVERY table, including secondary or pivot tables (e.g., `role_user`, `department_user`), MUST explicitly define an `id` column as its Primary Key.

## Security & Authorization

Define who can perform which action (RBAC). Refer to `App\Policies` and Controller & Auth Standards.

## Logic Placement

Determine if a rule belongs in a Controller, Service, Middleware, or a Background Job. Refer to `bks-be-api-standard`.

### Service Layer Organization

| Layer | Location | Registration | Usage |
|-------|----------|--------------|-------|
| **API Layer** | `App\Services\Api\` (**FLAT** — `app/Services/Api/UserService.php`) | `ApiFactory` | Logic triggered by HTTP requests |
| **Background Layer** | `App\Services\Background\` (**FLAT** — `app/Services/Background/ReportService.php`) | `BackgroundFactory` | Logic triggered by Jobs or Artisan Commands |
| **Common Layer** | `App\Services\Common\` | `CommonFactory` | Shared utilities (file upload, webhook dispatch) |

> Services are **FLAT** — the module name is the filename, NOT a folder. Do NOT propose `App\Services\Api\{Module}\…`. (DTOs/FormRequests/Resources are the opposite — grouped by module.)

### DTO Requirement

Every API and Background service method that accepts structured input MUST receive a `final readonly` DTO (`App\DTOs\{Layer}\{Module}\{Action}Data` — DTOs **are** grouped by module) — NEVER a raw `array`.

> [!CAUTION]
> **FORBIDDEN: Do NOT propose creating new Factory files.** The three factory files (`ApiFactory`, `BackgroundFactory`, `CommonFactory`) are permanent. New services are ADDED as methods to the existing factory — never by creating a new factory class.

### Eloquent Observers Warning

Do NOT propose using Eloquent Observers for critical business events (like Webhook Dispatches or Audit Logging) due to their silent failure during DB bulk-update operations. Explicitly require manual event triggers inside the Service layer.

## Integrations

Define interactions with 3rd-party APIs (Webhooks, Request/Response cycles). Refer to `bks-be-api-standard`.

## Background Jobs

Identify any scheduled tasks, queued jobs, or cron-based logic. Refer to `bks-be-job-standard` and `bks-be-command-standard`.

## Notifications

Map each notification trigger to channel (email/SMS/push), template, and variables.

```markdown
| Trigger Event | Channel | Template/Subject | Variables | Recipient |
|---------------|---------|------------------|-----------|-----------|
| User registers | Email | Registration invitation | `{link}`, `{token}` | User |
| Payment failed | Email | Payment reminder | `{plan_name}`, `{retry_date}` | User |
```

## Master Data vs Dedicated API (routing read endpoints)

Decide this **during analysis** — by the time an execution skill runs, the choice is already fixed. Master Data is a **read-only lookup channel** (`GET /api/master-data?resources[...]`) returning **raw `{id, label}`-style arrays** (never `JsonResource`), whose key advantage is **batching many lookups into one request** so a form's dropdowns fill in a single round-trip.

| Route to **Master Data** when… | Route to a **dedicated API** when… |
|---|---|
| The FE needs a **reusable lookup list to pick from** — `<select>`, autocomplete, radio/checkbox, tree picker, filter options. | The screen **manages the entity itself** — its CRUD list/table, detail view, create/edit/delete. |
| Data is **reference/constant**: enums/statuses, genders, countries, date formats, roles, config lists. | The response needs a **`JsonResource`** shape: computed fields, nested relations, conditional fields/links, full record. |
| Read-only, even with **search / pagination / `selected` / exclusion / auth-scoping** (Custom driver covers these). | The endpoint **mutates state** (POST/PUT/PATCH/DELETE) — Master Data is read-only. |
| The FE only needs **`{id, label}`** (+ a few display columns) and writes nothing back. | It carries **business rules, per-action permissions/policies**, or drives a workflow. |
| The list is **secondary** — it feeds a form/filter on *another* feature's screen. | The list is the feature's **primary table** needing sortable/filterable columns via `TableService`, policies, full pagination metadata. |

**Rule of thumb:** *"user picker dropdown inside the Order form"* → Master Data (`users` resource); *"the Users management table (list + detail + edit)"* → dedicated API. The same entity can have **both** — decide per **use-case**, not per entity. Designate Master Data resources for registration via `bks-be-master-data-standard`; dedicated endpoints follow `bks-be-api-standard`.

> [!CAUTION]
> **Master Data routing ≠ skipping the table.** Routing a list to Master Data only decides *how the FE reads it* — it does NOT mean the table is "handled elsewhere". An Eloquent-driven Master Data resource (e.g. `categories`, `tags`) is a **real physical table** that still needs a migration, seeder, and a **full column-table definition in §7 DATA MODEL UPDATES** (id, name, slug, status, timestamps, etc.). NEVER reference a Master Data table by FK (`category_id → categories`) or by `exists:categories,id` validation without defining that table's schema in §7. The `bks-be-master-data-standard` skill defines the *read driver/registry*, never the table structure — that is this document's job.

## UI/UX & Frontend (Next.js App Router)

Define all frontend requirements so they can be split into small, decomposable tasks. Classify scope (Complexity tier Simple/Standard/Complex; Flow A form / B list / C CRUD / D detail) and produce the exhaustive breakdown in the requirement's **Section 9** (Screen & Route Inventory, per-screen component tree, data-layer hook→endpoint map, Zod fields, UI states, UI behavior). Business rules stay in the single layer-agnostic `BR-*` registry (§5) — FE tasks reference the same `BR-*` as BE tasks, never a separate frontend-rule list:

- **Routes**: `frontend/app/(group)/...` (mark interactive files `'use client'`).
- **Feature directory**: `frontend/features/[feature]/` with `services/` (repositories), `hooks/`, `components/`, `schemas/` (Zod), `stores/`, `mocks/`. Cross-feature UI in `frontend/shared/`.
- **Component Split**: break each screen into small single-responsibility components (container vs presentational) — never a monolith.
- **Data layer**: map each screen's hooks/repository methods to the API ENDPOINT INVENTORY (repository + Zod runtime validation + 422 `mapBackendErrors`).
- **State Management**: feature-local hook state by default; global store only for cross-feature state (auth/workspace/notifications).
- **Validation**: define **Zod** schema fields and localized error keys.
- **UI states**: loading / empty / error / permission-denied / success feedback per screen.
- **User Feedback**: localized success/error messages (i18n MANDATORY).

> Refer to `bks-fe-implement-feature` (and sisters `bks-fe-api-integration`, `bks-fe-ds-sdk-consumer`, `bks-fe-list-url-state`) for frontend patterns.
