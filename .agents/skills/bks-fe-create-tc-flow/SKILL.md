---
name: bks-fe-create-tc-flow
description: >
  Viết kịch bản test (Playwright E2E) cho một màn hình hoặc flow được chỉ định.
  Tạo Page Object + spec file đúng chuẩn dự án. KHÔNG trùng với Vitest.
  Tối thiểu 10 TC mỗi feature. Áp dụng webapp-testing: recon trước khi viết selector.
  Triggers: "create-tc-flow", "viết testcase flow", "tạo testcase flow", "viết test cho", "tạo test cho".
---

> ⛔ **HARD STOP — ĐỌC TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ:**
> Skill này **CHỈ** được phép tạo/sửa file trong `e2e/`.
> Mọi file trong `__tests__/` là **TUYỆT ĐỐI CẤM**.
> Nếu bạn thấy mình sắp tạo `*.test.tsx` hoặc `__tests__/**` → **DỪNG NGAY**, không tạo, không mention, không gợi ý.

# Create Testcase — Playwright E2E (Flow / URL / Cookie)

Domain: **luồng người dùng thực** — navigation, redirect, cookie, URL change.  
Chuẩn: Page Object Model, TC-ID, tiếng Việt.
**Tối thiểu 10 TC mỗi feature.**

---

## 🚨 SCOPE GATE — ĐỌC VÀ THỰC THI NGHIÊM NGẶT

**Skill này CHỈ tạo file Playwright. KHÔNG tạo bất cứ file Vitest nào.**

### Kiểm tra input trước khi làm gì

```
Task yêu cầu test component render / validation / mock store / hook?
  └─ CÓ → DỪNG HOÀN TOÀN. Trả lời: "Dùng create-tc-component thay thế." Không làm gì thêm.
  └─ KHÔNG → Tiếp tục bình thường.
```

### ✅ Playwright — CHỈ NHỮNG THỨ NÀY
| Loại test | 
|-----------|
| Redirect URL sau login thành công |
| Auth guard: chưa login → redirect /login |
| Auth guard: đã login → redirect home |
| Token hết hạn (401) → redirect |
| Cookie set/assert sau login |
| Enter key → redirect URL thay đổi |
| Cross-page navigation |
| API 500 real intercept → page-level error |
| Double submit real timing → 1 request |
| Logout → redirect + cookie xóa |
| Network delay → loading → redirect |
| Back button history behavior |

### ❌ Vitest — TUYỆT ĐỐI KHÔNG VIẾT
| Loại test |
|-----------|
| Render elements, text, placeholder |
| Validation error messages (Zod/RHF) |
| Loading/disabled button state (mock) |
| Toggle password type |
| Store action called với đúng args |
| Error display từ store/MSW mock (unit) |
| Form clear error khi re-type |

> **Rule cứng — không ngoại lệ:** TC không cần `toHaveURL` / `addCookies` / `page.route` → Thuộc Vitest, **KHÔNG viết ở đây**, không mention, không gợi ý.

### 🚫 File bị cấm tạo
```
KHÔNG được tạo:
  __tests__/**/*.ts
  __tests__/**/*.tsx
  **/*.test.tsx (bất kỳ đâu)

CHỈ được tạo:
  e2e/pages/*.page.ts
  e2e/tests/**/*.spec.ts
```

---

## Bước 0 — Thu thập context

| Cần biết | Cách lấy |
|----------|----------|
| Màn hình / flow | Xác nhận với user |
| URL / route | `grep -r "href\|pathname\|push" features/<domain>/` |
| Vitest file đã có? | `ls __tests__/tests/<domain>/` |
| Playwright config base URL | `cat playwright.config.ts` → `baseURL` |

> **Bắt buộc:**
> 1. Đọc Vitest file tương ứng (`__tests__/tests/<domain>/<feature>.test.tsx`) → biết behavior nào đã được cover, áp dụng hard-boundary rule để tránh trùng
> 2. Xác nhận KHÔNG viết lại TC đã có ở Vitest

---

## Bước 1 — Reconnaissance (BẮTBUỘC trước khi viết selector)

### 1a. Decision tree

```
App là Next.js dynamic?
  ├─ Server đã chạy → Reconnaissance-then-action (1b)
  └─ Server chưa chạy → Playwright webServer tự khởi (playwright.config.ts)
                         → Chạy thử: pnpm test:e2e --list
```

### 1b. Recon script (khi cần inspect DOM thực)

Viết Python Playwright script để lấy selectors thực từ rendered HTML:

```python
# /tmp/recon_<feature>.py
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:3000/vi/<route>')
    page.wait_for_load_state('networkidle')  # CRITICAL

    # Screenshot để kiểm tra visual
    page.screenshot(path='/tmp/recon_<feature>.png', full_page=True)

    # Lấy tất cả inputs
    for el in page.locator('input').all():
        print('input id:', el.get_attribute('id'),
              'name:', el.get_attribute('name'),
              'type:', el.get_attribute('type'))

    # Lấy buttons
    for el in page.locator('button').all():
        print('button text:', el.inner_text(),
              'id:', el.get_attribute('id'))

    # In HTML nếu cần
    # print(page.content()[:8000])
    browser.close()
```

Chạy recon khi server đang chạy:
```bash
python /tmp/recon_<feature>.py
```

Hoặc dùng helper nếu cần khởi server:
```bash
# Xem options trước
python scripts/with_server.py --help

# Chạy recon kèm server
python scripts/with_server.py \
  --server "pnpm dev" --port 3000 \
  -- python /tmp/recon_<feature>.py
```

### 1c. Đọc source để map selectors

- Component → IDs, `data-testid`, `aria-label`, button text
- Middleware → routes được guard, redirect logic
- `__tests__/tests/<domain>/<feature>.test.tsx` → TC Vitest đã có → **TRÁNH TRÙNG**

### 1d. Selector priority (Playwright)

```
#id > [data-testid] > role+name > text= > CSS
```

---

## Bước 2 — Lập danh sách TC (≥ 10 TC)

> Chỉ claim domain Playwright. KHÔNG viết TC đã có ở Vitest.
> Sau khi liệt kê, **bắt buộc chạy filter**: xóa BẤT KỲ TC nào không cần `toHaveURL`/`addCookies`/`page.route`.
> Nếu sau filter còn < 10 TC → thêm TC từ nhóm PW-11+ (locale redirect, mobile viewport, network delay).
> **KHÔNG bù TC thiếu bằng cách thêm Vitest test.**

### Checklist bắt buộc (10 nhóm):

**[PW-01] Happy Path — Submit → redirect URL đúng**
- Fill form hợp lệ → click submit → `toHaveURL(/expected-path/)`

**[PW-02] Happy Path — Enter key → redirect**
- Fill form → press Enter trên field cuối → `toHaveURL(/expected-path/)`

**[PW-03] Happy Path — Cookie/token set sau login**
- Submit thành công → `page.context().cookies()` chứa token cookie

**[PW-04] Auth Guard — Đã login → truy cập /login → redirect home**
- `addCookies([{name: 'access_token', ...}])` → `goto('/vi/login')` → `toHaveURL(/home/)`

**[PW-05] Auth Guard — Chưa login → trang protected → redirect /login**
- Không có cookie → `goto('/vi/dashboard')` → `toHaveURL(/login/)`

**[PW-06] Auth Guard — Token hết hạn (401) → redirect /login**
- `page.route(...)` mock 401 → navigate protected page → `toHaveURL(/login/)`

**[PW-07] Edge Case — API 500 real intercept → page-level error/toast**
- `page.route('**/api/...', route => route.fulfill({status: 500}))` → submit → `[role=alert]` visible

**[PW-08] Edge Case — API 400 bad credentials → toast/error visible**
- Mock 400 → submit → error toast/alert hiển thị → URL KHÔNG thay đổi

**[PW-09] UX Flow — Logout → redirect /login + cookie xóa**
- Login → logout → `toHaveURL(/login/)` → `cookies()` không chứa token

**[PW-10] UX Flow — Back button sau login → không quay về /login**
- Submit → redirect → `page.goBack()` → URL KHÔNG phải `/login`

**[PW-11+] Nếu cần thêm:**
- Network delay → loading indicator visible trước redirect
- Double submit real timing → API chỉ gọi 1 lần
- Locale redirect (vi/en)
- Mobile viewport auth flow

> ⚠️ **Minimum 10 TC written** (không count skip). Skip phải có lý do rõ.

---

## Bước 3 — Tạo file

### Cấu trúc
```
e2e/
├── pages/<feature>.page.ts
└── tests/<domain>/<feature>.spec.ts
```

### Template Page Object
```typescript
// e2e/pages/<feature>.page.ts
import { type Locator, type Page } from '@playwright/test';

export class <Feature>Page {
  readonly page: Page;
  readonly fieldAInput: Locator;
  readonly fieldBInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    // Lấy selector từ recon script (bước 1b)
    this.fieldAInput = page.locator('#<id-from-recon>');
    this.fieldBInput = page.locator('#<id-from-recon>');
    this.submitButton = page.locator('#<id-from-recon>');
    this.errorAlert = page.locator('[role="alert"]');
  }

  async goto() {
    await this.page.goto('/<locale>/<route>');
    // Hạn chế dùng networkidle trong dev server do HMR WebSockets/polling.
    // Ưu tiên chờ URL hoặc selector cụ thể:
    await this.page.waitForURL(/.*\/<route>/);
  }

  async fillAndSubmit(fieldA: string, fieldB: string) {
    await this.fieldAInput.fill(fieldA);
    await this.fieldBInput.fill(fieldB);
    await this.submitButton.click();
  }

  async fillAndPressEnter(fieldA: string, fieldB: string) {
    await this.fieldAInput.fill(fieldA);
    await this.fieldBInput.fill(fieldB);
    await this.fieldBInput.press('Enter');
  }
}
```

