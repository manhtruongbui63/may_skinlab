# Bài 2: Cấu Trúc Thư Mục Dự Án & Ý Nghĩa Chi Tiết

Một trong những khác biệt lớn nhất của dự án này so với các dự án thông thường là sự chú trọng đặc biệt vào **Tài liệu nghiệp vụ có cấu trúc chuẩn hóa**. Đây không chỉ là tài liệu cho con người đọc, mà còn là "nguồn tri thức gốc" (Source of Truth) được thiết kế tối ưu để AI Agent có thể đọc hiểu hệ thống ngay lập tức mà không cần hỏi đi hỏi lại.

---

## 1. 📁 Cấu Trúc Thư Mục Gốc (Project Root)

```text
laravel-13-nextjs-16/          ← Thư mục gốc của toàn bộ dự án
├── .agents/                   # Hệ thống AI Agent (Skills, Workflows, Scripts)
│   ├── skills/                # Các kỹ năng chuyên biệt của AI Agent
│   ├── workflows/             # Quy trình làm việc từng bước (slash commands)
│   └── scripts/               # Script hỗ trợ tự động hóa (validate-backend.php...)
│
├── backend/                   # Laravel 13 — Backend API
├── frontend/                  # Next.js 16 — Frontend App Router
│
├── docs/                      # Toàn bộ tài liệu dự án (Source of Truth)
├── guide/                     # Cẩm nang hướng dẫn cho developer & AI Agent
│
├── AGENTS.md                  # Hướng dẫn bắt buộc cho AI Agent đọc trước khi code
└── README.md                  # Tổng quan dự án
```

---

## 2. ⚙️ Cấu Trúc Thư Mục Backend (`backend/`)

```text
backend/
├── app/
│   ├── Console/Commands/      # Artisan Commands tùy biến (php artisan ...)
│   ├── DTOs/                  # Data Transfer Objects — đóng gói input cho Service
│   │   ├── Api/               # DTOs cho API layer
│   │   └── Background/        # DTOs cho Jobs/Commands
│   ├── Enums/                 # PHP Enums — trạng thái, loại dữ liệu (UserStatus...)
│   ├── Exceptions/            # Custom Exceptions (InputException, NotFoundException...)
│   ├── Factories/             # Factory khởi tạo Service cho Controller
│   │   ├── ApiFactory.php     # Resolve các API Service
│   │   ├── BackgroundFactory.php # Resolve các Background Service
│   │   └── CommonFactory.php  # Resolve các Common Service
│   ├── Helpers/               # Hàm tiện ích dùng chung (ResponseHelper, DateHelper...)
│   ├── Http/
│   │   ├── Controllers/       # Thin Controllers — chỉ điều phối, không chứa logic
│   │   │   ├── Api/           # API Controllers theo module
│   │   │   └── Traits/        # Controller Traits tái sử dụng
│   │   ├── Requests/          # FormRequests — validation 3 lớp
│   │   └── Resources/         # JsonResources — định dạng response JSON
│   ├── Models/                # Eloquent Models & Query Scopes
│   ├── Policies/              # Authorization Policies (Spatie Permission)
│   ├── Providers/             # Service Providers cấu hình hệ thống
│   ├── Rules/                 # Custom Validation Rules
│   ├── Services/              # Rich Business Logic — trái tim của backend
│   │   ├── Api/               # Business services cho từng module API
│   │   ├── Background/        # Services cho Jobs & Commands
│   │   ├── Base/              # Lớp cơ sở Service, TableService, MasterDataService
│   │   ├── Common/            # Services dùng chung (upload, notification...)
│   │   └── Contracts/         # Interfaces & Contracts
│   └── Traits/                # PHP Traits tái sử dụng xuyên suốt app
│
├── database/
│   ├── factories/             # Model Factories cho testing
│   ├── migrations/            # Database migrations (version-controlled schema)
│   └── seeders/               # Database seeders
│
├── lang/                      # Validation error messages đa ngôn ngữ
├── routes/
│   ├── api.php                # Khai báo toàn bộ API endpoints
│   ├── console.php            # Đăng ký Artisan scheduled commands
│   └── web.php                # Web routes (minimal — chủ yếu dùng API)
│
└── tests/
    ├── Feature/
    │   ├── Api/               # Feature Tests cho HTTP API (nhóm theo resource)
    │   ├── Console/           # Tests cho Artisan Commands
    │   └── Jobs/              # Tests xác nhận Job được dispatch đúng
    └── Unit/
        ├── Services/          # Unit Tests cho logic phức tạp trong Service
        ├── Jobs/              # Unit Tests cho luồng xử lý bên trong Job
        ├── Rules/             # Unit Tests cho Custom Validation Rules
        └── Helpers/           # Unit Tests cho các hàm Helper
```

