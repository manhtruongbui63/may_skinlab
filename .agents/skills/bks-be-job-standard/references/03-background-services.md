# Background Service Standards

The **Background Service** is where the real work happens. It must follow these rules:

---

## 1. Inheritance

MUST extend `App\Services\Base\Service`.

---

## 2. DTO Input (MANDATORY)

The main entry-point method (`run()`) MUST accept a typed **DTO** as its primary parameter — NEVER a raw `array` or loose primitives.

```php
// ✅ CORRECT
public function run(CreateOrderData $dto): void { ... }

// ❌ FORBIDDEN
public function run(int $orderId, string $status): void { ... }
public function run(array $data): void { ... }
```

---

## 3. Factory Registration (MANDATORY)

Register in `BackgroundFactory.php` by adding an **Explicit Static Getter** method.

> [!CAUTION]
> **FORBIDDEN — New Factory Files**: NEVER create a new `XxxFactory.php` file. The three factories (`ApiFactory`, `BackgroundFactory`, `CommonFactory`) are **permanent**. New services are added as getter methods to the existing `BackgroundFactory`.

---

## 4. Transactions

Use the manual transaction pattern **ONLY for features involving multiple database queries or when row-level locking is required for security/integrity.** Simple single-query updates SHOULD NOT use a transaction block.

> **CAUTION**: NEVER wrap long-running or external tasks (e.g., file uploads, image resizing, 3rd-party API calls) inside a database transaction. Perform these before starting the transaction or after committing it.

---

## 5. N+1 Prevention

ALWAYS use `with()` to eager load relationships. Jobs processing hundreds of records MUST be optimized for query count.

---

## 6. No Auth/Request

NEVER use `Auth::user()` or `request()` helpers. Use `$this->user` (set via `withUser()` in the Job's `handle()` method) or data from the DTO.

---

## 7. User Context

Access the authenticated user via `$this->user` (inherited from `Base\Service`). The Job's `handle()` method resolves the user from `$userId` and sets it via `->withUser($user)` before calling the service.

- **System-triggered jobs** (no user context): If a Job is dispatched by a scheduled command or system event with no user, pass a designated System User or explicitly handle `null` in the service — NEVER silently skip user logging.

---

## 8. State Management

Use `$model->fresh()` or re-query to ensure you have the latest data before critical mutations.

---

## 9. Logging & Auditing (MANDATORY)

Log all database mutations in the Background Service using plain English messages.

- Log the `user_id` as metadata in every log entry for auditability.
- Catch exceptions and log using `Log::error()` with full trace context.

```php
Log::info("Entity updated successfully", ['user_id' => $this->user->id, 'entity_id' => $entity->id]);
```
