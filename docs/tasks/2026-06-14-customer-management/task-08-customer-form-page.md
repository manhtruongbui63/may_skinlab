---
task_id: "08"
title: "3c — Screen S2 & S3 (Customer Form) Page & Components"
description: "Xây dựng biểu mẫu tạo mới (S2) và chỉnh sửa (S3) bệnh nhân với bố cục 8 hàng, tích hợp logic phụ thuộc tỉnh thành/phường xã, tự tính tuổi và tự ghép địa chỉ."
type: IMPLEMENTATION
phase: 3c
status: completed
estimated_effort: M
complexity: medium
risk: low
depends_on: ["06"]
rule_refs: ["PROPOSED_BR:customer-unique-code", "PROPOSED_BR:customer-age-calculation", "PROPOSED_BR:customer-address-auto-generation"]
date: "2026-06-14"
changelog:
  - version: 1.0
    date: "2026-06-14"
    summary: Khởi tạo task FE S2/S3 Form Page.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-14-customer-management-implementation-tasks.md](../2026-06-14-customer-management-implementation-tasks.md)
- **Applicable Workflows**: (None)
- **Applicable Skills**: `bks-fe-implement-feature`, `bks-fe-ds-sdk-consumer`

---

# Task 08: Screen S2 & S3 (Customer Form) Page & Components

## Description
Task này chịu trách nhiệm xây dựng biểu mẫu Form thông tin khách hàng hỗ trợ cả chế độ Tạo mới (S2) và Chỉnh sửa (S3). Bố cục được sắp xếp chính xác theo 8 hàng biểu mẫu, cài đặt các cơ chế tự động tương tác tại Client để tối ưu hóa trải nghiệm nhập liệu của nhân viên phòng khám.

## Requirements

### 1. Form Layout (8 Rows Layout)
Bố trí giao diện form sử dụng grid/flex của Design System:
- **Hàng 1**: 
  - Mã BN: Ô nhập Read-only. Khi tạo mới hiển thị dạng placeholder (ví dụ: `BNxxxxxx`), khi sửa hiển thị mã thực tế của khách hàng.
  - Họ tên: Ô nhập text.
- **Hàng 2**:
  - Giới tính: Dropdown chọn (Nam, Nữ, Khác).
  - Ngày sinh (birth_date): Ô chọn ngày (Calendar Picker).
  - Tuổi: Ô nhập Read-only. Tự động tính toán khi Ngày sinh thay đổi (**PROPOSED_BR:customer-age-calculation**).
- **Hàng 3**:
  - Trạng thái khách hàng: Dropdown chọn (Active, Inactive).
- **Hàng 4**:
  - Số điện thoại chính: Ô nhập text.
  - Số điện thoại phụ: Ô nhập text.
- **Hàng 5**:
  - Số nhà: Ô nhập text.
  - Tỉnh/Thành phố: Combobox tìm kiếm nạp từ master data `provinces`.
- **Hàng 6**:
  - Phường/Xã: Combobox tìm kiếm nạp từ master data `wards` (phụ thuộc theo Tỉnh/Thành phố đã chọn).
- **Hàng 7**:
  - Địa chỉ: Textarea hiển thị chuỗi địa chỉ đầy đủ.
  - Nút/Biểu tượng: "Tự động tạo địa chỉ".
- **Hàng 8**:
  - Ảnh đại diện: Component Upload file hình ảnh (hỗ trợ preview ảnh).

### 2. Form Interactive Logic (FE Logic)
Triển khai logic tương tác trong React Hook Form:
- **Tính tuổi**: Lắng nghe sự thay đổi của `birth_date`. Khi có giá trị hợp lệ, tính tuổi = `Năm hiện tại - Năm sinh của birth_date` và gán vào ô Tuổi.
- **Ràng buộc địa phương**: 
  - Khi Tỉnh/Thành phố thay đổi, tự động reset `ward_id` về null/rỗng.
  - Tải lại danh sách Phường/Xã dựa trên `province_id` mới chọn.
- **Tự động ghép địa chỉ**:
  - Lắng nghe các trường: Số nhà, Tỉnh/Thành phố, Phường/Xã.
  - Nếu cờ `is_address_manually_edited` đang là `false`: mỗi khi các trường trên thay đổi, thực hiện ghép chuỗi `[Số nhà], [Tên Phường/Xã], [Tên Tỉnh/Thành phố]` và cập nhật vào textarea Địa chỉ.
  - Khi người dùng gõ trực tiếp vào textarea Địa chỉ -> chuyển cờ `is_address_manually_edited` sang `true` (**UI-003**).
  - Khi người dùng nhấn nút "Tự động tạo địa chỉ" -> Reset cờ về `false` và tự động ghép lại địa chỉ ghi vào textarea (**UI-004**).

### 3. Action Buttons
- **Tạo mới (S2)**: Nút "Lưu", "Lưu và tạo mới" (lưu xong clear form để nhập tiếp bản ghi mới), "Hủy".
- **Chỉnh sửa (S3)**: Nút "Lưu", "Hủy".

---

## Status
- [x] Thiết kế layout 8 hàng biểu mẫu bằng Tailwind/Design System.
- [x] Triển khai logic tính tuổi tự động từ ngày sinh.
- [x] Triển khai logic nạp phường/xã phụ thuộc tỉnh thành phố đã chọn.
- [x] Triển khai logic tự động ghép địa chỉ và cờ `is_address_manually_edited`.
- [x] Tích hợp component Upload ảnh đại diện.
- [x] Tích hợp React Hook Form, Zod schema và xử lý hiển thị lỗi validate.
- [x] Chạy lệnh `pnpm lint` (Frontend) kiểm tra định dạng code.
- [x] Chạy lệnh `pnpm test:unit` để kiểm tra render và tương tác form.

---

## Acceptance Criteria
1. Bố cục Form sắp xếp đúng 8 hàng như đặc tả thiết kế UI.
2. Nhập Ngày sinh hiển thị đúng tuổi tính được ở ô bên cạnh (chế độ Read-only).
3. Đổi Tỉnh/Thành phố xóa sạch giá trị Phường/Xã cũ và khóa cho tới khi tải xong Phường/Xã mới.
4. Gõ tay vào ô Địa chỉ chặn cơ chế tự động ghép chuỗi. Nhấn nút "Tạo lại địa chỉ tự động" khôi phục chuỗi ghép thành công.
