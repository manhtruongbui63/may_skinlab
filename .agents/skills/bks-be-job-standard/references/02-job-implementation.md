# Job Implementation Rules

## 1. Constructor & Context Preservation

Jobs run without a session. You MUST pass the context manually:

- **Always pass**: `user_id` (who triggered the job), and entity IDs.
- **Rules**: NO logic in constructor. Only property assignment.

```php
public function __construct(
    public int $userId,
    public int $entityId,
) {}
```

---

## 2. The `handle()` Method

- **Delegation ONLY**: The `handle()` method MUST ONLY resolve the Background Service from the Factory and call its main execution method.
- **User Context**: Resolve the User model from `$userId` and pass it to the service via `->withUser($user)`. This mirrors the API pattern where controllers call `->withUser($this->guard()->user())`.
- **Log**: Log the start and end of the Job for traceability.

```php
use App\DTOs\Background\{Module}\{Feature}Data;
use App\Factories\BackgroundFactory;
use App\Models\User;
use Illuminate\Support\Facades\Log;

public function handle(): void {
    Log::info("Job started", ['class' => self::class, 'user_id' => $this->userId, 'entity_id' => $this->entityId]);
    
    $user = User::findOrFail($this->userId);
    
    // Resolve from BackgroundFactory (Explicit Getter) and inject user context
    $service = BackgroundFactory::getFeatureBackgroundService();
    
    // ALWAYS wrap the input in a DTO — never pass raw primitives
    $service->withUser($user)->run(new {Feature}Data(
        entityId: $this->entityId,
    ));
    
    Log::info("Job finished", ['class' => self::class, 'user_id' => $this->userId, 'entity_id' => $this->entityId]);
}
```

---

## 3. Retry Policy

Explicitly define how many times the job should retry and the delay between them:

```php
public $tries = 3;
public $backoff = [10, 30, 60]; // Seconds
```

---

## 4. Failure Cleanup

Implement the `failed()` method in the Job class to update entity statuses or log critical errors with full context.

```php
use Illuminate\Support\Facades\Log;

public function failed(Throwable $exception): void {
    Log::critical("Job permanently failed", [
        'class' => self::class,
        'user_id' => $this->userId,
        'entity_id' => $this->entityId,
        'error' => $exception->getMessage(),
        'trace' => $exception->getTraceAsString()
    ]);
}
```
