# Bài 0: Onboarding & Cách Làm Việc Với AI Agent

Chào mừng bạn gia nhập dự án! Đây là bài **đọc đầu tiên** dành cho thành viên mới. Mục tiêu: sau khi đọc xong, bạn có thể (1) khởi động dự án chạy được trên máy, và (2) biết chính xác **thao tác nào để bắt đầu phát triển tính năng cùng AI Agent**.

Các bài 1–6 đi sâu vào *tiêu chuẩn kỹ thuật*; bài này trả lời câu hỏi thực dụng nhất: **"Tôi gõ gì, ở đâu, để bắt đầu?"**

---

## 1. 🤖 AI Agent Trong Dự Án Là Gì & Chạy Bằng Đâu?

Dự án này được thiết kế để phát triển **cùng AI Agent** chứ không chỉ code tay. Đội ngũ dev sử dụng **Antigravity IDE** — môi trường lập trình tích hợp AI Agent — để code cùng AI ngay trong editor.

Bạn mở thẳng thư mục gốc dự án `laravel-13-nextjs-16/` trong Antigravity, sau đó làm việc qua panel chat/agent của IDE. Khi mở **tại thư mục gốc**, Antigravity tự động nạp toàn bộ ngữ cảnh dự án: skills, workflows và file `AGENTS.md`. Bạn ra lệnh bằng **tiếng Việt tự nhiên** hoặc bằng **slash command** — cả Skill lẫn Workflow đều gọi được bằng `/<tên>`.

> [!NOTE]
> Bạn **không cần cài đặt skill thủ công**. Mọi skill/workflow đã nằm sẵn trong thư mục [.agents/](../.agents/) (và bản đồng bộ [.claude/](../.claude/)). Mở dự án trong Antigravity tại thư mục gốc là dùng được ngay.

---

## 2. 🧩 Ba Khái Niệm Cốt Lõi

Trước khi bắt đầu, hãy phân biệt 3 thứ bạn sẽ tương tác mỗi ngày:

| Khái niệm | Là gì | Cách kích hoạt |
|---|---|---|
| **Skill** | Bộ *tiêu chuẩn* cho một loại công việc (VD: viết API, dựng UI, viết test). AI **tự nạp** khi mô tả công việc khớp với skill. | Gõ slash command `/<tên-skill>`, hoặc mô tả công việc tự nhiên để AI tự khớp. |
| **Workflow** | *Quy trình từng bước* AI chạy tuần tự theo kịch bản chuẩn của dự án. | Gõ slash command `/<tên-workflow>`, VD: `/pm-analyze-draft-req`. |
| **`AGENTS.md`** | File luật **bắt buộc AI đọc đầu tiên** — chứa nguyên tắc nền tảng của dự án. | Tự động nạp. Bạn nên đọc qua 1 lần để biết AI đang bị ràng buộc gì. |

> [!IMPORTANT]
> **Skill ≠ Workflow.** Workflow điều phối *trình tự* (làm gì trước, làm gì sau); Skill cung cấp *tiêu chuẩn chất lượng* cho từng bước. Một workflow thường nạp nhiều skill bên trong nó.

---

## 3. 🎮 Cách Kích Hoạt AI — Thao Tác Cụ Thể

Đây là phần người mới hay vướng nhất. Có **2 cách** ra lệnh, dùng đúng tình huống:

### 3.1. Gõ Slash Command (cho cả Workflow lẫn Skill)
Trong khung chat/agent của Antigravity, gõ `/` rồi chọn/đánh tên Workflow **hoặc** Skill — cả hai đều xuất hiện trong menu slash:
```
/pm-analyze-draft-req           # Workflow
/bks-fe-implement-feature       # Skill
```
AI sẽ hỏi (hoặc bạn nói luôn) ngữ cảnh cần thiết — VD file draft, file task — rồi chạy đúng quy trình/tiêu chuẩn.

*   **Workflow** ([.agents/workflows/](../.agents/workflows/)): `pm-analyze-draft-req`, `pm-decompose-req-to-tasks`, `execute-api-task`, `execute-database-task`, `execute-job-task`, `execute-command-task`.
*   **Skill** ([.agents/skills/](../.agents/skills/)): toàn bộ `bks-*` (xem danh sách đầy đủ ở [Bài 1](./01-skills-workflows.md)).

### 3.2. Mô Tả Công Việc Tự Nhiên (để Skill tự trigger)
Không nhất thiết phải gõ slash. Chỉ cần mô tả rõ việc cần làm, AI tự khớp skill qua phần mô tả của nó:
```
Viết API tạo mới Company theo task docs/tasks/0002-company-api.md
```
→ AI tự nạp `bks-be-api-standard`. Hoặc:
```
Viết unit test cho LoginForm component
```
→ AI tự nạp `bks-fe-create-tc-component`.

