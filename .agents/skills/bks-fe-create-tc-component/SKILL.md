---
name: bks-fe-create-tc-component
description: >
  Viết kịch bản unit/integration test (Vitest + Testing Library) cho component, hook, util, store.
  KHÔNG phải E2E browser — dùng `create-tc-flow` cho Playwright. KHÔNG trùng TC với Playwright.
  **Tối thiểu 10 VT written + 10 VT-DS written = tổng ≥ 20 TC mỗi lần chạy.**
  Bao gồm VT-DS: test UI map đúng design token & SDK rules từ bks-ds-sdk-consumer.
  Triggers: "create-tc-component", "viết unit test", "tạo unit test", "viết test component", "tạo vitest".
---

> ⛔ **HARD STOP — ĐỌC TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ:**
> Skill này **CHỈ** được phép tạo/sửa các file trong `__tests__/`.
> Mọi file trong `e2e/` là **TUYỆT ĐỐI CẤM**.
> Nếu bạn thấy mình sắp tạo `*.spec.ts` hoặc `e2e/**` → **DỪNG NGAY**, không tạo, không mention, không gợi ý.

# Create Testcase — Vitest (Component / Logic)

Domain: **component render, logic, state, hook**.
Chuẩn: Testing Library, MSW (infra/mocks dùng chung dev+test), renderWithIntl, TC-ID, tiếng Việt.

> 🔢 **HARD MINIMUM — KHÔNG THƯƠNG LƯỢNG:**
> - VT (component/logic): **≥ 10 TC written** (skip không count)
> - VT-DS (design system token): **≥ 10 TC written** (skip không count)
> - **Tổng: ≥ 20 TC written mỗi lần chạy**
> 
> Vi phạm = output không hợp lệ. Phải thêm TC cho đủ trước khi kết thúc.

---

## 🚨 SCOPE GATE — ĐỌC VÀ THỰC THI NGHIÊM NGẶT

**Skill này CHỈ tạo file Vitest. KHÔNG tạo bất cứ file Playwright nào.**

### Kiểm tra input trước khi làm gì

```
Task yêu cầu test flow / URL / cookie / navigation?
  └─ CÓ → DỪNG HOÀN TOÀN. Trả lời: "Dùng create-tc-flow thay thế." Không làm gì thêm.
  └─ KHÔNG → Tiếp tục bình thường.
```

### ✅ Vitest — CHỈ NHỮNG THỨ NÀY
| Loại test | API dùng |
|-----------|---------|
| Render elements, text, placeholder | `screen.getBy*` |
| Validation error messages (Zod/RHF) | RHF trigger, Zod schema |
| API KHÔNG gọi khi validation fail | `mockAction.not.toHaveBeenCalled()` |
| Loading/disabled button (mock isLoading) | mock store state |
| Toggle password input type | `toHaveAttribute('type', ...)` |
| Store action called với đúng args | `toHaveBeenCalledWith(...)` |
| Error display từ store.error / MSW mock | `getByRole('alert')` |
| Conditional render (auth state) | mock store logged-in/out |
| Hook: initial state, action, cleanup | `renderHook` |
| Form field clear error khi re-type | re-type → error gone |
| Accessibility (aria-label, role) | ARIA assertions |
| **DS token — semantic class có trên DOM** | `toHaveClass('text-destructive')` etc. |
| **DS token — KHÔNG có hardcoded hex/rgb** | `not.toHaveStyle({color: '#...'})` |
| **DS Field composition** | `Field > FieldLabel + FieldContent` render |
| **DS Button tone/variant đúng** | `toHaveClass('bg-primary')` / `data-variant` |

### ❌ Playwright — TUYỆT ĐỐI KHÔNG VIẾT
| Loại test | Lý do |
|-----------|--------------|
| Redirect URL sau submit | `toHaveURL` → Playwright |
| Cookie set/assert | `page.context().cookies()` → Playwright |
| Auth guard real navigation | real browser → Playwright |
| Cross-page navigation | real browser → Playwright |
| Token expiry → redirect | real cookie + navigate → Playwright |
| `page.route(...)` intercept | Playwright API |

> **Rule cứng — không ngoại lệ:** Nếu TC cần `toHaveURL` / `addCookies` / `page.route` / `page.goto` → **BỎ QUA hoàn toàn**, không viết, không mention, không gợi ý "bạn có thể thêm ở Playwright".

