# Reference 02: Controller & Authentication Standards

> **Scope**: API Controllers, Authentication, Middleware configuration, and Response standards.

---

## 1. Thin Orchestrator Rule (MANDATORY)

Controllers MUST be "thin". They are only responsible for receiving input, performing authorization, and orchestrating the request flow.

- **NO Business Logic**: Controllers MUST NOT contain business logic. All logic MUST reside in the Service layer.
- **Single Service Call**: Controllers SHOULD call exactly ONE service method through its corresponding Factory.
- **Validation**: Controllers rely on `FormRequests` for input validation. Use `$request->validated()` to pass safe data to services.

---

## 2. Standard Method Naming (Traditional)

Standardize method names to match traditional Laravel resourceful routing:

| Method | Purpose |
|---|---|
| `index` | Paginated collection of items |
| `store` | Create and save a new item |
| `show` | Single item lookup by ID |
| `update` | Existing item modification |
| `destroy` | Item deletion |
| `destroyBatch` | Bulk deletion of items |
| `updateBatch` | Bulk modification of items |

---

## 3. Inheritance & Middleware

MUST extend guard-specific BaseController and register middleware in `__construct()` using base helper methods:

- `$this->authMiddleware()`: Automatically resolves to `auth:user` based on the controller's namespace.
- `$this->guestMiddleware()`: Automatically resolves to `guest:user`.

```php
public function __construct()
{
    // Auth required for all except 'login'
    $this->middleware($this->authMiddleware())->except(['login']);
    
    // Auth forbidden for 'login' (guests only)
    $this->middleware($this->guestMiddleware())->only(['login']);
}
```

| Namespace | Base Class | Guard |
|---|---|---|
| `App\Http\Controllers\Api` | `Api\BaseController` | `user` |

---

## 4. Auth Logic

- Use `$this->guard()->user()` for context.
- Login endpoints MUST use `HasRateLimiter` trait and Tag as `@unauthenticated`.

---

## 5. Standardized Responses

Controllers MUST use `ResponseHelper` methods (inherited from BaseController) for all responses.

| Status | Code | Method | Usage |
|---|---|---|---|
| Success | 200 | `sendSuccessResponse($data)` | Data retrieval, Success mutations |
| Bad Request | 400 | `sendErrorResponse($msg)` | Business rule violations (not validation) |
| Unauthorized | 401 | - | Handled by Sanctum |
| Forbidden | 403 | `abort(403)` | Permission/Policy failure |
| Not Found | 404 | `sendErrorResponse($msg, null, null, 404)` | Record not found |
| Validation | 422 | - | Handled automatically by FormRequest |

---

## 6. Rate Limiting for Auth Endpoints

When implementing login or authentication endpoints:

```php
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controllers\HasMiddleware;
use App\Http\Controllers\Traits\HasRateLimiter;

class AuthController extends BaseController
{
    use HasRateLimiter; // Include this trait

    public function __construct()
    {
        // Rate limiting for login
        $this->middleware('throttle:5,1')->only(['login']);
    }

    /**
     * @unauthenticated
     */
    public function login(LoginRequest $request): JsonResponse
    {
        // Implementation
    }
}
```
