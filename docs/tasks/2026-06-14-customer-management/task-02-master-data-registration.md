---
task_id: "02"
title: "Master Data Registration"
description: "Đăng ký các tài nguyên Master Data mới cho Provinces (Tỉnh/Thành phố) và Wards (Phường/Xã) trong MasterDataService để Frontend gọi thông qua endpoint /api/master-data."
type: IMPLEMENTATION
phase: 1
status: completed
estimated_effort: S
complexity: low
risk: low
depends_on: ["01"]
rule_refs: []
date: "2026-06-14"
changelog:
  - version: 1.0
    date: "2026-06-14"
    summary: Khởi tạo task đăng ký Master Data.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-14-customer-management-implementation-tasks.md](../2026-06-14-customer-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-api-task`
- **Applicable Skills**: `bks-be-master-data-standard`

---

# Task 02: Master Data Registration

## Description
Đăng ký các tài nguyên địa lý vào `MasterDataService` để hỗ trợ hiển thị các dropdown Tỉnh/Thành phố và Phường/Xã phụ thuộc trên form của Frontend. Một yêu cầu địa chỉ chi tiết yêu cầu nạp nhanh danh mục mà không cần gọi API riêng lẻ.

## Requirements

### 1. Đăng ký trong MasterDataService
Cập nhật thuộc tính `$availableResources` trong file `app/Services/Api/MasterDataService.php`:
- **Đăng ký `provinces`**:
  - Driver: `self::DRIVER_ELOQUENT`
  - Target: `App\Models\Province::class`
  - Select: `['id', 'name']`
  - Order: `['name', 'asc']`
- **Đăng ký `wards`**:
  - Driver: `self::DRIVER_CUSTOM`
  - Target: `getWards` (tên hàm xử lý tùy chỉnh)

### 2. Triển khai hàm getWards (Custom Driver)
- Viết hàm `getWards(array $resource): array` trong `MasterDataService`:
  - Lấy tham số `province_id` từ `$resource['params']`.
  - Nếu `province_id` được truyền, thực hiện query bảng `wards` có `province_id = province_id` được truyền.
  - Sắp xếp kết quả theo tên `name` tăng dần.
  - Sử dụng hàm `paginate($resource, $query, 'name')` để phân trang và tìm kiếm (hoặc trả về toàn bộ nếu được cấu hình).

### 3. Viết Smoke Test
- Cập nhật `tests/Feature/Api/MasterDataTest.php`:
  - Thêm test case kiểm tra việc gọi API `/api/master-data?resources[provinces]={}` trả về HTTP 200 và cấu trúc dữ liệu hợp lệ.
  - Thêm test case kiểm tra việc gọi API `/api/master-data?resources[wards]={"province_id": 1}` trả về HTTP 200 và danh sách phường xã thuộc tỉnh tương ứng.

---

## Status
- [x] Đăng ký tài nguyên `provinces` vào `$availableResources` của `MasterDataService`.
- [x] Đăng ký tài nguyên `wards` vào `$availableResources` của `MasterDataService`.
- [x] Triển khai hàm custom `getWards` trong `MasterDataService`.
- [x] Thêm các test case kiểm tra trong `MasterDataTest.php`.
- [x] Run `php artisan code:format` (Backend) để định dạng mã nguồn.
- [x] Run `php .agents/scripts/validate-backend.php backend` và sửa mọi lỗi cấu trúc được phát hiện.
- [x] Run `php artisan test --filter=MasterDataTest` để kiểm tra hoạt động của Master Data API.

---

## Acceptance Criteria
1. API `/api/master-data?resources[provinces]={}` hoạt động, trả về danh sách các tỉnh/thành phố dạng mảng `{id, name}` được sắp xếp theo tên.
2. API `/api/master-data?resources[wards]={"province_id":X}` hoạt động, trả về danh sách các phường/xã có `province_id = X` được sắp xếp theo tên.
3. Test case trong `MasterDataTest.php` pass hoàn toàn.