### 🚫 File bị cấm tạo
```
KHÔNG được tạo:
  e2e/**/*.ts
  e2e/**/*.spec.ts
  **/*.spec.ts (bất kỳ đâu)

CHỈ được tạo:
  __tests__/tests/<domain>/<feature>.test.tsx
  features/<feature>/mocks/<feature>.mock.ts   (chỉ khi feature CHƯA có mock)

  ℹ️ __tests__/utils/render-with-intl.tsx ĐÃ TỒN TẠI — chỉ import, KHÔNG tạo lại.
```

---

## Bước 0 — Reconnaissance (BẮTBUỘC trước khi viết)

### 0a. Thu thập context

| Cần biết | Cách lấy |
|----------|----------|
| Target file | Component path, hook name, util |
| Scope | Unit (isolated) hay integration (với store/API)? |
| Playwright file đã có? | `find e2e/tests/<domain>/ -name "*.spec.ts"` |
| MSW mock của feature đã có? | `ls features/<feature>/mocks/ 2>/dev/null` (đăng ký tập trung tại `infra/mocks/handlers.ts`) |

### 0b. Đọc source target

```
Component → Props, state, side effects, conditional render, event handlers
Hook      → Return values, params, async behavior, cleanup
Store     → Actions, selectors, state shape, error/loading fields
Util      → Input/output types, edge cases, boundary values
```

### 0c. Đọc validation schema

- Zod schema → extract **chính xác** error messages (không hardcode sai)
- RHF config → field names, defaultValues, mode

### 0d. Đọc Playwright file tương ứng

```bash
cat e2e/tests/<domain>/<feature>.spec.ts 2>/dev/null || echo "Chưa có"
```

→ Liệt kê TC đã có ở Playwright, **KHÔNG viết lại bất kỳ TC nào đã tồn tại ở Playwright**.

### 0e. Đọc MSW mock hiện có

```bash
ls features/<feature>/mocks/ 2>/dev/null
```

MSW dùng chung giữa dev mock-mode và test. Mỗi feature có 1 class `<Feature>Mock extends BaseMock`
tại `features/<feature>/mocks/<feature>.mock.ts`, được đăng ký qua `mockManager.register(...)` trong
`infra/mocks/handlers.ts`. Vitest server (`__tests__/setup.ts`) dựng 1 lần từ `handlers` đã gộp.

- Đã có → tái sử dụng; cần stub riêng cho test thì override bằng `server.use(...)` trong test đó.
- Chưa có → tạo mới `features/<feature>/mocks/<feature>.mock.ts` + đăng ký tại `infra/mocks/handlers.ts`.

---

## Bước 1 — Lập danh sách TC (VT ≥ 10 + VT-DS ≥ 10 = tổng ≥ 20)

> Chỉ claim domain Vitest. KHÔNG viết TC đã có ở Playwright.
> Sau khi liệt kê, **bắt buộc chạy filter**: xóa BẤT KỲ TC nào cần `toHaveURL`/`addCookies`/`page.route`/real navigate.
> Nếu sau filter VT < 10 → thêm từ nhóm VT-11+ (hook state, conditional render, accessibility, double-submit, boundary value).
> Nếu sau filter VT-DS < 10 → thêm từ nhóm VT-DS-11+ (spacing token, focus ring, responsive class, dark-mode class, data-testid present, skeleton/loading DS component).
> **KHÔNG bù TC thiếu bằng cách thêm Playwright test.**
> **Checklist cuối Bước 1:** đếm `written` — VT ≥ 10, VT-DS ≥ 10. Nếu chưa đủ → thêm trước khi sang Bước 2.**

### Checklist bắt buộc (10 nhóm):

**[VT-01] Render — Happy Path**
- Elements visible: heading, inputs, button, labels

**[VT-02] Submit hợp lệ → store action gọi đúng args**
- Fill tất cả field đúng format → click submit → assert mockAction args

**[VT-03] Loading state**
- `isLoading: true` → button disabled + text thay đổi → store action KHÔNG gọi thêm

**[VT-04] Submit rỗng → hiện TẤT CẢ lỗi validation**
- Click submit không fill → assert tất cả error messages → mockAction.not.toHaveBeenCalled()

**[VT-05] Thiếu field A — validation field A**
- Fill field B, bỏ field A → error A xuất hiện → KHÔNG có error B

