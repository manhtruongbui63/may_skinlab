# Reference 03: Validation Standards

> **Scope**: FormRequest validation, rule layers, foreign keys, uniqueness, and business rule validation.

---

## 1. Principles

1. **Always use FormRequests**: Do not use `$request->validate()` in controllers.
2. **Action-Specific Requests**: Create separate classes (e.g., `CreateRequest` vs `UpdateRequest`) if rules differ.
3. **Mandatory Localization**: Localize all attributes using the `attributes()` method.

```php
public function attributes(): array {
    return [
        'name' => trans('attributes.name'),
        'email' => trans('attributes.email'),
    ];
}
```

4. **Centralized Limits**: Use constants in `config/validate.php` for common limits.
5. **SoftDeletes / Uniqueness**: Create a per-model unique Rule class for uniqueness while excluding soft-deleted records.
6. **Complex Logic**: When validation involves complex business rules, create a custom **Rule class** in `app/Rules`.
7. **Rule Completeness**: Every field MUST have rules covering: **Presence**, **Data Type**, and **Boundaries**.
8. **Array Format (MANDATORY)**: Rules MUST be defined as an array of strings, not pipe-separated.

```php
public function rules(): array
{
    return [
        'name' => [
            'required',
            'string',
            'max:' . config('validate.max_length.name'),
        ],
    ];
}
```

---

## 2. Mandatory Rule Layer (Every Field MUST Have All 3)

| Layer | Purpose | Required Rules | Example |
|---|---|---|---|
| **1. Presence** | Is the field required or optional? | `required`, `nullable`, `sometimes` | `required`, `nullable` |
| **2. Data Type** | What type of data is expected? | Must match DB column type | `string`, `integer`, `numeric`, `boolean`, `array`, `date` |
| **3. Boundaries** | What are the min/max limits? | Must reference `config('validate.*')` | `max:`, `min:`, `between:` |

> [!NOTE]
> For `array` types, the **Boundary** layer MUST include a `max:` rule to limit the number of elements.

### Detailed Data Type → Rule Mapping

| DB Column Type | Validation Type Rule | Additional Rules | Config Reference |
|---|---|---|---|
| `VARCHAR(n)` | `string` | `max:` must match `n` | `config('validate.max_length.*')` |
| `TEXT` | `string` | `max:65535` | `config('validate.max_length.text')` |
| `INT` / `BIGINT` | `integer` | Optional `min:1` for FK | — |
| `TINYINT` (boolean-like) | `boolean` | — | — |
| `TINYINT` / `SMALLINT` (enum) | `Rule::enum(...)` | Must use Enum class | — |
| `DECIMAL(p,s)` | `numeric` | `between:0,999999.99` | `config('validate.max_value.*')` |
| `DATE` | `date` | `date_format:Y-m-d` | — |
| `DATETIME` / `TIMESTAMP` | `date` | `date_format:Y-m-d H:i:s` | — |
| `ARRAY` | `array` | `max:` | `config('validate.max_count.array')` |

### Complete Field Validation Example (All 3 Layers)

```php
public function rules(): array
{
    return [
        // Layer 1: Presence → required
        // Layer 2: Type → string
        // Layer 3: Boundary → max from config
        'name' => [
            'required',
            'string',
            'max:' . config('validate.max_length.name'),
        ],

        // Nullable field still needs all 3 layers
        'description' => [
            'nullable',
            'string',
            'max:' . config('validate.max_length.text'),
        ],

        // FK field — integer type + min:1
        'category_id' => [
            'nullable',
            'integer',
            'min:1',
            Rule::exists('categories', 'id')->whereNull('deleted_at'),
        ],

        // Enum field — use Rule::enum()
        'status' => [
            'required',
            Rule::enum(UserStatus::class),
        ],

        // Numeric field with min/max from config
        'price' => [
            'required',
            'numeric',
            'min:' . config('validate.min_value.price', 0),
            'max:' . config('validate.max_value.numeric'),
        ],

        // Array field with max count from config
        'tags' => [
            'nullable',
            'array',
            'max:' . config('validate.max_count.array'),
        ],
    ];
}
```

---

## 3. Foreign Key ID Validation (Soft-Delete Aware)

