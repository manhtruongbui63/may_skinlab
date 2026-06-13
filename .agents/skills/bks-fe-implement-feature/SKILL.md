---
name: bks-fe-implement-feature
description: |
  Single source of truth for implementing a frontend feature in the Next.js 16 (App Router) +
  next-intl codebase. Classify complexity (Simple/Standard/Complex) and flow (A — form only,
  B — list only, C — full CRUD, D — detail/read view), gather requirements (max 2 Q&A rounds, then
  proceed with labeled assumptions), apply design-system standards, build forms with React Hook Form
  + Zod + next-intl, and build lists/detail pages on the established Repository → Service → Zustand
  store → hook pattern. i18n (next-intl) is MANDATORY.
  Default create/edit delivery = modal dialog. Run a pre-merge review with a severity-tagged checklist.
user-invocable: false
allowed-tools: [Read, Glob, Grep, Bash, Edit, Write, ReadLints]
---

# FE implement feature

## How to use this skill

> [!IMPORTANT]
> **MANDATORY REQUIREMENT:** Whenever this skill is invoked, you MUST immediately load and read the `../bks-fe-api-integration/SKILL.md` file using the `view_file` tool. Do not proceed with feature planning or implementation until you have read the API Integration skill in full. All rules, file structures, code patterns, 422 mapping, and form validation requirements defined in `../bks-fe-api-integration/SKILL.md` are strictly required and must be fully implemented.

Read this file fully. Then read references **on demand only**:

| Reference                                  | Read when                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| `references/project-patterns.md`           | First time touching this project's HTTP/i18n/master-data/hook patterns       |
| `references/design-system-rules.md`        | **Step 2** — read once per session before any UI code                        |
| `references/q-and-a-template.md`           | **Step 1** Round 1 — when drafting the question prompt                       |
| `references/templates.md`                  | **Step 1** plan output — copy the matching block (Simple vs Standard/Complex)|
| `references/validation-i18n.md`            | **Step 3** before writing `useFeatureSchemas` (locale key contract); also when adding/extending any `validation.*` or `<feature>.fields.*` keys |
| `references/repository-factory-pattern.md` | Clarifies the repository layering (interface + impl + singleton); confirms there is no runtime factory |
| `references/mock-repo-patterns.md`         | Building an MSW mock for a feature (`extends BaseMock`) |

**Sister skills** (MANDATORY):
- `../bks-fe-api-integration/SKILL.md` — **API Integration authority: repository pattern, Zod client/runtime validation, 422 error mapping, hook orchestration, and form wiring. You MUST view and read this file in full before writing any feature code.**
- `../bks-fe-ds-sdk-consumer/SKILL.md` — **UI/UX authority: component selection, layout, typography, spacing, scroll, badges, upload, component detection. Read ALL relevant references from this skill before writing ANY UI code.**
- `../bks-fe-list-url-state/SKILL.md` — **List pages with filters/pagination that must survive reload or be shareable via URL (next-intl + App Router search params). Read before writing `use-*` hook URL logic (Flow B/C).**

**Reference shape:** `features/auth/` is the only fully-built feature and is the canonical reference
for the layering used in this codebase: `services/<feature>.repository.ts` (interface `I<Feature>Repository`)
→ `services/<feature>.repository.impl.ts` (`extends BaseRepository implements I<Feature>Repository`)
→ `services/<feature>.service.ts` (orchestrates Zustand store + `sonner` toast) → `hooks/use-<feature>.ts`
(reads store, delegates to service) → `components/*` (RHF + Zod + next-intl). Copy this layering, not
any specific business logic.

**Watch for these mistakes** (auto-checks may fire; fix them in your own code):

- `result as any` casts to bypass typed response shapes
- Hardcoded toast fallback strings where a shared/`Api` message key exists
- `shadow-*` classes in feature code (use DS surface tokens)

If a 🟡 auto-check (`rg 'shadow-' …`, `rg 'className=' …`) fires on existing files you did not edit,
**do not fix as part of your feature** unless the user explicitly asks. Note the pre-existing hits in
your plan and move on.

---

## Quickstart

