---
task_id: "04"
title: "Backend Test Suite (PHPUnit)"
description: "Viết bổ sung và cập nhật bộ test cases PHPUnit (Feature Tests) để kiểm thử toàn diện các quy tắc validate, logic nghiệp vụ tự động sinh mã BN, ghép địa chỉ và tính tuổi."
type: IMPLEMENTATION
phase: 4
status: completed
estimated_effort: S
complexity: medium
risk: low
depends_on: ["03"]
rule_refs: ["PROPOSED_BR:customer-unique-code", "PROPOSED_BR:customer-unique-phone", "PROPOSED_BR:customer-age-calculation", "PROPOSED_BR:customer-address-auto-generation"]
date: "2026-06-14"
changelog:
  - version: 1.0
    date: "2026-06-14"
    summary: Khởi tạo task viết test suite backend.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-14-customer-management-implementation-tasks.md](../2026-06-14-customer-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-api-task`
- **Applicable Skills**: `bks-be-testing-standard`

---

# Task 04: Backend Test Suite (PHPUnit)

## Description
Task này tập trung viết và cải tiến các Feature Test trong PHPUnit để bao phủ các tình huống nghiệp vụ đặc thù bao gồm: sinh mã BN tự động không trùng lặp kể cả khi tạo đồng thời, tự động ghép địa chỉ dựa trên cờ, validate tỉnh thành/phường xã hợp lệ và ràng buộc độc nhất của Số điện thoại chính.

## Requirements

### 1. Cập nhật CustomerStoreTest & CustomerUpdateTest
Bổ sung các test cases kiểm thử:
- **Test sinh mã BN tự động**: 
  - Tạo mới khách hàng và assert trường `code` được sinh có định dạng `BNxxxxxx`.
  - Kiểm tra xem mã sinh ra có tăng dần liên tiếp (`BN000001` -> `BN000002`).
- **Test tính tuổi bệnh nhân**:
  - Tạo khách hàng với `birth_date = 1995-10-12` (năm sinh 1995). Assert dynamic accessor `age` trả về đúng giá trị `năm hiện tại - 1995`.
- **Test tự động ghép địa chỉ**:
  - Gửi payload tạo mới với Số nhà, Tỉnh/Thành phố, Phường/Xã và `is_address_manually_edited = false` (hoặc omitted). Assert trường `address` trong DB lưu chuỗi ghép đúng định dạng.
  - Gửi payload với `is_address_manually_edited = true` và `address = "Địa chỉ nhập tay"`. Assert trường `address` lưu đúng `"Địa chỉ nhập tay"`.
- **Test ràng buộc trùng lặp SĐT**:
  - Tạo khách hàng có SĐT `0987654321`.
  - Gửi request tạo mới khách hàng khác có cùng SĐT `0987654321` -> Nhận lỗi 422 `phone_taken`.
  - Gửi request cập nhật thông tin khách hàng hiện tại với cùng SĐT `0987654321` -> Thành công (bỏ qua bản ghi hiện tại).
- **Test kiểm tra mối quan hệ địa phương**:
  - Gửi payload có `province_id = X` nhưng `ward_id = Y` (với Y không thuộc tỉnh X) -> Nhận lỗi 422 validation.

---

## Status
- [x] Bổ sung các test cases vào `tests/Feature/Api/Customer/CustomerStoreTest.php`.
- [x] Bổ sung các test cases vào `tests/Feature/Api/Customer/CustomerUpdateTest.php`.
- [x] Viết test case kiểm thử concurrency sinh mã BN (nếu có thể mô phỏng).
- [ ] Run `php artisan code:format` (Backend) để định dạng mã nguồn.
- [ ] Run `php .agents/scripts/validate-backend.php backend` và sửa mọi lỗi cấu trúc được phát hiện.
- [ ] Run `php artisan test --filter=CustomerStoreTest` và verify pass.
- [ ] Run `php artisan test --filter=CustomerUpdateTest` và verify pass.

---

## Acceptance Criteria
1. Toàn bộ các test cases mới và cũ của Customer API chạy thành công và đạt trạng thái PASS.
2. Code coverage kiểm thử của module Customer đạt mức yêu cầu dự án.
