---
name: bks-be-database-standard
description: Unified standalone skill for executing database infrastructure tasks. Covers Migrations, Models, Enums, Factories, and Seeders. ZERO external skill dependencies.
---

# Laravel Database Infrastructure Standards

Complete, self-contained standards for implementing database infrastructure: Migrations, Models, Enums, Factories, and Seeders.

---

## Quick Reference

| Component | Standard |
|-----------|----------|
| **Migrations** | Integer columns for enums (`TINYINT`/`SMALLINT`), robust `down()` methods |
| **Models** | `HasFactory`, `SoftDeletes`, `$fillable`, Scope Traits |
| **Enums** | `int` backed (start from 1), `label()` method, `HasEnumStaticMethods` trait |
| **Factories** | `fake()->realText()` for realistic content |
| **Seeders** | 15/10/1 volume rules, `DatabaseSeeder` vs `DataSampleSeeder` |

---

## Reference Documentation

### Database Structure
- [01-migrations.md](references/01-migrations.md) - DDL standards, database design table format
- [02-models.md](references/02-models.md) - Eloquent configuration, docblocks, query scopes

### Type Safety
- [03-enums.md](references/03-enums.md) - PHP Enums with int backing, `label()` method, integration

### Data Generation
- [04-factories-seeders.md](references/04-factories-seeders.md) - Realistic factories, seeder architecture, bulk operations

### Documentation & Workflow
- [05-logic-documentation.md](references/05-logic-documentation.md) - Business logic doc format
- [06-implementation-workflow.md](references/06-implementation-workflow.md) - Complete workflow with checklist

---

## Critical Constraints

| Rule | Constraint |
|------|------------|
| **Enum Columns** | ALWAYS use `TINYINT`/`SMALLINT` for enum values. NEVER use `string` or DB `enum()` |
| **Enum Values** | Start from `1`, not `0`. `0`/`null` means "not set" |
| **Enum Backing** | Use `int` for status/state. `string` ONLY for external identifiers (OAuth, ISO codes) |
| **Mass Assignment** | ALWAYS define `$fillable`. NEVER use `$guarded` |
| **No FQN** | NEVER use inline class paths. ALWAYS use `use` statements |
| **No `env()`** | NEVER call `env()` directly. Use `config()` |
| **Transactions** | NEVER wrap long-running tasks (file uploads, API calls) in DB transactions |
| **Method Length** | Methods MUST be ≤ 30 lines; split into private methods with descriptive names if longer |
| **External Code** | When copying from external sources, adapt to project patterns: use Enum constants (not raw values), add `use` statements, follow naming conventions |

---

## Quick Start: Implementation Workflow

1. **Plan**: Analyze requirements, design database structure
2. **Migrations**: Create DDL with proper column types and indexes
3. **Enums**: Create int-backed enums with `label()` method
4. **Models**: Implement Eloquent with casts, fillable, docblocks
5. **Scopes**: Create trait in `App\Models\Scopes/` for query logic
6. **Factories**: Use `fake()->realText()` for realistic data
7. **Seeders**: Follow 15/10/1 volume rules, register in `DataSampleSeeder`
8. **Verify**: Run `php artisan migrate:fresh --seed`
9. **Format**: Run `php artisan code:format`
10. **Document**: Create business logic doc in `docs/logic/{module}/`

See [06-implementation-workflow.md](references/06-implementation-workflow.md) for complete details.

---

## Code Examples

### Enum Definition

```php
namespace App\Enums;

use App\Traits\Enums\HasEnumStaticMethods;

enum UserStatus: int
{
    use HasEnumStaticMethods;

    case ACTIVE   = 1;
    case INACTIVE = 2;

    public function label(): string
    {
        return trans('enums.user_status.' . strtolower($this->name));
    }
}
```

> [!IMPORTANT]
> **ALWAYS add lang entries in `lang/en/enums.php`** when creating an enum:
> ```php
> 'user_status' => [
>     'active'   => 'Active',
>     'inactive' => 'Inactive',
> ],
> ```

### Migration with Enum

```php
$table->tinyInteger('status')->default(UserStatus::ACTIVE->value);
```

### Model Configuration

```php
class User extends Model
{
    use HasFactory, SoftDeletes, UserScope;

    protected $fillable = ['name', 'email', 'status'];

    protected function casts(): array
    {
        return [
            'status' => UserStatus::class,
            'created_at' => 'datetime',
        ];
    }
}
```

---

## Smoke Test vs Acceptance Test (mandatory boundary)

This skill only does a **smoke verify** — NOT the full data test suite.

| | Smoke Verify (**this skill**) | Acceptance Test (`bks-be-testing-standard`) |
|---|---|---|
| How | `php artisan migrate:fresh --seed` runs clean | Integrity/migration/soft-delete/audit tests from the requirement |
| Purpose | Confirm migration/model/seeder **run** | Verify it **meets the requirement**, full coverage |
| On FAIL | **FIX THE CODE NOW** — the just-written migration/model is buggy | **NEVER fix** — only report pass/fail, the user decides |

> [!IMPORTANT]
> If `migrate:fresh --seed` fails → **fix the code now** (the just-written code). Once it runs clean, STOP; deep data tests (data integrity, soft-delete, audit trail, migration rollback) are owned by `bks-be-testing-standard`, and that skill **must not auto-fix**.

---

## Final Completion Checklist

Before ending any database task:

- [ ] `php artisan code:format` has been run
- [ ] All migrations tested with `migrate:rollback`
- [ ] `php artisan migrate:fresh --seed` passes
- [ ] Business logic docs in `docs/logic/` are created/updated
- [ ] `docs/system/br-registry.md` updated with any new BR-* rules
- [ ] Task file statuses updated to `completed` (if applicable)

---

## Validation Scripts

Run these scripts to verify database compliance:

```bash
# Validate all backend structures (API, Command, Database, Job, Test)
php .agents/scripts/validate-backend.php /path/to/project
```

See `.agents/scripts/validate-backend.php` for detailed validation rules.