### 3.3. Luôn Đọc & Duyệt "Implementation Plan"
Với việc lớn, AI thường trình bày **kế hoạch (plan)** trước khi sửa file. **Đọc kỹ và duyệt** trước khi cho phép thực thi — đây là chốt kiểm soát quan trọng nhất của bạn.

> [!TIP]
> Quy tắc số 1: **Đừng yêu cầu AI "viết code ngay".** Hãy đi đúng pipeline `Draft → Requirements → Tasks → Execution`. Bỏ qua bước đầu khiến AI thiếu ngữ cảnh và sinh code lệch chuẩn.

---

## 4. 🚀 Khởi Động Dự Án Từ Con Số 0 (Day 1 Setup)

Toàn bộ dự án chạy trong **Docker** (chi tiết container xem [Bài 6](./06-docker-guide.md)). Thực hiện tuần tự tại **thư mục gốc**:

### Bước 1 — Chuẩn bị file môi trường
Dự án có sẵn các file `.env.docker` đã cấu hình đúng cho môi trường container (host trỏ về `bks-mysql`/`bks-redis`, kèm sẵn `APP_KEY`). Chỉ cần copy chúng thành `.env`:
```bash
# Thư mục gốc — cho docker-compose (CONTAINER_PREFIX, thông tin DB của container MySQL...)
cp .env.example .env

# Backend — đọc bởi container app & queue
cp backend/.env.docker backend/.env

# Frontend — đọc bởi container node
cp frontend/.env.docker frontend/.env
```

### Bước 2 — Khởi chạy toàn bộ container
```bash
docker compose up --build -d
docker compose ps        # kiểm tra tất cả container đã "Up"
```

### Bước 3 — Cài dependencies Backend
```bash
docker compose exec -it -u www-data app composer install
```

> [!NOTE]
> `backend/.env.docker` đã có sẵn `APP_KEY` nên **không cần** chạy `key:generate`. Nếu bạn tự tạo `backend/.env` từ `.env.example` (key rỗng) thì mới cần chạy:
> `docker compose exec -it -u www-data app php artisan key:generate`

### Bước 4 — Tạo bảng & nạp dữ liệu mẫu
```bash
docker compose exec -it -u www-data app php artisan migrate --seed
```

### Bước 5 — Cài dependencies Frontend
```bash
docker compose exec -it node pnpm install
```

> [!NOTE]
> Container `node` đã chạy Next.js Dev Server sẵn ở chế độ nền. Sau khi `pnpm install` xong, nếu cần thì khởi động lại: `docker compose restart node`.

---

## 5. 🔑 Truy Cập Ứng Dụng & Tài Khoản Mặc Định

Sau khi setup xong:

| Thành phần | Địa chỉ |
|---|---|
| **Frontend (Next.js)** | http://localhost:3000 |
| **Backend API (Laravel)** | http://localhost:8000 |
| **API Docs (Scramble)** | http://localhost:8000/docs/api |
| **MySQL (từ TablePlus/DBeaver)** | host `127.0.0.1`, port `33069`, db `bks_db`, user `bks_user`, pass `bks_pass` |

**Tài khoản đăng nhập mẫu** (tạo bởi `UserSeeder`, mật khẩu mặc định từ factory là `password`):

| Email | Mật khẩu | Vai trò |
|---|---|---|
| `admin@example.com` | `password` | Admin |
| `member1@example.com` | `password` | Member |
| `member2@example.com` | `password` | Member |

---

## 6. 🎭 Mock Mode — Chạy Frontend Không Cần Backend

Frontend có thể chạy **độc lập** bằng dữ liệu giả lập (MSW) mà không cần gọi API thật — rất tiện khi backend chưa xong. Điều khiển qua biến trong `frontend/.env`:

```bash
# true  = dùng mock (MSW handlers) — không cần backend
# false = gọi API thật tại NEXT_PUBLIC_API_URL
NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> [!IMPORTANT]
> Mặc định `NEXT_PUBLIC_USE_MOCK=true`. Khi đã sẵn sàng tích hợp backend thật, đổi thành `false` và trỏ `NEXT_PUBLIC_API_URL` về `http://localhost:8000`.

---

## 7. 🧭 Ví Dụ End-to-End: Phát Triển 1 Tính Năng Cùng AI

Đây là vòng đời đầy đủ của một tính năng, kèm **đúng câu lệnh** bạn gõ cho AI ở mỗi bước. (Toàn cảnh pipeline xem sơ đồ trong [index.md](./index.md).)

