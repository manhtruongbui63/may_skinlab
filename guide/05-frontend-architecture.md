# Bài 5: Kiến Trúc & Luồng Viết Frontend Next.js 16 Chuẩn Mực

Dự án của chúng ta sử dụng **Next.js 16** với App Router để xây dựng giao diện người dùng hiệu năng cao. Nhằm duy trì một codebase sạch, dễ mở rộng và có thể kiểm thử tự động, frontend áp dụng mô hình **Feature-Sliced** kết hợp với **Repository Pattern** và **Zustand** cho quản lý trạng thái toàn cục.

---

## 1. 🔄 Luồng Dữ Liệu Một Chiều (Unidirectional Data Flow)

Mọi tương tác người dùng trên Frontend bắt buộc phải tuân theo luồng xử lý tuần tự và một chiều duy nhất như sau:

```text
Người Dùng (UI Interaction)
       │
       ▼
 1. [ Page / Component ] ────► Render UI, gọi custom hook
       │
       ▼
 2. [ Custom Hook (use-*.ts) ] ► Đọc state từ Zustand, gọi Service
       │
       ▼
 3. [ Service (*.service.ts) ] ► Xử lý logic nghiệp vụ, phối hợp Store ↔ Repository
       │
       ▼
 4. [ Repository (*.repository.impl.ts) ] ► Gọi HTTP Adapter, validate response với Zod
       │
       ▼
 5. [ HttpService / BaseRepository ] ── Axios với tự động refresh token
       │
       ▼
 6. [ Zustand Store (*.store.ts) ] ◄── Service cập nhật trạng thái
       │
       ▼
 7. [ Component re-render ] ◄────────── Store thay đổi kích hoạt re-render
```

### 1.1. Chi Tiết Trách Nhiệm Của Từng Lớp (Separation of Concerns)

1.  **Page / Component (`app/(auth)/`, `app/(main)/`)**:
    *   Render UI thuần túy, nhận dữ liệu từ hook, phát sự kiện người dùng.
    *   **Tuyệt đối không chứa logic nghiệp vụ**, không gọi trực tiếp API, không thao tác với Store.

2.  **Custom Hook (`features/{module}/hooks/use-*.ts`)**:
    *   Là cầu nối duy nhất giữa Component và Service/Store.
    *   Đọc trạng thái từ Zustand Store (reactive), ủy quyền các action cho Service (singleton).
    *   Giữ cho Component hoàn toàn độc lập với lớp dịch vụ.

3.  **Service (`features/{module}/services/*.service.ts`)**:
    *   Xử lý toàn bộ logic nghiệp vụ frontend: phối hợp Repository, cập nhật Store, hiển thị toast thông báo.
    *   Được khởi tạo dưới dạng **singleton** (`export const authService = new AuthService(...)`).
    *   Phân biệt lỗi nghiệp vụ (422 → map vào form errors) với lỗi hệ thống (5xx → toast).

4.  **Repository Interface (`features/{module}/services/*.repository.ts`)**:
    *   Định nghĩa **contract** (interface) thuần túy cho từng tính năng.
    *   Tách biệt hoàn toàn giữa "cần làm gì" (interface) và "làm như thế nào" (implementation).
    *   Cho phép thay thế `HttpRepository` bằng `MockRepository` trong môi trường kiểm thử.

5.  **Repository Implementation (`features/{module}/services/*.repository.impl.ts`)**:
    *   Kế thừa `BaseRepository` từ `infra/api/base-repository.ts`.
    *   Gọi HTTP Adapter, validate response bằng Zod schema trước khi trả về dữ liệu.
    *   Xử lý việc map dữ liệu raw từ API sang domain type của dự án.

6.  **HttpService (`infra/api/http-service.ts`)**:
    *   Singleton Axios client toàn cục, được chia sẻ bởi tất cả Repository.
    *   Tích hợp sẵn cơ chế **tự động refresh access token** khi nhận được 401.
    *   Hỗ trợ các method có validation Zod tích hợp (`getValidated`, `postValidated`...).

7.  **Zustand Store (`features/{module}/stores/*.store.ts`)**:
    *   Lưu trữ trạng thái client-side tối thiểu: user session, loading flag, error state.
    *   Không chứa logic bất đồng bộ (async logic) — đó là trách nhiệm của Service.

---

## 2. 📂 Cấu Trúc Thư Mục Frontend

Mã nguồn Frontend được tổ chức theo mô hình **Feature-Sliced** kết hợp với phân lớp rõ ràng:

```text
frontend/
├── app/                    # Next.js App Router — chỉ chứa Pages & Layouts
│   ├── (auth)/             # Route group: trang đăng nhập, chưa xác thực
│   ├── (main)/             # Route group: trang đã xác thực, có AppShell
│   └── providers.tsx       # Cây Provider toàn app (locale lấy từ cookie, không prefix URL)
│
├── features/               # ⭐ Cốt lõi nghiệp vụ — mỗi module là một folder độc lập
│   └── {module}/           # Ví dụ: auth/, users/, companies/
│       ├── components/     # Component riêng của module này
│       ├── hooks/          # Custom hooks (use-{module}.ts)
│       ├── mocks/          # MSW handlers cho kiểm thử (*.mock.ts)
│       ├── schemas/        # Zod schemas validate dữ liệu API (*.schema.ts)
│       ├── services/       # Service + Repository pattern
│       │   ├── *.repository.ts       # Interface (contract)
│       │   ├── *.repository.impl.ts  # HTTP Implementation
│       │   └── *.service.ts          # Business logic orchestrator
│       ├── stores/         # Zustand store (*.store.ts)
│       ├── types.ts        # TypeScript types của module
│       └── index.ts        # Public API — chỉ export những gì module khác được phép dùng
│
├── shared/                 # Tài nguyên dùng chung toàn dự án
│   ├── components/         # Component tái sử dụng (layout, ui, providers, menu)
│   ├── hooks/              # Hook dùng chung (use-navigation, use-permission)
│   ├── lib/                # Thư viện tiện ích (utils)
│   └── types/              # TypeScript types dùng chung
│
├── infra/                  # Hạ tầng kỹ thuật — không chứa logic nghiệp vụ
│   ├── api/
│   │   ├── base-repository.ts    # Lớp cơ sở Repository (GET, POST, PUT, PATCH, DELETE)
│   │   ├── http-service.ts       # Axios singleton với refresh token tích hợp
│   │   ├── http-adapter.ts       # Interface IHttpAdapter (cho phép mock trong test)
│   │   ├── error-handler.ts      # Xử lý lỗi API toàn cục (toast, redirect)
│   │   └── query-client.ts       # TanStack Query client config
│   └── mocks/              # MSW setup (browser.ts, node.ts, handlers.ts, mock-manager.ts)
│
├── messages/               # File ngôn ngữ i18n (en.json, vi.json)
├── i18n/                   # Cấu hình next-intl (routing.ts, request.ts)
└── middleware.ts            # Next.js Edge middleware: auth guard (locale lấy từ cookie)
```

---

## 3. 🌐 Kiến Trúc Định Tuyến & Bảo Vệ Route

Dự án sử dụng **next-intl** để quản lý đa ngôn ngữ và **Next.js Middleware** để bảo vệ route:

```text
middleware.ts
  ├── Bước 1: Đọc locale từ cookie (không có prefix /<locale> trên URL)
  ├── Bước 2: Phát hiện token từ cookie hoặc Authorization header
  ├── Bước 3: Nếu đã đăng nhập → chặn vào trang auth (login), redirect về dashboard
  └── Bước 4: Nếu chưa đăng nhập → chặn vào PROTECTED_ROUTES, redirect về /login?callbackUrl=...
```

> [!IMPORTANT]
> **Nguyên tắc phân quyền hai tầng**: Middleware chỉ kiểm tra **authentication** (có token không?). Kiểm tra **authorization** (có đủ quyền không?) được thực hiện hoàn toàn ở phía client thông qua hook `usePermission()` và component `PermissionGuard`.

---

## 4. ⚙️ Hệ Thống Providers (Khởi Tạo Ứng Dụng)

Toàn bộ cây Provider được khai báo trong `app/providers.tsx` theo thứ tự lồng nhau có chủ đích:

```text
<ThemeProvider>           ← Dark/Light mode
  <QueryClientProvider>   ← TanStack Query client
    <LoggerProvider>      ← Khởi tạo logger phía client
      <MSWProvider>       ← Mock Service Worker (chỉ active khi NEXT_PUBLIC_USE_MOCK=true)
        <NetworkStatusProvider>  ← Giám sát kết nối mạng
          <AuthInitializer>      ← Gọi fetchMe() một lần duy nhất khi app khởi động
            {children}
          </AuthInitializer>
        </NetworkStatusProvider>
      </MSWProvider>
    </LoggerProvider>
    <Toaster />           ← Sonner toast notifications
    <ReactQueryDevtools /> ← Chỉ hiển thị ở môi trường development
  </QueryClientProvider>
</ThemeProvider>
```

---

## 5. 🛠️ Quy Trình 8 Bước Viết Frontend Feature Hoàn Chỉnh

Khi triển khai bất kỳ tính năng Frontend mới nào, bắt buộc phải tuân theo quy trình 8 bước chuẩn dưới đây:

### Bước 1: Tạo Cấu Trúc Module
*   Tạo thư mục `features/{module}/` với đầy đủ các thư mục con: `components/`, `hooks/`, `mocks/`, `schemas/`, `services/`, `stores/`.
*   Tạo file `index.ts` định nghĩa Public API của module — chỉ export những gì các module khác được phép import.

### Bước 2: Định Nghĩa Types & Zod Schemas
*   Tạo `types.ts` khai báo các TypeScript interface/type của module (VD: `User`, `LoginCredentials`).
*   Tạo `schemas/{module}.schema.ts` khai báo **Zod schemas** để validate response từ backend.
*   Quy tắc: Schema Zod dùng để validate tại tầng Repository; TypeScript types dùng trong toàn bộ codebase.