---

## 3. 🖥️ Cấu Trúc Thư Mục Frontend (`frontend/`)

```text
frontend/
├── app/                       # Next.js App Router — Pages & Layouts thuần túy
│   ├── (auth)/                # Route group: trang chưa xác thực (login...)
│   ├── (main)/                # Route group: trang đã xác thực (có AppShell)
│   ├── layout.tsx             # Root layout (locale lấy từ cookie, không prefix URL)
│   └── providers.tsx          # Cây Provider: TanStack Query, MSW, Auth, Theme...
│
├── features/                  # ⭐ Cốt lõi nghiệp vụ — Feature-Sliced Design
│   └── {module}/              # Ví dụ: auth/, users/, products/
│       ├── components/        # Components gắn với nghiệp vụ của module này
│       ├── hooks/             # Custom hooks (use-{module}.ts) — giao tiếp với Service
│       ├── mocks/             # MSW handlers cho kiểm thử & dev offline
│       ├── schemas/           # Zod schemas validate response từ backend
│       ├── services/          # Repository + Service layer
│       │   ├── *.repository.ts       # Interface (contract) — "cần làm gì"
│       │   ├── *.repository.impl.ts  # HTTP Implementation — "làm như thế nào"
│       │   └── *.service.ts          # Orchestrator: phối hợp Repo ↔ Store ↔ Toast
│       ├── stores/            # Zustand store (*.store.ts) — client state tối thiểu
│       ├── types.ts           # TypeScript types của module
│       └── index.ts           # Public API — chỉ export những gì module khác dùng được
│
├── shared/                    # Tài nguyên dùng chung toàn dự án
│   ├── components/
│   │   ├── layout/            # AppShell, Sidebar, TopBar, Page transitions
│   │   ├── menu/              # Navigation menu components
│   │   ├── permissions/       # PermissionGuard, RoleGuard components
│   │   ├── providers/         # MSWProvider, NetworkStatusProvider, ThemeProvider
│   │   └── ui/                # shadcn/ui primitives (Button, Card...)
│   ├── hooks/                 # Hooks dùng chung (use-navigation, use-permission)
│   ├── lib/                   # Thư viện tiện ích (utils, formatters...)
│   ├── services/              # Services dùng chung xuyên module
│   ├── stores/                # Zustand stores dùng chung
│   ├── types/                 # TypeScript types dùng chung
│   └── utils/                 # Hàm tiện ích thuần túy (pure functions)
│
├── infra/                     # Hạ tầng kỹ thuật — không chứa logic nghiệp vụ
│   ├── api/
│   │   ├── base-repository.ts      # Abstract BaseRepository (GET, POST, PUT...)
│   │   ├── http-service.ts         # Axios singleton với auto token refresh
│   │   ├── http-adapter.ts         # IHttpAdapter interface (decoupling)
│   │   ├── server-http.service.ts  # HTTP Client cho Server Components (Next.js)
│   │   ├── error-handler.ts        # Global API error handler (toast, redirect)
│   │   ├── query-client.ts         # TanStack Query client configuration
│   │   └── retry/                  # Retry logic & types
│   └── mocks/                 # MSW global setup
│       ├── browser.ts         # MSW worker setup cho browser
│       ├── node.ts            # MSW server setup cho Node.js (testing)
│       ├── handlers.ts        # Aggregated handlers từ tất cả features
│       └── mock-manager.ts    # Quản lý enable/disable mock handlers
│
├── i18n/                      # Cấu hình next-intl
│   ├── routing.ts             # Định nghĩa locales, defaultLocale, pathnames
│   └── request.ts             # Server-side locale detection
│
├── messages/                  # File ngôn ngữ i18n
│   ├── vi.json                # Tiếng Việt (ngôn ngữ mặc định)
│   └── en.json                # Tiếng Anh
│
├── middleware.ts              # Next.js Edge Middleware: auth guard + locale redirect
├── components.json            # shadcn/ui configuration
└── vitest.config.ts           # Vitest configuration cho unit/integration tests
```

