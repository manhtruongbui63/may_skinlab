# Bài 6: Hướng Dẫn Phát Triển Với Docker & Các Lệnh Artisan

Tài liệu này hướng dẫn cách vận hành, lập trình và thực thi các câu lệnh nghiệp vụ (Artisan, Composer, PNPM) trong môi trường Docker cô lập của dự án. Việc sử dụng Docker giúp toàn bộ đội ngũ phát triển đồng bộ môi trường phát triển và tránh lỗi "chạy được trên máy tôi nhưng lỗi trên máy khác".

---

## 🐳 1. Tổng Quan Hệ Sinh Thái Docker Trong Dự Án

Hệ thống sử dụng các Docker container được cấu hình tối ưu, tự động nhận diện tiền tố thông qua biến `CONTAINER_PREFIX` (mặc định là `bks`) trong file `.env` tại thư mục gốc.

| Dịch vụ | Tên Container | Cổng Ngoài (Host) | Cổng Trong (Container) | Volume logic | Vai trò |
|---|---|---|---|---|---|
| **nginx** | `bks-nginx` | `8000` | `80` | Không có | Web server phân phối request tới PHP-FPM |
| **app** | `bks-app` | Không expose | `9000` | Không có | Máy chủ ứng dụng PHP 8.4-FPM chạy Laravel API |
| **node** | `bks-node` | `3000` | `3000` | Không có | Node.js 24 chạy Next.js Dev Server |
| **mysql** | `bks-mysql` | `33069` | `3306` | `mysql_data` | Cơ sở dữ liệu MySQL 8.0 lưu trữ |
| **redis** | `bks-redis` | `63790` | `6379` | `redis_data` | Cache, Session và Queue Broker |
| **queue** | `bks-queue` | Không expose | Không expose | Không có | Supervisor quản lý Laravel Queue Workers |

---

## ⚙️ 2. Các Lệnh Vận Hành Docker Compose Cơ Bản

Tất cả các lệnh dưới đây đều phải được thực thi tại **thư mục gốc** của dự án (nơi chứa file `docker-compose.yml` và `.env`).

### Khởi chạy môi trường
Khởi chạy tất cả các container ở chế độ nền (background):
```bash
docker compose up -d
```

Khởi chạy và bắt buộc build lại các Dockerfile (khi có thay đổi cấu hình PHP extension hoặc Node packages):
```bash
docker compose up --build -d
```

### Kiểm tra trạng thái hoạt động
Xem danh sách các container đang chạy và các cổng tương ứng:
```bash
docker compose ps
```

### Xem Log của hệ thống
Xem log trực tiếp của tất cả container:
```bash
docker compose logs -f
```

Xem log riêng biệt của một dịch vụ (ví dụ `app` hoặc `node`):
```bash
docker compose logs -f app
```

### Dừng hệ thống
Dừng và tắt toàn bộ các container (dữ liệu database trong volume vẫn được giữ nguyên):
```bash
docker compose down
```

Dừng hệ thống và xóa sạch các volume dữ liệu (Lưu ý: Sẽ mất toàn bộ data trong database):
```bash
docker compose down -v
```

---

## 🚀 3. Hướng Dẫn Thực Thi Lệnh Backend (Laravel) Qua Docker

> [!IMPORTANT]
> **Quy tắc bảo toàn quyền sở hữu file (Permission):**
> Khi chạy các lệnh sinh file (như `make:model`, `make:controller`, `composer require`), bạn **BẮT BUỘC** phải chỉ định user chạy trong container là `www-data` bằng cờ `-u www-data`.
> Nếu không dùng cờ này, file được sinh ra sẽ thuộc quyền sở hữu của user `root`, dẫn đến lỗi phân quyền (Permission Denied) khi sửa code trên máy host.

### Lệnh Laravel Artisan thông dụng

Chạy Migration cơ sở dữ liệu:
```bash
docker compose exec -it -u www-data app php artisan migrate
```

