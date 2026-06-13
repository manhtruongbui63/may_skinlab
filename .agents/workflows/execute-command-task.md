---
description: Execute a Laravel Artisan Command task from docs/tasks/. Mandates loading the bks-be-command-standard skill.
---

# Execute Command Task Workflow

This workflow is for implementing Artisan Commands and Scheduled Tasks.

> [!IMPORTANT]
> **Mandatory Skill Loading**: Before starting, you MUST read the Command standards skill using:
> `view_file` on `.agents/skills/bks-be-command-standard/SKILL.md`.

---

## 1. Context Audit
- Read the task in `docs/tasks/`.
- Read the logic spec in `docs/logic/commands/` (if it exists).

## 2. Design & Strategy
- **MANDATORY**: Create an `implementation_plan.md` artifact.
- **MANDATORY**: Create/Update Business Logic Documentation in `docs/logic/` following the [Mandatory Logic Doc Format] in the Command Standards skill.
- Define the `Background Service` naming and `BackgroundFactory` registration.
- Plan for **Idempotency** and **Console UX** (Progress bars/Tables).

## 3. Implementation
- Implement the **Background Service** (`app/Services/Background`).
- Register in **BackgroundFactory**.
- Implement the **Command Stub** (`app/Console/Commands`).
- Register in `routes/console.php` (for schedules).

## 4. Audit & Finish
- Verify: **Logic Document consistency**, Tenant Isolation, N+1 Prevention, Manual Transactions, Localization, Logging.
- Run `php artisan code:format`.
- Run `php .agents/skills/bks-be-command-standard/scripts/validate-command-structure.php backend` to verify command structure compliance.
- Run `php artisan test --filter={CommandName}` — all tests MUST pass.
- Update task status to `completed`.