### Template Spec (10+ TC)
```typescript
// e2e/tests/<domain>/<feature>.spec.ts
import { test, expect } from '@playwright/test';
import { <Feature>Page } from '../../pages/<feature>.page';

const VALID_FIELD_A = '<valid-value>';
const VALID_FIELD_B = '<valid-value>';

test.describe('<Tên màn hình> — E2E Flow', () => {
  let featurePage: <Feature>Page;

  test.beforeEach(async ({ page }) => {
    featurePage = new <Feature>Page(page);
  });

  // ─── Happy Path ───────────────────────────────────
  test('PW-01: Đăng nhập thành công — redirect đúng URL', async ({ page }) => {
    await featurePage.goto();
    await featurePage.fillAndSubmit(VALID_FIELD_A, VALID_FIELD_B);
    await expect(page).toHaveURL(/<expected-path>/);
  });

  test('PW-02: Submit bằng Enter — redirect đúng URL', async ({ page }) => {
    await featurePage.goto();
    await featurePage.fillAndPressEnter(VALID_FIELD_A, VALID_FIELD_B);
    await expect(page).toHaveURL(/<expected-path>/);
  });

  test('PW-03: Cookie/token được set sau login', async ({ page }) => {
    await featurePage.goto();
    await featurePage.fillAndSubmit(VALID_FIELD_A, VALID_FIELD_B);
    await expect(page).toHaveURL(/<expected-path>/);
    const cookies = await page.context().cookies();
    expect(cookies.some(c => c.name === 'access_token')).toBe(true);
  });

  // ─── Auth Guard ───────────────────────────────────
  test('PW-04: Đã login truy cập /login — redirect home', async ({ page }) => {
    await page.context().addCookies([
      { name: 'access_token', value: 'fake-valid-token', domain: 'localhost', path: '/' },
    ]);
    await featurePage.goto();
    await expect(page).toHaveURL(/<home-path>/);
  });

  test('PW-05: Chưa login — trang protected → redirect /login', async ({ page }) => {
    await page.goto('/vi/dashboard');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('PW-06: Token hết hạn (401) → redirect /login', async ({ page }) => {
    await page.route('**/api/**', route =>
      route.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthorized' }) })
    );
    await page.context().addCookies([
      { name: 'access_token', value: 'expired-token', domain: 'localhost', path: '/' },
    ]);
    await page.goto('/vi/dashboard');
    await expect(page).toHaveURL(/.*\/login/);
  });

  // ─── Edge Case Flow ───────────────────────────────
  test('PW-07: API 500 — hiển thị lỗi hệ thống, không redirect', async ({ page }) => {
    await page.route('**/api/<endpoint>', route =>
      route.fulfill({ status: 500, body: JSON.stringify({ message: 'Server Error' }) })
    );
    await featurePage.goto();
    await featurePage.fillAndSubmit(VALID_FIELD_A, VALID_FIELD_B);
    await expect(featurePage.errorAlert).toBeVisible();
    await expect(page).toHaveURL(/.*\/<route>/); // URL không đổi
  });

  test('PW-08: API 400 bad credentials — lỗi hiển thị, không redirect', async ({ page }) => {
    await page.route('**/api/<endpoint>', route =>
      route.fulfill({ status: 400, body: JSON.stringify({ message: 'Sai tài khoản hoặc mật khẩu' }) })
    );
    await featurePage.goto();
    await featurePage.fillAndSubmit(VALID_FIELD_A, VALID_FIELD_B);
    await expect(featurePage.errorAlert).toBeVisible();
    await expect(page).toHaveURL(/.*\/<route>/);
  });

  // ─── UX Flow ─────────────────────────────────────
  test('PW-09: Logout → redirect /login + cookie bị xóa', async ({ page }) => {
    // Setup: fake login state
    await page.context().addCookies([
      { name: 'access_token', value: 'fake-token', domain: 'localhost', path: '/' },
    ]);
    await page.goto('/vi/<home-route>');

    // Click logout
    await page.locator('[data-testid="logout-button"]').click();
    await expect(page).toHaveURL(/.*\/login/);

    const cookies = await page.context().cookies();
    expect(cookies.find(c => c.name === 'access_token')).toBeUndefined();
  });

  test('PW-10: Back button sau login — không quay về /login', async ({ page }) => {
    await featurePage.goto();
    await featurePage.fillAndSubmit(VALID_FIELD_A, VALID_FIELD_B);
    await expect(page).toHaveURL(/<expected-path>/);
    await page.goBack();
    // history.replace → back không về login
    await expect(page).not.toHaveURL(/.*\/login/);
  });

  test('PW-11: Double submit — API chỉ gọi 1 lần', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/<endpoint>', async route => {
      callCount++;
      await route.continue();
    });
    await featurePage.goto();
    await featurePage.fieldAInput.fill(VALID_FIELD_A);
    await featurePage.fieldBInput.fill(VALID_FIELD_B);
    // Double click submit
    await featurePage.submitButton.dblclick();
    expect(callCount).toBe(1);
  });

  test.skip('PW-12: Network delay → loading indicator visible', async () => {
    // skip: cần timing control — dễ flaky, defer đến CI stable
  });
});
```

