# Reference 04: Service Layer Standards

> **Scope**: Service classes, DTOs, Factories, and business logic implementation.

---

## 1. Two-Layer Architecture

The project has **two distinct business layers**, each with its own Factory and entry-point contract:

| Layer | Namespace | Factory | Called from | Input contract |
|---|---|---|---|---|
| **API** | `App\Services\Api\*` | `ApiFactory` | HTTP Controllers | FormRequest → **DTO** |
| **Background** | `App\Services\Background\*` | `BackgroundFactory` | Queue Jobs & Artisan Commands | **DTO** directly |
| **Common** | `App\Services\Common\*` | `CommonFactory` | Any layer | Plain arguments |

> [!IMPORTANT]
> **Factory Boundary Rule**: Each Factory MUST ONLY import and register services from its own namespace.
> - `ApiFactory` → `App\Services\Api\*` only
> - `BackgroundFactory` → `App\Services\Background\*` only
> - `CommonFactory` → `App\Services\Common\*` only (the ONLY factory callable from all layers)

---

## 2. No Cross-Calling Rule (MANDATORY)

Services at the same level (sibling services) **MUST NOT** call each other directly.

- **Example**: `Api\AuthService` cannot call `Api\MasterDataService`.
- **Reason**: Prevents circular dependencies and "spaghetti" logic.
- **How to Handle Shared Logic**:
    1. **Extract**: Identify the common logic.
    2. **Relocate**: Move it to a new/existing service in `app/Services/Common`.
    3. **Inject**: Both services now call the `Common` service via `CommonFactory`.

---

## 3. DTO — Data Transfer Objects (MANDATORY)

All **API and Background service methods** MUST accept a typed DTO as their primary input, NOT a raw `array`.

- **Location**: `app/DTOs/{Layer}/{Module}/`
    - API DTOs: `app/DTOs/Api/{Module}/{Action}Data.php`
    - Background DTOs: `app/DTOs/Background/{Module}/{Action}Data.php`
- **Structure**: `final readonly` class with named properties and a static `::from(array $data): self` factory.
- **Caller**: Controllers construct the DTO and pass it to the service.

```php
// ✅ CORRECT — DTO structure
final readonly class CreatePostData
{
    public function __construct(
        public string $title,
        public string $body,
        public ?int $categoryId = null,
    ) {}

    public static function from(array $data): self
    {
        return new self(
            title: $data['title'],
            body: $data['body'],
            categoryId: $data['category_id'] ?? null,
        );
    }
}

// ✅ CORRECT — Controller usage
$data = ApiFactory::getPostService()
    ->withUser($this->guard()->user())
    ->create(CreatePostData::from($request->validated()));

// ❌ FORBIDDEN — raw array as input
$data = ApiFactory::getPostService()->create($request->validated());
```

---

## 4. Service Context (`withUser`)

Services extend `App\Services\Base\Service` and maintain user context using the `withUser($user)` pattern.

```php
// In Controller
$data = ApiFactory::getPostService()
    ->withUser($this->guard()->user())
    ->create(CreatePostData::from($request->validated()));
```

Inside the service, access the user via `$this->user`.

---

## 5. Factory Lifecycle Details

- **Transient Registration**: `TableService` classes MUST be resolved as **transient** using `$app->bind()` (new instance per call) because they maintain query state.

```php
// ✅ CORRECT — Transient for TableService
$app->bind(PostTableService::class, fn () => new PostTableService());
```

- **Scoped Registration**: All other Services SHOULD be **scoped** using `$app->scoped()` (one instance per request) for performance.

```php
// ✅ CORRECT — Scoped for regular Service
$app->scoped(PostService::class, fn () => new PostService());
```

---

## 6. Deletion Policy

When implementing deletion logic in Services:

1. **Pre-deletion Constraints**: BEFORE deleting a record, check for business constraints.
    - *Example*: Cannot delete a Category if it contains active courses.
    - *Action*: Return a 400 error via `sendErrorResponse` if constraints fail.
2. **Cascading**: Soft delete/Flag related children if the business rule requires it.
3. **Soft vs Force**: Follow the module's policy (usually SoftDelete by default).

---

## 7. Database Transactions in Services

Use manual transactions **ONLY for features involving multiple database queries or when row-level locking is required**.

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

> [!CAUTION]
> **FORBIDDEN**: NEVER wrap long-running or external tasks inside a database transaction.
