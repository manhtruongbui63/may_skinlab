# Global Coding Rules

Even when working solely on Jobs, you MUST follow these global standards:

---

## 1. No FQN

NEVER use inline class paths (e.g., `\App\Models\User`) directly in the code, docblocks, or type hints. ALWAYS use `use` statements at the top. This includes Root namespace classes like `\Exception` or `\stdClass`.

```php
// ❌ BAD
public function handle(\App\Models\User $user): void { ... }
/** @var \Exception $e */

// ✅ GOOD
use App\Models\User;
use Exception;

public function handle(User $user): void { ... }
/** @var Exception $e */
```

---

## 2. Localization

- **User-facing messages** (returned to UI, queued notifications): MUST use `trans()` helper.
- **Internal log messages** (`Log::info/error`): Use plain English strings. `trans()` is NOT required for logs.

---

## 3. No `env()`

ALWAYS use `config('key')`.

---

## 4. Enum Usage

MUST use PHP Enums for any set of fixed values (Role, Status, Type).
