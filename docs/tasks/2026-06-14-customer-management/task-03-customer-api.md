---
task_id: "03"
title: "Customer API (CRUD & Services)"
description: "Cập nhật Service, DTO, FormRequests, Resource và Controller của API Customer để hỗ trợ quản lý các trường thông tin địa chỉ chi tiết, mã bệnh nhân, điện thoại phụ và ảnh đại diện."
type: IMPLEMENTATION
phase: 2b
status: completed
estimated_effort: M
complexity: medium
risk: low
depends_on: ["01", "02"]
rule_refs: ["PROPOSED_BR:customer-unique-phone", "PROPOSED_BR:customer-address-auto-generation"]
date: "2026-06-14"
changelog:
  - version: 1.0
    date: "2026-06-14"
    summary: Khởi tạo task cập nhật API Customer.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-14-customer-management-implementation-tasks.md](../2026-06-14-customer-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-api-task`
- **Applicable Skills**: `bks-be-api-standard`

---

# Task 03: Customer API (CRUD & Services)

## Description
Task này nâng cấp luồng xử lý API CRUD của khách hàng, bao gồm việc sửa đổi các FormRequest để validate các trường mới, cập nhật DTO để chuyển tiếp dữ liệu an toàn, sửa đổi logic trong `CustomerService` để thực hiện lưu trữ/ghép địa chỉ tự động, và định dạng JSON trả về trong `CustomerResource` (gồm cả việc thêm trường `age` và format quan hệ Tỉnh/Phường).

## Requirements

### 1. DTO Updates (MODIFY)
Cập nhật các DTO trong `app/DTOs/Api/Customer/`:
- `StoreCustomerData`: Bổ sung các thuộc tính: `phoneSecondary`, `houseNumber`, `provinceId`, `wardId`, `isAddressManuallyEdited`, `avatarPath`.
- `UpdateCustomerData`: Bổ sung các thuộc tính tương tự ở dạng nullable/optional.

### 2. FormRequest Validation (MODIFY)
Cập nhật các validation rules trong các request:

#### Validation Rules Table
| Field | Presence | Type | Boundaries | Format | Cross-field Rules | Notes |
|-------|----------|------|------------|--------|-------------------|-------|
| `full_name` | `required` (Store) | `string` | `max:255` | — | — | Họ tên bệnh nhân |
| `phone` | `required` (Store) | `string` | `max:50` | Regex ĐTDĐ | UNIQUE trong bảng `customers` (bỏ qua ID hiện tại khi update) | SĐT chính |
| `phone_secondary` | `nullable` | `string` | `max:50` | Regex ĐTDĐ | — | SĐT phụ |
| `birth_date` | `required` (Store) | `date` | `before_or_equal:today` | `Y-m-d` | — | Ngày sinh |
| `gender` | `required` (Store) | `integer` | `in:1,2,3` | — | — | Giới tính (Nam, Nữ, Khác) |
| `status` | `required` (Store) | `integer` | `in:0,1` | — | — | Trạng thái (0: Inactive, 1: Active) |
| `house_number` | `nullable` | `string` | `max:255` | — | — | Số nhà |
| `province_id` | `nullable` | `integer` | `exists:provinces,id` | — | — | Tỉnh/Thành phố |
| `ward_id` | `nullable` | `integer` | `exists:wards,id` | — | Phải thuộc `province_id` đã chọn | Phường/Xã |
| `address` | `nullable` | `string` | `max:255` | — | — | Địa chỉ ghép hoặc tự nhập |
| `is_address_manually_edited` | `nullable` | `boolean` | — | — | — | Cờ chỉnh sửa tay |
| `avatar_path` | `nullable` | `string` | `max:255` | — | — | Path ảnh sau upload |

- **Cross-field Validation Rules**:
  - `ward_id` nếu được truyền thì phải thuộc `province_id` được chọn (sử dụng rule `exists:wards,id` kết hợp check `where('province_id', $province_id)`).

### 3. CustomerService Logic (MODIFY)
Cập nhật `app/Services/Api/CustomerService.php`:
- **Trong hàm `create` và `update`**:
  - Lưu trữ các trường thông tin địa phương mới: `phone_secondary`, `house_number`, `province_id`, `ward_id`, `is_address_manually_edited`, `avatar_path`.
  - Logic ghép địa chỉ tự động (**PROPOSED_BR:customer-address-auto-generation**):
    - Nếu `is_address_manually_edited` là `false` (hoặc rỗng khi tạo mới) và có truyền Số nhà, Tỉnh/Thành phố, hoặc Phường/Xã:
      - Truy vấn lấy tên Tỉnh/Thành phố từ bảng `provinces` và tên Phường/Xã từ bảng `wards`.
      - Ghép địa chỉ theo định dạng: `[Số nhà], [Phường/Xã], [Tỉnh/Thành phố]` (ví dụ: `Số 10, Phường Dịch Vọng, Quận Cầu Giấy, Thành phố Hà Nội`).
      - Lưu chuỗi ghép được vào cột `address`.
    - Nếu `is_address_manually_edited` là `true` hoặc người dùng chủ động điền `address` khác với chuỗi ghép tự động, giữ nguyên giá trị `address` người dùng nhập tay.
- **Trong hàm `list`**:
  - Eager load `province` và `ward` khi query danh sách bệnh nhân.

### 4. CustomerResource Formatting (MODIFY)
Cập nhật `app/Http/Resources/Customer/CustomerResource.php` để trả về JSON định dạng chuẩn:
- `code`: `string`
- `phone_secondary`: `string|null`
- `house_number`: `string|null`
- `province`: `['id' => ..., 'name' => ...]|null`
- `ward`: `['id' => ..., 'name' => ...]|null`
- `is_address_manually_edited`: `boolean`
- `avatar_path`: `string|null`
- `age`: `integer|null` (lấy giá trị computed từ accessor `age` trên Model)

---

## Status
- [x] Cập nhật DTO `StoreCustomerData` và `UpdateCustomerData` với các trường địa phương mới.
- [x] Cập nhật FormRequest `StoreCustomerRequest`, `UpdateCustomerRequest` (validate phone unique, ward thuộc province, format ngày sinh).
- [x] Cập nhật logic ghép địa chỉ và lưu trữ thông tin mới trong `CustomerService`.
- [x] Cập nhật `CustomerResource` để xuất cấu trúc JSON có đầy đủ mã BN, tuổi, và thông tin địa phương.
- [ ] Run `php artisan code:format` (Backend) để định dạng mã nguồn.
- [ ] Run `php .agents/scripts/validate-backend.php backend` và sửa mọi lỗi cấu trúc được phát hiện.
- [ ] Run `php artisan test` chạy thử happy-path của API để đảm bảo không lỗi cú pháp.

---

## Acceptance Criteria
1. API `POST /api/customers` lưu thành công khách hàng với các trường thông tin địa chỉ chi tiết, số điện thoại phụ, tính tuổi tự động và sinh mã bệnh nhân.
2. Nếu gửi payload tạo mới không có `is_address_manually_edited` (hoặc bằng false), cột `address` trong DB tự động lưu chuỗi ghép đúng định dạng `[Số nhà], [Phường/Xã], [Tỉnh/Thành phố]`.
3. Nếu gửi payload với `is_address_manually_edited = true` và truyền nội dung `address` tự do, cột `address` lưu đúng nội dung tự do đó mà không bị ghi đè.
4. Response JSON của các API Customer chứa đầy đủ các trường mới và quan hệ `province`, `ward` trả về dạng object `{id, name}`.