### Bước 3: Tạo Repository Interface & Implementation
*   Tạo `*.repository.ts` khai báo interface thuần túy với đầy đủ JSDoc cho từng phương thức.
*   Tạo `*.repository.impl.ts` kế thừa `BaseRepository`, gọi HTTP và validate response bằng Zod schema.
*   **Bắt buộc**: Implementation phải tuân thủ interface, không được thêm phương thức ngoài contract.

### Bước 4: Viết Service Layer
*   Tạo `*.service.ts` khai báo class Service nhận Repository qua **Constructor Injection** (dễ thay thế khi test).
*   Service phối hợp Repository → cập nhật Zustand Store → xử lý toast thông báo.
*   Export một **singleton** đã được khởi tạo sẵn để hook sử dụng.

### Bước 5: Tạo Zustand Store
*   Tạo `stores/*.store.ts` định nghĩa state tối thiểu cần thiết cho module.
*   Store chỉ chứa `state` và các `setter` đơn giản — không chứa async logic.
*   Sử dụng Zustand `create()` với TypeScript type đầy đủ.

### Bước 6: Viết Custom Hook
*   Tạo `hooks/use-{module}.ts` đọc state từ Store và ủy quyền action cho Service.
*   Hook là điểm tiếp xúc duy nhất mà Component có thể tương tác với tầng dịch vụ.

### Bước 7: Xây Dựng Component & Page
*   Tạo Component trong `features/{module}/components/` (Component nghiệp vụ, gắn với module).
*   Component dùng chung đặt tại `shared/components/`.
*   Tạo Page trong `app/(main)/{module}/page.tsx`.
*   **Form bắt buộc**: Dùng React Hook Form + Zod Resolver. Modal dialog là cách mặc định cho create/edit.

### Bước 8: Thiết Lập Mock & Viết Test
*   Tạo `mocks/{module}.mock.ts` định nghĩa MSW handlers để phát triển và kiểm thử offline.
*   Viết Vitest unit/integration tests cho hook và component.
*   Viết Playwright E2E tests cho các luồng người dùng quan trọng.

---

## 6. 🌍 Quy Chuẩn i18n (Đa Ngôn Ngữ)

Dự án hỗ trợ đa ngôn ngữ bắt buộc thông qua **next-intl**. Mọi chuỗi hiển thị ra UI đều phải được quốc tế hóa:

*   **File ngôn ngữ**: `messages/vi.json` (tiếng Việt) và `messages/en.json` (tiếng Anh).
*   **Namespace**: Mỗi module có namespace riêng trong file JSON (VD: key `"Auth"`, `"Common"`, `"Api"`).
*   **Client Component**: Dùng hook `useTranslations("NamespaceName")` từ `next-intl`.
*   **Server Component**: Dùng hàm `getTranslations("NamespaceName")` (async).

> [!IMPORTANT]
> **i18n là bắt buộc, không phải tùy chọn.** Nghiêm cấm hardcode chuỗi tiếng Việt hoặc tiếng Anh trực tiếp trong JSX. Mọi chuỗi mới phải được thêm vào cả `vi.json` và `en.json` trước khi dùng trong component.

---

## 7. ⚠️ Các Lỗi Thường Gặp Khi Viết Frontend

### 7.1. Import xuyên module (vi phạm nguyên tắc đóng gói)
```typescript
// ❌ Sai — Import trực tiếp vào file nội bộ của module khác
import { AuthRepository } from '@/features/auth/services/auth.repository.impl'

// ✅ Đúng — Luôn import qua Public API (index.ts) của module
import { useAuth } from '@/features/auth'
```

### 7.2. Gọi Service trực tiếp trong Component
```typescript
// ❌ Sai — Component biết quá nhiều về tầng dịch vụ
function LoginButton() {
  const handleClick = () => authService.login(credentials)
}

// ✅ Đúng — Component chỉ biết hook
function LoginButton() {
  const { login } = useAuth()
  const handleClick = () => login(credentials)
}
```

### 7.3. Chứa async logic trong Zustand Store
```typescript
// ❌ Sai — Store không nên chứa logic async phức tạp
const useAuthStore = create((set) => ({
  login: async (credentials) => {
    const user = await api.post('/login', credentials) // Sai
    set({ user })
  }
}))

// ✅ Đúng — Logic async thuộc về Service, Store chỉ lưu state
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
```

### 7.4. Hardcode chuỗi văn bản trong JSX
```tsx
// ❌ Sai — Không thể đa ngôn ngữ
<Button>Đăng nhập</Button>

// ✅ Đúng — Luôn dùng next-intl
const t = useTranslations('Auth')
<Button>{t('login')}</Button>
```

### 7.5. Bỏ qua validation Zod khi nhận response
```typescript
// ❌ Sai — Tin tưởng hoàn toàn vào cấu trúc response từ server
const user = response.data.data as User

// ✅ Đúng — Validate runtime với Zod để phát hiện lỗi ngay lập tức
const validated = BackendMeResponseSchema.parse(response.data)
const user = mapToUser(validated.data)
```
