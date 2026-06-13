# Reference 03: Background Service Standards

> **Scope**: Background Service implementation, DTOs, database transactions, and bulk operations.

---

## 1. DTO — Data Transfer Objects (MANDATORY)

All Background Service methods MUST accept a typed DTO, not raw arrays.

### 1.1 DTO Structure

```php
// app/DTOs/Background/{Module}/{Action}Data.php
final readonly class CleanupData
{
    public function __construct(
        public int $batchSize = 100,
        public ?GeneralStatusEnum $targetStatus = null,
    ) {}

    public static function from(array $data): self
    {
        return new self(
            batchSize: $data['batch_size'] ?? 100,
            targetStatus: isset($data['status']) 
                ? GeneralStatusEnum::tryFrom($data['status']) 
                : null,
        );
    }
}
```

### 1.2 Service Method Signature

```php
// ✅ CORRECT — Accepts typed DTO
public function run(CleanupData $dto): void

// ❌ FORBIDDEN — Raw array
public function run(array $data): void
```

---

## 2. Database Transactions

### 2.1 When to Use Transactions

Use manual transactions **ONLY for features involving multiple database queries or when row-level locking is required**.

```php
use Illuminate\Support\Facades\DB;

DB::beginTransaction();
try {
    // For critical/financial data, use lockForUpdate()
    $wallet = Wallet::where('user_id', $userId)->lockForUpdate()->first();
    $wallet->balance -= $amount;
    $wallet->save();
    
    DB::commit();
} catch (Exception $e) {
    DB::rollBack();
    throw $e;
}
```

### 2.2 Transaction Warnings

> [!CAUTION]
> **FORBIDDEN**: NEVER wrap long-running or external tasks inside a database transaction:
> - File uploads
> - Image resizing
> - 3rd-party API calls

Perform these BEFORE starting the transaction or AFTER committing.

---

## 3. Performance Standards

### 3.1 N+1 Prevention

ALWAYS use `with()` to eager load relationships:

```php
// ✅ CORRECT
User::with(['department', 'roles'])->chunk(100, function ($users) {
    foreach ($users as $user) {
        // Uses pre-loaded relations
    }
});

// ❌ FORBIDDEN — Causes N+1
User::chunk(100, function ($users) {
    foreach ($users as $user) {
        $user->department->name; // Query per user!
    }
});
```

### 3.2 Chunking (MANDATORY for Bulk Data)

Use `chunk()` or `eachById()`. NEVER load massive collections using `get()`:

```php
// ✅ CORRECT
User::where('status', UserStatus::INACTIVE)
    ->chunk(100, function ($users) {
        foreach ($users as $user) {
            $user->delete();
        }
    });

// ❌ FORBIDDEN — May exhaust memory
$users = User::where('status', UserStatus::INACTIVE)->get();
foreach ($users as $user) {
    $user->delete();
}
```

### 3.3 High-Performance Bulk Operations

For high-volume data creation/updates (>100 records):

| Pattern | Use Case | Example |
|---------|----------|---------|
| `insert()` | Mass insert | `DB::table('users')->insert($data)` |
| `upsert()` | Insert or update | `User::upsert($data, ['id'])` |

**Critical Rules**:
- NEVER use `Model::create()` inside a large loop
- Divide data into batches: `array_chunk($data, 500)`
- `insert()` bypasses Model Events and Timestamps — add `created_at` manually if needed

```php
// ✅ CORRECT — Bulk insert
$data = [];
foreach ($records as $record) {
    $data[] = [
        'name' => $record['name'],
        'created_at' => now(),
        'updated_at' => now(),
    ];
}

foreach (array_chunk($data, 500) as $batch) {
    User::insert($batch);
}

// ❌ FORBIDDEN — Loop create (N queries)
foreach ($records as $record) {
    User::create($record); // 1 query per record!
}
```

---

## 4. Checkpoint & Resume Capability (CRITICAL)

Bulk tasks MUST be designed to resume after failure:

### 4.1 Granular Updates

Update each item's status individually as it finishes:

```php
ProcessStatus::where('status', ProcessStatus::PENDING)
    ->eachById(function ($item) {
        $this->processItem($item);
        
        // Mark as completed immediately
        $item->update(['status' => ProcessStatus::COMPLETED]);
    });
```

### 4.2 Skip Logic

The Service's main query must automatically exclude already processed items:

```php
public function run(CleanupData $dto): void
{
    // Automatically skips already processed items
    $query = ProcessStatus::where('status', ProcessStatus::PENDING);
    
    $query->eachById(function ($item) {
        // Process...
        $item->update(['status' => ProcessStatus::COMPLETED]);
    });
}
```

---

## 5. Service Audit Checklist

- [ ] Service method accepts typed DTO parameter
- [ ] DTO has static `from()` factory method
- [ ] Manual transactions only for multi-query/locking scenarios
- [ ] `with()` used for eager loading
- [ ] `chunk()` or `eachById()` used for bulk operations
- [ ] Bulk inserts use `insert()` or `upsert()`, not loop `create()`
- [ ] Checkpoint/resume capability implemented for long-running tasks
