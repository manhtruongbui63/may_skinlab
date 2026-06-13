# Bài 1: Hướng Dẫn Chi Tiết Các Skill & Quy Trình Làm Việc Chi Tiết

Để dự án được phát triển một cách nhất quán, chất lượng và tự động hóa cao, chúng ta áp dụng hệ thống **AI Agent Skills** và **Workflows**. Tài liệu này hướng dẫn chi tiết ý nghĩa của từng công cụ và quy trình phối hợp hiệu quả giữa bạn và AI Agent.

---

## 1. 🛠️ Danh Sách 21 AI Agent Skills

Hệ thống hiện có **21 skill chuyên biệt**, được chia thành các nhóm vai trò rõ ràng:

### 1.1. Nhóm Quản Trị & Phân Tích Nghiệp Vụ (PM & BA)
*   **`bks-requirement-analysis`**: Phân tích các yêu cầu nghiệp vụ thô, mơ hồ từ khách hàng hoặc tài liệu nháp (`docs/draft/`) để tạo ra đặc tả kỹ thuật hệ thống hoàn chỉnh, phát hiện sớm các lỗ hổng logic (logical gaps) và các trường hợp biên (edge cases).
*   **`bks-requirement-to-tasks`**: Phân rã các tài liệu đặc tả nghiệp vụ (`docs/requirements/`) thành các file task phát triển chi tiết, cực kỳ trực quan và có tính thực thi cao nằm trong `docs/tasks/`.
*   **`bks-doc-logic-standard`**: Chuẩn hóa cấu trúc tài liệu logic nghiệp vụ (`docs/logic/`) có tích hợp cấu trúc YAML frontmatter giúp AI Agent đọc hiểu chính xác 100% ngữ cảnh hệ thống.
*   **`bks-brand-guidelines`**: Hướng dẫn áp dụng nhận diện thương hiệu BKS (màu sắc, phông chữ, tone of voice) vào tài liệu, email hoặc landing page.

### 1.2. Nhóm Thực Thi Backend Laravel (`backend/`)
*   **`bks-be-database-standard`**: Hướng dẫn toàn diện để viết Migrations, Models, Eloquent Query Scopes, Enums, Factories và Seeders. Đảm bảo cấu trúc DB sạch và tối ưu.
*   **`bks-be-api-standard`**: Kỹ năng quan trọng nhất cho backend. Định nghĩa chi tiết luồng xử lý 1 chiều của API và các bước triển khai tuần tự từ DTO, Validation 3 lớp, đến Service và Controller.
*   **`bks-be-command-standard`**: Tiêu chuẩn viết Artisan Commands và các tác vụ lập lịch (Scheduled Tasks) an toàn, có thanh tiến trình (progress bar) và ghi log chuẩn.
*   **`bks-be-job-standard`**: Hướng dẫn viết các tác vụ chạy nền (Background Jobs), xử lý hàng đợi (Queues) kèm theo cơ chế bảo toàn ngữ cảnh người dùng và xử lý lỗi/retry thông minh.
*   **`bks-be-master-data-standard`**: Quy chuẩn đồng bộ và quản lý dữ liệu danh mục tĩnh (Master Data) toàn hệ thống.
*   **`bks-be-testing-standard`**: Tiêu chuẩn viết PHPUnit Tests (bao gồm Feature Tests và Unit Tests) để bảo vệ mã nguồn backend khỏi các lỗi hồi quy, kiểm tra hiệu năng (N+1 query, thời gian phản hồi) và bảo mật (SQL Injection, IDOR).

### 1.3. Nhóm Thực Thi Frontend Next.js (`frontend/`)

Nhóm frontend gồm **7 skill chuyên biệt**, phân công trách nhiệm rõ ràng và không chồng chéo lẫn nhau:

*   **`bks-fe-implement-feature`** *(Skill lõi — bắt buộc dùng trước)*: Single source of truth để triển khai một tính năng giao diện Next.js 16. Phân loại độ phức tạp (Simple/Standard/Complex) và luồng (A — form only, B — list only, C — full CRUD, D — detail view). Tích hợp React Hook Form + Zod + i18n bắt buộc. Gồm 5 bước thực thi tuần tự và checklist pre-merge có phân loại mức độ nghiêm trọng (🔴/🟡/🟢). **Bắt buộc nạp `bks-fe-api-integration` và `bks-fe-ds-sdk-consumer` khi thực thi.**