**[VT-06] Thiếu field B — validation field B**
- Fill field A, bỏ field B → error B xuất hiện → KHÔNG có error A

**[VT-07] Format sai → error message chính xác**
- Email sai format / password quá ngắn / số âm → error khớp Zod message

**[VT-08] Store error → alert hiển thị**
- `store.error = 'Lỗi đăng nhập'` → `getByRole('alert')` có text đúng

**[VT-09] UX interaction — Toggle password**
- type="password" → click toggle → type="text" → click lại → type="password"

**[VT-10] Clear error khi re-type**
- Submit rỗng → error xuất hiện → user gõ lại → error biến mất (hoặc global error cleared)

**[VT-11+] Nếu có hook/conditional render:**
- Hook initial state đúng
- Logged-out → render fallback/null
- Logged-in → render full UI
- MSW 400 → error message API hiển thị **trong component** (không assert URL)
- MSW 500 → generic error UI **trong component** (không assert URL)
- Double submit → mockFn chỉ gọi 1 lần

**[VT-DS] Design System Token & SDK Rules** _(bắt buộc nếu component dùng @bks/ds-system-sdk)_

> Recon trước: đọc source component để xác định SDK components & semantic class đang dùng.
> Chỉ assert class/attribute đã tồn tại — KHÔNG assume class.
> **Hard minimum: ≥ 10 VT-DS written (skip không count). Phải đạt trước khi sang Bước 2.**

**[VT-DS-01] Semantic color token — error**
- Error text có `text-destructive`, KHÔNG có inline hex/rgb

**[VT-DS-02] Semantic color token — muted**
- Muted label có `text-muted-foreground`, KHÔNG có hex

**[VT-DS-03] Field composition hierarchy**
- Field > FieldLabel > FieldContent render đúng, input accessible qua `getByLabelText`

**[VT-DS-04] FieldLabel không uppercase**
- `toHaveStyle` / KHÔNG có `text-transform: uppercase`

**[VT-DS-05] Button variant/tone đúng**
- Primary action button có đúng `variant`/`tone` attribute hoặc `bg-primary` class

**[VT-DS-06] Typography class**
- Heading có `typo-heading-*`, error caption có `typo-caption`

**[VT-DS-07] Badge variant semantic**
- Status badge dùng semantic variant (`success`/`destructive`/…), KHÔNG hardcode color

**[VT-DS-08] Icon button aria-label**
- Icon-only button có `aria-label` không rỗng

**[VT-DS-09] Upload primitive đúng loại**
- Single image → `InputUploadImage`; multi → `InputUploadImages`

**[VT-DS-10] Scrollable container**
- Overflow container có class `custom-scrollbar`

**[VT-DS-11+] Thêm nếu VT-DS-01→10 skip nhiều — ít nhất đủ 10 written:**
- **VT-DS-11: Spacing token** — gap/padding dùng Tailwind scale (`gap-4`, `p-6`), không inline `style={{ gap: '16px' }}`
- **VT-DS-12: Focus ring** — focused input có `focus-visible:ring-*` class (keyboard nav)
- **VT-DS-13: Dark mode class** — nếu có dark toggle, dark-variant class xuất hiện trên DOM
- **VT-DS-14: Skeleton/loading DS** — loading state dùng `<Skeleton>` SDK, không custom div spinner
- **VT-DS-15: Card composition** — `<Card><CardHeader><CardContent>` hierarchy đúng, không dùng div thô
- **VT-DS-16: data-slot present** — SDK component quan trọng có `data-slot` attribute để dễ select

> Skip VT-DS-XX nếu component không dùng SDK feature tương ứng — ghi lý do rõ.
> **Nếu skip nhiều → bù bằng VT-DS-11→16 để đảm bảo ≥ 10 written.**

---

## Bước 2 — Selector priority & Portal components

```
getByRole > getByLabelText > getByPlaceholderText > getByTestId > getByText > querySelector
```

Nếu element thiếu `aria-label`/`role` → ghi vào phần **⚠️ Cần fix UI** ở output.

### ⚠️ Lưu ý đặc biệt về Portal Components:
Với các components render qua Portal (như Radix UI / SDK Dialog, Popover, Select, Drawer, Tooltip):
- Mọi elements render trong Portal sẽ được gắn trực tiếp vào `document.body` thay vì `container` của Testing Library.
- **KHÔNG** dùng `container.querySelector(...)` vì sẽ trả về `null`.
- **NÊN** dùng `document.querySelector(...)` cho các token class check (VT-DS) hoặc query trực tiếp từ `screen` (ví dụ: `screen.getByRole('dialog')` hoặc `within(screen.getByRole('dialog'))`).

