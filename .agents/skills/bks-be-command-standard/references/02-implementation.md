# Reference 02: Command Implementation

> **Scope**: Command shell setup, handle() method patterns, console interaction, and output formatting.

---

## 1. Command Shell Setup

Define signature and description at the top of the class:

```php
protected $signature = 'module:task 
    {id : The ID of the item} 
    {--status= : Filter by status}';

protected $description = 'Briefly describe what this command does';
```

---

## 2. The handle() Method (Orchestration ONLY)

The `handle()` method is for **orchestration only** — NO business logic:

### 2.1 Four-Step Pattern

```php
use App\DTOs\Background\{Module}\{Feature}Data;
use App\Factories\BackgroundFactory;
use App\Enums\GeneralStatusEnum;

public function handle(): void
{
    // Step 1: Input retrieval
    $id = $this->argument('id');
    $statusString = $this->option('status');
    
    // Step 2: Enum validation
    $status = $statusString ? GeneralStatusEnum::tryFrom($statusString) : null;

    $this->info("Starting process for ID: {$id}");

    // Step 3: Service resolution
    $service = BackgroundFactory::getFeatureBackgroundService();
    
    // Step 4: User context injection (if needed)
    // Commands run without a web session
    // - If audit logging requires user: inject System User
    //   $systemUser = User::find(config('system.system_user_id'));
    //   $service->withUser($systemUser);
    // - Otherwise, service MUST log 'system' as actor
    
    // ALWAYS wrap arguments in DTO — never pass raw primitives
    $service->run(new {Feature}Data(
        id: (int) $id,
        status: $status,
    ));

    $this->info("Task completed successfully.");
}
```

---

## 3. Console Interaction

### 3.1 Visual Feedback (Progress Bars)

ALWAYS use progress bars for loops involving bulk data:

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

### 3.2 Destructive Confirmation

ALWAYS use `$this->confirm()` for dangerous actions:

```php
if (!$this->confirm('This will delete all inactive records. Continue?')) {
    $this->warn('Operation cancelled.');
    return;
}
```

### 3.3 Output Formatting

| Method | Use Case |
|--------|----------|
| `$this->info($msg)` | General information |
| `$this->line($msg)` | Neutral output |
| `$this->warn($msg)` | Warnings |
| `$this->error($msg)` | Errors |
| `$this->newLine()` | Line breaks |

### 3.4 Enum Labels in Output

Use Enum labels for clarity when displaying status:

```php
$this->line("Current status: " . $item->status->label());
```

---

## 4. Input Validation

Treat all command arguments and options as **untrusted input**:

```php
// Validate enums
$status = $statusString ? GeneralStatusEnum::tryFrom($statusString) : null;

// Validate required arguments
$id = $this->argument('id');
if (!$id) {
    $this->error('ID is required.');
    return;
}
```

---

## 5. Implementation Audit Checklist

- [ ] Signature clearly documents arguments and options
- [ ] `handle()` method only orchestrates (no business logic)
- [ ] Arguments wrapped in DTO before passing to service
- [ ] Enum values validated before use
- [ ] Progress bars used for bulk operations
- [ ] Destructive actions confirmed with `$this->confirm()`
- [ ] Service resolved from `BackgroundFactory`
