---
name: bks-be-master-data-standard
description: Standards for implementing Master Data resources in the Laravel backend. Defines the registry pattern, driver usage, and integration with the MasterDataService.
---

# Master Data Implementation Standard

This skill defines the standard approach for adding and managing Master Data resources. Master Data provides centralized lookups (dropdowns, constants, configurations) for the frontend via a unified API.

> [!NOTE]
> **Already here = already decided.** By the time you invoke this skill, the requirement/task has already decided the data belongs in Master Data — the "Master Data vs a dedicated API" routing decision is made upstream during analysis (see `bks-requirement-analysis` → Technical Mapping). What matters when implementing here:
> - Master Data is **read-only** — never mutate state and never return a `JsonResource`; it returns **raw `{id, label}`-style arrays**.
> - Its purpose is **reusable choice inputs** (selects, dropdowns, autocomplete, radio/checkbox, tree pickers) — including search, item exclusion, and pre-`selected` items.
> - **One call, many sources**: a single request resolves multiple resources (`?resources[roles]={}&resources[departments]={}…`), so one round-trip fills all of a form's lookups instead of N separate API calls.

## Core Components

- **Controller**: `App\Http\Controllers\Api\MasterDataController`
- **Service**: `App\Services\Api\MasterDataService` (inherits from `Base\MasterDataService`)
- **Request**: `App\Http\Requests\MasterData\MasterDataShowRequest`
- **Logic Doc**: `docs/logic/user/master-data.md`
- **API Doc**: `docs/api/modules/master-data.md`

## Implementation Workflow

### 1. Register the Resource
Add a new entry to the `$availableResources` array in `backend/app/Services/Api/MasterDataService.php`.

### 2. Choose a Driver
Select the appropriate driver based on the data source:

| Driver | Constant | Usage |
|---|---|---|
| **Eloquent** | `self::DRIVER_ELOQUENT` | Simple list from a database table. |
| **Enum** | `self::DRIVER_ENUM` | Options from a PHP Enum class (must have `options()` method). |
| **Custom** | `self::DRIVER_CUSTOM` | Complex logic, trees, or filtered queries. |
| **Config** | `self::DRIVER_CONFIG` | Raw data from Laravel `config()`. |
| **Config Trans** | `self::DRIVER_CONFIG_TRANS` | Translated data from config. |

### 3. Implement Driver Logic

#### A. Eloquent Driver
Simple list from a model.
```php
'roles' => [
    'driver' => self::DRIVER_ELOQUENT,
    'target' => Role::class,
    'select' => ['id', 'name'],
],
```
**Input Example**: `GET /api/master-data?resources[roles]={}`

##### Eloquent Configuration Options
| Key | Required | Description |
|---|---|---|
| `target` | ✅ | Model class name. |
| `select` | ❌ | Array of columns to select. Use to avoid fetching unnecessary columns. |
| `order` | ❌ | Array `['column', 'direction']` to sort results. If omitted, results follow DB default order. |
| `where` | ❌ | Array of where conditions. Use to filter results by column values. |

**Example with `order` and `where`:**
```php
'active_roles' => [
    'driver' => self::DRIVER_ELOQUENT,
    'target' => Role::class,
    'select' => ['id', 'name'],
    'where' => [['is_active', '=', true]],  // Filter only active roles
    'order' => ['name', 'asc'],            // Sort alphabetically
],
```

#### B. Enum Driver
Extracts options from a PHP Enum.
```php
'user_statuses' => [
    'driver' => self::DRIVER_ENUM,
    'target' => UserStatus::class,
],
```
**Input Example**: `GET /api/master-data?resources[user_statuses]={}`


#### C. Config & Translation Driver
Maps config values to translation keys.
```php
'genders' => [
    'driver' => self::DRIVER_CONFIG_TRANS,
    'target' => 'master.genders', // config('master.genders') => [1 => 'male', 2 => 'female']
    'target_trans' => 'response.gender', // trans('response.gender.male') => 'Nam'
],
```
**Input Example**: `GET /api/master-data?resources[genders]={}`




#### D. Custom Driver
For complex logic, tree structures, or paginated lists with search and exclusion.

##### 1. Basic Tree Structure
```php
'departments' => [
    'driver' => self::DRIVER_CUSTOM,
    'target' => 'getDepartmentsTree',
],

protected function getDepartmentsTree(): array
{
    return Department::defaultOrder()->get()->toTree()->toArray();
}
```
**Input Example**: `GET /api/master-data?resources[departments]={}`


##### 2. Pagination, Search, and Selected Items
The `paginate()` helper automatically handles:
- **Search**: If `search_field` is provided and `?resources[users]={"search":"keyword"}` is sent.
- **Pagination**: Handles `page` and `per_page` params in the JSON object.
- **Selected Items**: If `?resources[users]={"selected":[1,2,3]}` is sent, these IDs will be fetched and placed at the top of the first page.

