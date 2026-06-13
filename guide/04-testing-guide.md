# Bài 4: Hướng Dẫn Kiểm Thử (Testing Guide)

Kiểm thử là một phần **bắt buộc** trong quy trình phát triển của dự án, không phải tùy chọn. Tài liệu này hướng dẫn thành viên hiểu rõ triết lý, cấu trúc thư mục, quy chuẩn đặt tên và quy trình báo cáo kết quả kiểm thử.

---

## 1. 🎯 Triết Lý Kiểm Thử

Dự án chia kiểm thử thành hai tầng rõ ràng dựa trên **mục tiêu kiểm tra**, không phải theo module:

| Tầng | Mục tiêu | Công cụ |
|---|---|---|
| **Feature Test** | Kiểm tra toàn bộ vòng đời của một HTTP request (Route → Middleware → Controller → DB → Response) | PHPUnit + `RefreshDatabase` |
| **Unit Test** | Kiểm tra cô lập một logic nghiệp vụ phức tạp bên trong Service, Rule hoặc Helper — không qua HTTP | PHPUnit + Mocking |

> [!IMPORTANT]
> **Nguyên tắc vàng**: Feature Tests bao phủ đường đi của dữ liệu; Unit Tests bao phủ sự đúng đắn của logic. **Không viết Unit Test cho CRUD đơn giản** — Feature Test đã đủ cho những trường hợp này.

---

## 2. 📂 Cấu Trúc Thư Mục Test

```text
backend/tests/
├── Feature/
│   ├── Api/            # ← Tất cả API Feature Tests (nhóm theo resource)
│   │   ├── Auth/       # VD: UserLoginTest.php, UserLogoutTest.php
│   │   ├── Company/    # VD: CompanyStoreTest.php, CompanyIndexTest.php
│   │   └── Upload/     # VD: UploadStoreTest.php
│   ├── Console/        # Tests cho Artisan Commands
│   └── Jobs/           # Tests xác nhận Job được dispatch đúng cách
│
└── Unit/
    ├── Services/       # Tests logic phức tạp bên trong Service
    ├── Jobs/           # Tests luồng xử lý bên trong Job handler
    ├── Rules/          # Tests các Custom Validation Rule
    └── Helpers/        # Tests các hàm Helper tiện ích
```

---

## 3. 📝 Quy Chuẩn Đặt Tên

### 3.1. Tên File & Class

| Ngữ cảnh | Quy tắc | Ví dụ |
|---|---|---|
| Feature API test | `{Resource}{Action}Test` | `CompanyStoreTest`, `UserLoginTest` |
| Feature Console test | `{CommandName}CommandTest` | `SendRemindersCommandTest` |
| Feature Job dispatch | `{JobName}JobDispatchTest` | `ProcessInvoiceJobDispatchTest` |
| Unit Service test | `{ServiceName}ServiceTest` | `AuthServiceTest` |
| Unit Job test | `{JobName}JobTest` | `ProcessInvoiceJobTest` |
| Unit Rule test | `{RuleName}RuleTest` | `PasswordRuleTest` |

### 3.2. Tên Phương Thức Test

```php
// Feature: {subject}_can/cannot_{action}_{condition}
public function test_user_can_create_company_successfully(): void
public function test_guest_cannot_access_company_list(): void
public function test_user_without_permission_gets_403(): void

// Unit: {method}_{scenario}_{expected_result}
public function test_calculate_discount_with_valid_coupon_returns_correct_amount(): void
public function test_validate_password_with_short_input_returns_false(): void
```

---

## 4. ✅ Checklist Cho Mỗi Feature API (7 Test Cases Tối Thiểu)

Mỗi endpoint API mới bắt buộc phải có ít nhất các test case sau:

- [ ] **Guest (401)** — Không có token → trả về `401 Unauthorized`
- [ ] **Forbidden (403)** — Có token nhưng không có quyền → trả về `403 Forbidden`
- [ ] **Validation Error (422)** — Dữ liệu thiếu hoặc sai định dạng → trả về `422` kèm chi tiết lỗi
- [ ] **Not Found (404)** — Tài nguyên không tồn tại hoặc đã xóa → trả về `404`
- [ ] **Happy Path (200/201)** — Request hợp lệ → trả về đúng dữ liệu và cấu trúc JSON
- [ ] **Soft Delete Awareness** — Không thể truy cập tài nguyên đã xóa mềm
- [ ] **Data Integrity** — Kiểm tra dữ liệu được ghi đúng vào database