*   **`bks-fe-api-integration`** *(Thẩm quyền Data Layer)*: Hướng dẫn đầy đủ luồng tích hợp API cho một feature: Repository Pattern (abstract interface + HTTP adapter + optional mock), Zod runtime response validation, xử lý 422 server errors qua `mapBackendErrors`, hook orchestration, và toast policy. Đảm bảo luồng hoàn chỉnh từ `form submit → API call → validate response → map errors → toast`. Kích hoạt bằng: "ghép api", "tích hợp api".

*   **`bks-fe-ds-sdk-consumer`** *(Thẩm quyền UI/UX)*: Hướng dẫn sử dụng đúng chuẩn các component từ `@bks/ds-system-sdk`. Quy định: lựa chọn component đúng loại, layout composition, typography (`typo-*`), spacing token, scroll container (`custom-scrollbar`), badge/status semantic, upload primitives. Đây là **nguồn sự thật duy nhất về UI/UX** — không dùng `className` trực tiếp lên SDK primitives.

*   **`bks-fe-list-url-state`** *(List Pages)*: Đồng bộ hóa bộ lọc (search, selects, page, perPage) và phân trang của trang danh sách với URL search params trong Next.js App Router + next-intl. Áp dụng khi cần reload, chia sẻ link, hoặc Back/Forward trình duyệt khôi phục đúng trạng thái lọc.

*   **`bks-fe-create-tc-component`** *(Testing — Vitest)*: Viết kịch bản unit/integration test bằng **Vitest + Testing Library** cho component, hook, util, store. **Bắt buộc tối thiểu 10 VT** (component/logic) + **10 VT-DS** (design system token compliance) = tổng ≥ 20 TC mỗi lần chạy. Tạo file trong `__tests__/**/*.test.tsx`. **Tuyệt đối không tạo file Playwright**. Kích hoạt bằng: "viết unit test", "tạo vitest".

*   **`bks-fe-create-tc-flow`** *(Testing — Playwright E2E)*: Viết kịch bản E2E test bằng **Playwright** cho luồng người dùng thực (redirect URL, auth guard, cookie, cross-page navigation). Tạo Page Object + spec file. **Bắt buộc tối thiểu 10 TC** mỗi feature. Tạo file trong `e2e/**/*.spec.ts`. **Tuyệt đối không tạo file Vitest**. Kích hoạt bằng: "viết testcase flow", "tạo test cho".

*   **`bks-fe-webapp-testing`** *(Debug Tool)*: Toolkit tương tác và kiểm thử ứng dụng web local bằng Playwright. Hỗ trợ xác minh chức năng giao diện, debug UI behavior, chụp screenshot browser, xem browser console logs. Thường dùng để **recon selector** trước khi viết test với `bks-fe-create-tc-flow`.

> [!IMPORTANT]
> **Phân công Testing — Không được vi phạm:**
> | Skill | File tạo ra | Domain |
> |---|---|---|
> | `bks-fe-create-tc-component` | `__tests__/**/*.test.tsx` | Render, validation, hook, store, DS token |
> | `bks-fe-create-tc-flow` | `e2e/**/*.spec.ts` | URL redirect, cookie, auth guard, navigation |
> | `bks-fe-webapp-testing` | Không tạo file | Debugging, recon, screenshots |

### 1.4. Nhóm Tiện Ích & Kiểm Soát
*   **`bks-code-review`**: Đóng vai trò chuyên gia rà soát chất lượng mã nguồn, phát hiện lỗ hổng bảo mật, lỗi logic tiềm ẩn hoặc các điểm chưa tuân thủ quy chuẩn dự án trước khi tạo Pull Request.
*   **`bks-git-convention`**: Chuẩn hóa việc đặt tên nhánh (branch), viết Conventional Commit message và tiêu đề/mô tả Pull Request (Merge Request), liên kết ngược về mã task Excel (001, 002...) và file `docs/draft/{id}-{slug}.md`. Dùng ở bước cuối trước khi đẩy code lên Git.
*   **`find-skills`**: Hỗ trợ tìm kiếm nhanh các kỹ năng hoặc công cụ phù hợp với yêu cầu hiện tại.
*   **`skill-creator`**: Cho phép tạo mới hoặc cải tiến các skill sẵn có trong dự án.

---

## 2. 🔄 Quy Trình Làm Việc Chi Tiết (5 Bước Phối Hợp)

Để đạt hiệu suất tối đa, lập trình viên phối hợp với AI Agent theo quy trình 5 giai đoạn sau:

```
[B1: Phân Tích Draft] ➔ [B2: Phân Rã Tasks] ➔ [B3: Thực Thi Tính Năng] ➔ [B4: Review & QA] ➔ [B5: Merge & Đóng Task]
```