---

## Bước 3 — Tạo file

### Cấu trúc thực tế
```
__tests__/
├── setup.ts                          ← dựng MSW server từ infra/mocks/handlers
├── utils/render-with-intl.tsx        ← renderWithIntl (ĐÃ TỒN TẠI — chỉ import)
└── tests/<domain>/<feature>.test.tsx ← FILE TẠO MỚI

features/<feature>/mocks/<feature>.mock.ts  ← MSW mock (class extends BaseMock), tạo nếu chưa có
infra/mocks/handlers.ts                      ← gộp tất cả mock (mockManager.getAllHandlers())
```

> ⛔ **TUYỆT ĐỐI KHÔNG** tạo `e2e/` files.
> ⛔ **TUYỆT ĐỐI KHÔNG** tạo `*.spec.ts` (bất kỳ đâu).
> ✅ **CHỈ** tạo `__tests__/tests/<domain>/<feature>.test.tsx` và (nếu thiếu) `features/<feature>/mocks/<feature>.mock.ts`.
> ℹ️ `__tests__/utils/render-with-intl.tsx` đã tồn tại — chỉ import, KHÔNG tạo lại.

### Template test file (10+ TC)
```typescript
// __tests__/tests/<domain>/<feature>.test.tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../setup';
import { renderWithIntl } from '../../utils/render-with-intl';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as store from '@/features/<feature>/store';

// Mock next/navigation nếu component sử dụng router/pathname/searchParams
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/mock-path',
  useSearchParams: () => new URLSearchParams(''),
}));

// Mock Zustand store nếu sử dụng (ví dụ useAuthStore)
vi.mock('@/features/auth/stores/auth.store', () => ({
  useAuthStore: {
    getState: () => ({
      isLoading: false,
      user: null,
    }),
    subscribe: vi.fn(),
  },
}));

vi.mock('@/features/<feature>/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/<feature>/store')>();
  return { ...actual, use<Feature>Store: vi.fn() };
});

describe('<Tên màn hình>', () => {
  const mockAction = vi.fn();

  beforeEach(() => {
    mockAction.mockClear();
    vi.mocked(store.use<Feature>Store).mockReturnValue({
      action: mockAction,
      isLoading: false,
      error: null,
    });
  });

  // ─── VT-01: Render ────────────────────────────────
  it('VT-01: Render đúng các element cơ bản', () => {
    renderWithIntl(<FeatureComponent />);
    expect(screen.getByRole('heading', { name: /<title>/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/<field-a>/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/<field-b>/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /<submit>/i })).toBeInTheDocument();
  });

  // ─── VT-02: Happy Path Submit ────────────────────
  it('VT-02: Submit hợp lệ → action gọi với đúng args', async () => {
    const user = userEvent.setup();
    renderWithIntl(<FeatureComponent />);
    await user.type(screen.getByLabelText(/<field-a>/i), 'value-a');
    await user.type(screen.getByLabelText(/<field-b>/i), 'value-b');
    await user.click(screen.getByRole('button', { name: /<submit>/i }));
    await waitFor(() => {
      expect(mockAction).toHaveBeenCalledWith({ fieldA: 'value-a', fieldB: 'value-b' });
    });
  });

  // ─── VT-03: Loading State ────────────────────────
  it('VT-03: isLoading=true → button disabled, action không gọi thêm', () => {
    vi.mocked(store.use<Feature>Store).mockReturnValue({
      action: mockAction,
      isLoading: true,
      error: null,
    });
    renderWithIntl(<FeatureComponent />);
    const btn = screen.getByRole('button', { name: /đang|loading/i });
    expect(btn).toBeDisabled();
  });

  // ─── VT-04: Validation — Submit rỗng ────────────
  it('VT-04: Submit rỗng → tất cả lỗi validation, action không gọi', async () => {
    const user = userEvent.setup();
    renderWithIntl(<FeatureComponent />);
    await user.click(screen.getByRole('button', { name: /<submit>/i }));
    await waitFor(() => {
      expect(screen.getByText(/<error-message-a>/i)).toBeInTheDocument();
      expect(screen.getByText(/<error-message-b>/i)).toBeInTheDocument();
    });
    expect(mockAction).not.toHaveBeenCalled();
  });

  // ─── VT-05: Validation — Thiếu field A ──────────
  it('VT-05: Thiếu field A → lỗi A, không lỗi B', async () => {
    const user = userEvent.setup();
    renderWithIntl(<FeatureComponent />);
    await user.type(screen.getByLabelText(/<field-b>/i), 'value-b');
    await user.click(screen.getByRole('button', { name: /<submit>/i }));
    await waitFor(() => {
      expect(screen.getByText(/<error-message-a>/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/<error-message-b>/i)).not.toBeInTheDocument();
  });

  // ─── VT-06: Validation — Thiếu field B ──────────
  it('VT-06: Thiếu field B → lỗi B, không lỗi A', async () => {
    const user = userEvent.setup();
    renderWithIntl(<FeatureComponent />);
    await user.type(screen.getByLabelText(/<field-a>/i), 'value-a');
    await user.click(screen.getByRole('button', { name: /<submit>/i }));
    await waitFor(() => {
      expect(screen.getByText(/<error-message-b>/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/<error-message-a>/i)).not.toBeInTheDocument();
  });

  // ─── VT-07: Validation — Format sai ─────────────
  it('VT-07: Format sai → error message khớp Zod schema', async () => {
    const user = userEvent.setup();
    renderWithIntl(<FeatureComponent />);
    await user.type(screen.getByLabelText(/<field-a>/i), 'invalid-format');
    await user.click(screen.getByRole('button', { name: /<submit>/i }));
    await waitFor(() => {
      expect(screen.getByText(/<zod-error-message>/i)).toBeInTheDocument();
    });
    expect(mockAction).not.toHaveBeenCalled();
  });

  // ─── VT-08: Store Error → Alert ─────────────────
  it('VT-08: store.error có giá trị → alert hiển thị', () => {
    vi.mocked(store.use<Feature>Store).mockReturnValue({
      action: mockAction,
      isLoading: false,
      error: 'Lỗi đăng nhập không hợp lệ',
    });
    renderWithIntl(<FeatureComponent />);
    expect(screen.getByRole('alert')).toHaveTextContent('Lỗi đăng nhập không hợp lệ');
  });

  // ─── VT-09: Toggle Password ──────────────────────
  it('VT-09: Toggle show/hide password → input type thay đổi', async () => {
    const user = userEvent.setup();
    renderWithIntl(<FeatureComponent />);
    const input = screen.getByLabelText(/<password-label>/i);
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: /hiện|show/i }));
    expect(input).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: /ẩn|hide/i }));
    expect(input).toHaveAttribute('type', 'password');
  });

  // ─── VT-10: Clear Error khi Re-type ─────────────
  it('VT-10: Error xuất hiện → user gõ lại → error global bị clear', async () => {
    const user = userEvent.setup();
    vi.mocked(store.use<Feature>Store).mockReturnValue({
      action: mockAction,
      isLoading: false,
      error: 'Lỗi cũ',
    });
    renderWithIntl(<FeatureComponent />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/<field-a>/i), 'a');
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // ─── VT-11: MSW 400 → API Error trong component ─
  it('VT-11: MSW 400 → hiển thị error message từ API trong component', async () => {
    server.use(
      http.post('/api/<endpoint>', () =>
        HttpResponse.json({ message: 'Sai tài khoản hoặc mật khẩu' }, { status: 400 })
      )
    );
    const user = userEvent.setup();
    renderWithIntl(<FeatureComponent />);
    await user.type(screen.getByLabelText(/<field-a>/i), 'value-a');
    await user.type(screen.getByLabelText(/<field-b>/i), 'value-b');
    await user.click(screen.getByRole('button', { name: /<submit>/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Sai tài khoản hoặc mật khẩu');
    });
    // ❌ KHÔNG assert URL ở đây — URL assertion thuộc Playwright
  });

  // ─── VT-12: MSW 500 → Generic Error trong component
  it('VT-12: MSW 500 → hiển thị lỗi hệ thống chung trong component', async () => {
    server.use(
      http.post('/api/<endpoint>', () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
      )
    );
    const user = userEvent.setup();
    renderWithIntl(<FeatureComponent />);
    await user.type(screen.getByLabelText(/<field-a>/i), 'value-a');
    await user.type(screen.getByLabelText(/<field-b>/i), 'value-b');
    await user.click(screen.getByRole('button', { name: /<submit>/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    // ❌ KHÔNG assert URL ở đây
  });

  it.skip('VT-XX: Tên TC (lý do skip)', () => {
    // skip: <lý do rõ ràng — vd: chưa implement / không mock được>
  });
});
```

