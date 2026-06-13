# Database Migrations (DDL)

Standards for creating and managing database schema changes.

---

## Naming & Structure

| Rule | Requirement |
|------|-------------|
| **Filenames** | Follow Laravel's timestamped convention: `YYYY_MM_DD_HHMMSS_create_table_name_table.php` |
| **Indexes** | Always index columns used in `where` clauses, especially foreign keys and status columns |
| **Robust `down()`** | The `down()` method MUST perfectly reverse the `up()` method |

### `down()` Method Requirements

- If `up()` adds a column, `down()` must drop it
- If `up()` creates a table, `down()` must drop it

**Rollback Verification**: After creating a migration, you MUST run `php artisan migrate:rollback` to ensure the `down()` method works without errors.

---

## Database Design Table Format

When documenting or proposing database changes, ALWAYS use the following table format to ensure all SQL attributes are captured:

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| id | bigint | 20 | NO | YES | — | KEPT | Primary key | — |
| name | string | 255 | NO | NO | — | ADDED | Display name | — |

**Action Values**: `KEPT` | `ADDED` | `MODIFIED` | `DELETED` | `MOVED_TO:{table}` | `MOVED_FROM:{table}` | `SNAPSHOT`

---

## Indexing Best Practices

Proper indexing is critical for query performance. Follow these guidelines when creating migrations.

### Index Categories

| Category | When to Index | Examples |
|----------|---------------|----------|
| **Foreign Keys** | ALWAYS index FK columns | `user_id`, `order_id`, `category_id` |
| **Search Fields** | Frequently searched/filtered | `email`, `name`, `code`, `status` |
| **Sort Fields** | Frequently ordered | `created_at`, `sort_order`, `priority` |
| **Composite** | Multi-column queries | `[status, created_at]`, `[user_id, status]` |

### Foreign Key Indexes

**ALWAYS** index foreign key columns for JOIN performance:

```php
// ✅ CORRECT: Index FK columns
Schema::create('orders', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->index(); // FK + index
    $table->foreignId('category_id')->constrained()->index();
    $table->timestamps();
});
```

### Search Field Indexes

Index columns used in `WHERE` clauses:

```php
// ✅ CORRECT: Index searchable columns
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->string('sku')->unique(); // Unique = indexed
    $table->string('name');
    $table->string('status')->default('active')->index();
    $table->decimal('price', 12, 2)->index(); // Range queries
    $table->timestamps();
    
    // Composite index for common filter combinations
    $table->index(['status', 'created_at']);
});
```

### Composite Indexes

Use composite indexes when filtering by multiple columns:

```php
// ✅ CORRECT: Composite index for multi-column WHERE
$table->index(['status', 'priority', 'created_at']);

// Query: WHERE status = 'active' AND priority = 1 ORDER BY created_at
```

**Order matters**: Place higher cardinality columns first.

### Index Types

| Type | Use Case | Laravel Syntax |
|------|----------|----------------|
| **Standard** | Equality/range queries | `$table->index('email')` |
| **Unique** | Unique constraints | `$table->unique('code')` |
| **Fulltext** | Text search (MySQL) | `$table->fullText('description')` |
| **Spatial** | Geographic data | `$table->spatialIndex('location')` |

### Performance Guidelines

| Rule | Rationale |
|------|-----------|
| **Don't over-index** | Each index slows down INSERT/UPDATE |
| **Index nullable sparingly** | NULL distribution affects efficiency |
| **Consider index size** | Large TEXT/BLOB columns shouldn't be indexed |
| **Monitor slow queries** | Use `DB::enableQueryLog()` to find missing indexes |

### Common Patterns

```php
// Soft deletes with status filter
$table->softDeletes();
$table->index(['deleted_at', 'status']); // For queries excluding soft deletes

// Multi-tenant tables
$table->foreignId('tenant_id')->index();
$table->index(['tenant_id', 'user_id']); // Scope queries first

// Status + date range (common reporting pattern)
$table->index(['status', 'created_at']);
```

---

## Related

- [Models](02-models.md) - Eloquent model configuration
- [Enums](03-enums.md) - Enum column types in migrations
