# Beki AI — Laravel 13 + Next.js 16

Ứng dụng full-stack hiện đại: **Laravel 13** (Backend API) + **Next.js 16** (Frontend App Router), chạy hoàn toàn trong **Docker**, phát triển cùng **AI Agent** qua hệ thống **Skills & Workflows**.

> 📚 Tài liệu đầy đủ nằm trong thư mục [`guide/`](./guide/index.md). README này tổng hợp những phần **hay dùng nhất** — setup, lệnh thường gặp, truy cập app và quy trình làm việc với AI. Mỗi mục đều có link tới bài hướng dẫn chi tiết.

---

## 🚀 Khởi động dự án (Day 1 Setup)

Thực hiện tuần tự tại **thư mục gốc**. Chi tiết: [Bài 0 — Onboarding](./guide/00-onboarding.md#4--khởi-động-dự-án-từ-con-số-0-day-1-setup).

```bash
# 1. Chuẩn bị file môi trường (.env.docker đã cấu hình sẵn, kèm APP_KEY)
cp .env.example .env
cp backend/.env.docker backend/.env
cp frontend/.env.docker frontend/.env

# 2. Khởi chạy toàn bộ container
docker compose up --build -d
docker compose ps                                              # kiểm tra tất cả "Up"

# 3. Cài dependencies Backend
docker compose exec -it -u www-data app composer install

# 4. Tạo bảng & nạp dữ liệu mẫu
docker compose exec -it -u www-data app php artisan migrate --seed

# 5. Cài dependencies Frontend
docker compose exec -it node pnpm install
```

> [!NOTE]
> `backend/.env.docker` đã có sẵn `APP_KEY` nên **không cần** `key:generate`. Container `node` đã chạy Next.js Dev Server sẵn; nếu cần: `docker compose restart node`.

---

## 🔑 Truy cập ứng dụng & tài khoản mẫu

| Thành phần | Địa chỉ |
|---|---|
| **Frontend (Next.js)** | http://localhost:3000 |
| **Backend API (Laravel)** | http://localhost:8000 |
| **API Docs (Scramble)** | http://localhost:8000/docs/api |
| **MySQL** (TablePlus/DBeaver) | host `127.0.0.1`, port `33069`, db `bks_db`, user `bks_user`, pass `bks_pass` |

**Tài khoản đăng nhập mẫu** (tạo bởi `UserSeeder`, mật khẩu mặc định `password`):

| Email | Mật khẩu | Vai trò |
|---|---|---|
| `admin@example.com` | `password` | Admin |
| `member1@example.com` | `password` | Member |
| `member2@example.com` | `password` | Member |

> **Mock Mode:** Frontend chạy độc lập không cần backend bằng `NEXT_PUBLIC_USE_MOCK=true` trong `frontend/.env` (MSW giả lập API). Đổi sang `false` để gọi API thật. Xem [Bài 0 §6](./guide/00-onboarding.md#6--mock-mode--chạy-frontend-không-cần-backend).

---

## 🐳 Lệnh thường dùng (Docker)

Chi tiết & danh sách container: [Bài 6 — Docker Guide](./guide/06-docker-guide.md).

> [!IMPORTANT]
> Lệnh sinh file backend (`make:*`, `composer require`) **BẮT BUỘC** có `-u www-data` để tránh lỗi permission. Frontend (`node`) **không** cần `-u`.

### Vận hành Docker Compose

```bash
docker compose up -d                  # khởi chạy nền
docker compose up --build -d          # build lại khi đổi Dockerfile
docker compose ps                     # trạng thái container
docker compose logs -f app            # xem log 1 service (app / node / queue...)
docker compose down                   # dừng (giữ data)
docker compose down -v                # dừng + xóa sạch volume (mất data!)
```

### Backend — Laravel Artisan / Composer

```bash
docker compose exec -it -u www-data app php artisan migrate          # chạy migration
docker compose exec -it -u www-data app php artisan migrate --seed   # migrate + seed
docker compose exec -it -u www-data app php artisan db:seed          # seed dữ liệu
docker compose exec -it -u www-data app php artisan make:model Post -m
docker compose exec -it -u www-data app php artisan optimize:clear   # clear cache
docker compose exec -it -u www-data app php artisan code:format      # Laravel Pint
docker compose exec -it -u www-data app php artisan queue:restart    # reload queue worker

docker compose exec -it -u www-data app php artisan test             # toàn bộ test
docker compose exec -it -u www-data app composer require <package>   # cài package
```

### Frontend — Next.js / PNPM

```bash
docker compose exec -it node pnpm install            # cài dependencies
docker compose exec -it node pnpm add <package>      # cài thêm thư viện
docker compose exec -it node pnpm test:unit          # Vitest unit/integration
docker compose exec -it node pnpm test:e2e           # Playwright E2E
docker compose exec -it node pnpm test:run           # Vitest + Playwright
docker compose exec -it node pnpm lint               # ESLint
```

---

## 🤖 Làm việc với AI Agent

Dự án phát triển cùng AI Agent trong **Antigravity IDE**. Mở thư mục gốc → IDE tự nạp toàn bộ **skills**, **workflows** và `AGENTS.md`. Chi tiết: [Bài 0](./guide/00-onboarding.md) · [Bài 1](./guide/01-skills-workflows.md).

**Pipeline chuẩn — đừng nhảy thẳng vào code:**

```text
Draft → Requirements → Tasks → Execution (BE/FE) → Test & Review → PR
```

| Bước | Lệnh | Đầu vào → Đầu ra |
|---|---|---|
| **1. Phân tích yêu cầu** | `/pm-analyze-draft-req` | `docs/draft/` → `docs/requirements/` |
| **2. Phân rã task** | `/pm-decompose-req-to-tasks` | `docs/requirements/` → `docs/tasks/` |
| **3a. Thực thi Backend** | `/execute-database-task`, `/execute-api-task`, `/execute-job-task`, `/execute-command-task` | task → code trong `backend/` |
| **3b. Thực thi Frontend** | `/bks-fe-implement-feature` (+ skill bổ trợ) | task → module `frontend/features/` |
| **4. Test** | `/bks-fe-create-tc-component` (Vitest), `/bks-fe-create-tc-flow` (Playwright) | → `__tests__/`, `e2e/` |
| **5. Review** | `/bks-code-review` | → danh sách phát hiện 🔴/🟡/🟢 |

> [!TIP]
> **Luôn truyền ngữ cảnh:** mỗi khi gọi skill/workflow hãy chỉ rõ file đầu vào (draft/requirement/task nào). Chạy **từng task một** — xong rồi mới sang task kế tiếp. Mỗi file task tự khai báo workflow/skill bắt buộc ở đầu file.

### Luật vàng

1. **Đi đúng pipeline** — không nhảy thẳng vào code.
2. **Đọc tài liệu nền** `docs/system/` trước khi sửa code.
3. **Luôn duyệt Implementation Plan** của AI trước khi cho sửa file.
4. **Double Documentation** — thay đổi logic phải cập nhật cả code lẫn `docs/logic/`.
5. **Business Rule có mã** — rule mới bắt đầu `PROPOSED_BR:{slug}`, duyệt rồi ghi vào `docs/system/br-registry.md`.
6. **Đúng skill, đúng thư mục test** — Vitest → `__tests__/`, Playwright → `e2e/`.

---

## 📚 Tài liệu chi tiết

| Bài | Nội dung |
|---|---|
| [Index — Sơ đồ tổng quan](./guide/index.md) | Mermaid pipeline & bản đồ skill |
| [Bài 0 — Onboarding](./guide/00-onboarding.md) | Setup từ con số 0, kích hoạt AI, ví dụ end-to-end |
| [Bài 1 — Skills & Workflows](./guide/01-skills-workflows.md) | Ý nghĩa từng skill & quy trình phối hợp |
| [Bài 2 — Cấu trúc Docs](./guide/02-folder-structure.md) | Thư mục `docs/`, quy chuẩn Business Rule |
| [Bài 3 — Kiến trúc Backend](./guide/03-backend-architecture.md) | Laravel: thin Controller, Unidirectional Flow, quy trình 11 bước |
| [Bài 4 — Testing Guide](./guide/04-testing-guide.md) | Triết lý Feature/Unit test, checklist tối thiểu |
| [Bài 5 — Kiến trúc Frontend](./guide/05-frontend-architecture.md) | Feature-Sliced, Repository Pattern, 7 skill `bks-fe-*` |
| [Bài 6 — Docker Guide](./guide/06-docker-guide.md) | Container, lệnh Artisan/Composer/PNPM qua Docker |

---

## 🧱 Tech Stack

- **Backend:** Laravel 13 · PHP 8.4-FPM · MySQL 8.0 · Redis (cache/session/queue) · Sanctum · Scramble (API docs)
- **Frontend:** Next.js 16 (App Router) · React · Zustand · React Hook Form + Zod · `@bks/ds-system-sdk` · next-intl
- **Test:** PHPUnit (BE) · Vitest + Playwright (FE) · MSW (mock)
- **Hạ tầng:** Docker Compose · Nginx · Supervisor (queue worker)
