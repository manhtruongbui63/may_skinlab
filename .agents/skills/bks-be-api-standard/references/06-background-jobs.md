# Reference 06: Background Job Handover Protocol

> **Scope**: Offloading logic from API to background Jobs — task separation and context persistence.

---

## 1. Task Separation Rule (MANDATORY)

A feature with both an HTTP API trigger AND a background Job MUST ALWAYS be decomposed into **two separate tasks**:

| Task | Skill | Workflow | Phase | Dependency |
|---|---|---|---|---|
| **Task A** | `bks-be-job-standard` | `/execute-job-task` | Phase 2a | None |
| **Task B** | `bks-be-api-standard` | `/execute-api-task` | Phase 2b | `depends_on: [Task A]` |

**Job task MUST be implemented and completed BEFORE the API task.** The API task is only responsible for triggering/dispatching the Job.

---

## 2. Task A — Job Task (Implement First)

The Job task MUST implement:

1. **DTO**: `app/DTOs/Background/{Module}/{Action}Data.php`
2. **Background Service**: `app/Services/Background/{Feature}BackgroundService.php` with `run({Action}Data $dto)`
3. **Register** in `BackgroundFactory` (add getter method — never create a new factory)
4. **Job stub**: `app/Jobs/{Feature}Job.php` — passes DTO to Background Service

---

## 3. Task B — API Task (Implement After Task A)

The API task implements the dispatch call in the **Api Service**:

```php
// In Api Service — dispatch only, no job business logic here
{Feature}Job::dispatch($user->id, $entityId);
```

- **Constructor**: Pass `user_id` and required entity IDs as primitives (Job stores these, then constructs the DTO in `handle()`).
- **Stub Safety**: If Task A is not yet done, create the Job class stub with the correct constructor only.

---

## 4. Context Persistence (The Bridge)

To ensure Task A can be implemented independently:

1. **Create Logic Doc**: Write `docs/logic/{module}/{FeatureName}Job.md` specifying:
   - Input parameters
   - Step-by-step logic
   - Background Service naming
   - Success/fail criteria

2. **Task A file** MUST reference this Logic Doc and specify `bks-be-job-standard` + `/execute-job-task`.

3. **Task B file** MUST list Task A in `depends_on` with a note: *"Task A must be completed before this dispatch call can be wired."*
