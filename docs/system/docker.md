# Môi Trường Docker & Quy Chuẩn Thực Thi Lệnh Cho AI Agent

Tài liệu này định nghĩa cấu trúc môi trường Docker của dự án và các quy tắc bắt buộc dành cho AI Agent khi thực thi các lệnh terminal (thông qua công cụ `run_command`) hoặc khi cấu hình các file môi trường.

---

## 🐳 1. Thông Số Hệ Thống Docker

Môi trường Docker của dự án được thiết lập tự động hóa hoàn toàn thông qua tệp `docker-compose.yml` và `.env` ở thư mục gốc.

### Bảng tra cứu Container & Hostname

AI Agent khi cấu hình ứng dụng hoặc thực hiện kết nối dịch vụ nội bộ Docker bắt buộc phải sử dụng các thông số sau:

| Dịch vụ | Tên Container | Hostname trong mạng Docker | Cổng Host | Cổng Container | Thư mục mã nguồn trong Container |
|---|---|---|---|---|---|
| **Nginx** | `bks-nginx` | `bks-nginx` | `8000` | `80` | `/var/www/html` |
| **PHP-FPM** | `bks-app` | `bks-app` | Không expose | `9000` | `/var/www/html` (Ánh xạ từ `./backend`) |
| **Next.js** | `bks-node` | `bks-node` | `3000` | `3000` | `/var/www/html` (Ánh xạ từ `./frontend`) |
| **MySQL** | `bks-mysql` | `bks-mysql` | `33069` | `3306` | `/var/lib/mysql` (Volume: `mysql_data`) |
| **Redis** | `bks-redis` | `bks-redis` | `63790` | `6379` | `/data` (Volume: `redis_data`) |
| **Queue** | `bks-queue` | `bks-queue` | Không expose | Không expose | `/var/www/html` (Ánh xạ từ `./backend`) |

* Mạng nội bộ Docker (Network): `bks-network` (bridge).

---

## 🚀 2. Quy Chuẩn Thực Thi Lệnh Của AI Agent (MANDATORY)

Khi AI Agent cần thực thi bất kỳ câu lệnh nào trên hệ thống (như Migration, chạy Test, cài đặt thư viện), AI Agent **PHẢI** tuân thủ các cấu trúc lệnh sau:

### A. Thực thi lệnh Backend (Laravel / Composer)
Mọi lệnh liên quan đến Backend phải được chạy thông qua container `bks-app` và **BẮT BUỘC** phải chỉ định user `-u www-data` để tránh lỗi phân quyền (Permission Denied).

#### Lệnh Artisan mẫu:
* Chạy Migration:
  ```bash
  docker compose exec -it -u www-data app php artisan migrate
  ```
* Chạy Test Suite (PHPUnit):
  ```bash
  docker compose exec -it -u www-data app php artisan test
  ```
* Tạo mới Model/Controller/Request:
  ```bash
  docker compose exec -it -u www-data app php artisan make:model <ModelName> -m
  ```
* Tự động định dạng code (Laravel Pint):
  ```bash
  docker compose exec -it -u www-data app php artisan code:format
  ```

#### Lệnh Composer mẫu:
* Cài đặt thư viện mới:
  ```bash
  docker compose exec -it -u www-data app composer require <package-name>
  ```
* Chạy Composer Install:
  ```bash
  docker compose exec -it -u www-data app composer install
  ```

### B. Thực thi lệnh Frontend (Next.js / PNPM)
Mọi lệnh liên quan đến Frontend phải được chạy thông qua container `bks-node`. Không cần chỉ định user vì container này đã cấu hình chạy bằng user `node` đồng bộ UID/GID.

#### Lệnh PNPM mẫu:
* Cài đặt thư viện mới:
  ```bash
  docker compose exec -it node pnpm add <package-name>
  ```
* Chạy Unit/Integration Test:
  ```bash
  docker compose exec -it node pnpm test:unit
  ```
* Kiểm tra chất lượng (Linter, Typecheck, Format):
  ```bash
  docker compose exec -it node pnpm quality:check
  ```

---

## ⚠️ 3. Quy Tắc Cấu Hình File Môi Trường (.env) Cho AI Agent

1. **DB_HOST**: Khi cấu hình kết nối database cho Laravel (`backend/.env` hoặc `.env` gốc), luôn sử dụng hostname `bks-mysql` (hoặc `mysql`).
2. **REDIS_HOST**: Luôn sử dụng hostname `bks-redis` (hoặc `redis`).
3. **Cổng kết nối**:
   - Bên trong Laravel API: Sử dụng `DB_PORT=3306` và `REDIS_PORT=6379`.
   - Kết nối từ máy host hoặc ứng dụng Client ngoài Docker: Sử dụng `33069` (MySQL) và `63790` (Redis).
