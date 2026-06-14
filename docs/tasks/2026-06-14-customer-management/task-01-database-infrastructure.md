---
task_id: "01"
title: "Database Infrastructure & Models"
description: "Thiết lập các bảng danh mục địa lý provinces/wards, bổ sung cột địa chỉ chi tiết, mã bệnh nhân code, điện thoại phụ, ảnh đại diện vào bảng customers và cập nhật model Customer cùng seeders."
type: IMPLEMENTATION
phase: 1
status: completed
estimated_effort: M
complexity: medium
risk: low
depends_on: []
rule_refs: ["PROPOSED_BR:customer-unique-code", "PROPOSED_BR:customer-age-calculation"]
date: "2026-06-14"
changelog:
  - version: 1.0
    date: "2026-06-14"
    summary: Khởi tạo task thiết lập cơ sở dữ liệu.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-14-customer-management-implementation-tasks.md](../2026-06-14-customer-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-database-task`
- **Applicable Skills**: `bks-be-database-standard`

---

# Task 01: Database Infrastructure & Models

## Description
Task này chịu trách nhiệm chuẩn bị cấu trúc cơ sở dữ liệu cho module Quản lý khách hàng, bao gồm việc tạo mới 2 bảng `provinces` và `wards`, thêm các cột cần thiết vào bảng `customers`, liên kết quan hệ (Relationship) và xử lý logic tự sinh mã bệnh nhân (`BNxxxxxx`) trong sự kiện của Eloquent Model.

## Requirements

### 1. Migrations (NEW & MODIFY)
- **Tạo migration mới** tạo bảng `provinces` và `wards`:
  - Bảng `provinces`: `id` (bigIncrements), `name` (string).
  - Bảng `wards`: `id` (bigIncrements), `province_id` (foreignId references `provinces`), `name` (string).
- **Tạo migration mới** cập nhật bảng `customers`:
  - `code` (string, length 20, unique, index) - Mã bệnh nhân.
  - `phone_secondary` (string, length 50, nullable) - Số điện thoại phụ.
  - `house_number` (string, length 255, nullable) - Số nhà/tên đường.
  - `province_id` (foreignId, nullable, references `provinces`).
  - `ward_id` (foreignId, nullable, references `wards`).
  - `is_address_manually_edited` (boolean, default false) - Đánh dấu đã sửa tay.
  - `avatar_path` (string, length 255, nullable) - Ảnh đại diện.

### 2. Models (NEW & MODIFY)
- **Tạo mới Model `App\Models\Province`**:
  - `$fillable`: `['name']`.
  - Relationship: `hasMany(Ward::class)`.
- **Tạo mới Model `App\Models\Ward`**:
  - `$fillable`: `['province_id', 'name']`.
  - Relationship: `belongsTo(Province::class)`.
- **Cập nhật Model `App\Models\Customer`**:
  - Thêm các cột mới vào thuộc tính `$fillable`.
  - Thêm relationships: `belongsTo(Province::class)` và `belongsTo(Ward::class)`.
  - Thêm Model Event `creating`:
    - Logic tự động sinh mã bệnh nhân dạng `BNxxxxxx` (ví dụ `BN000001`). 
    - Cần tìm mã bệnh nhân lớn nhất hiện có, tăng phần số thêm 1 và định dạng 6 chữ số zero-padded. Sử dụng Database lock (ví dụ `sharedLock` hoặc `lockForUpdate`) trên truy vấn mã lớn nhất để phòng tránh tranh chấp đồng thời (concurrency).
  - Thêm dynamic accessor `age` (`getAgeAttribute()`) trả về `Năm hiện tại - Năm của birth_date`. Trả về null nếu `birth_date` rỗng.

### 3. Seeders & Dữ liệu cũ (NEW)
- **Tạo Seeder cho địa lý**:
  - Seed ít nhất 3 tỉnh/thành phố mẫu tại Việt Nam (ví dụ: Hà Nội, TP. Hồ Chí Minh, Đà Nẵng).
  - Seed tương ứng một số phường/xã trực thuộc mỗi tỉnh/thành phố.
- **Tạo Migration gán mã BN cho dữ liệu cũ**:
  - Viết logic cập nhật các bản ghi `customers` hiện có chưa có mã `code`. Duyệt qua theo thứ tự `id` tăng dần và gán mã `BN000001`, `BN000002`... tương ứng.

---

## Status
- [x] Tạo file migration tạo bảng `provinces` và `wards`.
- [x] Tạo file migration bổ sung cột vào bảng `customers`.
- [x] Viết Model `Province` và `Ward` kèm quan hệ Eloquent.
- [x] Cập nhật Model `Customer` (fillable, relationships, accessor `age`, event sinh mã `code` tự động).
- [x] Tạo seeder cho danh mục tỉnh/phường xã Việt Nam.
- [x] Tạo migration sinh mã BN cho khách hàng cũ đã có sẵn trong DB.
- [x] Run `php artisan migrate:rollback` và migrate lại để xác minh phương thức `down()` hoạt động tốt.
- [x] Run `php artisan db:seed` để nhập dữ liệu địa lý mẫu.
- [x] Run `php artisan code:format` (Backend) để định dạng mã nguồn.
- [x] Run `php .agents/scripts/validate-backend.php backend` và sửa mọi lỗi cấu trúc được phát hiện.
- [x] Run `php artisan test` kiểm tra tính tương thích của database sau thay đổi.

---

## Acceptance Criteria
1. Chạy migrate thành công, cấu trúc bảng `customers`, `provinces`, `wards` khớp hoàn toàn với thiết kế.
2. Phương thức rollback hoạt động bình thường, dọn sạch các bảng và cột mới tạo mà không gây lỗi khóa ngoại.
3. Khi lưu một `Customer` mới không truyền `code`, mã `code` tự động sinh có định dạng `BNxxxxxx` không bị trùng lặp.
4. Accessor `customer->age` trả về kết quả chính xác theo năm hiện tại trừ đi năm của `birth_date`.