### Helper `renderWithIntl` — ĐÃ TỒN TẠI (chỉ import, KHÔNG tạo lại)

File `__tests__/utils/render-with-intl.tsx` đã có sẵn. Chỉ wrap `NextIntlClientProvider` với catalog
tiếng Anh (`@/messages/en.json`) — KHÔNG có QueryClient. Component test chỉ cần `import` và gọi
`renderWithIntl(<Component .../>)`.

```tsx
// __tests__/utils/render-with-intl.tsx  (đã tồn tại)
import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/messages/en.json'

/** Render a component inside the next-intl provider with the English catalog. */
export function renderWithIntl(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
  return render(ui, { wrapper: Wrapper, ...options })
}
```

#### Hook test — wrapper local + renderHook
Hook test không dùng `renderWithIntl`; tự khai báo `wrapper` là `NextIntlClientProvider` với cùng
`messages/en.json` rồi truyền vào `renderHook`:

```tsx
import { renderHook } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/messages/en.json'
import { useX } from '@/features/<feature>/hooks/use-x'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>{children}</NextIntlClientProvider>
)

it('VT-XX: useX initial state', () => {
  const { result } = renderHook(() => useX(), { wrapper })
  expect(result.current.isLoading).toBe(false)
})
```

### Template MSW mock — `features/<feature>/mocks/<feature>.mock.ts`