---

## Bước 4 — Quy tắc code

| Rule | Chi tiết |
|------|----------|
| **≥ 10 TC written** | Skip không count. Thêm PW-11+ nếu thiếu |
| **Recon trước khi viết selector** | Bước 1b — không đoán ID |
| **KHÔNG trùng Vitest** | Đọc `__tests__/tests/<domain>/` trước |
| **Chỉ test flow/URL/cookie** | Không test render, validation, toggle UI |
| **Không `waitForTimeout`** | Dùng `waitForURL` / `waitForSelector` / `toHaveURL` |
| **Hạn chế `networkidle`** | Tránh dùng `networkidle` trong local dev mode (vì Next.js HMR/Fast Refresh WebSocket giữ network hoạt động liên tục). Dùng `expect(page).toHaveURL()` hoặc `waitForSelector` thay thế. |
| **Cookie fake login** | `page.context().addCookies([...])` trước `goto()` |
| **Lưu ý intercept API (RSC)** | `page.route()` **chỉ** intercept client-side API calls. **KHÔNG** thể intercept các API fetch chạy trên Server side (React Server Components - RSC hoặc Route Handlers). E2E tests cho RSC phải dùng real data/mock backend. |
| **Page Object Method** | Mỗi flow thành method riêng (fillAndSubmit, goto) |
| **Assert URL** | `expect(page).toHaveURL(...)` — assertion cốt lõi, có auto-retry tích hợp |
| **Test isolation** | Mỗi test tự setup, không share state |
| **TC-ID liên tục** | PW-01..N kế tiếp file hiện có nếu append |
| **tiếng Việt** | Tên test, describe, comment |
| **`test.skip` có lý do** | Comment rõ |

---

## Bước 5 — Verify

```bash
# Chạy file cụ thể
pnpm test:e2e e2e/tests/<domain>/<feature>.spec.ts --reporter=list

# HTML report
pnpm test:e2e e2e/tests/<domain>/<feature>.spec.ts --reporter=html

# Debug mode
pnpm test:e2e e2e/tests/<domain>/<feature>.spec.ts --debug

# List TCs không chạy
pnpm test:e2e --list
```

---

## Output cuối

```
✅ Đã tạo:
  - e2e/pages/<feature>.page.ts  (N locators, M methods)
  - e2e/tests/<domain>/<feature>.spec.ts  (N TCs — min 10)

📋 TC list (Playwright — Flow/URL/Cookie only):
  PW-01 ✅ Happy Path — redirect đúng URL
  PW-02 ✅ Happy Path — Enter key → redirect
  PW-03 ✅ Cookie/token set sau login
  PW-04 ✅ Auth Guard — đã login → redirect home
  PW-05 ✅ Auth Guard — chưa login → redirect /login
  PW-06 ✅ Token hết hạn → redirect /login
  PW-07 ✅ API 500 → error, không redirect
  PW-08 ✅ API 400 → lỗi credentials
  PW-09 ✅ Logout → redirect + cookie xóa
  PW-10 ✅ Back button → không về /login
  PW-11 ✅ Double submit → API 1 lần
  PW-XX ⏭️  Skip — <lý do>

🚫 KHÔNG viết (đã có Vitest):
  - Render elements → VT-01
  - Validation errors → VT-04/05/06/07
  - Loading state → VT-03
  - Toggle password → VT-09

📊 COMBINED COVERAGE SUMMARY:
  ┌─────────────────────────────────────────────────┐
  │ Vitest  (Component/Logic)                       │
  │   VT-01..VT-12  ✅  ~90% statements             │
  │                                                 │
  │ Playwright  (Flow/URL/Cookie)                   │
  │   PW-01..PW-11  ✅  ~95% critical E2E paths     │
  │                                                 │
  │ Uncovered gaps: <none / list>                   │
  │                                                 │
  │ Combined: ✅ ~100% critical paths covered       │
  └─────────────────────────────────────────────────┘

⚠️ Cần thêm vào UI:
  - <element> chưa có data-testid → data-testid="<name>"
  - <button> chưa có id rõ → id="<name>"
```
