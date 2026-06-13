# Reference 09: API Feature Implementation Workflow

> **Scope**: Step-by-step workflow for implementing any new API feature (CRUD or custom).

---

## Step 1: Resource & Constants Setup

1. **Migration**: Create table with necessary columns.
2. **Model**: Define `$fillable`, `HasFactory`, and docblocks. Add **Query Scopes**.
3. **Enums**: Create and implement Enums if the feature has statuses or types.

---

## Step 2: Table Service (If List Endpoint exists)

Create the `TableService` class. Implement `makeNewQuery()` and map `$searchables/$filterables/$orderables`.

See: [05-table-services.md](./05-table-services.md)

---

## Step 3: Validation Layer

Create `FormRequest` classes in `app/Http/Requests/{Module}/` (e.g., `CreateRequest`, `UpdateRequest`).

- Every field MUST follow the **3-Layer Rule** (Presence + Type + Boundary)
- Implement FK validation with soft-delete awareness
- Implement unique rules correctly for create vs update
- Ensure all limits reference `config/validate.php`
- Localize attributes in the `attributes()` method

**Verify**: Run through the **Validation Audit Checklist** before proceeding.

See: [03-validation.md](./03-validation.md)

---

## Step 4: DTO Layer (MANDATORY)

1. Create a `final readonly` DTO in `app/DTOs/Api/{Module}/{Action}Data.php`
2. The DTO MUST have a static `::from(array $data): self` factory method
3. The corresponding Service method MUST accept the DTO as its parameter

See: [04-services.md](./04-services.md)

---

## Step 5: Service Layer & Business Logic

1. Create the **Api Service** in `app/Services/Api/{Module}Service.php`
2. Implement methods accepting the typed DTO. Use **Manual Transactions** for multi-query mutations
3. **Common Services**: If logic is shared, relocate it to `app/Services/Common/`
4. **Queueing (If needed)**: If logic is long-running, follow the Background Job Handover Protocol

See: [04-services.md](./04-services.md), [06-background-jobs.md](./06-background-jobs.md)

---

## Step 5a: Smoke-Test the Service (MANDATORY)

> [!IMPORTANT]
> **This is a SMOKE test, not the full suite.** Write it NOW, right after the Service is implemented, to confirm the code you just wrote actually runs (happy path). Full, objective coverage is done later by `bks-be-testing-standard` (report-only). See "Smoke Test vs Acceptance Test" in SKILL.md.

| Condition | Smoke test |
|---|---|
| Service has no 3rd-party calls, no OAuth, no SSO | ✅ Cover happy path via the Feature smoke test in Step 7a (skip a separate Unit smoke here) |
| Service calls 3rd-party APIs, SSO tokens, or has >3 branches | ✅ Write a Unit smoke test NOW: happy path of each key method |

**Run**: `php artisan test --filter={Feature}ServiceSmokeTest`.

> [!CAUTION]
> **If the smoke test FAILS → fix the code NOW.** You just wrote this code, so a failure means the code is buggy — fix it until the happy path passes before moving on. (This is the core difference from `bks-be-testing-standard`: there the tests are written later, objectively, and **must not auto-fix**.)

---

## Step 6: Factory Registration (MANDATORY)

Register the new Service in `ApiFactory`. Register TableService using `$app->bind()` (transient).

See: [04-services.md](./04-services.md)

---

## Step 7: Controller & Routing

1. Create the **Thin Controller** inheriting from the guard base. Implement orchestrator methods.
2. Register routes in the corresponding file (e.g., `routes/api.php`).

See: [02-controllers.md](./02-controllers.md)

---

## Step 7a: Smoke-Test the Endpoint (MANDATORY)

> [!IMPORTANT]
> **Smoke test only — confirm the endpoint wiring runs end-to-end.** A few high-signal cases are enough here; the exhaustive, requirement-derived suite (EP/BVA/Validation Matrix/security…) is `bks-be-testing-standard`'s job and is **report-only**.

Smoke cases (minimal):
1. Happy path (correct status + JSON shape)
2. Unauthenticated (401)
3. One obvious validation error (422)

Write to `tests/Feature/Api/{Module}/{Resource}{Action}SmokeTest.php`.

**Run**: `php artisan test --filter={Feature}SmokeTest`.

> [!CAUTION]
> **If the smoke test FAILS → fix the code NOW** (the route/controller/service you just wrote is buggy). Fix until the 3 cases above are green before moving on. When `bks-be-testing-standard` later writes the full `{Action}Test.php`, **delete the matching `*SmokeTest.php`** to avoid duplication.

---

## Step 8: Data Transformation

1. Create **JsonResources** (Single & Collection) in `app/Http/Resources/{Module}/`
2. Implement relationship safety with `whenLoaded()` and explicit type casting
3. Follow field formatting rules for dates, files, and enums

See: [07-resources.md](./07-resources.md)

---

## Step 9: API & Logic Documentation (MANDATORY)

> [!IMPORTANT]
> **Perform this step only AFTER all tests are passing.**

1. Update **Scramble** annotations in Controllers and Resources
2. **API Reference**: Create/Update manual API documentation in `docs/api/modules/{domain}.md`
3. **Logic Documentation**: Create/Update business logic doc in `docs/logic/{module}/{feature}.md` **and bump version**
4. **BR Registry**: Update `docs/system/br-registry.md` with any new Business Rules
5. **Export**: Run `php artisan scramble:export` to ensure `api.json` is in sync

See: [08-documentation.md](./08-documentation.md)

---

## Step 10: Final Audit & Polish

1. **Logging Check**: Verify all Service mutations have `Log::info()` calls
2. **Logic Doc Verification**: Ensure code matches the `FLOW` and `RULES` in the Logic Doc
3. **Config Check**: Ensure no `env()` calls exist
4. **Formatting**: Run `php artisan code:format`
5. **Analyze**: Run `php artisan scramble:analyze`
6. **Validate Structure**: Run `php .agents/scripts/validate-backend.php backend/app/Modules/{ModuleName}` to verify API structure compliance
7. **Full Test Suite**: Run `php artisan test --filter={Module}` — all tests MUST pass

---

## Step 11: Task Completion

> [!IMPORTANT]
> **Only perform this step if the work was initiated from a task file in `docs/tasks/`.**

After all previous steps are verified and passing:

1. Open the task file that was provided at the start of this session
2. Mark **all checklist items** as `[x]` that have been completed
3. Update the YAML frontmatter: set `status: completed`
4. If this task is part of a task index file, update the index:
   - Change the task row's status icon to `✅ Completed`
   - Update the **Progress Summary** counts
5. If this task is delegated from a **COORDINATION task**, update the Delegation Map to `✅ Completed`
