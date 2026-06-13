# Testing Preparation Guide

Hướng dẫn chuẩn bị môi trường testing cho dự án.

## 1. PHP Environment

Project sử dụng **SQLite in-memory** cho testing để đảm bảo tốc độ và isolation.
- **Yêu cầu**: Đảm bảo `php_sqlite3` và `php_pdo_sqlite` extensions được enable trong `php.ini`.
- **Verify**: Chạy `php -m | grep sqlite` trong terminal.

## 2. PHPUnit Configuration

`backend/phpunit.xml` đã được cấu hình cho SQLite:
```xml
<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
```
> [!TIP]
> Không cần tạo database file hay MySQL database riêng cho testing.

## 3. Model Factories

AI sử dụng **Model Factories** (`backend/database/factories/`) để generate test data.
- Khi thêm required columns mới vào table, phải update Factory tương ứng.

## 4. How to Run Tests

| Action | Command |
|---|---|
| Run all tests | `php artisan test` |
| Run specific file | `php artisan test --filter=UserTest` |
| Run with coverage | `php artisan test --coverage` (Requires Xdebug) |

---

## Workflow Integration

Khi implement feature mới sử dụng các execution workflows (`/execute-api-task`, `/execute-job-task`, `/execute-command-task`), AI sẽ:
1. **Automatically create Unit/Feature Tests** theo AAA pattern.
2. **Run tests** sử dụng `php artisan test`.
3. **Report results** cho bạn.