### Bước 1: Giai Đoạn Phân Tích Nghiệp Vụ (PM Phase)
1.  **Nhập yêu cầu**: Developer nhận yêu cầu thô từ khách hàng và lưu vào thư mục `docs/draft/`.
2.  **Kích hoạt AI**: Yêu cầu AI Agent chạy workflow `/pm-analyze-draft-req` bằng cách truyền file nháp.
3.  **Lập kế hoạch**: AI Agent sẽ tải skill `bks-requirement-analysis`, phân tích hệ thống hiện tại, tìm các kẽ hở logic nghiệp vụ và đề xuất tài liệu đặc tả kỹ thuật dưới dạng một `implementation_plan.md` tạm thời.
4.  **Phê duyệt**: Developer review bản kế hoạch, góp ý chỉnh sửa. Sau khi chốt, AI sẽ tự động tạo file đặc tả chính thức trong thư mục `docs/requirements/`.

### Bước 2: Giai Đoạn Phân Rã Nhiệm Vụ (Decomposition Phase)
1.  **Chạy workflow phân rã**: Sử dụng lệnh `/pm-decompose-req-to-tasks` để yêu cầu AI Agent phân chia đặc tả kỹ thuật thành các nhiệm vụ nhỏ, độc lập.
2.  **Định vị task**: AI Agent tải skill `bks-requirement-to-tasks`, tạo ra các thư mục tương ứng trong `docs/tasks/` và sinh ra các file task markdown (VD: `0001-setup-db.md`, `0002-implement-api.md`).
3.  **Bản đồ công việc**: AI tạo sơ đồ Mermaid thể hiện mối quan hệ phụ thuộc giữa các task để lập trình viên dễ dàng theo dõi.

### Bước 3: Giai Đoạn Thực Thi (Execution Phase)
Developer hoặc AI Agent có thể lần lượt "nhận" các task từ thư mục `docs/tasks/` để phát triển:
1.  **Xử lý Database**: Dùng workflow `/execute-database-task` để tạo Migration, Model, Enums.
2.  **Xử lý API**: Dùng workflow `/execute-api-task` để phát triển API backend Laravel chuẩn chỉ.
3.  **Xử lý Tác Vụ Nền**: Dùng workflow `/execute-job-task` hoặc `/execute-command-task` nếu task yêu cầu Jobs/Command.
4.  **Xử lý Frontend**: AI Agent tự động nạp skill `bks-fe-implement-feature` (kết hợp `bks-fe-api-integration` + `bks-fe-ds-sdk-consumer`) để dựng giao diện, viết hooks, service và tích hợp API.

### Bước 4: Giai Đoạn Đảm Bảo Chất Lượng (QA & Review Phase)
Trước khi coi một tác vụ là hoàn thành, bắt buộc phải thực hiện các bước sau:
1.  **Viết Test**:
    *   **Backend**: Viết Feature & Unit Test bằng PHPUnit. Đảm bảo độ bao phủ các nhánh logic chính và trường hợp biên lỗi.
    *   **Frontend — Unit**: Dùng skill `bks-fe-create-tc-component` viết tests bằng Vitest/Testing Library cho component, hook và store. Tối thiểu 20 TC (10 VT + 10 VT-DS).
    *   **Frontend — E2E**: Dùng skill `bks-fe-create-tc-flow` viết Playwright tests cho luồng người dùng chính. Tối thiểu 10 TC mỗi flow.
2.  **Chạy Công Cụ Định Dạng & Kiểm Tra Tự Động**:
    *   **Backend**: Chạy `php artisan code:format` để định dạng mã nguồn tự động qua Pint.
    *   **Frontend**: Chạy `pnpm run lint` để kiểm tra lỗi cú pháp và style guide.
3.  **Code Review**: Yêu cầu AI Agent sử dụng skill `bks-code-review` để quét toàn bộ các file code đã sửa đổi, đánh giá xem có lỗ hổng bảo mật, lỗi N+1 Query DB hay vi phạm tiêu chuẩn thiết kế không.

### Bước 5: Giai Đoạn Hoàn Thành & Đóng Task (Completion Phase)
1.  **Cập nhật tài liệu**: Cập nhật tài liệu logic nghiệp vụ trong `docs/logic/` và cập nhật Business Rule mới vào `docs/system/br-registry.md`.
2.  **Đóng Task**: Cập nhật trạng thái task trong file `.md` tại `docs/tasks/` sang `status: completed` và đánh dấu tích `[x]` cho toàn bộ checklist.
3.  **Tạo Pull Request**: Dùng skill `bks-git-convention` để đặt tên nhánh, viết commit message và mô tả PR đúng chuẩn (liên kết về mã task), sau đó đẩy code lên Git repository để chạy CI/CD và review nội bộ trước khi merge vào nhánh chính.