MSW dùng chung dev + test. Mock của mỗi feature là 1 class `extends BaseMock`, đăng ký tập trung tại
`infra/mocks/handlers.ts`. Test cần stub khác → override bằng `server.use(...)` trong từng test.

```ts
// features/<feature>/mocks/<feature>.mock.ts  (tạo nếu CHƯA có)
import { http, HttpResponse, delay, type HttpHandler } from 'msw'
import { BaseMock } from '@/infra/mocks/base-mock'

export class <Feature>Mock extends BaseMock {
  public getHandlers(): HttpHandler[] {
    return [
      http.post('*/api/<endpoint>', async ({ request }) => {
        // ... đọc body, trả HttpResponse.json(...)
        return HttpResponse.json({ /* success payload */ }, { status: 200 })
      }),
    ]
  }
}
```

```ts
// infra/mocks/handlers.ts — đăng ký rồi export handlers đã gộp
mockManager.register(new <Feature>Mock())
export const handlers = mockManager.getAllHandlers()
```

```ts
// Override per-test (không sửa file mock chung):
server.use(
  http.post('*/api/<endpoint>', () =>
    HttpResponse.json({ message: 'Sai tài khoản hoặc mật khẩu' }, { status: 400 })
  )
)
```

---

## Bước 4 — Quy tắc code

| Rule | Chi tiết |
|------|----------|
| **VT ≥ 10 written** | Skip không count. Thêm từ VT-11+ nếu thiếu |
| **VT-DS ≥ 10 written** | Skip không count. Thêm từ VT-DS-11+ nếu thiếu |
| **Total ≥ 20 written** | VT + VT-DS cộng lại. Vi phạm = output invalid |
| **Self-check trước khi done** | Đếm written: `VT=? / VT-DS=? / Total=?`. Nếu chưa đủ → thêm TC |
| **KHÔNG trùng Playwright** | Đọc `e2e/tests/<domain>/` trước khi viết |
| **Chỉ test component/logic** | Không assert real URL, không real cookie, không `page.goto` |
| **KHÔNG tạo file Playwright** | Không tạo `*.spec.ts`, không tạo `e2e/` files |
| **userEvent > fireEvent** | `userEvent.setup()` cho tất cả interactions |
| **Mock API failure** | `server.use(...)` override trong test cụ thể |
| **Test isolation** | Mỗi test tự setup, `beforeEach` reset mock |
| **QueryClient retry: false** | Cả queries lẫn mutations |
| **Không hardcode text** | Dùng regex `/pattern/i` hoặc import message file |
| **TC-ID liên tục** | VT-01..N kế tiếp file hiện có nếu append |
| **tiếng Việt** | Tên test, describe, comment |
| **`it.skip` có lý do** | Comment rõ lý do |
| **Coverage target** | ≥ 80% statements |
| **VT-DS recon trước** | Đọc source component, xác nhận SDK class tồn tại trước khi assert |
| **Không assume class** | KHÔNG assert class nếu chưa thấy trong source |
| **VT-DS skip rõ lý do** | `// skip: component không dùng Badge` etc. |