```php
'users_active' => [
    'driver' => self::DRIVER_CUSTOM,
    'target' => 'getActiveUsers',
],

protected function getActiveUsers(array $resource): array
{
    $query = User::query()
        ->select(['id', 'name', 'avatar', 'email'])
        ->where('status', UserStatus::ACTIVE)
        ->orderBy('name', 'asc');

    // 'name' is the field used for the 'search' parameter
    return $this->paginate($resource, $query, 'name');
}
```
**Input Example**: `GET /api/master-data?resources[users_active]={"search":"john","page":2,"per_page":15}`


##### 3. Custom Filtering and Exclusion
You can access raw parameters via `$resource['params']` to implement custom logic like exclusion.

```php
'available_mentors' => [
    'driver' => self::DRIVER_CUSTOM,
    'target' => 'getAvailableMentors',
],

protected function getAvailableMentors(array $resource): array
{
    $params = $resource['params'];
    $query = User::query()
        ->where('role', 'mentor')
        ->where('status', UserStatus::ACTIVE);

    // Manual exclusion logic
    if (!empty($params['exclude_ids'])) {
        $query->whereNotIn('id', (array) $params['exclude_ids']);
    }

    return $this->paginate($resource, $query, 'name');
}
```
**Input Example**: `GET /api/master-data?resources[available_mentors]={"exclude_ids":[5,9]}`


##### 4. Resource Authentication Context
Use `$this->user` to filter data based on the current user's permissions or organization.

```php
'my_team_members' => [
    'driver' => self::DRIVER_CUSTOM,
    'target' => 'getMyTeamMembers',
],

protected function getMyTeamMembers(array $resource): array
{
    if (!$this->user || !$this->user->department_id) {
        return [];
    }

    $query = User::query()
        ->where('department_id', $this->user->department_id)
        ->where('id', '!=', $this->user->id);

    return $query->get()->toArray();
}
```
**Input Example**: `GET /api/master-data?resources[my_team_members]={}`



### 4. Authentication (Optional)
Restrict access to a resource using the `auth` key. The user instance is accessible via `$this->user`.
```php
'sensitive_data' => [
    'driver' => self::DRIVER_CUSTOM,
    'target' => 'getSensitiveData',
    'auth' => ['admin', 'super-admin'], // Checks $this->user->isAdmin(), etc.
],
```

### 5. Array Conversion (Optional)
Set `convert_array` to `true` to ensure the result is a re-indexed array (0, 1, 2...). Use this when the driver returns a Collection with non-sequential keys (e.g., after `filter()` or when keyed by ID), which would otherwise cause JSON to serialize as an object instead of an array.
```php
'filtered_items' => [
    'driver' => self::DRIVER_ELOQUENT,
    'target' => Item::class,
    'select' => ['id', 'name'],
    'convert_array' => true,  // Forces Collection → array_values()
],
```

### 6. Documentation
Updating documentation is mandatory for all new master data resources.

#### 6.1 Business Logic Documentation
Update `docs/logic/user/master-data.md` (Vietnamese) to describe the data source, logic, and any special filtering/authentication applied. Add the new resource to the **AVAILABLE RESOURCES** table. **ALWAYS bump the document version (minor/major)** following the `bks-doc-logic-standard`.

Additionally:
- Ensure module index is synchronized (`docs/logic/user/index.md` and root `docs/logic/index.md` links remain valid).
- Every `BR-*` referenced in master-data logic docs MUST resolve in `docs/system/br-registry.md`.
- **BR Registry**: **MANDATORY**: If new Business Rules (`BR-*`) were introduced or existing ones updated, you MUST update `docs/system/br-registry.md` to reflect these changes.

#### 6.2 API Reference Documentation
Update `docs/api/modules/master-data.md` (Vietnamese). Every resource MUST be documented with its query format and response shape. Add the new resource to the **Available Resources** table.

**Standard Format for additional resource details:**
```markdown
#### 1.X [Resource Name]
- **Description**: [What data this resource provides]
- **Driver**: [Eloquent | Enum | Custom | etc.]
- **Input Example**: `GET /api/master-data?resources[[resource_name]]={}`
- **Response**:
```json
{
    "[resource_name]": [
        { "id": 1, "name": "Value 1" },
        { "id": 2, "name": "Value 2" }
    ]
}
```
```

### 7. Smoke Test (confirm the resource resolves)
Add a **smoke** test case in `backend/tests/Feature/Api/MasterDataTest.php` to confirm the resource you just registered actually resolves (happy path only):
```php
public function test_can_get_new_resource(): void
{
    $response = $this->actingAs($this->user, 'api')
        ->getJson('/api/master-data?resources[my_resource]={}');

    $response->assertStatus(200)
        ->assertJsonStructure(['data' => ['my_resource']]);
}
```

