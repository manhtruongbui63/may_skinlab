# Long-Running & Bulk Operations

## 1. Timeouts

Define the `$timeout` property (e.g., `3600`) for jobs expected to run longer than 60 seconds.

```php
public $timeout = 3600; // 1 hour
```

---

## 2. Progress Tracking

The Background Service MUST update progress (status, percentage) on a tracking model to provide feedback to the UI.

---

## 3. Chunking

Use `chunk()` or `eachById()`. NEVER load massive datasets into memory using `get()`.

---

## 4. High-Performance Bulk Operations

For creating/updating large datasets (e.g., > 100 records):

### Avoid Loop-Create

Do NOT use `Model::create()` inside a large loop.

### Use Bulk Methods

Prefer `insert()` or `upsert()`.

### Batching

Divide data into small chunks (e.g., `array_chunk($data, 500)`) to avoid DB packet size limits.

### Manual Features

Be aware that `insert()` bypasses Model Events and Timestamps. Add `created_at` manually if required.

---

## 5. Memory Management

If processing a massive loop, call `gc_collect_cycles()` and `unset()` large variables periodically.