---

## 5. 🏃 Cách Chạy Test

```bash
# Chạy toàn bộ test suite
cd backend
php artisan test

# Chạy một file test cụ thể
php artisan test --filter=CompanyStoreTest

# Chạy một test case cụ thể
php artisan test --filter="test_user_can_create_company_successfully"

# Chạy toàn bộ Feature Tests
php artisan test tests/Feature/

# Chạy toàn bộ Unit Tests
php artisan test tests/Unit/
```

---

## 6. 📊 Quy Trình Báo Cáo Kết Quả Test

Mỗi khi viết test cho một tính năng, **bắt buộc** phải tạo hoặc cập nhật file báo cáo trong `docs/testing/`.

### 6.1. Vị Trí File Báo Cáo

```text
docs/testing/
├── preparation.md          # Hướng dẫn cài đặt môi trường test
├── auth-management.md      # Báo cáo test cho tính năng Auth
├── company-management.md   # Báo cáo test cho tính năng Company
└── {feature-name}.md       # Đặt tên theo kebab-case
```

### 6.2. Quy Trình 2 Giai Đoạn (Quan Trọng)

> [!CAUTION]
> **Không được báo cáo sau khi đã sửa xong.** Điều này dẫn đến tất cả kết quả đều là `pass` — mất đi toàn bộ giá trị truy xuất lịch sử lỗi.

**Giai đoạn 1 — Sau khi chạy test lần đầu:**
- Ghi kết quả ngay lập tức, kể cả các test `fail`
- Ghi rõ `Nguyên nhân` nếu test thất bại

**Giai đoạn 2 — Sau khi khắc phục lỗi:**
- Cập nhật `Kết quả` thành `fail (Đã khắc phục thành pass)`
- Bổ sung `Các bước giải quyết` chi tiết

### 6.3. Ví Dụ Báo Cáo

```markdown
# Báo cáo Test: Quản lý Công ty

## 1. Thông tin chung
- **Ngày test**: 2026-05-29
- **Môi trường**: Local / Testing

## 2. Chi tiết kết quả chạy test

### tests/Feature/Api/Company/CompanyStoreTest.php

#### Test Case 1: `test_user_can_create_company_successfully`
- **Nội dung test**: Người dùng đã đăng nhập với đủ quyền có thể tạo mới công ty.
- **Kết quả**: `pass`

#### Test Case 2: `test_guest_cannot_create_company`
- **Nội dung test**: Khách chưa đăng nhập bị từ chối với lỗi 401.
- **Kết quả**: `fail` (Đã khắc phục thành `pass`)
- **Nguyên nhân**: Route thiếu middleware `auth:sanctum`.
- **Các bước giải quyết**:
  1. Thêm route vào group `auth:sanctum` trong `routes/api.php`.
  2. Chạy lại `php artisan test --filter=CompanyStoreTest`.
```

### 6.4. Phân Loại Kết Quả

| Tình huống | Định dạng |
|---|---|
| Test pass ngay từ đầu | `pass` |
| Test fail rồi được sửa | `fail` (Đã khắc phục thành `pass`) |
| Test vẫn đang fail | `fail` |
| Test cập nhật theo logic mới | `pass (Đã cập nhật logic)` |

---

## 7. ⚠️ Các Lỗi Thường Gặp Khi Viết Test

### 7.1. Quên `RefreshDatabase`
```php
// ❌ Sai — Test bị ô nhiễm dữ liệu từ test khác
class CompanyStoreTest extends TestCase { ... }

// ✅ Đúng
class CompanyStoreTest extends TestCase
{
    use RefreshDatabase;
}
```

### 7.2. Hardcode dữ liệu thay vì dùng Factory
```php
// ❌ Sai — Dữ liệu cứng, không flexible
$user = User::create(['name' => 'Test', 'email' => 'test@test.com', ...]);

// ✅ Đúng — Factory tự sinh đầy đủ và random
$user = User::factory()->create();
```

