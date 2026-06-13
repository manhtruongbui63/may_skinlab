# Implementation Workflow

Step-by-step workflow for creating Artisan commands and scheduled tasks.

---

## Step 1: Architecture & Logic Planning

Decide signature and Background Service. Plan the Business Logic Documentation structure (to be created in Step 9 after code is finalized).

---

## Step 2: Create DTO

Create a `final readonly` DTO in `app/DTOs/Background/{Module}/{Action}Data.php`. The DTO represents the input contract for the Background Service.

---

## Step 3: Background Service

Implement logic in `app/Services/Background/`. The `run()` method MUST accept the DTO as its parameter. Apply **Manual Transactions** (for multi-query/locking) and N+1 prevention.

---

## Step 4: Factory Registration

Register in `BackgroundFactory.php` and add an **Explicit Static Getter**.

> [!CAUTION]
> **FORBIDDEN**: Never create a new `XxxFactory.php` file. Add a getter to the existing `BackgroundFactory` only.

---

## Step 5: Command Stub

Write stub, handle input/interaction, construct the DTO from arguments/options, and provide high-quality output.

**Pattern**: `Artisan Call / Schedule` → `Command Stub` → `Background Service` → `Common Service / Models`

---

## Step 6: Schedule Registration

Register the command in `routes/console.php` with `withoutOverlapping()` and `onOneServer()`.

See [Scheduling](05-scheduling.md) for details.

---

## Step 7: Verification

Run `php artisan {signature}` to verify the command works correctly.

---

## Step 8: Testing (MANDATORY)

- Use `$this->artisan('{signature}', ['argument' => value])` for a Feature-style test
- If the Command triggers complex Background Service logic: write **Unit Tests** for each key Service method immediately after implementing the Background Service — do NOT wait until the end
- Invalid input / missing argument cases MUST be tested
- Verify with `php artisan test --filter={CommandTest}`

---

## Step 9: Logic Documentation (MANDATORY POST-IMPLEMENTATION)

Create/Update Business Logic Documentation and **bump its version (minor/major)** in `docs/logic/{module}/{feature_command}.md` following the [Mandatory Logic Doc Format](06-logic-documentation.md) based on the **final code**.

> [!IMPORTANT]
> A task is considered FAILED if this is skipped.

---

## Step 10: BR Registry Update

**MANDATORY**: If new Business Rules (`BR-*`) were introduced or existing ones updated, you MUST update `docs/system/br-registry.md` to reflect these changes.

---

## Step 11: Final Audit

Ensure the code implementation matches the documented `FLOW` and `RULES` in the Logic Doc. Run `php artisan code:format`.
Run `php .agents/scripts/validate-backend.php backend` to verify command structure compliance.
Run `php artisan test --filter={CommandName}` — all tests MUST pass.

---

## Step 12: Task Completion

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
- [ ] **Tests**: All relevant Feature and Unit tests are passing
- [ ] **Logic Docs**: Business logic docs in `docs/logic/` are created/updated to match the final implementation
- [ ] **BR Registry**: `docs/system/br-registry.md` has been updated with all new or modified business rules
- [ ] **Task Update**: The task file and index file statuses are updated to `completed`

---

## Related

- [Architecture](01-architecture.md) - Command structure and naming
- [Implementation](02-implementation.md) - Command stub patterns
- [Background Services](03-background-services.md) - Service layer standards
- [Logic Documentation](06-logic-documentation.md) - Business logic doc format