---

## 4. 📂 Ý Nghĩa Chi Tiết Của Từng Thư Mục Con Trong `docs/`

Thư mục `docs/` là kho lưu trữ toàn bộ tài liệu của dự án và được tổ chức phân cấp rõ ràng theo mục đích sử dụng:

```text
docs/
├── system/         # Nền tảng hệ thống (kiến trúc tĩnh, luật chung) — ĐỌC TRƯỚC KHI CODE
├── logic/          # Tài liệu logic chi tiết của từng module (nguồn sự thật động)
│   ├── index.md    # Danh sách toàn bộ logic docs hiện có
│   ├── auth/       # Logic docs cho module auth
│   └── user/       # Logic docs cho module user
├── api/            # Đặc tả API endpoints (manual + auto-generated bởi Scramble)
├── draft/          # Yêu cầu thô đầu vào từ stakeholders (KHÔNG dùng để tham chiếu code)
├── requirements/   # Đặc tả kỹ thuật chính thức (sau khi PM phân tích draft)
├── tasks/          # Các task phát triển được phân rã để thực thi
└── testing/        # Báo cáo kết quả kiểm thử theo từng tính năng
```

### 4.1. Thư Mục `docs/system/` (Nền Tảng Hệ Thống — Bắt Buộc Đọc Trước)
Chứa các tài liệu mang tính chất "khung xương" của toàn hệ thống. Đây là nơi các thành viên mới bắt buộc phải đọc trước khi code bất kỳ dòng nào:
*   `overview.md`: Tổng quan về hệ thống, các vai trò người dùng (user roles) và bản đồ thư mục dự án.
*   `business-rules.md`: Định nghĩa các luật kinh doanh cấp hệ thống (quy chuẩn đăng nhập, phân quyền, xử lý lỗi chung).
*   `br-registry.md`: **Sổ đăng ký tập trung** tất cả mã Business Rule (`BR-*`) trong dự án để tránh trùng lặp.
*   `architecture.md`: Chi tiết kiến trúc Backend và Frontend, sơ đồ luồng dữ liệu, quy chuẩn mã hóa.
*   `domain-model.md`: Bản đồ các thực thể (entities), mối quan hệ, kiểu dữ liệu và Enums.

### 4.2. Thư Mục `docs/logic/` (Source Of Truth Cho Logic Nghiệp Vụ)
Đây là thư mục **quan trọng nhất** đối với việc phát triển tính năng. Mỗi module/feature có file logic riêng:
*   **Nhiệm vụ**: Mô tả chi tiết Luồng xử lý (Flow), Quy tắc nghiệp vụ, Edge cases, và cách xử lý lỗi.
*   **Cấu trúc chuẩn**: Bắt buộc có YAML frontmatter ghi nhận phiên bản tài liệu, trạng thái và file code liên quan để AI Agent định vị vùng chỉnh sửa.
*   **Quy định cập nhật**: Khi logic tính năng thay đổi, tài liệu trong `docs/logic/` **phải được cập nhật đầu tiên** trước khi chỉnh sửa code.

### 4.3. Thư Mục `docs/tasks/` (Quản Lý Nhiệm Vụ Chi Tiết)
Nơi chứa danh sách các task phát triển chi tiết được phân rã từ tài liệu đặc tả. Mỗi task (file `.md`) bao gồm:
*   Metadata về task (độ ưu tiên, công sức ước tính, trạng thái).
*   Mô tả chi tiết những việc cần làm với Checklist `[x]`.
*   Tài liệu tham chiếu liên quan (skill nào cần dùng, BR nào áp dụng).