1. **Assess complexity** — Simple / Standard / Complex (see tier table)
2. **Classify flow** — A (form only) / B (list only) / C (full CRUD) / D (detail/read view)
3. **Step 1** — Gather requirements: max 2 Q&A rounds → produce plan → proceed
4. **Step 2** — Apply design-system standards (read `design-system-rules.md` once per session)
5. **MANDATORY API Integration Check** — Read `../bks-fe-api-integration/SKILL.md` in full immediately before proceeding to implement any API, hook, repository, schema, or form field.
6. **Implementation steps by flow** — Steps 1, 2, 5 always run; only the implementation step changes:

   | Flow | Implementation step(s) | Skip                  |
   | ---- | ---------------------- | --------------------- |
   | A    | Step 3                 | Step 4                |
   | B    | Step 4                 | Step 3                |
   | C    | Step 3 → Step 4        | —                     |
   | D    | Step 4 (detail variant)| Step 3 if read-only   |

7. **Step 5** — `pnpm lint` → severity checklist → fix blockers → ship
8. **Step 6** — Task status update: if the work came from a `docs/tasks/` file, tick its checklist, set `status: completed`, and update the task index

---

## Complexity tiers

| Tier         | Criteria                                                       | Step 1 behavior                                     | Extra skills                              |
| ------------ | -------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------- |
| **Simple**   | ≤3 fields/columns, 1 screen, standard CRUD                     | 3–5 questions, abbreviated plan                     | —                                         |
| **Standard** | 4–10 fields/columns, 2–3 screens                               | 5–8 questions, full plan                            | E2E smoke test                            |
| **Complex**  | 10+ fields, 4+ screens, custom logic, multi-step, file uploads | 5–8 questions + 1 follow-up round, full plan        | E2E + React perf review (memo/lazy/virtualize) |

Default to **Standard** when unsure.

---

## Flow classification

| Type                       | When                                                                     | Steps                  | Skip                |
| -------------------------- | ------------------------------------------------------------------------ | ---------------------- | ------------------- |
| **A — Form only**          | Settings, auth, wizard, standalone create/edit page (no list)            | 1→2→3→5                | Step 4              |
| **B — List only**          | Read-only table, no mutations                                            | 1→2→4→5                | Step 3              |
| **C — Full CRUD**          | List + create/edit + delete                                              | 1→2→3→4→5              | —                   |
| **D — Detail / read view** | Single-record detail page (read-only or read + per-section inline edit)  | 1→2→4→5 (detail variant) | Step 3 if read-only |

**Decision rules:** Any create/edit/delete on a list → C. Only table, no mutation → B. Only form,
no list → A. Single-record detail → D. Hybrid (list + dialog form) → C with dialogs.

**Data mode:** Always write the HTTP repository. When the API is unready (UI-first), add an **MSW**
mock (`mocks/<feature>.mock.ts` + register in `infra/mocks/handlers.ts`) and toggle it with
`NEXT_PUBLIC_USE_MOCK=true`. The repository is identical in both modes — there is no mock/http
repository swap.

---

## Project layout

| Path               | Role                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `app/`             | Next.js App Router: route groups (`(auth)/`, `(main)/`), `layout.tsx`, `providers.tsx`, `page.tsx`, `error.tsx`, `not-found.tsx` |
| `features/<name>/` | Domain module: `components/`, `services/`, `hooks/`, `schemas/`, `stores/`, `mocks/`, `types.ts`, `index.ts` |
| `shared/`          | Cross-feature: `components/` (`ui/`, `layout/`, `menu/`, `providers/`, `permissions/`), `hooks/`, `lib/`, `services/`, `stores/`, `utils/`, `types/`, `config/` |
| `infra/`           | HTTP client (`api/` — `BaseRepository`, `HttpService`, retry), `logging/`, dev `mocks/`       |
| `i18n/`, `messages/` | next-intl config + `vi.json` / `en.json` / `ja.json` message catalogs                       |

**Alias:** `@/` → frontend root (e.g. `@/features/auth/...`, `@/infra/api/...`). `@bks/ds-system-sdk`
→ the design-system SDK. **There is no `~/` alias.** **Files/dirs:** kebab-case. Feature pages live
under `app/<route group>/...` (App Router), not inside the feature folder; the feature folder holds
logic and presentational components only.

