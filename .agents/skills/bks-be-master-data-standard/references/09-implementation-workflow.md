# Implementation Workflow

## Phase 1: Task & Context Audit

1. Read the task file.
2. Identify which resources need to be registered (names, drivers, targets).
3. Check that all `depends_on` tasks are completed.
4. **MANDATORY**: Read this entire SKILL.md before proceeding.

---

## Phase 2: Technical Design & Planning

1. For each resource, determine: name, driver, target, and configuration options.
2. **MANDATORY**: Create an `implementation_plan.md` artifact.
3. Note which resources need custom methods and plan their logic.
4. **STOP AND WAIT** for user approval before writing code.

---

## Phase 3: Step-by-Step Implementation

1. Register resources in `$availableResources` (Section 1–5 above).
2. Implement custom driver methods if needed (Section 3.D).
3. Add test cases in `MasterDataTest.php` (Section 7).

---

## Phase 4: Documentation & Audit

1. Update `docs/logic/user/master-data.md` (Section 6.1).
2. Update `docs/api/modules/master-data.md` (Section 6.2).
3. Audit: snake_case names, `select` on Eloquent, no side effects, tests pass.
4. Run `php artisan code:format`.

---

## Phase 5: Task Status Update

1. Update the task file checklist and set `status: completed`.
2. Create a `walkthrough.md` summarizing the implementation.

---

## Final Completion Checklist

**AI Agent MUST verify this checklist before ending the session:**

- [ ] **Code Quality**: `php artisan code:format` has been run.
- [ ] **Resource Registration**: All resources from the task are registered in `$availableResources`.
- [ ] **Driver Configuration**: Each resource uses the correct driver with appropriate options (`select`, `where`, `order`, `auth`).
- [ ] **Custom Methods**: Custom driver methods return raw arrays/collections (no `JsonResource`).
- [ ] **No Side Effects**: No observers or side effects are triggered during data retrieval.
- [ ] **Tests**: All new test cases in `MasterDataTest.php` pass.
- [ ] **Logic Docs**: `docs/logic/user/master-data.md` updated with new resources in AVAILABLE RESOURCES table.
- [ ] **BR Registry**: `docs/system/br-registry.md` has been updated with all new or modified business rules.
- [ ] **API Docs**: `docs/api/modules/master-data.md` updated with query format and response shape for each new resource.
- [ ] **Task Status**: Task file checklist completed and frontmatter `status` set to `completed`.
