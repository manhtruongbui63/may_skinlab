# PHP Enums (Type Safety)

Standards for implementing type-safe enums with proper database integration and localization.

---

## Database Column Type (MANDATORY)

> [!IMPORTANT]
> **ALWAYS use integer columns for enum values in migrations. NEVER use strings for status/state columns.**

| Number of cases | Column type | Laravel method |
|----------------|-------------|----------------|
| ≤ 127 values | `TINYINT` | `$table->tinyInteger('status')` |
| 128 – 32,767 values | `SMALLINT` | `$table->smallInteger('status')` |

```php
// ✅ CORRECT — migration column
$table->tinyInteger('status')->default(UserStatus::INACTIVE->value);

// ❌ FORBIDDEN — string column for status
$table->string('status')->default('inactive');
$table->enum('status', ['active', 'inactive']); // DB-level enum is also forbidden
```

---

## PHP Enum Class (MANDATORY)

- **Location**: `app/Enums/`
- **Backed type**: MUST be `int` for all status/state/lifecycle columns
  - **Exception**: Use `string` backed Enums ONLY for external integration identifiers (e.g., OAuth provider names, ISO codes) where a numeric value has no meaning
- **Traits**: MUST use `HasEnumStaticMethods`
- **Naming**: `PascalCase` for Enum name, `SCREAMING_SNAKE_CASE` for cases
- **Values**: Start from `1` (not `0`) so that `0` / `null` unambiguously means "not set"

### Mandatory `label()` Method

Every enum MUST implement `label()` returning a localized string. This is the ONLY way enum values should be presented to the frontend.

```php
// ✅ CORRECT — complete enum class
namespace App\Enums;

use App\Traits\Enums\HasEnumStaticMethods;

enum UserStatus: int
{
    use HasEnumStaticMethods;

    case ACTIVE = 1;
    case INACTIVE = 2;

    public function label(): string
    {
        return trans('enums.user_status.' . strtolower($this->name));
    }
}

// ❌ FORBIDDEN — no label(), string-backed for status
enum UserStatus: string
{
    case ACTIVE = 'active'; // Never store string labels in DB
}
```

### Lang File Setup (MANDATORY)

**Every enum MUST have corresponding translation entries.** Do not create an enum without adding lang entries.

**Location**: `lang/en/enums.php`

**Structure**: Key = snake_case of enum name, value = array with key as lowercase case name

```php
// ✅ CORRECT — lang/en/enums.php
return [
    'user_status' => [
        'active'   => 'Active',
        'inactive' => 'Inactive',
    ],
    'task_priority' => [
        'low'    => 'Low',
        'medium' => 'Medium',
        'high'   => 'High',
    ],
];
```

**Pattern for `label()` method**:
```php
return trans('enums.{enum_snake_case}.' . strtolower($this->name));
// Example: UserStatus -> enums.user_status.{case_name}
// Example: TaskPriority -> enums.task_priority.{case_name}
```

**Checklist when creating an enum**:
- [ ] Create enum file at `app/Enums/{Name}.php`
- [ ] Add lang entries in `lang/en/enums.php`
- [ ] Test `UserStatus::ACTIVE->label()` returns correct string

---

## Integration

| Layer | Requirement |
|-------|-------------|
| **Model Cast** | ALWAYS add to `casts()`: `'status' => UserStatus::class` |
| **Validation** | Use `Rule::enum(UserStatus::class)` in FormRequests |
| **Migration Default** | Use `UserStatus::ACTIVE->value` (integer) — NEVER a raw integer literal |
| **API Response** | Expose BOTH raw integer value AND label: `'status' => $this->status->value, 'status_label' => $this->status->label()` |
| **Database Storage** | NEVER return only a string label. NEVER store `label()` output in the database |

---

## Related

- [Migrations](01-migrations.md) - Enum column types
- [Factories & Seeders](04-factories-seeders.md) - Enum usage in seeders