**State:** Default = local React state (`useState`, `useCallback`, `useMemo`, `useRef`) inside a
custom hook per feature. **Zustand** (`create` from `zustand`, e.g. `useAuthStore`) is reserved for
cross-feature global state (auth, notifications). Read state in components via the store hook;
mutate from the **service layer** via `useStore.getState()`. There is no Redux in this codebase.

---

## Data layer

**MANDATORY:** You MUST open and read `../bks-fe-api-integration/SKILL.md` using the `view_file` tool. All implementation details for the data layer, repository, response validation, hook orchestration, 422 error handling, and form wiring must strictly follow `../bks-fe-api-integration/SKILL.md`.

Read `../bks-fe-api-integration/SKILL.md` for:
- Decision matrix (HTTP-only vs Mock-only)
- Repository contract and file structure (interface + `extends BaseRepository` impl + singleton)
- HTTP 200 Fake Error Gotcha (read `status_code` from body, not `res.status`)
- Response validation with a `Backend<X>Schema` Zod guard
- Service-layer orchestration (Zustand store + `sonner` toast) and 422 handling

- Generic CRUD base: `@/infra/api/base-repository.ts` (`BaseRepository`) — inject `IHttpAdapter`
  (the `HttpService` singleton from `@/infra/api/http-service.ts`) and use its protected
  `get`/`post`/`put`/`patch`/`delete` wrappers (each returns the `ResponseData<T>` envelope).
- Shared envelope types live in `@/shared/types/common.ts`: `ResponseData<T>`, `ListResponse<T>`,
  `Future<T>`. Repository methods return **mapped domain types**, not raw envelopes (see `features/auth`).
- Cross-feature helpers live in `@/shared/services/` (e.g. `navigation.service.ts`) and
  `@/shared/utils/` (e.g. `map-backend-errors.ts`).

See `references/project-patterns.md` for the `HttpService` / `BaseRepository` API, the response
envelope, and the hook/service contract. See `references/repository-factory-pattern.md` for the
repository layering (interface + impl + singleton) and `references/mock-repo-patterns.md` for MSW mocks.

### Dates

Format dates via `@/shared/lib/format-date.ts` / `format-datetime.ts` — never raw ISO or
`toLocaleDateString()` in feature code.

---

## Step 1 — Requirements gathering (max 2 rounds)

**Goal:** Enough shared understanding to start. Perfection not required — labeled assumptions are
acceptable. Use `references/q-and-a-template.md` for the prompt template.

### Round 1 — Single message, 5–8 questions ordered by priority

**Must-answer (max 3)** — block implementation if unknown:
- What screens? (list, create, edit, detail?)
- Dialog or routed page for create/edit? (default: **dialog**)
- API ready or mock?

**Should-answer (2–5)** — proceed with defaults if unanswered:
- Business logic (empty state, soft/hard delete, post-create editable?)
- Scope cuts for v1 (filters, roles, exports, bulk actions)
- Data shape (paginated? sort default? nested entities?)
- UX (post-create navigation? confirm before delete?)
- Edge cases (max items? file size limits? long text?)

**Rules:** Ask ALL questions in **one** message. If a doc/API/prior chat already answers something,
state your assumption — don't re-ask. **Simple tier:** 3–5 questions max.

### Round 2 — Only for Complex tier or critical ambiguity

Trigger only if Round 1 left a **must-answer** ambiguous. Max 3 follow-ups. If still unanswered →
labeled assumption, proceed.

### Waivers

User says "skip" / "default" / "your choice" / "just start" / "go ahead" → waive remaining.
Partial answer → confirmed part recorded, rest assumed. **Never ask the same question twice.**

### Plan output (after Q&A, single message, no further questions)

Use `references/templates.md`. Always produce:

1. **Screen breakdown** — per screen: name, route (App Router `page.tsx` path, or "dialog"),
   delivery choice (App Router page in shared shell / `Dialog` from SDK), component map.
