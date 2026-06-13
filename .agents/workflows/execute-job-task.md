---
description: Execute a Laravel Background Job task from docs/tasks/. Mandates loading the bks-be-job-standard skill.
---

# Execute Job Task Workflow

This workflow is for implementing Laravel background Jobs.

> [!IMPORTANT]
> **Mandatory Skill Loading**: Before starting, you MUST read the Job standards skill using:
> `view_file` on `.agents/skills/bks-be-job-standard/SKILL.md`.

---

## 1. Context Audit
- Read the task in `docs/tasks/`.
- Read the logic spec in `docs/logic/jobs/`.

## 2. Design & Strategy
- **MANDATORY**: Create an `implementation_plan.md` artifact.
- **MANDATORY**: Create/Update Business Logic Documentation in `docs/logic/` following the [Mandatory Logic Doc Format] in the Job Standards skill.
- Define the `Background Service` naming and `BackgroundFactory` registration.
- Plan for **Double-Run Protection** (Atomic Locks) and **Bulk Efficiency** (Batching).

## 3. Implementation
- Implement the **Background Service** (`app/Services/Background`).
- Register in **BackgroundFactory**.
- Implement the **Job Stub** (`app/Jobs`).

## 4. Audit & Finish
- Verify: **Logic Document consistency**, Tenant Isolation, N+1 Prevention, Manual Transactions, Localization, Logging.
- Run `php artisan code:format`.
- Run `php .agents/skills/bks-be-job-standard/scripts/validate-job-structure.php backend` to verify job structure compliance.
- Run `php artisan test --filter={JobName}` — all tests MUST pass.
- Update task status to `completed`.