---

## Bước 5 — Verify

```bash
# Chạy đơn lẻ
pnpm test:unit __tests__/tests/<domain>/<feature>.test.tsx

# Verbose
pnpm test:unit __tests__/tests/<domain>/<feature>.test.tsx --reporter=verbose

# Coverage
pnpm test:unit:coverage
```

---

## Bước 4b — Template VT-DS (Design System Token Tests)

> Dùng khi component import từ `@bks/ds-system-sdk`. Recon source trước, chỉ assert class đã thấy.

```typescript
// __tests__/tests/<domain>/<feature>.test.tsx — phần VT-DS
import { within } from '@testing-library/react';

// ─── VT-DS-01: Error text dùng semantic token, không có hex ────
it('VT-DS-01: Error text dùng text-destructive, không hardcode hex', async () => {
  const user = userEvent.setup();
  renderWithIntl(<FeatureComponent />);
  await user.click(screen.getByRole('button', { name: /<submit>/i }));
  await waitFor(() => {
    const errorEl = screen.getByText(/<error-message>/i);
    expect(errorEl).toHaveClass('text-destructive');
    // KHÔNG có inline color hex
    expect(errorEl).not.toHaveStyle({ color: expect.stringMatching(/^#|^rgb/) });
  });
});

// ─── VT-DS-02: Field label dùng text-muted-foreground ──────────
it('VT-DS-02: FieldLabel dùng text-muted-foreground', () => {
  renderWithIntl(<FeatureComponent />);
  const label = screen.getByText(/<field-label-text>/i);
  expect(label).toHaveClass('text-muted-foreground');
});

// ─── VT-DS-03: Field composition hierarchy đúng ────────────────
it('VT-DS-03: Field > FieldLabel + FieldContent render đúng', () => {
  renderWithIntl(<FeatureComponent />);
  // Field wrap label + input (dùng document.querySelector vì component có thể render trong portal)
  const field = document.querySelector('[data-slot="field"], .field, form > div');
  expect(field).toBeInTheDocument();
  // Input có for/id pair (accessible label)
  const input = screen.getByLabelText(/<field-label-text>/i);
  expect(input).toBeInTheDocument();
});

// ─── VT-DS-04: FieldLabel KHÔNG uppercase ──────────────────────
it('VT-DS-04: FieldLabel không bị uppercase bởi CSS', () => {
  renderWithIntl(<FeatureComponent />);
  const label = screen.getByText(/<field-label-text>/i);
  const style = window.getComputedStyle(label);
  expect(style.textTransform).not.toBe('uppercase');
});

// ─── VT-DS-05: Button có đúng variant/tone ─────────────────────
it('VT-DS-05: Submit button dùng variant default (primary)', () => {
  renderWithIntl(<FeatureComponent />);
  const btn = screen.getByRole('button', { name: /<submit>/i });
  // SDK Button render data-variant hoặc class bg-primary
  expect(btn).toHaveClass('bg-primary');
});

// ─── VT-DS-06: Heading dùng typo-heading-* class ───────────────
it('VT-DS-06: Page heading dùng typo-heading-* class', () => {
  renderWithIntl(<FeatureComponent />);
  const heading = screen.getByRole('heading');
  const hasTypoClass = ['typo-heading-1','typo-heading-2','typo-heading-3','typo-title']
    .some(c => heading.classList.contains(c));
  expect(hasTypoClass).toBe(true);
});

// ─── VT-DS-07: Badge variant semantic ──────────────────────────
it('VT-DS-07: Status badge dùng variant semantic, không hardcode color', () => {
  renderWithIntl(<FeatureComponent status="active" />);
  const badge = screen.getByText(/active/i).closest('[class*="badge"], [data-slot="badge"]');
  expect(badge).not.toHaveStyle({ backgroundColor: expect.stringMatching(/^#|^rgb/) });
});

// ─── VT-DS-08: Icon button có aria-label ───────────────────────
it('VT-DS-08: Icon-only button có aria-label không rỗng', () => {
  renderWithIntl(<FeatureComponent />);
  const iconBtns = screen.queryAllByRole('button').filter(btn => !btn.textContent?.trim());
  iconBtns.forEach(btn => {
    expect(btn).toHaveAttribute('aria-label');
    expect(btn.getAttribute('aria-label')).not.toBe('');
  });
});

// ─── VT-DS-10: Scroll container có custom-scrollbar ────────────
it('VT-DS-10: Scrollable container có class custom-scrollbar', () => {
  renderWithIntl(<FeatureComponent />);
  const scrollEl = document.querySelector('.overflow-auto, .overflow-y-auto, .overflow-scroll, .custom-scrollbar');
  if (scrollEl) {
    expect(scrollEl).toHaveClass('custom-scrollbar');
  } else {
    // skip: không có scroll container
  }
});
```

