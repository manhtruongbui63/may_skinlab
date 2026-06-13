# System Architecture

Hệ thống bao gồm **Laravel 13 Backend** và **Next.js 16 Frontend**, giao tiếp qua REST API.

```text
┌──────────────────────────┐
│      REST API (JSON)     │
├────────────┬─────────────┤
│  frontend  │   backend   │
│ (Next.js)  │  (Laravel)  │
└────────────┴─────────────┘
```

---

## Backend Architecture

### Request Flow (Strict Unidirectional)

```text
Route → Middleware → FormRequest → Controller → Service → Controller → JsonResource → JSON Response
```

Mọi request đều tuân theo flow này.

### Directory Structure

```text
backend/app/
├── Console/          # Artisan commands
│   └── Commands/
│       └── CodeFormat.php    # php artisan code:format
├── DTOs/             # Data Transfer Objects
│   ├── Api/
│   └── Background/
├── Enums/            # PHP Enums (UserStatus)
├── Exceptions/       # Custom exceptions (InputException, NotFoundException)
├── Factories/        # Service factories
│   ├── ApiFactory.php        # → Services\Api\* (AuthService, UserService, UserTableService, MasterDataService)
│   ├── CommonFactory.php     # → Services\Common\* (FileService)
│   └── BackgroundFactory.php # → Services\Background\*
├── Helpers/          # Static utility classes (ResponseHelper, etc.)
├── Http/
│   ├── Controllers/
│   │   ├── Controller.php        # Base controller
│   │   ├── User/                 # User module controllers
│   │   │   ├── AuthController.php       # Login, register, logout, me, profile, password
│   │   │   ├── UserController.php       # User listing
│   │   │   ├── MasterDataController.php # Master data resources
│   │   │   ├── UploadImageController.php# Image upload
│   │   │   └── BaseController.php       # User guard base
│   │   └── Traits/
│   │       └── HasRateLimiter.php  # Rate limiting for login
│   ├── Requests/
│   │   ├── Auth/                 # LoginRequest, RegisterRequest, UpdateProfileRequest, ChangePasswordRequest
│   │   └── User/
│   │       ├── IndexRequest.php
│   │       └── UploadImageRequest.php
│   └── Resources/
│       ├── Auth/
│       │   └── MeResource.php
│       └── User/
│           ├── UserCollection.php
│           └── UserResource.php
├── Models/           # Eloquent models (User, Image)
│   └── Scopes/
├── Providers/        # Service providers (AppServiceProvider)
├── Rules/            # Custom validation rules (PasswordRule, UserUniqueRule)
├── Services/
│   ├── Base/
│   │   ├── Service.php            # Abstract base (withUser context)
│   │   ├── TableService.php       # Base for paginated list endpoints
│   │   └── MasterDataService.php  # Abstract base for master data endpoints
│   ├── Common/                    # Shared utilities
│   │   └── FileService.php        # Image upload handling
│   └── Api/                       # API module services
│       ├── AuthService.php        # Auth logic
│       ├── UserService.php        # (placeholder)
│       ├── UserTableService.php   # User listing query builder
│       └── MasterDataService.php  # (extends Base, availableResources = [])
└── Traits/           # Shared traits
    └── Enums/
        └── HasEnumStaticMethods.php
```

### Testing Directory Structure

Thư mục test trong dự án được chia thành hai nhánh chính: `Feature` (kiểm thử tích hợp luồng HTTP/API) và `Unit` (kiểm thử logic cô lập của Services, Rules, Helpers, Jobs). 

Cấu trúc thư mục tuân thủ nguyên tắc **File Isolation** (mỗi file test đảm nhận duy nhất một endpoint/action cụ thể) và phản chiếu cấu trúc module thực tế:

```text
backend/tests/
├── Feature/                          # --- FEATURE TESTS ---
│   ├── Api/                          # Các API dùng chung (MasterData, Logs)
│   │   ├── MasterDataTest.php
│   │   └── UserActivityLogTest.php
│   └── User/                         # Tổ chức theo Module chức năng
│       ├── Auth/
│       │   ├── UserLoginTest.php
│       │   ├── UserRegisterTest.php
│       │   └── UserProfileTest.php
│       ├── Company/
│       │   ├── CompanyStoreTest.php
│       │   └── CompanyUpdateTest.php
│       └── Upload/
│           └── UploadImageTest.php
│
└── Unit/                             # --- UNIT TESTS ---
    ├── User/
    │   ├── Auth/
    │   │   └── AuthServiceTest.php
    │   └── Services/
    │       └── UserTableServiceTest.php
    ├── Rules/                        # Custom Validation Rules
    │   ├── PasswordRuleTest.php
    │   └── UserUniqueRuleTest.php
    ├── Helpers/                      # Static Helpers
    │   └── ResponseHelperTest.php
    └── Common/
        └── File/
            └── FileServiceTest.php   # Logic cô lập của FileService
```