### 7.3. Assert bằng số nguyên thô thay vì Enum
```php
// ❌ Sai — Magic number, không rõ nghĩa
$this->assertDatabaseHas('users', ['status' => 1]);

// ✅ Đúng — Rõ ràng và bền vững trước khi Enum thay đổi giá trị
$this->assertDatabaseHas('users', ['status' => UserStatus::Active->value]);
```

### 7.4. Gộp nhiều endpoint vào một file test
```php
// ❌ Sai — Một file test cho cả CRUD
class CompanyTest extends TestCase { ... }

// ✅ Đúng — Mỗi action có file riêng
// CompanyIndexTest.php, CompanyStoreTest.php, CompanyUpdateTest.php, CompanyDestroyTest.php
```

---

---

# Phần 2: Kiểm Thử Frontend (Next.js)

Kiểm thử frontend cũng là **bắt buộc**, chia làm hai tầng độc lập với scope tách biệt hoàn toàn. Mỗi tầng có skill riêng để thực thi: `bks-fe-create-tc-component` và `bks-fe-create-tc-flow`.

---

## 8. 🎯 Triết Lý Kiểm Thử Frontend

| Tầng | Skill | Mục tiêu | Công cụ |
|---|---|---|---|
| **Vitest** | `bks-fe-create-tc-component` | Render, validation, store state, hook logic — **không cần browser thật** | Vitest + Testing Library + MSW node |
| **Playwright E2E** | `bks-fe-create-tc-flow` | Navigation thực, redirect URL, cookie, auth guard — **cần browser thật** | Playwright + Page Object Model |

> [!IMPORTANT]
> **Nguyên tắc vàng:** Hai tầng **không được trùng nhau**. Nếu TC cần `toHaveURL` / `addCookies` / `page.route` → thuộc Playwright. Nếu TC chỉ assert DOM element, validation, store state → thuộc Vitest.

---

## 9. 📂 Cấu Trúc Thư Mục Test Frontend

```text
frontend/
├── __tests__/                            # Vitest (unit/integration)
│   ├── setup.ts                          # Nạp MSW server từ infra/mocks/handlers + jest-dom
│   ├── utils/
│   │   └── render-with-intl.tsx          # renderWithIntl — wrap NextIntlClientProvider
│   └── tests/
│       └── <domain>/
│           └── <feature>.test.tsx        # File Vitest
│
├── infra/mocks/                          # MSW dùng chung cho cả dev mock-mode lẫn test
│   ├── handlers.ts                       # Gom handlers đã đăng ký qua mockManager
│   ├── node.ts / browser.ts              # MSW server (Node) / worker (browser)
│   └── mock-manager.ts, base-mock.ts     # Cơ chế đăng ký mock theo feature
│
├── features/<feature>/mocks/
│   └── <feature>.mock.ts                 # Handlers MSW riêng feature (mockManager.register)
│
└── e2e/                                  # Playwright (E2E)
    ├── pages/
    │   └── <feature>.page.ts             # Page Object
    └── tests/
        └── <domain>/
            └── <feature>.spec.ts         # File Playwright
```

> [!NOTE]
> MSW handlers nằm trong `infra/mocks/` và được **dùng chung** cho cả dev mock-mode (`NEXT_PUBLIC_USE_MOCK=true`) lẫn Vitest — test vì thế chạy qua đúng repository layer thật. `__tests__/setup.ts` tạo MSW server từ chính `infra/mocks/handlers`. Mock của từng feature đặt tại `features/<feature>/mocks/<feature>.mock.ts` và tự đăng ký vào `mockManager`.

> [!CAUTION]
> **Ranh giới cứng không ngoại lệ:**
> - `bks-fe-create-tc-component` → **CHỈ** tạo file trong `__tests__/`. Tuyệt đối không tạo `*.spec.ts` hay `e2e/`.
> - `bks-fe-create-tc-flow` → **CHỈ** tạo file trong `e2e/`. Tuyệt đối không tạo `*.test.tsx` hay `__tests__/`.

---

## 10. ✅ Checklist TC Tối Thiểu

### 10.1. Tầng Vitest — Tối Thiểu 20 TC mỗi Feature (10 VT + 10 VT-DS)

**[VT] Component / Logic Tests (≥ 10 written)**

