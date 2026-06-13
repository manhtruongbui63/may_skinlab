# Implementation Workflow for Database Tasks

Complete step-by-step workflow for implementing database infrastructure changes.

---

## Step 1: Preparation

Analyze the requirement and plan the database structure.

---

## Step 2: DDL Stage

Create Migrations. Verify with rollback:

```bash
php artisan migrate
php artisan migrate:rollback
```

---

## Step 3: Infrastructure Stage

Create Enums, Models (with Scopes and Traits), and register casts. Ensure Docblocks are exhaustive.

See:
- [Migrations](01-migrations.md) - Database design
- [Models](02-models.md) - Eloquent configuration
- [Enums](03-enums.md) - Type-safe enums

---

## Step 4: Data Stage

Create Factories (Realistic using `fake()->realText()`) and Seeders (Realistic).

See [Factories & Seeders](04-factories-seeders.md).

---

## Step 5: Integration Stage

Register Seeder in the relevant `ModuleSeeder` and `DataSampleSeeder`.

---

## Step 6: Final Audit

- Run `php artisan code:format`
- Run `php .agents/scripts/validate-backend.php backend` to verify database structure compliance
- Run `php artisan test --filter={ModuleOrFeature}` — all tests MUST pass
- Verify the whole stack via `php artisan migrate:fresh --seed`
- Ensure no FQN or `env()` calls exist

---

## Step 7: Logic Documentation (MANDATORY POST-IMPLEMENTATION)

Create/Update Business Logic Documentation and **bump its version (minor/major)** in `docs/logic/{module}/{feature}.md` following the [Business Logic Documentation Standards](05-logic-documentation.md) based on the final code.

---

## Step 8: BR Registry Update

**MANDATORY**: If new Business Rules (`BR-*`) were introduced or existing ones updated, you MUST update `docs/system/br-registry.md` to reflect these changes.

---

## Step 9: Task Completion (If applicable)

> [!IMPORTANT]
> **Only perform this step if the work was initiated from a task file in `docs/tasks/`.**

After all previous steps are verified and passing:

1. Open the task file provided at the start of this session
2. Mark **all checklist items** as `[x]` that have been completed
3. Update the YAML frontmatter: set `status: completed`
4. If this task is part of a task index file (`docs/tasks/{date}-{feature}-implementation-tasks.md`):
   - Change the task row's status icon from `🔄 In Progress` (or `⏳ Pending`) to `✅ Completed`
   - Update the **Progress Summary** counts
5. If this task is delegated from a **COORDINATION task**, open the COORDINATION task file and update the relevant row in its **Delegation Map** to `✅ Completed`

---

## Final Completion Checklist (MANDATORY)

**AI Agent MUST verify this checklist before ending the session:**

- [ ] **Code Quality**: `php artisan code:format` has been run
- [ ] **Migrations**: All migrations have been tested with `migrate:rollback`
- [ ] **Logic Docs**: Business logic docs in `docs/logic/` are created/updated to match the final implementation
- [ ] **BR Registry**: `docs/system/br-registry.md` has been updated with all new or modified business rules
- [ ] **Task Update**: The task file and index file statuses are updated to `completed`

---

## Global Coding Standards

Apply these standards to ALL database-related code:

| Rule | Requirement |
|------|-------------|
| **No FQN** | NEVER use inline class paths (e.g., `\App\Models\User`). ALWAYS use `use` statements at the top. This includes Root namespace classes like `\Exception` or `\Eloquent` |
| **Localization** | Use `trans()` for any string presented in Seeders or Enum labels |
| **SQL Injection Prevention** | Never interpolate variables into RAW statements. ALWAYS use parameterized bindings (e.g., `whereRaw("name = ?", [$name])`) |
| **No `env()`** | NEVER call `env()` directly. Configuration MUST be defined in `config/*.php` and accessed via `config()` |
| **Mass Assignment** | ALWAYS define `protected $fillable = [...];` in Models. NEVER use `$guarded` |
| **Type Safety** | Avoid using `mixed` types. ALWAYS use explicit types for properties, method parameters, and return values |
| **Naming** | Use `PascalCase` for Class/Enum/Model names and `camelCase` for methods/variables |

---

## Related

- [Migrations](01-migrations.md) - DDL standards
- [Models](02-models.md) - Eloquent standards
- [Enums](03-enums.md) - Enum implementation
- [Factories & Seeders](04-factories-seeders.md) - DML patterns
