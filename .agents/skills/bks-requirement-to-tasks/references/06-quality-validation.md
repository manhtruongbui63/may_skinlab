# Quality Standards & Validation

This document defines the quality checklist and post-generation validation process.

---

## Quality Checklist

Before presenting tasks to the user, verify:

### Completeness

- [ ] **Every processing flow** from the requirement has at least one task covering it.
- [ ] **Every API endpoint** from the requirement's API ENDPOINT INVENTORY is assigned to a task.
- [ ] **Every database change** from DATA MODEL UPDATES is covered in a foundation task.
- [ ] **Every enum** is defined in the foundation task with:
  - Full integer value list (starting at 1)
  - `tinyInteger/smallInteger` migration type
  - Mandatory `label()` method implementation
- [ ] **API responses** for enum fields include both the raw integer value and the localized label.
- [ ] **Every notification** from the NOTIFICATIONS section has a task.
- [ ] **Every background job** has a task.
- [ ] **Master Data Registration**: If the requirement introduces new enums, lookup tables, or trees, a **separate task** exists (Phase 1, `bks-be-master-data-standard`).
- [ ] **Testing** and **Documentation** tasks exist.

### Task Quality

- [ ] Every task has **YAML frontmatter** with all required fields.
- [ ] Every task declares its **type** (IMPLEMENTATION / COORDINATION / DOCUMENTATION).
- [ ] **MANDATORY: Every IMPLEMENTATION task maps to exactly ONE workflow + ONE skill.** A task referencing both `/execute-api-task` AND `/execute-job-task` is invalid — split it.
- [ ] **MANDATORY: No task mixes API code and Job code.** If a feature requires both, two separate tasks exist (Job task in Phase 2a, API task in Phase 2b).
- [ ] **MANDATORY: Job tasks that a feature depends on MUST appear before the API task** in the dependency graph and execution order.
- [ ] Every task has **Acceptance Criteria** with testable conditions.
- [ ] Every task has **Error Scenarios** mapped from the requirement.
- [ ] Every task has **Dependencies** explicitly listed.
- [ ] **MANDATORY**: Every task references **Applicable Workflows** and **Applicable Skills** correctly.
- [ ] Every COORDINATION task has a **Delegation Map**.
- [ ] Every IMPLEMENTATION task with testable code has **Testing Hints**.
- [ ] **MANDATORY: Every backend IMPLEMENTATION task** (Phases 1, 2a, 2b, backend tests) has `php .agents/scripts/validate-backend.php backend` in its Status checklist, placed right before the test command. (Omit for FE-only and DOCUMENTATION tasks.)
- [ ] **WHAT, not HOW**: No task contains route definitions, `->middleware(...)` / middleware-placement instructions, controller/service class bodies, or factory-registration code. Auth is stated as a *semantic requirement* and all structure/wiring is delegated to the referenced execution skill. (This is the #1 source of off-convention output — e.g. middleware written into routes instead of the controller `__construct`.)
- [ ] **Correct file placement (per-layer, not per-feature)**: Every file path matches the layer's real convention — services & controllers **flat** in `app/Services/Api/` & `app/Http/Controllers/Api/` (filename carries the module, e.g. `UserService.php`); DTOs/FormRequests/Resources **grouped by module**. No task invents a `app/Services/Api/{Feature}/…` or any per-feature folder to bundle a feature's files. Paths mirror existing siblings / `bks-be-api-standard`.
- [ ] No task spans more than one major functional boundary.
- [ ] No task exceeds the **size guideline** (BE: >2000 words; **FE: >~1200 words or effort L/XL** → split).
- [ ] **Backend budget respected**: Every backend IMPLEMENTATION task is within the budget (**≤8 files created/modified; ≤5 endpoints; one flow/module/foundation layer**). **No backend task is XL**; any `L` backend task carries a one-line justification in its Description for why it can't be split smaller. Size by **files × conventions** first, words second.

### Frontend (if the feature has UI)

- [ ] **Screen coverage**: Every screen/dialog from the requirement's §9.2 Screen & Route Inventory is covered by at least one task.
- [ ] **Screen × Layer split**: FE work is decomposed into 3a Data / 3b Components / 3c Integration / 3d Tests — not one "build the feature" task.
- [ ] **FE budget respected**: Every FE task is **S/M effort** and within the budget (**≤4 components OR ≤2 hooks/repositories OR 1 page-integration; ≤3 endpoints; ≤~1200 words**). No L/XL FE task exists.
- [ ] **Correct skills**: Each FE task references `bks-fe-implement-feature` + the layer-specific sister (`bks-fe-api-integration` for 3a, `bks-fe-ds-sdk-consumer` for 3b, `bks-fe-list-url-state` for list integration, `bks-fe-create-tc-component`/`bks-fe-create-tc-flow` for 3d).
- [ ] **Screen ID linkage**: Each FE task names the screen ID(s) from §9.2 it implements.
- [ ] **No FE-BR**: FE tasks reference shared `BR-*` (not a frontend-only rule registry); pure UI/UX behavior is `UI-*`.
- [ ] **i18n**: Every FE task lists its `messages/` namespace; no hardcoded user-facing strings.
- [ ] **Data-before-integration**: 3c integration tasks `depends_on` the 3a data task for the same screen.
- [ ] **WHAT, not HOW (FE)**: No FE task contains JSX/component code, `fetch`/`axios`/`useForm`/`useState` wiring, styling/CSS, the repository-adapter body, or `mapBackendErrors`/URL-sync/toast code. It carries only types, Zod field tables, repo/hook **signatures**, the API contract, UI states, `UI-*` interactions, and the i18n namespace — code is delegated to the `bks-fe-*` skills.

### Traceability

- [ ] Every `BR-*` from the requirement is referenced by at least one task.
- [ ] Every `BR-*` in requirement/task files is resolvable in `docs/system/br-registry.md`.
- [ ] Every task has `rule_refs` in frontmatter and each entry is valid.
- [ ] No `PROPOSED_BR:{slug}` remains in finalized logic docs (`docs/logic/`).
- [ ] The Mermaid dependency graph has no circular dependencies.
- [ ] The execution order respects all dependencies.

### Index File

- [ ] Progress Summary section exists with correct counts.
- [ ] Task table includes Type and Effort columns.
- [ ] Mermaid dependency graph is present and valid.

---

## Post-Generation Validation

> [!IMPORTANT]
> **MANDATORY**: Run this validation before presenting tasks to the user.

### Validation Steps

1. **Coverage Verification**
   - Cross-check every section of the requirement (Flows, Data Model, API Endpoints, Notifications, Business Rules) against the generated tasks.
   - Every item must be assigned to at least one task.

2. **Dependency Integrity**
   - Verify no circular dependencies in the Mermaid graph.
   - Verify execution order respects all dependencies.

3. **Standalone Check**
   - Can a developer implement each IMPLEMENTATION task by reading ONLY the task file + the referenced requirement? (Answer must be YES.)

4. **Delegation Check**
   - For every COORDINATION task, verify that every delegated sub-requirement is actually covered by the target IMPLEMENTATION task.

5. **Workflow & Skill Alignment**
   - Verify each task references the correct project workflows and/or skills.
   - Implementation tasks MUST have at least one.

6. **BR Resolution Check**
   - Verify every `BR-*` in task bodies/frontmatter is registered in `docs/system/br-registry.md` (except temporary `PROPOSED_BR:{slug}` in requirement/task stage).

7. **Frontmatter Check**
   - Verify every task file has valid YAML frontmatter with all required fields, including `rule_refs`.

8. **Enum Standards Check**
   - Verify every enum has:
     - Integer backing starting at 1
     - `tinyInteger` or `smallInteger` migration type
     - `label()` method implementation
     - API response includes both value and label

9. **DTO Check**
   - Verify every service method accepting structured input uses a DTO.
   - Verify DTOs are defined in the correct location: `app/DTOs/{Layer}/{Module}/{Action}Data.php`

10. **Factory Check**
    - Verify no new factory files are proposed.
    - Verify service registration uses existing `ApiFactory`, `BackgroundFactory`, or `CommonFactory`.

11. **Backend Budget Check**
    - Verify each backend IMPLEMENTATION task is within budget: **≤8 files created/modified, ≤5 endpoints, one flow/module/foundation layer**.
    - Verify **no backend task is XL**; for any `L` backend task confirm a one-line justification is present. Split anything that exceeds a cap (by CRUD operation, sub-flow, or by extracting foundation/job/notification).

12. **Frontend Budget Check** (if the feature has UI)
    - Verify every screen in §9.2 has tasks, split by Screen × Layer (3a/3b/3c/3d).
    - Verify no FE task is L/XL or exceeds the budget (≤4 components OR ≤2 hooks OR 1 page-integration; ≤3 endpoints; ≤~1200 words). Split any that do.
    - Verify FE tasks reference the correct `bks-fe-*` skill(s) and the screen ID(s) they implement.

13. **Backend Validation-Script Check**
    - Verify every backend IMPLEMENTATION task's Status checklist contains `php .agents/scripts/validate-backend.php backend`, positioned right before the test command.
    - This is the structural-convention gate implementors most often forget — no backend task may ship without it.

### If Validation Fails

If any check fails:
1. Fix the issues before presenting to user.
2. Re-run the validation.
3. Only present when all checks pass.

---

## Common Validation Failures

| Failure | Fix |
|---|---|
| Task mixes API and Job code | Split into two tasks; Job task in Phase 2a, API task in Phase 2b |
| COORDINATION task missing Delegation Map | Add Delegation Map with all sub-requirements delegated |
| IMPLEMENTATION task missing workflow/skill | Add the applicable workflow and skill to Context block |
| `BR-*` not in registry | Register in `docs/system/br-registry.md` or use `PROPOSED_BR:{slug}` |
| Circular dependency in Mermaid | Reorganize task dependencies |
| Enum missing `label()` method | Add label method requirement to task |
| Service uses `array` instead of DTO | Update to use `final readonly` DTO |
| New factory file proposed | Change to register in existing factory |
| Backend task is XL (or L with no justification) | Split by CRUD operation / sub-flow, or extract the foundation (Phase 1) / job (Phase 2a) / notification; `L` only for a genuine single-flow/foundation task **with** a one-line justification |
| Backend task >8 files or >5 endpoints | Split by operation or sub-flow; pull shared foundation into its own Phase 1 task |
| FE task is L/XL or "build whole feature" | Split by Screen × Layer (3a/3b/3c/3d) until each is S/M within budget |
| FE task mixes data + components + page | Split into 3a Data, 3b Components, 3c Integration |
| FE task >4 components or >3 endpoints | Split by component subtree or by CRUD operation |
| FE task invents a frontend-only rule | Reference shared `BR-*`; reclassify pure UX as `UI-*` |
| Backend task missing `validate-backend.php` in Status | Add `php .agents/scripts/validate-backend.php backend` right before the test command |
| Task writes routes / `->middleware(...)` / controller body (prescribes HOW) | Delete the wiring code; state auth as a semantic requirement and delegate placement to the execution skill (`bks-be-api-standard`) |
| FE task writes JSX / `fetch`/`axios` / `useForm` / styling (prescribes HOW) | Delete the code; keep types, Zod field table, repo/hook signatures, API contract, UI states; delegate to the `bks-fe-*` skills |
| Task bundles a feature's files under `app/Services/Api/{Feature}/…` (per-feature folder) | Use the per-layer convention: services/controllers flat (`{Name}Service.php`), DTOs/Requests/Resources grouped by module; mirror existing siblings |