### 4.4. Các Thư Mục Khác
*   `docs/draft/`: Lưu file nháp, ghi chú thô từ khách hàng. **Không dùng làm tài liệu tham chiếu khi code.**
*   `docs/api/`: Đặc tả thủ công các API. Kết hợp với tài liệu tự động sinh qua Scramble tại `/docs/api`.
*   `docs/testing/`: Báo cáo kết quả test từng tính năng. Mỗi báo cáo ghi lại cả lần thất bại và cách khắc phục.

---

## 5. 🔄 Quy Trình Luồng Tài Liệu (Documentation Pipeline)

Trong dự án, viết tài liệu không phải việc làm sau cùng để đối phó, mà là **đầu vào của quá trình lập trình**:

```text
[Ý tưởng thô] ➔ [Drafts] ➔ [Formal Requirements] ➔ [Granular Tasks] ➔ [Code + Tests] ➔ [Logic Docs] ➔ [BR Registry]
```

1.  **Tiếp nhận nháp**: Lưu file nháp vào `docs/draft/`.
2.  **Phân tích yêu cầu**: AI phân tích nháp qua workflow `/pm-analyze-draft-req`, sinh ra đặc tả kỹ thuật chuẩn trong `docs/requirements/`.
3.  **Phân rã tác vụ**: Đặc tả kỹ thuật được phân rã thành các task cực nhỏ trong `docs/tasks/`.
4.  **Thực thi & Kiểm thử**: Developer hoặc AI Agent đọc task, phát triển code và viết test tương ứng.
5.  **Cập nhật Logic & Registry**: Khi code chạy tốt, cập nhật chi tiết logic vào `docs/logic/` và bổ sung mã rule mới vào `docs/system/br-registry.md`.

---

## 6. 🏷️ Quy Chuẩn Quản Lý Business Rules (BR)

Để AI Agent và con người có chung một ngôn ngữ giao tiếp về nghiệp vụ, mọi quy tắc kinh doanh trong dự án phải được chuẩn hóa và quản lý tập trung:

### 6.1. Cấu Trúc Mã BR
Mọi rule nghiệp vụ phải được gán một mã ID duy nhất theo quy ước:
*   `BR-GXXX` (Global Rule): Quy tắc chung áp dụng cho toàn hệ thống (VD: `BR-G001`).
*   `BR-{MODULE}-XXX` (Module Rule): Quy tắc cụ thể cho một phân hệ (VD: `BR-AUTH-002`).
*   `PROPOSED_BR:{slug}` (Proposed Rule): Mã tạm thời được AI đề xuất, chưa được phê duyệt chính thức.

### 6.2. Quy Trình Đăng Ký Business Rule Mới
1.  **Bước 1**: Đề xuất rule mới bằng nhãn `PROPOSED_BR:{slug}` trong tài liệu đặc tả.
2.  **Bước 2**: Thảo luận giữa các thành viên và Tech Lead để phê duyệt.
3.  **Bước 3**: Khi được thông qua, thêm rule mới vào bảng `docs/system/br-registry.md` với mã ID chính thức.
4.  **Bước 4**: Thay thế toàn bộ nhãn `PROPOSED_BR` trong code và tài liệu bằng mã `BR-*` chính thức.

> [!IMPORTANT]
> **Tại Sao Phải Làm Việc Này?**
> Việc đặt mã BR giúp chúng ta có khả năng **truy xuất nguồn gốc luật nghiệp vụ** (traceability). Trong code, tại vị trí thực hiện validation hoặc xử lý logic phức tạp, ta chỉ cần chèn: `// Tuân thủ BR-AUTH-002`. Khi AI Agent đọc code này, nó sẽ tự động tìm kiếm tài liệu tương ứng để hiểu nguyên nhân viết đoạn code đó, giúp hạn chế tối đa việc sửa đổi làm hỏng logic nghiệp vụ ban đầu.
