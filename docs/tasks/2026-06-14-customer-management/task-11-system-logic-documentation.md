---
task_id: "11"
title: "System Logic & API Documentation"
description: "Cập nhật tài liệu logic hệ thống docs/logic/customer/customer-management.md, đăng ký chính thức các mã Business Rule mới vào registry và cập nhật tài liệu API."
type: DOCUMENTATION
phase: 4
status: completed
estimated_effort: S
complexity: low
risk: low
depends_on: ["03", "10"]
rule_refs: []
date: "2026-06-14"
changelog:
  - version: 1.0
    date: "2026-06-14"
    summary: Khởi tạo task cập nhật tài liệu.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-14-customer-management-implementation-tasks.md](../2026-06-14-customer-management-implementation-tasks.md)
- **Applicable Workflows**: (None)
- **Applicable Skills**: `bks-doc-logic-standard`

---

# Task 11: System Logic & API Documentation

## Description
Task này tập trung vào việc cập nhật và chuẩn hóa toàn bộ tài liệu kỹ thuật liên quan đến module Quản lý khách hàng sau khi các thay đổi đã được triển khai hoàn chỉnh. Mục tiêu là duy trì nguồn tài liệu chính xác (System Intelligence) để phục vụ cho các chu kỳ phát triển tiếp theo.

## Requirements

### 1. Cập nhật BR Registry (MODIFY)
Đăng ký chính thức các Business Rules đã đề xuất vào file `docs/system/br-registry.md`:
- `BR-CUST-001` (được cấp mã thay cho `PROPOSED_BR:customer-unique-code`): Quy tắc về tính duy nhất của Mã BN.
- `BR-CUST-002` (được cấp mã thay cho `PROPOSED_BR:customer-unique-phone`): Quy tắc về tính duy nhất của Số điện thoại chính.
- `BR-CUST-003` (được cấp mã thay cho `PROPOSED_BR:customer-age-calculation`): Quy tắc về cách tính tuổi tự động.
- `BR-CUST-004` (được cấp mã thay cho `PROPOSED_BR:customer-address-auto-generation`): Quy tắc về cơ chế ghép địa chỉ tự động và cờ sửa tay.
- *Lưu ý*: Cập nhật cột `Status`, `Module`, `Title`, `Source File` và `Notes` cho các rule này.

### 2. Cập nhật Logic Documentation (MODIFY)
Cập nhật file `docs/logic/customer/customer-management.md`:
- Bổ sung tài liệu về cấu trúc bảng danh mục địa lý `provinces`/`wards`.
- Giải thích chi tiết về luồng nghiệp vụ tự động sinh mã BN dạng `BNxxxxxx` (sử dụng Database locks).
- Giải thích cơ chế tự động ghép địa chỉ dựa trên cờ `is_address_manually_edited`.
- Chuyển đổi toàn bộ các tham chiếu `PROPOSED_BR` thành mã `BR-CUST-*` đã đăng ký.
- Cập nhật số phiên bản tài liệu (changelog) lên `1.1.0`.

### 3. Cập nhật API Documentation (MODIFY)
Cập nhật file `docs/api/modules/master-data.md`:
- Thêm tài liệu hướng dẫn gọi API Master Data của `provinces` và `wards` kèm mô tả các tham số lọc đầu vào và cấu trúc JSON trả về mẫu.

---

## Status
- [x] Đăng ký các mã `BR-CUST-*` mới vào `docs/system/br-registry.md`.
- [x] Cập nhật tài liệu logic hệ thống `docs/logic/customer/customer-management.md`.
- [x] Cập nhật tài liệu API Master Data `docs/api/modules/master-data.md`.
- [x] Rà soát toàn bộ tài liệu đảm bảo không còn chứa ký tự `PROPOSED_BR`.

---

## Acceptance Criteria
1. Các file tài liệu được cập nhật hoàn chỉnh, định dạng chuẩn Markdown của dự án.
2. Không còn bất kỳ tham chiếu `PROPOSED_BR` nào trong các tài liệu logic, tất cả đều đã được thay bằng mã `BR-CUST-XXX` tương ứng.
