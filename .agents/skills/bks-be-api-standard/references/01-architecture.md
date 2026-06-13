# Reference 01: Core Architecture & Global Coding Standards

> **Scope**: Core architecture flow and global coding standards applicable to ALL backend code.

---

## 1. Core Architecture Flow

**Applies to**: EVERY new feature or API endpoint.

```
Route → Middleware → FormRequest → Controller → Service → Controller → JsonResource → JSON Response
```

This unidirectional flow ensures:
- **Separation of concerns** - Each layer has a single responsibility
- **Testability** - Layers can be tested independently
- **Maintainability** - Changes are localized to specific layers

---

## 2. Global Backend Coding Standards

**Applies to**: ALL backend code (Models, Services, Controllers, Jobs, etc.)

### 2.1 No Inline Full Class Paths (FQN)

NEVER use full class paths (starting with `\`) directly in code or type hints. ALWAYS use a `use` statement at the top. This includes Root namespace classes.

> [!NOTE]
> **Docblock Exception**: `@mixin`, `@param`, `@return`, and `@var` docblocks MAY use FQN for IDE support and automated documentation tools (e.g., Scramble). Example: `/** @mixin \App\Models\User */`.

**Additional Rule**: No `$request->get()` — use `$request->input()` for general input or `$request->query()` for URL parameters.

```php
// ❌ BAD
public function boot(): void {
    \Laravel\Passport\Passport::tokensExpireIn(now()->addHours(2));
}

$clientId = $request->get('client_id');

try { ... } catch (\Exception $e) { ... }

/** @var \App\Models\User $user */

// ✅ GOOD
use Laravel\Passport\Passport;
use Exception;
use App\Models\User;

public function boot(): void {
    Passport::tokensExpireIn(now()->addHours(2));
}

$clientId = $request->input('client_id');

try { ... } catch (Exception $e) { ... }

/** @var User $user */
```

### 2.2 Localization

NEVER use hardcoded strings in **user-facing outputs** (API responses, validation messages, notifications). ALWAYS use the `trans()` helper.

```php
return $this->sendErrorResponse(trans('response.not_found'));
```

- **API responses & validation**: MUST use `trans()`.
- **Internal log messages** (`Log::info/error`): Use plain English strings. `trans()` is NOT required for logs.

### 2.3 Config Standard

> [!IMPORTANT]
> **Config Layer is Source of Truth**: All configurable values MUST be centralized in `config/`. `config()` calls do NOT need a fallback default across the entire codebase. If a key is missing, that is a **config bug**, not a code bug.

> [!CAUTION]
> **Review Exception**: When checking code for `bks-be-api-standard` compliance, the **absence of a fallback in `config()` is NOT a violation** in any layer (Controllers, Services, FormRequests, Jobs, etc.). Only flag `config()` usage if it references a key that does not exist in the centralized config files.

### 2.4 Security & Data Integrity

#### A. Database Transactions & Concurrency

**1. Manual Transaction Pattern (MANDATORY for Multi-Query/Locking)**

Use manual transaction pattern in the Service layer **ONLY for features involving multiple database queries or when row-level locking (`lockForUpdate`) is required**.

> [!CAUTION]
> **FORBIDDEN**: NEVER wrap long-running or external tasks (file uploads, image resizing, 3rd-party API calls) inside a database transaction. Perform these BEFORE starting the transaction or AFTER committing.

```php
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

**2. Application Atomic Locks**

To prevent a process from running twice simultaneously:

```php
$lock = Cache::lock("process-{$userId}", 10);
if ($lock->get()) {
    try {
        $this->executeProcess($userId);
    } finally {
        $lock->release();
    }
}
```

#### B. SQL Injection Prevention

Never interpolate variables into RAW statements. ALWAYS use parameterized bindings.

```php
// ✅ CORRECT
$query->whereRaw("name = ?", [$request->input('name')]);
```

#### C. Mass Assignment

Never pass `$request->all()` to mutations. ALWAYS use `$request->validated()`.

#### D. Insecure Direct Object References (IDOR)

Verify ownership via Policies or implicitly via Scopes.

```php
if ($this->guard()->user()->cannot('delete', $post)) {
    abort(403);
}
```

### 2.5 Mandatory Helpers

NEVER reimplement basic logic for strings, dates, files, numbers, or HTTP requests. ALWAYS check existing helpers in `app/Helpers/` first.

> [!IMPORTANT]
> **Before creating any utility/helper method**, you MUST first read all existing files in `app/Helpers/` to check if similar functionality exists.

| Helper | Purpose | Examples |
|---|---|---|
| `ResponseHelper` | Format uniform JSON responses | `sendResponse()` |
| `FileHelper` | Manage URLs, storage, and webp naming | `getFullUrl()`, `constructFileName()` |
| `DateHelper` | Format dates/times for UI | `formatDateTime()` |
| `StringHelper` | Slug, random code, unique generators | `uniqueCode()`, `slug()` |
| `PasswordHelper` | Password generation and validation | `generateSecure()` |
| `NumberHelper` | Money formatting, numeric OTP | `formatMoney()`, `generateNumericOTP()` |
| `HttpHelper` | HTTP GET/POST requests to external APIs | `get()`, `post()`, `postAsForm()` |
| `RequestHelper` | Request type detection | `isApi()` |

### 2.6 Logging Standards (MANDATORY)

**Applies to**: ALL Service operations and complex logic.

#### A. Database Mutations

ALWAYS log all database mutations (Create, Update, Delete) in the Service layer after a successful transaction.

```php
Log::info("User created successfully", [
    'user_id' => $this->user->id,
    'model' => 'User',
    'id' => $user->id,
    'payload' => $request->validated(),
]);
```

#### B. Complex Business Logic

Log entry points (inputs) and results for complex calculations, AI interactions, or core business rules.

```php
Log::info("Processing AI token calculation", ['user_id' => $userId, 'input' => $text]);
// ... logic ...
Log::info("AI token calculated", ['user_id' => $userId, 'tokens' => $tokens]);
```

#### C. Error Logging

Use `Log::error()` in catch blocks with full exception context.

```php
} catch (Exception $e) {
    Log::error("Failed to process payment", [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    throw $e;
}
```

### 2.7 Adapting External Code (MANDATORY)

> [!CAUTION]
> **FORBIDDEN**: Copy-pasting code from ANY source without fully adapting it to ALL project standards in this document.

**Applies to**: Code from task files, documentation examples, Stack Overflow, AI generated code, other projects, sample implementations, tutorials, blog posts.

When referencing code from ANY external source, you MUST verify and adapt EVERY aspect to match this skill's standards:

| Aspect | Required Adaptation |
|---|---|
| **Architecture** | Route → Middleware → FormRequest → Controller → Service → Controller → JsonResource → JSON Response |
| **Service Resolution** | `app(Service::class)` → `ApiFactory::{serviceName}()` or `BackgroundFactory::{serviceName}()` |
| **DTOs** | Raw arrays → `final readonly` class with `from()` factory method |
| **Type Hints** | Missing types → Explicit return types and parameter types |
| **Enum Values** | Raw integers/strings → `EnumName::CASE->value` with proper import |
| **Imports** | FQN usage → Proper `use` statements, alphabetically sorted |
| **Method Length** | Long methods → Split into private methods ≤ 30 lines with descriptive names |
| **Validation** | Simple/implicit validation → 3-layer validation (Presence + Type + Boundary) |
| **Transactions** | `DB::transaction()` closure → Manual transaction pattern with explicit begin/commit/rollback |
| **Logging** | No logging → Mandatory `Log::info()` for mutations, entry/exit points, and errors |
| **Error Handling** | Generic exceptions → Specific exception types with full context |
| **Naming** | CamelCase/snake_case variations → Follow project conventions (PascalCase classes, camelCase methods) |
| **Constants** | Magic numbers/strings → Named constants or Enum cases |
| **Localization** | Hardcoded strings → `trans()` helper with lang file entries |

**The Golden Rule**: If you copy ANY code from ANY source, you MUST rewrite it to follow EVERY standard in this document. **NEVER** assume external code is "good enough".

**Example transformation**:

```php
// ❌ BAD - External code copied verbatim (violates multiple rules)
public function handle($request) {
    $service = app(SomeService::class);
    $data = $request->all();
    $result = $service->process($data);
    return response()->json($result);
}

// ✅ GOOD - Fully adapted to ALL project standards
public function handle(SomeFormRequest $request): JsonResponse
{
    $service = ApiFactory::someService();
    $dto = SomeActionData::from($request->validated());
    
    Log::info('Processing started', ['dto' => $dto]);
    
    try {
        $result = $service->process($dto);
        Log::info('Processing completed', ['result_id' => $result->id]);
        return $this->sendSuccessResponse($result);
    } catch (DomainException $e) {
        Log::error('Processing failed', ['error' => $e->getMessage()]);
        return $this->sendErrorResponse(trans('api.some.error'));
    }
}
```

---

## 3. Database & Model Standards

**Applies to**: Working with database models, query scopes, or database operations.

### 3.1 Configuration

- 1 Model = 1 Table. MUST use `HasFactory` and define `$fillable`.
- **SoftDeletes**: Use `SoftDeletes` trait for critical entities (Users, Courses, etc.).
- **Docblocks**: MUST include `@property` for all columns/relations and `@mixin \Eloquent`.

### 3.2 Implementation Rules

- **No `env()` usage**: NEVER call `env()` directly in models or services. Use `config()` instead.
- **Query Scopes**: Define reusable logic in separate traits in `App\Models\Scopes`.

### 3.3 Performance

- **N+1 Prevention**: ALWAYS eager load relations with `with()`.
- **High-Performance Bulk Operations**:
    - **Avoid Loop-Create**: NEVER use `Model::create()` inside a large loop.
    - **Use Bulk Methods**: Prefer `insert()` or `upsert()` for efficiency.
    - **Batching**: Divide data into batches (e.g., `array_chunk($data, 500)`) to avoid DB packet size limits.
    - **Manual Metadata**: `insert()` bypasses model timestamps. Add `created_at`/`updated_at` manually if needed.

---

## 4. Enum Standards

**Applies to**: Defining statuses, roles, types, or fixed values.

### 4.1 Database Column Type (MANDATORY)

Enum status columns in migrations MUST use integer column types — NEVER `string` or DB-level `enum`:

| Cases | Column type | Method |
|---|---|---|
| ≤ 127 | `TINYINT` | `$table->tinyInteger('status')` |
| 128–32,767 | `SMALLINT` | `$table->smallInteger('status')` |

```php
// ✅ CORRECT
$table->tinyInteger('status')->default(UserStatus::ACTIVE->value);

// ❌ FORBIDDEN
$table->string('status');
$table->enum('status', ['active']);
```

### 4.2 PHP Enum Class Rules

- **Backed type**: MUST be `int` for status/state columns. Use `string` only for external identifiers.
- **Trait**: MUST use `HasEnumStaticMethods`.
- **Values**: Start from `1` — reserve `0`/`null` for "not set".
- **`label()` (MANDATORY)**: Every enum MUST implement `label()` returning `trans('enums.{name}.{case}')`.
- **Lang file**: ALWAYS add entries to `lang/en/enums.php` and `lang/vi/enums.php`.

```php
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

### 4.3 API Response Format (MANDATORY)

In **JsonResources**, ALWAYS expose BOTH the raw integer AND the localized label:

```php
'status'       => $this->status->value,  // int — for FE conditional logic
'status_label' => $this->status->label(), // string — for display only
```

> [!CAUTION]
> **FORBIDDEN**: Returning only `$this->status->label()` without `->value`.

### 4.4 Other Integration

- **Model Cast**: `'status' => UserStatus::class` in `casts()`.
- **Validation**: `Rule::enum(UserStatus::class)` in FormRequests.
- **Migration default**: `UserStatus::ACTIVE->value` — NEVER a raw integer literal.
