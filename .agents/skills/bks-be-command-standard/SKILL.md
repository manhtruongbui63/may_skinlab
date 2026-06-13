---
name: bks-be-command-standard
description: Use this skill when creating or modifying Artisan commands and scheduled tasks. Defines standards for command architecture, input/output, progress tracking, and registration in routes/console.php.
---

# Laravel Artisan Command & Scheduled Task Standards

This skill ensures Artisan commands and background schedules are interactive, reliable, and consistent with the project's service-oriented architecture.

---

## Quick Reference

| Pattern | Flow |
|---------|------|
| **Architecture** | `Artisan Call / Schedule` → `Command Stub` → `Background Service` → `Common Service / Models` |

---

## Reference Documentation

### Architecture & Structure
- [01-architecture.md](references/01-architecture.md) - Command naming, location, localization, and global coding rules
- [02-implementation.md](references/02-implementation.md) - `handle()` method patterns, DTO usage, console interaction

### Service Layer
- [03-background-services.md](references/03-background-services.md) - Background Service patterns, transactions, performance, checkpoint/resume

### Interaction & Scheduling
- [04-console-interaction.md](references/04-console-interaction.md) - Progress bars, output formatting, localization, confirmations
- [05-scheduling.md](references/05-scheduling.md) - Task registration in routes/console.php, overlap prevention

### Documentation & Workflow
- [06-logic-documentation.md](references/06-logic-documentation.md) - Business logic doc format for commands
- [07-implementation-workflow.md](references/07-implementation-workflow.md) - Step-by-step implementation guide with completion checklist

---

## Critical Constraints

| Rule | Constraint |
|------|------------|
| **No New Factories** | NEVER create new `XxxFactory.php` files. Add getters to existing `BackgroundFactory` only. |
| **No `env()`** | ALWAYS use `config()` instead of `env()`. |
| **No FQN** | NEVER use inline class paths. ALWAYS use `use` statements. |
| **Transaction Boundaries** | NEVER wrap long-running tasks (file uploads, API calls) in DB transactions. |
| **Overlap Prevention** | Scheduled commands MUST use `withoutOverlapping()` in routes/console.php. |
| **DTOs Required** | ALWAYS wrap command arguments in DTOs — never pass raw primitives to Services. |
| **Method Length** | Methods MUST be ≤ 30 lines; split into private methods with descriptive names if longer |
| **External Code** | When copying from docs/other projects: convert to Factory getters, use Enum constants, add proper imports, follow project naming conventions |

---

## Quick Start: Implementation Workflow

1. **Plan**: Define signature and Background Service architecture
2. **DTO**: Create `app/DTOs/Background/{Module}/{Action}Data.php`
3. **Service**: Implement `app/Services/Background/{Feature}BackgroundService.php`
4. **Factory**: Register explicit getter in `BackgroundFactory.php`
5. **Command**: Write stub in `app/Console/Commands/{Name}Command.php`
6. **Schedule**: Register in `routes/console.php` with overlap prevention
7. **Smoke Test**: Write a minimal smoke test in `tests/Feature/Console/{Name}CommandSmokeTest.php` — run the command with valid input and assert it completes (`$this->artisan('{signature}', [...])->assertExitCode(0)`). Goal: confirm the command you just wrote runs. **If it fails → fix the code NOW** (the just-written code is buggy). Do NOT write the full suite here.
8. **Document**: Create business logic doc in `docs/logic/{module}/`
9. **Audit**: Run `php artisan code:format` and verify checklist

> Full, objective test coverage (all branches, edge cases, report) is a separate pass owned by `bks-be-testing-standard` — and that skill is **report-only (no auto-fix)**. See "Smoke Test vs Acceptance Test" below.

See [07-implementation-workflow.md](references/07-implementation-workflow.md) for complete details.

---

## Smoke Test vs Acceptance Test (mandatory boundary)

This skill writes **smoke tests only** after coding — NOT the full suite.

| | Smoke Test (**this skill** — step 7) | Acceptance Test (`bks-be-testing-standard`) |
|---|---|---|
| Purpose | Confirm the command **runs** | Verify it **meets the requirement**, full coverage |
| Source | Happy path of the just-written code | The requirement input (task/requirement/BR/logic doc) |
| Scope | Minimal: run with valid input → `assertExitCode(0)` | Full: valid/invalid input, every branch, edge cases |
| On FAIL | **FIX THE CODE NOW** — just-written code, a failure means a code bug | **NEVER fix** — only report pass/fail, the user decides |
| File | `{Name}CommandSmokeTest.php` | `{Name}CommandTest.php` (replaces the smoke test → delete `*SmokeTest.php`) |

> [!IMPORTANT]
> A failing smoke test = the code you just wrote is broken → **fix the code now** until the command runs. Then STOP; comprehensive, objective coverage is owned by `bks-be-testing-standard`, and that skill **must not auto-fix**.

---

## Code Example

```php
namespace App\Console\Commands;

use App\DTOs\Background\System\CleanupData;
use App\Factories\BackgroundFactory;
use Illuminate\Console\Command;

class CleanupCommand extends Command
{
    protected $signature = 'system:cleanup {--days=30 : Days to keep}';
    protected $description = 'Clean up old system records';

    public function handle(): void
    {
        $days = (int) $this->option('days');
        
        $this->info("Starting cleanup for records older than {$days} days...");
        
        $service = BackgroundFactory::getSystemCleanupBackgroundService();
        $service->run(new CleanupData(days: $days));
        
        $this->info('Cleanup completed successfully.');
    }
}
```

---

## Final Completion Checklist

Before ending any session implementing commands:

- [ ] `php artisan code:format` has been run
- [ ] **Smoke test** passes: command runs with valid input → `assertExitCode(0)` (any failure was a code bug and was fixed)
- [ ] Full objective coverage delegated to `bks-be-testing-standard` (report-only, no auto-fix) — not done in this skill
- [ ] **Audit Log** (BR-G002): Commands delegate to BackgroundService — verify the target Model has `LogsActivity` trait. If command does something non-CRUD (e.g., bulk purge), verify BackgroundService calls `activity()->log()` manually (Pattern B)
- [ ] Business logic docs in `docs/logic/` are created/updated
- [ ] `docs/system/br-registry.md` updated with any new BR-* rules
- [ ] Task file statuses updated to `completed` (if applicable)

---

## Validation Scripts

Run these scripts to verify command compliance:

```bash
# Validate all backend structures (API, Command, Database, Job, Test)
php .agents/scripts/validate-backend.php /path/to/project
```

See `.agents/scripts/validate-backend.php` for detailed validation rules.
