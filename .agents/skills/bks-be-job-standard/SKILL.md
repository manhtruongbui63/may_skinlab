---
name: bks-be-job-standard
description: Use this skill when creating or modifying Laravel background Jobs. Defines standards for job architecture (Job -> Background Service), context preservation (user), error handling, and service delegation.
---

# Laravel Background Job Standards

This skill ensures jobs are isolated, reliable, and perfectly aligned with the project's architecture.

---

## Quick Start

| Need to... | Read Reference |
|------------|----------------|
| Understand Job architecture flow | [01-job-architecture.md](references/01-job-architecture.md) |
| Implement Job shell, handle(), retry | [02-job-implementation.md](references/02-job-implementation.md) |
| Build Background Service layer | [03-background-services.md](references/03-background-services.md) |
| Add security, idempotency, locks | [04-security.md](references/04-security.md) |
| Handle long-running/bulk operations | [05-long-running-ops.md](references/05-long-running-ops.md) |
| Check global coding rules | [06-global-rules.md](references/06-global-rules.md) |
| Document business logic | [07-logic-documentation.md](references/07-logic-documentation.md) |
| Follow step-by-step workflow | [08-implementation-workflow.md](references/08-implementation-workflow.md) |

---

## Critical Constraints

### Factory Registration
> [!CAUTION]
> **FORBIDDEN — New Factory Files**: NEVER create a new `XxxFactory.php` file. Register services in the existing `BackgroundFactory.php`.

### DTO Usage
The Background Service `run()` method MUST accept a typed **DTO** — NEVER a raw `array` or loose primitives.

### No FQN
NEVER use inline class paths (e.g., `\App\Models\User`). ALWAYS use `use` statements at the top of the file.

### No `env()`
ALWAYS use `config('key')` instead of `env()` directly.

### Method Length
Methods MUST be ≤ 30 lines. If longer, split into private methods with descriptive names (e.g., `fetchUserData()`, `validatePayload()`).

### External Code Adaptation
> [!CAUTION]
> **FORBIDDEN**: Copy-pasting external code (documentation, Stack Overflow, AI generated, other projects) without adapting to project standards.
> 
> When referencing external code:
> - Convert `app(Service::class)` to `BackgroundFactory::{serviceName}()`
> - Replace raw values with proper Enum constants (`Enum::CASE->value`)
> - Add explicit `use` statements instead of FQN
> - Apply mandatory logging patterns
> - Follow manual transaction pattern
> - Ensure all DTOs follow `final readonly` structure with `from()` factory

---

## Code Example

```php
// app/Jobs/ProcessInvoiceJob.php
namespace App\Jobs;

use App\DTOs\Background\Invoice\ProcessInvoiceData;
use App\Factories\BackgroundFactory;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ProcessInvoiceJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        private readonly ProcessInvoiceData $data,
        private readonly int $userId,
    ) {}

    public function handle(): void
    {
        Auth::loginUsingId($this->userId);

        BackgroundFactory::getProcessInvoiceBackgroundService()->run($this->data);
    }

    public function failed(\Throwable $e): void
    {
        Log::error('ProcessInvoiceJob failed', [
            'user_id'   => $this->userId,
            'exception' => $e->getMessage(),
        ]);
    }
}
```

> **Key Pattern**: Job stores `$userId` → restores auth context in `handle()` → delegates ALL business logic to `BackgroundService::run(DTO)`. Zero business logic lives inside the Job itself.

---

## Smoke Test (MANDATORY after coding)

Right after the Job + Background Service are implemented, write a minimal smoke test to confirm the code you just wrote runs:

- **Background Service smoke** (`tests/Unit/Jobs/{Feature}BackgroundServiceSmokeTest.php`): call `run()` with a valid DTO (happy path) and assert the expected primary effect (record created/updated, no exception).
- **Dispatch smoke** (`tests/Feature/Jobs/{Feature}JobDispatchSmokeTest.php`): `Bus::fake()` → trigger the dispatch → `Bus::assertDispatched({Feature}Job::class)`.

**Run**: `php artisan test --filter={Feature}SmokeTest`.

> [!CAUTION]
> **If the smoke test FAILS → fix the code NOW** — the Job/Service you just wrote is buggy. Fix until the happy path is green before moving on.

---

## Smoke Test vs Acceptance Test (mandatory boundary)

This skill writes **smoke tests only** after coding — NOT the full suite.

| | Smoke Test (**this skill**) | Acceptance Test (`bks-be-testing-standard`) |
|---|---|---|
| Purpose | Confirm the Job/Service **runs** | Verify it **meets the requirement**, full coverage |
| Source | Happy path of the just-written code | The requirement input (task/requirement/BR/logic doc) |
| Scope | Minimal: `run()` happy path + dispatch works | Full: every branch, retry/failed, idempotency, edge cases |
| On FAIL | **FIX THE CODE NOW** — just-written code, a failure means a code bug | **NEVER fix** — only report pass/fail, the user decides |
| File | `{Feature}...SmokeTest.php` | `{Feature}...Test.php` (replaces the smoke test → delete `*SmokeTest.php`) |

> [!IMPORTANT]
> A failing smoke test = the code you just wrote is broken → **fix the code now**. Then STOP; comprehensive, objective coverage is owned by `bks-be-testing-standard`, and that skill **must not auto-fix**.

---

## Final Completion Checklist

**AI Agent MUST verify this checklist before ending the session:**

- [ ] **Code Quality**: `php artisan code:format` has been run.
- [ ] **Smoke test**: Background Service `run()` happy path + dispatch smoke pass (any failure was a code bug and was fixed).
- [ ] **Acceptance tests**: Full, objective coverage delegated to `bks-be-testing-standard` (report-only, no auto-fix) — not written in this skill.
- [ ] **Audit Log** (BR-G002): Jobs delegate to BackgroundService — verify the target Model has `LogsActivity` trait. If Job triggers a non-CRUD action (e.g., bulk delete, force purge), verify BackgroundService calls `activity()->log()` manually (Pattern B)
- [ ] **Logic Docs**: Business logic docs in `docs/logic/` are created/updated to match the final implementation.
- [ ] **BR Registry**: `docs/system/br-registry.md` has been updated with all new or modified business rules.
- [ ] **Task Update**: The task file and index file statuses are updated to `completed`.

---

## Validation Scripts

Run these scripts to verify job compliance:

```bash
# Validate all backend structures (API, Command, Database, Job, Test)
php .agents/scripts/validate-backend.php /path/to/project
```

See `.agents/scripts/validate-backend.php` for detailed validation rules.
