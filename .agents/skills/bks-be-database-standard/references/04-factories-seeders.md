# Factories & Seeders (DML)

Standards for generating realistic test data and database seeding architecture.

---

## Factories

### Realistic Data Generation

- **Fake Data**: Use `fake()->realText()` for localized, realistic content
- **Schema Alignment**: Validate that generated lengths fit within DB column limits
- **Logical Consistency**: Combined fields must make sense (e.g., `start_at` < `end_at`)

### Factory Pattern

```php
class PostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->realText(50),
            'content' => fake()->realText(500),
            'status' => PostStatus::DRAFT,
            'published_at' => null,
        ];
    }
}
```

---

## Seeders

### Volume Rules

| Entity Type | Record Count |
|-------------|--------------|
| Core entities | 15 records |
| System/Shared entities | 10 records |
| Settings/Static | 1 record |

### Seeder Pattern

```php
Model::factory()->count(10)->create();
```

---

## Seeder Architecture

Seeders are strictly organized into Structural and Development seeders.

### A. Initial Structural Seeders: `DatabaseSeeder.php`

The default entry point for `php artisan db:seed`. It MUST only contain data required for the project to function in production (Structural Data).

- **Examples**: Default User, System Settings, Prefectures
- **Usage**: `php artisan migrate:fresh --seed`

### B. Development Sample Seeders: `DataSampleSeeder.php`

Strictly for development and testing. Populates the database with rich mock data.

- **Usage**: `php artisan db:seed --class=DataSampleSeeder`

### C. Composite Module Seeders: `database/seeders/{ModuleName}ModuleSeeder.php`

Group related individual seeders into logical domain modules.

- **Examples**: `UserModuleSeeder` (User, Profile), `ContentModuleSeeder` (Category, Post)
- **Integration**: These `ModuleSeeder` classes MUST be registered inside `DataSampleSeeder.php`

---

## Performance & Security

| Rule | Requirement |
|------|-------------|
| **Manual Transactions** | Use `DB::beginTransaction()`, `commit()`, `rollBack()` for multi-query mutations. Simple single-query updates don't require transactions |
| **NEVER in Transactions** | NEVER wrap long-running or external tasks (file uploads, API calls) in DB transactions |
| **Concurrency Protection** | Use `$query->lockForUpdate()` within transactions for critical data mutations (seeding balances, unique codes) |
| **N+1 Prevention** | Plan eager-loading requirements when defining relationships. ALWAYS use `with()` before iterating |
| **Bulk Operations (>100 records)** | Use `insert()` or `upsert()` instead of `Model::create()` in loops. Chunk data into batches of 500 |
| **Data Integrity** | Seeders must respect all foreign key constraints and business rules |

### Bulk Insert Example

```php
// ❌ BAD — 1 query per record
foreach ($data as $item) {
    Model::create($item);
}

// ✅ GOOD — Bulk insert with manual timestamps
$chunks = array_chunk($data, 500);
foreach ($chunks as $chunk) {
    $now = now();
    foreach ($chunk as &$item) {
        $item['created_at'] = $now;
        $item['updated_at'] = $now;
    }
    Model::insert($chunk);
}
```

---

## Related

- [Enums](03-enums.md) - Enum values in factories
- [Implementation Workflow](06-implementation-workflow.md) - Complete database task workflow