2. **Requirements capture** — flow, data mode, screens, API contract (agreed vs TBD), Q&A summary,
   labeled assumptions, out of scope. Per screen: 2–3 Given-When-Then acceptance criteria.
3. **Validation strategy** — i18n (MANDATORY). No hardcoded strings.

**Standard/Complex tier** also produces:

4. **Detailed spec** — form fields (label, control, required, defaults, constraints, API key or TBD),
   table columns (header, property, sort, format), actions (placement, variant, outcome).

Mark unknowns as **"TBD — assumed: [default]"** throughout.

### Readiness check (proceed-by-default)

Proceed when **flow is chosen** AND **≥1 screen is defined**. Everything else can be a labeled
assumption refined later.

| Item                       | Default if unknown                                      |
| -------------------------- | ------------------------------------------------------- |
| Flow (A/B/C/D)             | Infer from user description                             |
| Empty/loading/error states | Project defaults (`Empty`, `Skeleton`, `ErrorBoundary`) |
| Validation                 | i18n (MANDATORY)                                        |
| Form delivery              | Dialog (project default)                                |
| API contract               | TBD → mock repository (or stub HTTP if quick to land)   |
| Permissions                | Admin-only unless specified                             |

---

## Step 2 — Design-system standards

**Two sources to read once per session:**

1. **`../bks-fe-ds-sdk-consumer/SKILL.md`** + its references — **UI/UX authority**. Governs: component
   selection, component size, layout composition, typography, spacing, scroll containers, form field
   composition, upload components, badge/status, filter toolbar, component detection.
2. **`references/design-system-rules.md`** — **Logic-side rules**. Governs: SDK imports, layout shell
   selection, dialog form structure (STRICT), styling prohibitions, validation/i18n, toast policy,
   date formatting, loading/error/empty states, responsive breakpoints, reusable utils.

**No user interaction needed.** Apply both automatically.

### Non-negotiables (logic-side — from `design-system-rules.md`):

- **Pages:** Each route is a Next.js App Router `page.tsx` under a route group (`app/(main)/...`),
  composed inside the shared shell (`shared/components/layout/app-shell.tsx`). Client interactivity
  needs a `"use client"` component.
- **Dialog forms (default delivery):** `Dialog` + `DialogContent` from `@bks/ds-system-sdk` (see
  `features/auth/components/change-password-dialog.tsx`): scrollable body with `custom-scrollbar` +
  `overflow-y-auto`, actions in `DialogFooter`, footer outside the scroll area. Mount the form
  conditionally — `{open && <FeatureForm … />}` — so it remounts on open/close.
- **Styling:** **zero** `shadow-*` in feature code. Component selection / variant / tone rules are
  governed by `bks-fe-ds-sdk-consumer` (the UI/UX authority) — read it before writing UI.
- **Dates:** via `@/shared/lib/format-date.ts` / `format-datetime.ts` — no raw ISO or `toLocaleDateString()`.
- **Validation & strings:** next-intl (MANDATORY) via `useTranslations("<Namespace>")`. Shared keys
  under the `validation` and `action` namespaces; per-feature keys under their own namespace. Add
  keys to **all** of `messages/vi.json`, `en.json`, `ja.json`.
- **Toasts:** `import { toast } from 'sonner'`. Prefer the backend `message` (or an `Api`/feature
  i18n key) over inline strings. Never toast on 422 — those map to inline field errors.
- **Responsive:** Mobile-first; verify 320 / 768 / 1280px.

### Non-negotiables (UI/UX — from `bks-ds-sdk-consumer`):

- **Component selection:** Scan UI intent → map to most specific SDK component.
- **Component size:** `default` unless spec says otherwise.
- **Layout composition:** Identify screen type → hierarchy → gap tokens.
- **Typography:** `.typo-*` for shape, semantic classes for color.
- **Form fields:** `Field` + `FieldLabel` + `FieldContent` composition. `className="gap-1"` on `Field`.
- **Scroll:** `custom-scrollbar` on every overflow container.
- **Buttons:** `variant` prop only; `size` only on icon-only; never `className`.

---

## Step 3 — Feature form

**Deliverables:**

