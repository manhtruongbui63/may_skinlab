---
description: Execute a database infrastructure task (Migrations, Models, Enums, Factories, Seeders) from a docs/tasks/ directory following the bks-be-database-standard.
---

# Execute Database Task Workflow

This workflow is specialized for implementing the project's foundation layer (Phase 1) as defined in `docs/tasks/`. It enforces strict adherence to the **bks-be-database-standard** skill.

> [!IMPORTANT]
> **Mandatory Skill Loading**: Before starting any phase, you MUST read the `bks-be-database-standard` skill using the `view_file` tool on `.agents/skills/bks-be-database-standard/SKILL.md`.

---

## Phase 1: Task & Context Audit

1. **Read Task**: Load the specified task file.
2. **Identify Scope**: Determine affected tables, enums, and models.
3. **Check Dependencies**: Verify that all `depends_on` tasks (e.g., initial infra) are completed.
4. **Load Standards**: **MANDATORY**: View `bks-be-database-standard/SKILL.md`. You MUST NOT proceed until you have digested all sections.

---

## Phase 2: Technical Design & Planning

1. **Schema Design**: Map the task's data model requirements to migration steps.
2. **Implementation Plan**:
    - **MANDATORY**: Create an `implementation_plan.md` artifact.
    - Detail the changes for Migrations, Models, Enums, Factories, and Seeders.
    - **STOP AND WAIT**: Do not write code until the user approves the plan.

---

## Phase 3: Infrastructure Implementation (DDL & Models)

Follow Section 8 of the `bks-be-database-standard` skill:

1. **[Step 1] Migrations**: Generate and define migrations with correct index logic.
2. **[Step 2] Rollback Check**: Run `php artisan migrate:rollback` and then `php artisan migrate` to verify the logic.
3. **[Step 3] Enums**: Create required Backed Enums with labels and traits.
4. **[Step 4] Models**: Implement Model classes with full Docblocks, `$fillable`, `casts`, and Scopes.

---

## Phase 4: Mock Data & Seeding (DML)

1. **[Step 1] Factories**: Create realistic factories using localized fake data.
2. **[Step 2] Seeders**: Create individual seeders.
3. **[Step 3] Module Linking**: Register new seeders in their corresponding `ModuleSeeder` and `DataSampleSeeder`.

---

## Phase 5: Verification & Audit

1. **Full Refresh**: Run `php artisan migrate:fresh --seed` to verify the entire stack.
2. **Audit Checklist**:
    - [ ] No `env()` calls.
    - [ ] Models have full Docblocks and `HasFactory` trait.
    - [ ] Migrations have working `down()` methods.
    - [ ] Seeders generate diverse data.
    - [ ] Run `php artisan code:format`.
    - [ ] Run `php .agents/skills/bks-be-database-standard/scripts/validate-database-structure.php backend` to verify database structure compliance.
    - [ ] Run `php artisan test --filter={ModuleOrFeature}` — all tests MUST pass.

---

## Phase 6: Task Status Update

1. **Mark Checklist**: Update the "Status" block in the task file.
2. **Mark Completed**: Change the task frontmatter to `status: completed`.
3. **Cleanup**: Create a `walkthrough.md` summarizing the changes.
