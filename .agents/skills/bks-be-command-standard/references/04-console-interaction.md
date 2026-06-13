# Console Interaction & Output Standards

Standards for providing visual feedback and user interaction in Artisan commands.

---

## Progress Bars (Mandatory for Bulk Operations)

Always use progress bars for loops involving bulk data processing to provide real-time feedback on execution status.

```php
$bar = $this->output->createProgressBar(count($items));
$bar->start();

foreach ($items as $item) {
    // Process item...
    
    $bar->advance();
}

$bar->finish();
$this->newLine();
```

---

## Output Formatting & Enums

When printing results that include status or type values, use Enum labels for human-readable clarity:

```php
$this->line("Current status: " . $item->status->label());
```

### Available Output Methods

| Method | Purpose |
|--------|---------|
| `$this->info()` | Informational messages (green) |
| `$this->line()` | Plain text output |
| `$this->error()` | Error messages (red) |
| `$this->warn()` | Warning messages (yellow) |
| `$this->newLine()` | Add blank line |

---

## User Confirmation

ALWAYS use `$this->confirm()` for destructive actions to prevent accidental data loss:

```php
if (!$this->confirm('This will permanently delete ' . count($items) . ' records. Continue?')) {
    $this->warn('Operation cancelled.');
    return;
}
```

---

## Localization Guidelines

| Context | Requirement |
|---------|-------------|
| Console output (`$this->info()`, `$this->error()`) | Plain English acceptable for internal scripts |
| User-facing messages (notifications, UI responses) | MUST use `trans()` helper |
| Internal log messages (`Log::info/error`) | Plain English strings, `trans()` NOT required |

---

## Related

- [Background Services](03-background-services.md) - Service layer execution patterns
- [Implementation](02-implementation.md) - Command stub patterns
