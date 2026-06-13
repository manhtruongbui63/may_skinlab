---
description: Execute a single API task from a docs/tasks/ directory following project standards and the bks-be-api-standard skill. Provide the task file path as input.
---

# Execute API Task Workflow

This workflow is specialized for implementing backend API features defined in `docs/tasks/`. It enforces strict adherence to the **bks-be-api-standard** skill.

> [!IMPORTANT]
> **Mandatory Skill Loading**: Before starting any phase, you MUST read the `bks-be-api-standard` skill using the `view_file` tool on `.agents/skills/bks-be-api-standard/SKILL.md`.

---

## Phase 1: Task & Context Audit

1. **Read Task**: Load the specified task file (e.g., `docs/tasks/.../task-xx-feature.md`).
2. **Identify Scope**: Determine the target module (e.g., User) and the core entity.
3. **Check Dependencies**: Verify that all `depends_on` tasks are marked as completed.
4. **Load Standards**: **MANDATORY**: View `bks-be-api-standard/SKILL.md`. You MUST NOT proceed until you have digested the 13 sections of the skill.

---

## Phase 2: Technical Design & Planning

1. **Map Requirements**: Align the task's "Description" and "Logic" sections with the implementation workflow (Section 13 of the skill).
2. **Implementation Plan**:
    - **MANDATORY**: Create an `implementation_plan.md` artifact.
    - Detail the changes for Models, Enums, TableServices, Requests, Services, Factories, Controllers, and Resources.
    - **STOP AND WAIT**: Do not write code until the user approves the plan.

---

## Phase 3: Step-by-Step Implementation

Follow Section 13 of the `bks-be-api-standard` skill EXACTLY:

1. **[Step 1] Resource Setup**: Migration, Model (Docblocks!), Enums (if needed).
2. **[Step 2] Table Service**: If a list endpoint is required, implement the `TableService` with appropriate scoping.
3. **[Step 3] Validation**: Create localized `FormRequest` classes.
4. **[Step 4] Service Logic**: Implement business logic with **Manual Transactions** and **Mandatory Logging**.
5. **[Step 5] Factory**: Register the Service and TableService in the correct Factory.
6. **[Step 6] Controller**: Build a **Thin Controller** calling the Service via Factory.
7. **[Step 7] Routing**: Register routes in the guard-specific route file.
8. **[Step 8] Resources**: Implement `JsonResource` and `ResourceCollection` with relationship safety (`whenLoaded`).
9. **[Step 9] Documentation Prep**: Prepare the manual API Reference data and Scramble annotations.

---

## Phase 4: Documentation & Audit

1. **Triple Documentation**:
    - **Scramble**: Update PHP Docblocks and Attributes in Controllers and Requests (use `#[QueryParameter]`, `@unauthenticated`, etc.).
    - **API Reference**: **MANDATORY**: Create or update the manual API documentation in `docs/api/modules/{module}/{feature}.md`.
    - **Logic Document**: Create or update the Business Logic Documentation in `docs/logic/{module}/{feature}.md` following the Mandatory Logic Doc Format.
2. **Audit & Format**:
    - [ ] Documentation reflects final code exactly.
    - [ ] `php artisan scramble:analyze` - Run this to verify API schemas and documentation completeness.
    - [ ] No `env()` calls in new code.
    - [ ] Manual transactions used in services.
    - [ ] Service mutations logged successfully.
    - [ ] Run `php artisan code:format`.
    - [ ] Run `php .agents/skills/bks-be-api-standard/scripts/validate-api-structure.php app/Modules/{ModuleName}` to verify API structure compliance.
    - [ ] Run `php artisan test --filter={Module}` — all tests MUST pass.

---

## Phase 5: Task Status Update

1. **Mark Checklist**: Update the "Status" block in the task file, ticking off completed items.
2. **Mark Completed**: Change the task's frontmatter `status` to `completed`.
3. **Cleanup**: Create a `walkthrough.md` summarizing the implementation.
