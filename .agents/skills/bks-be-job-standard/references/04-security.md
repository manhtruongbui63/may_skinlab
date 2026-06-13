# Security & Data Integrity (CRITICAL)

## 1. Double-Run Protection (Idempotency)

Jobs may be dispatched twice or retried by the queue system. The Background Service MUST handle this:

### State Check

Always check if the entity/task is already processed or in a final state BEFORE starting work.

### Atomic Locks

Use `Cache::lock()` for sensitive logic to prevent concurrent processing:

```php
$lock = Cache::lock("job-lock-{$entityId}", 60);
if (!$lock->get()) return; // Already running elsewhere
try { 
    /* Business Logic */ 
} finally { 
    $lock->release(); 
}
```

---

## 2. Mass Assignment

NEVER use raw payload arrays for model mutations. Use explicit assignments.

---

## 3. SQL Injection

Never use raw strings in DB queries. Use parameterized bindings.

---

## 4. Unique Constraints

Use DB-level unique keys as a final defense against duplicate data creation during retries.