#### Quy tắc đặt tên (Naming Conventions):
- **Feature Test Class**: `{Resource}{Action}Test` (Ví dụ: `CompanyStoreTest`).
- **Feature Method**: `test_{subject}_can_{action}_{condition}` (Ví dụ: `test_user_can_login_with_valid_credentials`).
- **Unit Test Class**: `{TargetClass}Test` hoặc `{Feature}Test` (Ví dụ: `AuthServiceTest`).
- **Unit Method**: `test_{method}_{condition}_returns_{result}` (Ví dụ: `test_hash_password_when_valid_input_returns_hashed_string`).

### Key Architecture Rules

#### Controllers

- Controllers phải **thin**. Chỉ extract request data và gọi service qua Factory.
- Luôn return responses qua `sendSuccessResponse()` hoặc `sendErrorResponse()` (kế thừa từ base `Controller`).

#### Service Layer

- **Tất cả business logic** phải nằm trong Service layer.
- Services extend `App\Services\Base\Service`.
- Services được resolve qua **Factories**.
- `ApiFactory` — scoped services cho API module (AuthService, UserService, UserTableService, MasterDataService).
- `CommonFactory` — shared utilities (FileService).

#### Models & Scopes

- User: fillable `[name, email, password, status]`, casts `status → UserStatus::class`.
- Image: polymorphic `imageable`.

#### Enums

- `UserStatus: int` — INACTIVE(0), ACTIVE(1).
- Mọi enum BẮT BUỘC có method `label()` trả về localized string qua `trans()`.

---

## API Bridge

### Communication Standard

- Mọi communication qua **JSON** over REST.
- Responses theo `ResponseHelper` standardized format.
- API documentation auto-generated qua **Scramble** (available at `/docs/api`).

### Authentication

- **Email + Password** login/register.
- **Laravel Sanctum** tokens (không dùng Passport).
- Token trả về `plainTextToken`, type `Bearer`.
- Logout xóa `currentAccessToken()`.

---

## Frontend Architecture

### Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.5 |
| React | React Server Components + Client Components | 19.2.4 |
| Styling | Tailwind CSS v4 + OKLCH design tokens | ^4 |
| UI Library | shadcn/ui primitives | ~40 components |
| State | Zustand (client) + TanStack Query (server) | ^5 / ^5 |
| Forms | React Hook Form + Zod | ^7 / ^3 |
| i18n | next-intl | ^4 |
| Monitoring | Sentry (Next.js SDK) | ^9 |
| Testing | Vitest (unit/integration) + Playwright (e2e) | ^4 / ^1 |
| HTTP | Axios | ^1 |

### Directory Structure

