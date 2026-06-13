# Task Scheduling Standards

MANDATORY registration of scheduled commands in `routes/console.php`. DO NOT use system crontabs for application logic.

---

## Schedule Registration

Use the `Schedule` facade to define command execution patterns:

```php
use Illuminate\Support\Facades\Schedule;

// Run with overlap prevention and server isolation
Schedule::command('system:cleanup')
    ->daily()
    ->onOneServer()
    ->withoutOverlapping();
```

---

## Required Constraints

| Constraint | Method | Purpose |
|------------|--------|---------|
| Overlap Prevention | `->withoutOverlapping()` | Prevents concurrent execution of the same command |
| Server Isolation | `->onOneServer()` | Ensures command runs on only one server in a multi-server setup |

---

## Frequency Methods

Common scheduling frequencies for commands:

```php
Schedule::command('report:generate')->hourly();
Schedule::command('system:cleanup')->daily();
Schedule::command('sync:external')->dailyAt('02:00');
Schedule::command('cache:warm')->weekly();
Schedule::command('audit:log-rotate')->monthly();
```

---

## Double-Run Protection (Idempotency)

Commands may be run multiple times or overlap if not scheduled correctly:

1. **State Check**: Always verify if the work is already completed BEFORE starting the logic
2. **Atomic Locks**: Use `Cache::lock()` inside the Background Service for business-critical logic
3. **Scheduling**: ALWAYS use `withoutOverlapping()` in `routes/console.php` for scheduled commands

---

## Security Considerations

- Commands MUST log the intent, input parameters, and results for transparency
- Treat all command arguments as untrusted input - validate using Enums
- Use `$this->confirm()` for destructive actions even in scheduled contexts

---

## Related

- [Background Services](03-background-services.md) - Service layer with checkpoint/resume
- [Console Interaction](04-console-interaction.md) - Output and confirmation patterns
