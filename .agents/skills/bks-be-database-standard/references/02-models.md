# Eloquent Models

Standards for implementing Eloquent models with proper type safety and documentation.

---

## Configuration

| Rule | Requirement |
|------|-------------|
| **1 Model = 1 Table** | Each model MUST correspond to exactly one table |
| **HasFactory** | `use HasFactory;` (Mandatory) |
| **SoftDeletes** | `use SoftDeletes;` (For critical entities like Users, Courses) |
| **LogsActivity** | `use LogsActivity;` (Mandatory for all domain Models — see [BR-G002](../../docs/system/business-rules.md)) |
| **Mass Assignment** | ALWAYS define `protected $fillable = [...];`. NEVER use `$guarded` |

---

## Activity Logging (BR-G002 — MANDATORY)

Every domain Model MUST implement `LogsActivity` with the following standard configuration:

```php
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Company extends Model
{
    use HasFactory, SoftDeletes, CompanyScope, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()          // Only log fields in $fillable
            ->logOnlyDirty()         // Only log when something actually changed
            ->dontLogEmptyChanges(); // Skip if no real change occurred
    }
}
```

> [!IMPORTANT]
> - Use `->logFillable()` — NEVER `->logAll()` (would leak sensitive fields)
> - NEVER include `password` or `remember_token` in `$fillable`
> - Spatie auto-logs `create`, `update`, `delete` via Model Observer — **no manual calls needed in Service** for standard CRUD

**When to manually call `activity()` in the Service layer:**
- Login / Logout (no model mutation)
- Permission / Role changes (needs `reason` context)
- Bulk operations (Observer would fire N times — group into 1 log entry)
- Force delete (log before permanent removal)

```php
// Service-level manual logging pattern
activity()
    ->causedBy($this->user)
    ->performedOn($model)
    ->withProperties(['action' => 'bulk_delete', 'count' => count($ids)])
    ->log('companies_bulk_deleted');
```

---

## Docblocks (IDE & API Support)

ALL models MUST include exhaustive docblocks for properties and relationships:

```php
/**
 * @property int $id
 * @property string $name
 * @property UserStatus $status
 * @property \Illuminate\Support\Carbon $created_at
 * @property-read \Illuminate\Database\Eloquent\Collection<Project> $projects
 * @mixin \Eloquent
 */
```

---

## Query Scopes

**NEVER** define logic directly in the Model. Create a trait in `App\Models\Scopes/{ModelName}Scope.php`:

```php
namespace App\Models\Scopes;

trait UserScope {
    public function scopeIsActive($query) {
        return $query->where('status', 1);
    }
}
```

Then use in the model:

```php
use App\Models\Scopes\UserScope;

class User extends Model
{
    use UserScope;
}
```

---

## Type Casting

ALWAYS add Enum casts for status/type columns:

```php
protected function casts(): array
{
    return [
        'status' => UserStatus::class,
        'created_at' => 'datetime',
    ];
}
```

---

## Related

- [Migrations](01-migrations.md) - Database schema design
- [Enums](03-enums.md) - Enum configuration and casting