```text
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Route group — auth pages
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/        # Route group — protected pages
│   │   ├── dashboard/
│   │   ├── orders/
│   │   └── users/
│   ├── globals.css         # Tailwind v4 + design tokens (@theme inline)
│   ├── layout.tsx          # Root layout (i18n, theme, providers)
│   ├── page.tsx            # Landing/home page
│   ├── providers.tsx       # App providers (QueryClientProvider, ThemeProvider)
│   ├── loading.tsx         # Global loading UI
│   ├── error.tsx           # Error boundary
│   └── not-found.tsx       # 404 page
├── components/
│   ├── ui/                 # shadcn/ui primitives (~42 components)
│   ├── composites/         # Composite UI components
│   │   ├── actions/
│   │   ├── data-display/
│   │   ├── feedback/
│   │   └── form/
│   ├── layouts/            # Layout shells
│   │   ├── auth-layout/
│   │   └── dashboard-layout/
│   └── shared/             # mock-provider.tsx
├── features/               # Feature-based modules
│   ├── auth/               # Auth module
│   │   ├── api/            # Auth API hooks (login, register, logout, me)
│   │   ├── components/     # Auth forms (LoginForm, RegisterForm)
│   │   ├── hooks/          # useAuth, useLogout
│   │   ├── lib/            # Auth helpers
│   │   ├── stores/         # Zustand auth store
│   │   └── types/          # Auth DTO types
│   ├── dashboard/          # Dashboard module
│   │   ├── api/
│   │   └── components/
│   ├── orders/             # Orders module
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   └── users/              # Users module
│       ├── api/
│       ├── components/
│       ├── hooks/
│       └── types/
├── lib/                    # Cross-cutting utilities
│   ├── api/                # Axios client, endpoints, error-handler, cache-utils
│   ├── auth/               # Cookie utilities (js-cookie)
│   ├── design-tokens/      # primitives.ts — OKLCH color definitions
│   ├── formatters/         # Date, currency formatters
│   ├── logging/            # Logger utilities
│   ├── sentry/             # Sentry initialization helpers
│   ├── utils/              # cn(), general utilities
│   └── validators/         # Zod schemas and validation helpers
├── i18n/                   # Internationalization
│   ├── config.ts           # next-intl configuration
│   ├── request.ts          # Locale resolution
│   └── messages/
│       ├── en.json         # English translations
│       └── vi.json         # Vietnamese translations
├── mocks/                  # MSW mock API
│   ├── data/               # Mock data fixtures
│   ├── handlers/           # Request handlers
│   ├── browser.ts          # Browser mock worker
│   ├── server.ts           # Server mock worker
│   └── index.ts
├── scripts/                # Development scripts
│   ├── lint-design-tokens.ts   # Design token linting
│   └── lint-i18n.ts            # i18n key linting
├── tests/
│   ├── unit/               # Vitest unit tests
│   ├── integration/        # Vitest integration tests
│   └── e2e/                # Playwright end-to-end tests
├── public/                 # Static assets
├── next.config.ts          # Next.js + Sentry webpack config
├── sentry.client.config.ts
├── sentry.server.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

### Key Frontend Rules

#### Route Groups

- `(auth)/` — public routes (login, register, forgot-password)
- `(dashboard)/` — protected routes (dashboard, orders, users)
- Middleware `middleware.ts` redirect unauthenticated users từ dashboard về login.

#### State Management

- **Server state** → TanStack Query (caching, refetching, mutations).
- **Client state** → Zustand stores (auth store giữ user + token).
- **Form state** → React Hook Form + Zod resolver.

#### API Communication

- Axios instance trong `lib/api/client.ts` với interceptors:
  - Request: attach `Bearer` token từ auth store.
  - Response: centralized error handling → toast + redirect 401.
- Endpoint definitions trong `lib/api/endpoints.ts`.
- Feature API hooks trong `features/<name>/api/` dùng `useQuery` / `useMutation`.

#### Design Tokens

- Tokens định nghĩa trong `globals.css` (`@theme inline`) — colors, spacing, radius, shadows.
- `primitives.ts` export OKLCH color constants.
- Scripts `lint-design-tokens.ts` đảm bảo không dùng arbitrary values.

#### i18n

- next-intl với locale detection (`en`, `vi`).
- Messages stored trong `i18n/messages/{locale}.json`.
- Script `lint-i18n.ts` đảm bảo keys đồng bộ giữa các locale.

#### Testing

- **Unit**: Vitest + React Testing Library (components, hooks, stores).
- **Integration**: Vitest + MSW (API integration, data flows).
- **E2E**: Playwright (critical user journeys).
- Coverage target: components + hooks + API flows.

### Authentication Flow (Frontend)

```text
1. User nhập email/password → submit LoginForm
2. Frontend POST /auth/login qua Axios client
3. Backend trả Sanctum token + user data
4. Zustand auth store lưu token (js-cookie) + user
5. Axios interceptor tự động attach Bearer token cho mọi request sau
6. User click Logout → POST /auth/logout → xóa cookie → redirect /login
```

> **Chi tiết quy chuẩn FE (file naming, import order, tokens, testing, i18n, v.v.)** → đọc skill `fe-implementation` (`.agents/skills/fe-implementation/SKILL.md`)

---

## Database (Migrations)

| Migration | Table |
|---|---|
| `0001_01_01_000000` | `users` — name, email, password, status, timestamps |
| `0001_01_01_000001` | `cache` — Laravel cache |
| `0001_01_01_000002` | `jobs` — Laravel queue jobs |
| `2026_02_23_102226` | `personal_access_tokens` — Sanctum tokens |
| `2026_02_23_102659` | `images` — polymorphic image storage |
| `2026_05_06_172016` | `images.variants` — JSON column for responsive image sizes |

---

## Data Flow

```text
1. User POST /auth/register với name, email, password
2. Backend validate → Hash::make(password) → tạo User (status = ACTIVE)
3. User POST /auth/login với email, password
4. Backend verify Hash::check → tạo Sanctum token → trả access_token
5. Frontend dùng Bearer token cho các API khác
6. User POST /auth/logout → xóa currentAccessToken
```