When validating a field that references another model's ID, you MUST check:

1. **Data type**: `integer` (or `numeric` for non-integer PKs)
2. **Minimum value**: `min:1` to reject zero and negative IDs
3. **Existence**: The referenced record must exist
4. **Soft-delete awareness**: If the referenced model uses `SoftDeletes`, the validation MUST exclude soft-deleted records

```php
// ✅ CORRECT — FK to a soft-deletable model
'manager_id' => [
    'nullable',
    'integer',
    'min:1',
    Rule::exists('users', 'id')->whereNull('deleted_at'),
],

// ✅ CORRECT — FK to a non-soft-deletable model
'role_id' => [
    'required',
    'integer',
    'min:1',
    'exists:roles,id',
],

// ❌ FORBIDDEN — Missing soft-delete check
'manager_id' => [
    'nullable',
    'integer',
    'exists:users,id',  // Will match soft-deleted users!
],

// ❌ FORBIDDEN — Missing min:1
'manager_id' => [
    'nullable',
    'integer',
    Rule::exists('users', 'id')->whereNull('deleted_at'),
],
```

> [!CAUTION]
> **Always check the Model to determine if it uses `SoftDeletes`** before writing FK validation.

### Array of FK IDs

```php
'department_ids' => [
    'nullable',
    'array',
    'max:' . config('validate.max_count.array'),
],
'department_ids.*' => [
    'integer',
    'min:1',
    Rule::exists('departments', 'id')->whereNull('deleted_at'),
],
```

---

## 4. Unique Validation (Create vs Update)

### On Create

Use a simple `unique:` rule string or `Rule::unique()`:

```php
'email' => [
    'required',
    'email',
    'max:' . config('validate.max_length.email'),
    'unique:users,email',
],
```

### On Update (MANDATORY: Must Ignore Current Record)

When updating, the unique rule MUST ignore the current record's ID using `Rule::unique()->ignore()`.

```php
// ✅ CORRECT — Update with unique ignore
public function rules(): array
{
    $departmentId = $this->route('department');

    return [
        'code' => [
            'required',
            'string',
            'max:' . config('validate.max_length.code'),
            Rule::unique('departments', 'code')->ignore($departmentId),
        ],
    ];
}

// ❌ FORBIDDEN — Will always fail on update
'code' => [
    'required',
    'string',
    'unique:departments,code',
],
```

### Unique with Soft-Deleted Records

**Option A — Built-in Rule (recommended for simple cases):**
Laravel's `Rule::unique()` automatically excludes soft-deleted records.

**Option B — Custom Rule Class (for strict uniqueness across ALL records):**

```php
// app/Rules/DepartmentUniqueCodeRule.php
use App\Models\Department;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class DepartmentUniqueCodeRule implements ValidationRule
{
    public function __construct(
        protected ?int $excludeId = null,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $query = Department::withTrashed()->where('code', $value);

        if ($this->excludeId) {
            $query->where('id', '<>', $this->excludeId);
        }

        if ($query->exists()) {
            $fail(trans('validation.unique'));
        }
    }
}
```

---

## 5. Business Rule Validation

When the task involves business rules beyond simple data type/format checks, create a custom Rule class in `app/Rules`:

**When to create a custom Rule:**
- Cross-field dependencies (e.g., `end_date` must be after `start_date`)
- Database-state checks (e.g., max children count, depth limit)
- Complex format requirements (e.g., password policy)
- Composite uniqueness (e.g., unique combination of `name` + `category_id`)

```php
// Example: Max depth validation for hierarchical data
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class CheckMaxDepthRule implements ValidationRule
{
    public function __construct(
        protected int $maxDepth = 3,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $depth = $this->calculateDepth($value);
        if ($depth > $this->maxDepth) {
            $fail(trans('validation.max_depth_exceeded', ['max' => $this->maxDepth]));
        }
    }
}
```

> [!NOTE]
> For cross-field dependencies (e.g., `end_date > start_date`), use `after:` or `after_or_equal:` validation rules when possible.

---

## 6. Validation Limit Config Reference

> [!IMPORTANT]
> **Config Standard**: All validation limits MUST be centralized in `config/validate.php`. The project config layer itself is the single source of truth. `config()` calls within validation rules do NOT need a fallback default — if a key is missing, that is a **config bug**, not a validation bug.