- `features/<feature>/types/<feature>.ts` — `CreateInput` / `UpdateInput` or unified `FormInput`
  aligned to API keys.
- `features/<feature>/schemas/<feature>.schema.ts` — hook (e.g. `useFeatureSchemas`) returning
  `{ schema }` (project default — single schema covers create + edit). Split only when create/edit
  truly diverge. Strategy must match Step 2. **For i18n schemas, read `references/validation-i18n.md`
  first** — the `validation.*` (templates) vs `<feature>.fields.*` (display names) split is strict.
- `features/<feature>/components/<feature>-form.tsx` — extracted component with RO-RO props:
  `defaultValues?: Partial<FormInput>`, `mode: "create" | "edit"`, `isSubmitting`, `onSubmit`,
  `onCancel?`.

**Implementation:**

- `useForm` + `zodResolver(schema)`; `defaultValues` for **every** registered field; `register`
  vs `Controller` per control type.
- Compose: `FieldGroup` → `Field` → `FieldLabel` + `FieldContent` + `FieldError` + `FieldDescription`.
- Errors: destructive border, `aria-invalid`, destructive focus ring. Required marker always destructive/red.
- Submit disabled while submitting; create may reset after success; edit keeps values.
- `useFieldArray`: `key={field.id}`; no bare `watch()` — watch specific fields only.
- A11y: labels + `htmlFor`, `FieldError` semantics, `aria-label` on icon-only controls, keyboard order.

**API Integration & Error Handling:**

**MANDATORY:** You MUST open and read `../bks-fe-api-integration/SKILL.md` using the `view_file` tool and follow it in full for the entire API integration flow:
- Repository patterns: interface `I<Feature>Repository` + impl `extends BaseRepository`, parsing the response with a `Backend<X>Schema` Zod guard before mapping to a domain type.
- Client-side validation using a Zod schema with next-intl `t()` messages.
- Service-layer orchestration (Zustand store + `sonner` toast); hook reads store and delegates to the service.
- 422 Unprocessable Entity mapping via `mapBackendErrors` (re-thrown from the service so the form maps it into RHF `setError`).
- Toast policy: prefer backend `message` / i18n key, no toasts on 422.
- Form component wiring: passing `setError`, lazy `useState` initialization for local states (no `useEffect` + `reset()` sync from `defaultValues` as it erases validation errors).
- Dialog container conditional mounting: `{open && <FeatureForm ... />}`.

Do not implement these manually or inline without reading and applying the `api-integration` skill.

---

## Step 4 — CRUD / list / detail

**List page (Flow B/C):**

- **URL sync:** When filters or pagination should restore on reload / share link / Back-Forward,
  read `../bks-fe-list-url-state/SKILL.md` and drive the list hook from App Router search params
  (`useSearchParams` / `useRouter` from `next/navigation`).
- Render the page as a `page.tsx` under a route group, composed inside the shared shell.
- Filters: debounce free-text; reset button (`variant="outline"`) disabled when filters equal defaults.
- Build the table from SDK primitives; use the SDK `pagination` and `empty` components
  (`@bks/ds-system-sdk`) for paging and empty state. Paginated payloads follow `ListResponse<T>`
  (`@/shared/types/common.ts`).
- Loading: skeleton rows. `spellCheck={false}` for id-like inputs.

**Detail page (Flow D):**

- A `page.tsx` with a back action; custom header renders record identity (name + status badge).
- Tabs / sections for related collections.
- Read-only fields rendered with the `Field` family or extracted display components — no editable
  inputs on the detail page itself.
- Inline edit → open a `Dialog` per section; never inline a form on the page.
- URL query param (`?tab=…`) drives the active tab so deep links work. Per-tab skeleton.
- Header/destructive actions go through the SDK `AlertDialog` — never `window.confirm`.

**Create / edit / delete (Flow C, default delivery = dialog):**

- Standard pattern: `Dialog` + `DialogContent` from `@bks/ds-system-sdk` wrapping the extracted
  `<feature>-form` (reference: `features/auth/components/change-password-dialog.tsx`). Mount the form
  conditionally with `{open && <FeatureForm … />}`.