| TC-ID | Scenario |
|-------|----------|
| VT-01 | Render đúng các element cơ bản (heading, inputs, button, labels) |
| VT-02 | Submit hợp lệ → store action gọi với đúng arguments |
| VT-03 | `isLoading: true` → button disabled, action không gọi thêm |
| VT-04 | Submit rỗng → hiện tất cả lỗi validation, action không gọi |
| VT-05 | Thiếu field A → lỗi A xuất hiện, không có lỗi B |
| VT-06 | Thiếu field B → lỗi B xuất hiện, không có lỗi A |
| VT-07 | Format sai → error message khớp chính xác Zod schema |
| VT-08 | `store.error` có giá trị → `[role=alert]` hiển thị đúng text |
| VT-09 | Toggle show/hide password → `input[type]` thay đổi |
| VT-10 | User re-type sau khi error xuất hiện → error bị clear |
| VT-11+ | Hook initial state, MSW 400/500 error trong component, double-submit |

**[VT-DS] Design System Token Tests (≥ 10 written)**

| TC-ID | Scenario |
|-------|----------|
| VT-DS-01 | Error text có class `text-destructive`, không có inline hex/rgb |
| VT-DS-02 | Muted label có class `text-muted-foreground`, không có hex |
| VT-DS-03 | Field composition: `Field > FieldLabel > FieldContent` render đúng |
| VT-DS-04 | FieldLabel không có `text-transform: uppercase` |
| VT-DS-05 | Primary button có đúng `variant`/`tone` hoặc class `bg-primary` |
| VT-DS-06 | Heading có `typo-heading-*`, error caption có `typo-caption` |
| VT-DS-07 | Badge dùng semantic variant (`success`/`destructive`), không hardcode color |
| VT-DS-08 | Icon-only button có `aria-label` không rỗng |
| VT-DS-09 | Single image upload dùng `InputUploadImage`, multi dùng `InputUploadImages` |
| VT-DS-10 | Overflow container có class `custom-scrollbar` |
| VT-DS-11+ | Spacing token, focus ring, dark-mode class, Skeleton/loading DS, Card composition |

### 10.2. Tầng Playwright — Tối Thiểu 10 TC mỗi Feature

| TC-ID | Scenario |
|-------|----------|
| PW-01 | Happy path: Submit → redirect đúng URL (`toHaveURL`) |
| PW-02 | Happy path: Enter key → redirect URL thay đổi |
| PW-03 | Cookie/token được set sau khi login thành công |
| PW-04 | Auth guard: Đã login → truy cập `/login` → redirect home |
| PW-05 | Auth guard: Chưa login → trang protected → redirect `/login` |
| PW-06 | Token hết hạn (401) → redirect `/login` |
| PW-07 | API 500 real intercept → page-level error hiển thị, không redirect |
| PW-08 | API 400 bad credentials → lỗi hiển thị, URL không đổi |
| PW-09 | Logout → redirect `/login` + cookie bị xóa |
| PW-10 | Back button sau login → không quay về `/login` |
| PW-11+ | Double submit → API 1 lần, network delay → loading → redirect |

---

## 11. 📊 Phân Định Phạm Vi Giữa 2 Tầng

Hai tầng test **không trùng nhau** nhờ **ranh giới cứng theo loại assertion** (xem §8), chứ không phải qua một file coverage-map riêng:

| Thuộc về | Khi TC cần | Skill |
|---|---|---|
| **Vitest** | render DOM, validation, store state, hook logic | `bks-fe-create-tc-component` |
| **Playwright** | `toHaveURL`, cookie, auth guard, điều hướng cross-page | `bks-fe-create-tc-flow` |

Đo coverage bằng công cụ thật, không phải bảng tay:

```bash
pnpm test:unit:coverage   # Vitest coverage (statements/branches)
pnpm test:e2e             # Playwright phủ các critical E2E path
```

> [!NOTE]
> Nếu một TC vừa cần assert DOM vừa cần `toHaveURL` → tách làm hai: phần DOM ở Vitest, phần điều hướng ở Playwright.

---

## 12. 🏃 Cách Chạy Test Frontend