Chạy Rollback Migration:
```bash
docker compose exec -it -u www-data app php artisan migrate:rollback
```

Chạy Seeder dữ liệu mẫu:
```bash
docker compose exec -it -u www-data app php artisan db:seed
```

Tạo mới một Model kèm Migration:
```bash
docker compose exec -it -u www-data app php artisan make:model Post -m
```

Tạo mới một FormRequest kiểm thử:
```bash
docker compose exec -it -u www-data app php artisan make:request Post/StoreRequest
```

Xóa sạch cache của Laravel (Config, Route, View):
```bash
docker compose exec -it -u www-data app php artisan optimize:clear
```

Tự động định dạng code theo tiêu chuẩn Laravel Pint:
```bash
docker compose exec -it -u www-data app php artisan code:format
```

### Thực thi Unit/Feature Test PHPUnit
Chạy toàn bộ test suite của Backend:
```bash
docker compose exec -it -u www-data app php artisan test
```

Chạy một file test cụ thể:
```bash
docker compose exec -it -u www-data app ./vendor/bin/phpunit tests/Feature/Api/AuthTest.php
```

### Quản lý package với Composer

Cài đặt các package được định nghĩa trong `composer.json`:
```bash
docker compose exec -it -u www-data app composer install
```

Cài thêm một thư viện mới vào dự án:
```bash
docker compose exec -it -u www-data app composer require laravel/sanctum
```

Cập nhật autoload (sau khi thêm class thủ công):
```bash
docker compose exec -it -u www-data app composer dump-autoload
```

---

## 💻 4. Hướng Dẫn Thực Thi Lệnh Frontend (Next.js) Qua Docker

Đối với dịch vụ Frontend (`bks-node`), mã nguồn được chạy bằng user `node` đã được đồng bộ UID/GID phù hợp nên không cần truyền `-u`.

### Cài đặt thư viện với PNPM

Cài đặt toàn bộ dependencies của Frontend:
```bash
docker compose exec -it node pnpm install
```

Cài thêm một thư viện mới (ví dụ `lucide-react`):
```bash
docker compose exec -it node pnpm add lucide-react
```

### Chạy các lệnh kiểm thử Frontend

Chạy toàn bộ Unit/Integration tests bằng Vitest:
```bash
docker compose exec -it node pnpm test:unit
```

Chạy E2E tests bằng Playwright:
```bash
docker compose exec -it node pnpm test:e2e
```

Kiểm tra lint (ESLint) và chạy toàn bộ test (Vitest + Playwright):
```bash
docker compose exec -it node pnpm lint
docker compose exec -it node pnpm test:run
```

---

## ⚠️ 5. Những Lưu Ý Quan Trọng Khi Lập Trình Với Docker

1. **Kết nối Database từ phần mềm bên ngoài (TablePlus, DBeaver, Navicat):**
   - Host kết nối: `127.0.0.1` hoặc `localhost`
   - Port kết nối: `33069` (Cổng ngoài đã map của MySQL container)
   - Database name: `bks_db` (Xem trong file `.env` ở thư mục gốc)
   - Username: `bks_user`
   - Password: `bks_pass`

2. **Kết nối Database bên trong Container (Laravel config):**
   - Laravel API kết nối tới MySQL thông qua mạng nội bộ Docker. Do đó host kết nối là tên container `bks-mysql` và port là `3306`.
   - Cấu hình này đã được tự động nạp thông qua file `.env` ở thư mục gốc khi container khởi chạy.

3. **Khi Queue Worker không tự nhận diện code mới:**
   - Container `bks-queue` chạy Supervisor để giữ hàng đợi luôn chạy. Khi bạn thay đổi code trong thư mục `backend/app/Jobs`, bạn cần khởi động lại queue worker để áp dụng thay đổi:
   ```bash
   docker compose exec -it -u www-data app php artisan queue:restart
   ```