- Routed form pages only when explicitly requested or when the form is too large for a dialog.
- Destructive actions: SDK `AlertDialog` — no `window.confirm`.
- Toasts: Step 2 policy only.

**Routes and sidebar:**

- Pages are file-system routes: `app/(main)/<feature>/page.tsx` (and `[id]/page.tsx` for detail).
  No central route-registry file; no `React.lazy` (App Router code-splits per route).
- The shared shell lives in `shared/components/layout/app-shell.tsx`; the sidebar is driven by
  `shared/components/menu/sidebar-menu.tsx` off the menu config in `@/shared/types/menu` +
  `@/shared/lib/menu-utils.ts`.
- **Navigation:** use the locale-aware `Link` and `usePathname` from `@/i18n/routing` (next-intl)
  for in-app links, or `useRouter` from `next/navigation` for programmatic navigation. `isActive`
  via `pathname.startsWith("/<feature>")`. Do **not** use `react-router-dom` — it is not installed.

**Smoke test:** Create → row appears → edit → delete; deep-link refresh restores the correct state.

---

## Step 5 — Pre-merge review

### Deviation policy (kill-switch)

A 🟡 rule may be broken if and only if **all four** conditions are met:

1. The deviation is **necessary** — no design-system-compliant alternative exists or works.
2. The deviation is **scoped** — affects exactly one component / file, not a pattern shift.
3. The deviation is **documented in the plan before the change**, with this block:

   ```
   ### Deviation
   - Rule: <e.g. "no shadow-* in feature code">
   - File: <path>
   - Reason: <why the standard fix doesn't work>
   - Approved by: <user / designer / reviewer name from the chat>
   - Reverts on: <condition under which this should be undone, e.g. "DS adds X variant">
   ```

4. A `// DEVIATION: <rule> — see plan` comment sits on the offending line so the next reviewer
   doesn't blindly "fix" it.

🔴 Blockers and the design-system "STRICT" rules in `references/design-system-rules.md`
(layout shells, dialog scrolling, button compliance, date formatting) are **not** waivable through
this policy — they require a SKILL.md update, not a per-feature deviation.

If the user explicitly says "skip the rule" mid-conversation: still record it as a deviation with
"Approved by: user (chat)" so the audit trail survives.

### Checklist (severity-tagged)

#### 🔴 Blockers (must fix — block merge)

- [ ] **Lint:** `cd frontend && pnpm lint` — zero errors
- [ ] **Build:** `cd frontend && pnpm build` (skip if dev-server only) — zero errors
- [ ] **Runtime sanity:** Page mounts without console errors; routes load without 404
- [ ] **Deep-link refresh:** Direct URL navigation works for all routes

#### 🟡 Required (must fix — design / architecture violations)

- [ ] **Layout:** Feature UI inside existing shells; no unrelated `shared/layouts/` edits
- [ ] **Design system:** Compose from `@bks/ds-system-sdk` (and `shared/components/*`); component
      selection / variant / tone per `bks-fe-ds-sdk-consumer`; **zero** `shadow-*` in feature code
  - Auto-check: `rg 'shadow-' frontend/features/<name>`
- [ ] **Dialog form (if any):** scrollable body (`custom-scrollbar` + `overflow-y-auto`); all actions
      inside `DialogFooter`; footer outside the scroll area; form mounted with `{open && …}`
- [ ] **Date formatting:** All dates via `@/shared/lib/format-date.ts` / `format-datetime.ts` — no
      raw ISO or `toLocaleDateString()`
  - Auto-check: `rg 'toLocaleDateString|toISOString' frontend/features/<name>`
- [ ] **Navigation:** `Link` / `usePathname` from `@/i18n/routing` or `useRouter` from
      `next/navigation`; **no `react-router-dom`**
  - Auto-check: `rg 'react-router' frontend/features/<name>` — must be empty
- [ ] **Form (if any):** Separate component, RO-RO props, schema hook, i18n validation strategy,
      Field family, `setError` for API errors, no bare `watch()`, field-array keys