---

## Output cuối

```
✅ Đã tạo (Vitest only):
  - __tests__/tests/<domain>/<feature>.test.tsx
  - features/<feature>/mocks/<feature>.mock.ts  (chỉ khi feature chưa có mock; nhớ đăng ký tại infra/mocks/handlers.ts)

🔢 TC COUNT (tự check trước khi output):
  VT written:    ?? / 10 minimum
  VT-DS written: ?? / 10 minimum
  Total written: ?? / 20 minimum
  ❌ Nếu bất kỳ số nào chưa đủ → THÊM TC trước khi output này

📋 VT list (Component/Logic — min 10 written):
  VT-01 ✅ Render đúng các element
  VT-02 ✅ Submit → action gọi đúng args
  VT-03 ✅ Loading state — button disabled
  VT-04 ✅ Validation — submit rỗng
  VT-05 ✅ Validation — thiếu field A
  VT-06 ✅ Validation — thiếu field B
  VT-07 ✅ Format sai → error Zod
  VT-08 ✅ Store error → alert
  VT-09 ✅ Toggle password type
  VT-10 ✅ Re-type → clear error
  VT-11 ✅ MSW 400 → API error (component alert)
  VT-12 ✅ MSW 500 → generic error (component alert)
  VT-XX ⏭️  Skip — <lý do>

🎨 VT-DS list (Design System Token — min 10 written):
  VT-DS-01 ✅/⏭️  Error text → text-destructive, không hex
  VT-DS-02 ✅/⏭️  Label → text-muted-foreground
  VT-DS-03 ✅/⏭️  Field composition hierarchy
  VT-DS-04 ✅/⏭️  FieldLabel không uppercase
  VT-DS-05 ✅/⏭️  Button variant → bg-primary
  VT-DS-06 ✅/⏭️  Heading → typo-heading-*
  VT-DS-07 ✅/⏭️  Badge variant semantic
  VT-DS-08 ✅/⏭️  Icon button → aria-label
  VT-DS-09 ✅/⏭️  Upload primitive đúng loại
  VT-DS-10 ✅/⏭️  Scroll container → custom-scrollbar
  VT-DS-11 ✅/⏭️  Spacing token — không inline style gap/padding
  VT-DS-12 ✅/⏭️  Focus ring → focus-visible:ring-*
  VT-DS-13 ✅/⏭️  Dark mode class
  VT-DS-14 ✅/⏭️  Skeleton/loading DS component
  VT-DS-15 ✅/⏭️  Card composition hierarchy
  VT-DS-16 ✅/⏭️  data-slot attribute present
  (thêm VT-DS-XX nếu cần bù đủ 10 written)

🚫 KHÔNG viết (thuộc Playwright — đã defer):
  - Redirect URL → PW-01
  - Auth guard navigation → PW-03/04
  - Cookie set/assert → PW-05
  - Token expiry → PW-07

📊 Coverage estimate:
  - Vitest (logic): ~90% component logic
  - Vitest (DS tokens): ~85% SDK compliance
  - Playwright: ⏳ pending → chạy create-tc-flow

⚠️ Cần fix UI:
  - <element> chưa có aria-label → thêm aria-label="<name>"
  - <span> hardcode color → đổi sang text-destructive
  - <label> missing text-muted-foreground

👉 BƯỚC TIẾP: Chạy create-tc-flow → fill PW-XX → combined coverage 100%
```