> [!CAUTION]
> **Review Exception**: When checking code for `bks-be-api-standard` compliance, the **absence of a fallback in `config()` inside FormRequests is NOT a violation**. Only flag `config()` usage if it references a key that does not belong in `config/validate.php`.

All validation limits MUST be centralized in `config/validate.php`:

```php
// config/validate.php
return [
    'max_length' => [
        'name'    => 50,    // VARCHAR(50) in migration
        'email'   => 255,   // VARCHAR(255)
        'code'    => 50,
        'string'  => 255,
        'text'    => 65535,  // TEXT column
    ],
    'min_length' => [
        'phone' => 10,
    ],
    'max_value' => [
        'numeric'  => 9000000,
        'quantity' => 99,
        'percent'  => 100,
    ],
    'min_value' => [
        'quantity' => 1,
        'percent'  => 0,
        'per_page' => 1,
    ],
    'max_count' => [
        'array' => 1000,
    ],
];
```

> [!IMPORTANT]
> When a migration creates a new column with a specific size, you MUST:
> 1. Add the entry to `config/validate.php`
> 2. Reference it as `'max:' . config('validate.max_length.column_name')`
> 3. The config value MUST exactly match the migration column size.

---

## 7. Anti-patterns (FORBIDDEN)

- **Hardcoded Strings**: Using strings for attributes or error messages. Use `trans()`.
- **Magic Numbers**: Hardcoding lengths (e.g., `max:255`). Use `config('validate.max_length.*')`.
- **Pipe Strings**: Using pipe-separated strings. ALWAYS use an array.
- **Missing Guards**: Using `$this->user()` without a guard parameter.
- **Controller Validation**: Calling validation logic inside a controller.
- **Missing Presence**: A field without `required`, `nullable`, or `sometimes`.
- **Missing Type**: A field without an explicit type rule.
- **Missing Boundary**: A `string` field without `max:`, a `numeric` field without `min:/max:`.
- **Bare FK `exists`**: An FK field without `min:1` and soft-delete check.
- **Simple unique on update**: Using `'unique:table,column'` string on an UpdateRequest without `ignore()`.

---

## 8. Custom Rule Naming

Custom rules in `app/Rules` MUST follow the `{Name}Rule` naming convention:

- ✅ `UserUniqueRule.php`
- ✅ `PasswordRule.php`
- ✅ `CheckMaxDepthRule.php`
- ❌ `UserUnique.php` (missing Rule suffix)
- ❌ `ValidateDepth.php`

---

## 9. Validation Audit Checklist (MANDATORY)

Before completing any FormRequest, verify ALL items:

- [ ] **Presence**: Every field has `required`, `nullable`, or `sometimes`.
- [ ] **Data Type**: Every field has an explicit type rule matching its DB column type.
- [ ] **Boundaries**: Every `string` has `max:` from config. Every `numeric` has `min:/max:`.
- [ ] **Config Reference**: No hardcoded numbers — all limits come from `config('validate.*')`.
- [ ] **Config Accuracy**: Config values match the migration column sizes exactly.
- [ ] **FK `min:1`**: All FK fields have `min:1` to reject zero/negative IDs.
- [ ] **FK Soft-Delete**: All FK fields referencing a soft-deletable model use `whereNull('deleted_at')`.
- [ ] **Unique on Create**: Simple `'unique:table,column'` or `Rule::unique()` — correct.
- [ ] **Unique on Update**: Uses `Rule::unique('table','column')->ignore($id)`.
- [ ] **Unique Soft-Delete**: Decided whether soft-deleted values can be reused.
- [ ] **Enum Validation**: Status/type fields use `Rule::enum(EnumClass::class)`.
- [ ] **Business Rules**: Task-specific business validation rules are implemented as custom Rule classes.
- [ ] **Localization**: All field names are localized via `attributes()` method using `trans()`.
- [ ] **Array Format**: All rules are array format, not pipe-delimited strings.
- [ ] **Array Fields**: Array fields have a `max:` rule from `config('validate.max_count.array')`.
- [ ] **Array Children**: Array children (`field.*`) follow the 3-layer rule explicitly.
