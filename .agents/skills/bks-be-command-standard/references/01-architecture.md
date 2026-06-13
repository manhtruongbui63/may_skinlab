# Reference 01: Command Architecture & Global Standards

> **Scope**: Core architecture flow, naming conventions, and global coding standards for Artisan commands.

---

## 1. Command Architecture Flow

**Pattern**: `Artisan Call / Schedule` → `Command Stub` → `Background Service` → `Common Service / Models`

| Layer | Responsibility | Namespace |
|-------|---------------|-----------|
| **Command Stub** | Input handling, user interaction, output formatting | `app/Console/Commands` |
| **Background Service** | Business rules, bulk operations, transactions | `app/Services/Background` |
| **Common Service** | Shared utilities | `app/Services/Common` |

---

## 2. Naming & Location Standards

| Component | Path Pattern | Naming Rule |
|-----------|--------------|-------------|
| **Command** | `app/Console/Commands/{Name}Command.php` | `PascalCase`, must end with `Command` |
| **Signature** | Colon-separated | Lowercase (e.g., `system:cleanup`) |
| **Background Service** | `app/Services/Background/{Feature}BackgroundService.php` | `PascalCase` |
| **Background DTO** | `app/DTOs/Background/{Module}/{Action}Data.php` | `PascalCase` + `Data` suffix |

**Example**:
```php
// Command
app/Console/Commands/CleanupCommand.php
signature: 'system:cleanup'

// Service
app/Services/Background/CleanupBackgroundService.php

// DTO
app/DTOs/Background/System/CleanupData.php
```

---

## 3. Global Coding Standards

### 3.1 No Full Class Paths (FQN)

NEVER use inline class paths (starting with `\`). ALWAYS use `use` statements.

```php
// ❌ BAD
public function handle(): void { 
    \App\Models\User::all(); 
}

// ✅ GOOD
use App\Models\User;

public function handle(): void { 
    User::all(); 
}
```

### 3.2 Localization Rules

| Output Type | Rule |
|-------------|------|
| **Console output** (`$this->info()`, `$this->error()`) | Plain English acceptable |
| **User-facing messages** (notifications, UI responses) | MUST use `trans()` |
| **Internal log messages** (`Log::info/error`) | Plain English, `trans()` NOT required |

### 3.3 Configuration Access

```php
// ❌ FORBIDDEN
env('SYSTEM_USER_ID');

// ✅ CORRECT
config('system.system_user_id');
```

### 3.4 Enum Usage

MUST use PHP Enums for any set of fixed values (Role, Status, Type):

```php
$status = $statusString ? GeneralStatusEnum::tryFrom($statusString) : null;
```

### 3.5 Factory Rule (MANDATORY)

> [!CAUTION]
> **FORBIDDEN**: NEVER create a new `XxxFactory.php` file. The three factories (`ApiFactory`, `BackgroundFactory`, `CommonFactory`) are **permanent**. New Background Services are added as getter methods to `BackgroundFactory` only.

```php
// ✅ CORRECT — Use existing BackgroundFactory
$service = BackgroundFactory::getFeatureBackgroundService();
```

### 3.6 Logging & Auditing (MANDATORY)

- Log all database mutations in the Background Service
- Include execution context (`user_id` or `'system'`) in every log entry
- Catch exceptions and log with `Log::error()`:

```php
} catch (Exception $e) {
    Log::error("Command failed", [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    throw $e;
}
```

---

## 4. Architecture Audit Checklist

- [ ] Command follows `Module/NameCommand.php` naming convention
- [ ] Signature uses lowercase colon format (`module:task`)
- [ ] No FQN used — all imports via `use` statements
- [ ] Uses `BackgroundFactory` (not creating new factories)
- [ ] Configuration accessed via `config()`, never `env()`
- [ ] Enums used for fixed values
- [ ] Logging includes execution context