> [!CAUTION]
> **If the smoke test FAILS → fix the code NOW** (the driver/target/registration you just wrote is buggy). This is a smoke test, NOT the full suite. Comprehensive, objective coverage (per-resource auth, search/pagination/exclusion, edge cases) belongs to `bks-be-testing-standard`, and that skill **must not auto-fix** — it only reports pass/fail. See "Smoke Test vs Acceptance Test" below.

## Smoke Test vs Acceptance Test (mandatory boundary)

This skill writes **smoke tests only** (Section 7) — NOT the full suite.

| | Smoke Test (**this skill** — §7) | Acceptance Test (`bks-be-testing-standard`) |
|---|---|---|
| Purpose | Confirm the resource **resolves** | Verify it **meets the requirement**, full coverage |
| Source | Happy path of the just-registered resource | The requirement input (task/requirement/BR/logic doc) |
| Scope | Minimal: 1 valid request → 200 + correct structure | Full: per-resource auth, search/pagination/exclusion, edge |
| On FAIL | **FIX THE CODE NOW** — just-written code, a failure means a code bug | **NEVER fix** — only report pass/fail, the user decides |

> [!IMPORTANT]
> A failing smoke test = the code you just wrote is broken → **fix the code now**. Then STOP; comprehensive, objective coverage is owned by `bks-be-testing-standard`, and that skill **must not auto-fix**.

---

## Rules & Best Practices

1. **Naming**: Use `snake_case` for resource names (e.g., `user_roles`, `departments`).
2. **Raw Data**: Master Data returns raw arrays/collections, NOT `JsonResource` objects.
3. **Efficiency**: Use `select` in Eloquent drivers to avoid fetching unnecessary columns.
4. **Single Responsibility**: The `MasterDataService` should only handle data retrieval. Complex business logic should reside in dedicated domain services.
5. **No Observers**: Never trigger side effects or observers during Master Data retrieval.

## Execution Workflow

When executing a Master Data task from `docs/tasks/`, follow these phases strictly:

### Phase 1: Task & Context Audit
1. Read the task file.
2. Identify which resources need to be registered (names, drivers, targets).
3. Check that all `depends_on` tasks are completed.
4. **MANDATORY**: Read this entire SKILL.md before proceeding.

### Phase 2: Technical Design & Planning
1. For each resource, determine: name, driver, target, and configuration options.
2. **MANDATORY**: Create an `implementation_plan.md` artifact.
3. Note which resources need custom methods and plan their logic.
4. **STOP AND WAIT** for user approval before writing code.

### Phase 3: Step-by-Step Implementation
1. Register resources in `$availableResources` (Section 1–5 above).
2. Implement custom driver methods if needed (Section 3.D).
3. Add test cases in `MasterDataTest.php` (Section 7).

### Phase 4: Documentation & Audit
1. Update `docs/logic/user/master-data.md` (Section 6.1).
2. Update `docs/api/modules/master-data.md` (Section 6.2).
3. Audit: snake_case names, `select` on Eloquent, no side effects, tests pass.
4. Run `php artisan code:format`.

### Phase 5: Task Status Update
1. Update the task file checklist and set `status: completed`.
2. Create a `walkthrough.md` summarizing the implementation.

---

### Final Completion Checklist (MANDATORY)

**AI Agent MUST verify this checklist before ending the session:**

- [ ] **Code Quality**: `php artisan code:format` has been run.
- [ ] **Resource Registration**: All resources from the task are registered in `$availableResources`.
- [ ] **Driver Configuration**: Each resource uses the correct driver with appropriate options (`select`, `where`, `order`, `auth`).
- [ ] **Custom Methods**: Custom driver methods return raw arrays/collections (no `JsonResource`).
- [ ] **No Side Effects**: No observers or side effects are triggered during data retrieval.
- [ ] **Audit Log** (BR-G002): Master Data is **read-only** — no mutations occur, so `LogsActivity` is NOT required here. ✅ Skip.
- [ ] **Smoke test**: New resource smoke case in `MasterDataTest.php` passes (any failure was a code bug and was fixed). Full objective coverage delegated to `bks-be-testing-standard` (report-only, no auto-fix).
- [ ] **Logic Docs**: `docs/logic/user/master-data.md` updated with new resources in AVAILABLE RESOURCES table.
- [ ] **BR Registry**: `docs/system/br-registry.md` has been updated with all new or modified business rules.
- [ ] **API Docs**: `docs/api/modules/master-data.md` updated with query format and response shape for each new resource.
- [ ] **Task Status**: Task file checklist completed and frontmatter `status` set to `completed`.

---

## Validation Scripts

Run these scripts to verify master data compliance:

```bash
# Validate all backend structures (API, Command, Database, Job, Test)
php .agents/scripts/validate-backend.php /path/to/project
```

See `.agents/scripts/validate-backend.php` for detailed validation rules.