```bash
cd frontend

# Chạy cả Vitest + Playwright
pnpm test:run

# Chỉ Vitest (unit/integration)
pnpm test:unit

# Vitest watch mode
pnpm test:unit:watch

# Coverage report (Vitest)
pnpm test:unit:coverage

# Chạy một file test cụ thể
pnpm test:run __tests__/tests/<domain>/<feature>.test.tsx

# ─── Playwright ───────────────────────────────────────

# Chạy tất cả E2E tests
pnpm test:e2e

# Chạy một file spec cụ thể
pnpm test:e2e e2e/tests/<domain>/<feature>.spec.ts --reporter=list

# HTML report
pnpm test:e2e e2e/tests/<domain>/<feature>.spec.ts --reporter=html

# Debug mode (mở browser)
pnpm test:e2e e2e/tests/<domain>/<feature>.spec.ts --debug

# ─── Quality gate ───────────────────────────────────

pnpm lint            # ESLint
pnpm test:run        # Vitest + Playwright
```

---

## 13. ⚠️ Các Lỗi Thường Gặp Khi Viết Test Frontend

### 13.1. Viết Playwright TC vào file Vitest (hoặc ngược lại)

```typescript
// ❌ Sai — toHaveURL thuộc Playwright, không dùng trong Vitest
it('VT-01: Redirect sau login', async () => {
  await user.click(submitBtn);
  expect(window.location.href).toBe('/dashboard'); // ❌
});

// ✅ Đúng — Vitest chỉ assert DOM/store trong component
it('VT-01: Render đúng heading', () => {
  renderWithIntl(<LoginForm />);
  expect(screen.getByRole('heading', { name: /đăng nhập/i })).toBeInTheDocument();
});
```

### 13.2. Không dùng `renderWithIntl`

```typescript
// ❌ Sai — Component dùng next-intl nhưng không có Provider
render(<LoginForm />); // ❌ bị lỗi context (no intl)

// ✅ Đúng — Luôn dùng renderWithIntl từ __tests__/utils/render-with-intl
import { renderWithIntl } from '../../utils/render-with-intl';
renderWithIntl(<LoginForm />);
```

### 13.3. Dùng `waitForTimeout` trong Playwright

```typescript
// ❌ Sai — Flaky, không reliable
await page.waitForTimeout(2000);

// ✅ Đúng — Dùng assertion có built-in auto-retry
await expect(page).toHaveURL(/dashboard/);
await expect(page.locator('[role="alert"]')).toBeVisible();
```

### 13.4. Dùng `networkidle` trong Playwright local dev

```typescript
// ❌ Sai — Next.js HMR giữ WebSocket mở liên tục → networkidle không bao giờ đạt
await page.goto('/vi/login', { waitUntil: 'networkidle' }); // ❌ timeout

// ✅ Đúng — Chờ URL hoặc selector cụ thể
await page.goto('/vi/login');
await page.waitForURL(/.*\/login/);
```

### 13.5. Assert class CSS mà không recon source trước

```typescript
// ❌ Sai — Assume class tồn tại mà không đọc component source
expect(button).toHaveClass('btn-primary-custom'); // ❌ class này không tồn tại

// ✅ Đúng — Chỉ assert class đã xác nhận trong source component
// Đọc source trước: component dùng variant="default" → class bg-primary
expect(button).toHaveClass('bg-primary');
```

### 13.6. `QueryClient` không tắt retry

```typescript
// ❌ Sai — Retry mặc định làm test chậm và timeout
const qc = new QueryClient();

// ✅ Đúng — Tắt retry hoàn toàn trong test
const qc = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});
```

### 13.7. `page.route()` intercept RSC fetch

```typescript
// ❌ Sai — page.route() KHÔNG intercept được Server Component fetch
await page.route('**/api/products', route => route.fulfill({ status: 500 }));
// Nếu fetch chạy trên server → không bị intercept, test sẽ fail

// ✅ Đúng — Dùng real backend mock hoặc chỉ intercept client-side API calls
// RSC fetch cần mock ở tầng backend (database/seeder), không dùng page.route()
```

### 13.8. Trùng TC giữa Vitest và Playwright

```typescript
// ❌ Sai — VT-04 đã test validation, PW-08 không cần test lại cùng scenario
// VT-04: Submit rỗng → lỗi validation (đã có trong Vitest)
// PW-08: Submit rỗng → lỗi validation (trùng lặp ❌)

// ✅ Đúng — PW-08 focus vào flow/URL, không test DOM render
// PW-08: API 400 bad credentials → lỗi hiển thị, URL không thay đổi (toHaveURL)
```