```text
[Yêu cầu thô] → [Phân tích] → [Phân rã Task] → [Thực thi BE/FE] → [Test & Review] → [Đóng Task & PR]
```

**① Đưa yêu cầu thô vào hệ thống**
> Lưu file yêu cầu của khách (hoặc feedback chỉnh sửa) vào `docs/draft/`, ví dụ `docs/draft/company-management.md`.
> *(Nếu cần dựng HTML prototype để khách duyệt UX trước, dùng skill ngoài hệ thống `bks-prototype-v1` — kết quả cũng đổ về `docs/draft/`.)*

> [!IMPORTANT]
> **Quy tắc luôn truyền ngữ cảnh:** Mỗi khi gọi skill/workflow, **luôn chỉ rõ file đầu vào** (draft nào, requirement nào, task nào). Slash command chỉ "mở đúng quy trình"; AI cần biết *làm trên file nào*. Đừng gõ trống `/pm-decompose-req-to-tasks` rồi để AI tự đoán.

**① Đưa yêu cầu thô vào hệ thống**
> Lưu file yêu cầu của khách (hoặc feedback chỉnh sửa) vào `docs/draft/`, ví dụ `docs/draft/company-management.md`.
> *(Nếu cần dựng HTML prototype để khách duyệt UX trước, dùng skill ngoài hệ thống `bks-prototype-v1` — kết quả cũng đổ về `docs/draft/`.)*
>
> 📤 **Đầu ra:** `docs/draft/company-management.md`

**② Phân tích thành đặc tả kỹ thuật**
```
/pm-analyze-draft-req  — phân tích docs/draft/company-management.md
```
→ AI nạp `bks-requirement-analysis` và **đặt ra các câu hỏi làm rõ** (logic gaps, edge cases, ràng buộc nghiệp vụ). Bạn cần **trả lời từng câu** để AI hoàn thiện đặc tả.

> [!IMPORTANT]
> Câu hỏi nào bạn **chưa chắc chắn**, đừng tự suy đoán — **hỏi PM của dự án** để chốt rồi mới trả lời AI. Đặc tả sai từ bước này sẽ kéo theo sai toàn bộ task và code phía sau.

📤 **Đầu ra:** file đặc tả trong `docs/requirements/`, VD `docs/requirements/03-company.md`. **Bạn review & chốt.**

**③ Phân rã thành các task nhỏ**
```
/pm-decompose-req-to-tasks  — phân rã docs/requirements/03-company.md
```
→ AI nạp `bks-requirement-to-tasks`.
📤 **Đầu ra:** thư mục task trong `docs/tasks/`, VD `docs/tasks/2026-06-04-company/` chứa `task-01-database-infrastructure.md`, `task-02-api.md`… Mỗi file task đã **tự khai báo** workflow/skill bắt buộc dùng để thực thi nó (xem callout bên dưới).

**④a Thực thi — Backend** (chạy **lần lượt từng task một**)

> [!CAUTION]
> Mỗi lần chỉ chạy **một** task. Chờ task xong (code + test pass, đánh dấu `status: completed`) rồi mới sang task kế tiếp — **không gộp nhiều task vào một lệnh**.

Task 1 (database):
```
/execute-database-task  — chạy docs/tasks/2026-06-04-company/task-01-database-infrastructure.md
```
Sau khi task 1 hoàn tất, mới chạy task 2 (API):
```
/execute-api-task  — chạy docs/tasks/2026-06-04-company/task-02-api.md
```
→ AI nạp `bks-be-database-standard`, `bks-be-api-standard`… theo đúng [quy trình 11 bước Bài 3](./03-backend-architecture.md).
📤 **Đầu ra:** Migration/Model/Enum, Controller/Service/Resource trong `backend/`.

Sau khi xong code backend, chạy skill **test backend** (truyền kèm file đặc tả để bám đúng yêu cầu nghiệp vụ):
```
/bks-be-testing-standard  — viết Feature/Unit Test cho feature company
                            tham chiếu: docs/requirements/03-company.md
```
📤 **Đầu ra:** test trong `backend/tests/Feature/` & `backend/tests/Unit/` + báo cáo trong `docs/testing/company-management.md`.

**④b Thực thi — Frontend** (chạy từng task, truyền kèm đủ ngữ cảnh)

Frontend cần thêm **tài liệu API** và **tài liệu logic** để map đúng endpoint và nghiệp vụ:
```
/bks-fe-implement-feature  — chạy docs/tasks/2026-06-04-company/task-03-fe-crud.md (flow C — full CRUD)
                             tham chiếu thêm: docs/api/company.md, docs/logic/company/company.md
```
→ `bks-fe-implement-feature` là **skill lõi** (scaffold module + form). Khi cần đi sâu từng phần, gọi thêm **skill bổ trợ** đúng việc:

| Khi cần… | Skill bổ trợ | Ví dụ lệnh |
|---|---|---|
| Ghép API thật: repository, Zod, map lỗi 422 → form, toast | `bks-fe-api-integration` | `/bks-fe-api-integration — ghép API cho feature company (docs/api/company.md)` |
| Dựng UI đúng Design System (@bks/ds-system-sdk): component, typography, layout | `bks-fe-ds-sdk-consumer` | `/bks-fe-ds-sdk-consumer — chuẩn hóa UI form/list company` |
| Trang danh sách: đồng bộ filter + phân trang với URL | `bks-fe-list-url-state` | `/bks-fe-list-url-state — sync filter & pagination cho list company` |

📤 **Đầu ra:** module `frontend/features/company/` (types, schema, service, store, hook, component, page).

**⑤ Viết test Frontend** — chạy **tuần tự từng bước**, không gộp:

Bước 1 — unit test (Vitest):
```
/bks-fe-create-tc-component  — viết unit test cho feature company (≥20 TC)
```
Bước 2 — sau khi unit test xanh, viết E2E (Playwright):
```
/bks-fe-create-tc-flow  — viết E2E test luồng quản lý company (≥10 TC)
```
📤 **Đầu ra:** test trong `frontend/__tests__/` & `frontend/e2e/`, báo cáo BE trong `docs/testing/`.

**⑥ Review chất lượng code (trước khi tạo PR)**

Sau khi code + test đã xong, chạy skill review để soát lỗ hổng bảo mật, lỗi logic, N+1 query và vi phạm quy chuẩn dự án:
```
/bks-code-review  — review toàn bộ thay đổi của feature company
```
→ AI đóng vai chuyên gia rà soát adversarial (xem [Bài 1 §1.4](./01-skills-workflows.md)). **Sửa hết các phát hiện rồi mới sang bước đóng task.**
📤 **Đầu ra:** danh sách phát hiện theo mức độ nghiêm trọng (🔴/🟡/🟢) để bạn xử lý.

**⑦ Đóng task & tạo Pull Request**
> Cập nhật `docs/logic/`, ghi BR mới vào `docs/system/br-registry.md`, đánh dấu task `status: completed`, rồi tạo PR vào nhánh `master`.

> [!TIP]
> **Không cần nhớ task nào dùng skill gì.** Mỗi file task trong `docs/tasks/` đã ghi sẵn ở đầu file (mục `# Context`) workflow/skill bắt buộc:
> ```markdown
> - **Applicable Workflows (MANDATORY)**: `/execute-database-task`
> - **Applicable Skills (MANDATORY)**: `bks-be-database-standard`
> ```
> Vì vậy ở bước ④ bạn chỉ cần **trỏ AI tới đúng file task** và yêu cầu thực thi theo workflow/skill đã khai báo trong đó — AI sẽ tự dùng đúng tiêu chuẩn.

---

## 8. ⭐ Luật Vàng Khi Làm Việc Với AI Agent

1.  **Đi đúng pipeline** — `Draft → Requirements → Tasks → Execution`. Không nhảy thẳng vào code.
2.  **Đọc tài liệu nền trước** — yêu cầu AI đọc `docs/system/` (overview, business-rules, architecture, domain-model) trước khi sửa code.
3.  **Luôn duyệt Plan** — đọc kỹ Implementation Plan của AI trước khi cho phép sửa file.
4.  **Tài liệu song hành (Double Documentation)** — mọi thay đổi logic phải cập nhật cả code lẫn `docs/logic/`.
5.  **Business Rule có mã** — rule mới bắt đầu bằng `PROPOSED_BR:{slug}`, được duyệt rồi mới ghi danh `BR-*` vào `docs/system/br-registry.md` (xem [Bài 2 §6](./02-folder-structure.md)).
6.  **Đúng skill, đúng thư mục test** — Vitest (`bks-fe-create-tc-component` → `__tests__/`), Playwright (`bks-fe-create-tc-flow` → `e2e/`), không trộn lẫn.
7.  **Lệnh sinh file backend phải có `-u www-data`** — tránh lỗi permission (xem [Bài 6](./06-docker-guide.md)).

---

> [!TIP]
> **Đọc tiếp theo:** [Bài 1 — Chi tiết các Skill & Quy trình](./01-skills-workflows.md) để hiểu sâu vai trò từng skill, sau đó là Bài 2 (cấu trúc thư mục) trước khi bắt tay vào code.