- [ ] **API Integration:** All checklist items from `../bks-fe-api-integration/SKILL.md` §5 Checklist must pass (Repository patterns, HTTP 200 fake-error guard, Zod response schema, 422 mapping, Toast policy, Form component wiring).
- [ ] **List (if any):** App Router `page.tsx` + filters + debounced search, SDK table + `empty`,
      SDK `pagination`, sidebar `startsWith`, `ListResponse<T>` payload shape
- [ ] **i18n:** All user-visible strings via next-intl `t()` (`useTranslations`); MANDATORY; split by
      feature namespace; use the `action` namespace for shared actions and `validation` for shared
      templates (interpolation `{field}` / `{min}` / `{max}`).
      **Strict Rules:** keys present in **all three** of `vi.json`, `en.json`, `ja.json`; no
      redundant/duplicate keys (use shared roots); no unused keys. Perfect synchronization required.
- [ ] **Reusable utils:** Helper used 2+ places extracted to util; pure, typed, one concern per file
- [ ] **State:** Local hooks default; **Zustand** only for cross-feature global state (mutated from
      the service layer via `useStore.getState()`)
- [ ] **Plan-vs-code drift:** Final code matches plan (screens, routes, actions, API keys). If
      drifted → update the plan **before** shipping.

#### 🟢 Recommended (fix when feasible)

- [ ] **Clean code:** Small focused components (<40 lines render), single responsibility, no dead code
- [ ] **Responsive:** 320 / 768 / 1280 verified
- [ ] **Accessibility:** Keyboard navigation, focus visible, `aria-label` on icon-only controls
- [ ] **E2E smoke (Standard/Complex):** Playwright happy-path test for the primary flow
- [ ] **Performance (Complex tier or list >100 rows):** memo, code-split, virtualization
- [ ] **Code review:** Apply `../bks-code-review/SKILL.md` checklist to changed files

### Done definition

A feature is **done** when:

1. All 🔴 Blockers pass
2. All 🟡 Required pass (or have a documented deviation in the plan — see "Deviation policy" above)
3. ≥80 % of 🟢 Recommended pass (≥5/6 with the current list — or have a documented reason)
4. Plan reflects what was actually shipped (no drift)

---

## Step 6 — Task status update

> [!IMPORTANT]
> **Only perform this step if the work was initiated from a task file in `docs/tasks/`** (PM-driven, referenced via `@`). For ad-hoc feature requests with no task file, skip it.

After the Done definition is satisfied:

1. Open the task file provided at the start of the session (e.g. `docs/tasks/<batch>/<nn>-<feature>.md`).
2. Tick **every** completed checklist item from `[ ]` to `[x]`.
3. Update the YAML frontmatter: set `status: completed`.
4. If the task belongs to a parent index file (e.g. `docs/tasks/<batch>-implementation-tasks.md`):
   - Change the task row's status icon to `✅ Completed`.
   - Update the **Progress Summary** counts.
5. Leave a one-line note of any documented deviation (from the Step 5 kill-switch) so the task record matches what shipped.

If conversation was interrupted or context was reset:

1. **Locate the plan first.** Look in: current chat thread, `docs/tasks/<feature>.md` (PM-driven —
   only if the task explicitly references the file via `@`), or the most recent commit message body.
2. **Inventory existing files:** `ls features/<feature>/` — categorize by type (`types/`,
   `schemas/`, `components/`, `pages/`, `hooks/`).
3. **Infer current step:**
   - Nothing → Step 1–2.
   - Types/schemas only → past Step 2, mid Step 3.
   - Form component exists → past Step 3.
   - List / detail page exists → past Step 4.
   - All exist → enter Step 5.
4. **Detect drift:** Compare files against the plan. If a file contradicts the plan, ask the user:
   (a) update plan, (b) refactor file, or (c) skip.
5. **Health check:** `cd frontend && pnpm lint` (scoped if possible). Note pre-existing errors
   **before** adding more.
6. **Don't re-ask answered questions.** If a plan exists, use it. If files exist, they are decided answers.
7. **State current state explicitly.** Output: "Resuming at Step N. Existing files: [...].
   Drift: [none|listed]. Lint: [clean|N pre-existing errors]." Then proceed.
