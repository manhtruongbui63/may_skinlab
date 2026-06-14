---
task_id: "06"
title: "3a — Screen S2 & S3 (Customer Form) Data Layer"
description: "Thiết lập Zod schema validation cho form thông tin khách hàng, viết các hook mutation tạo mới/cập nhật và hook truy xuất danh mục địa phương."
type: IMPLEMENTATION
phase: 3a
status: completed
estimated_effort: S
complexity: low
risk: low
depends_on: ["03", "02"]
rule_refs: ["PROPOSED_BR:customer-unique-phone"]
date: "2026-06-14"
changelog:
  - version: 1.0
    date: "2026-06-14"
    summary: Khởi tạo task FE S2/S3 Data Layer.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-14-customer-management-implementation-tasks.md](../2026-06-14-customer-management-implementation-tasks.md)
- **Applicable Workflows**: (None)
- **Applicable Skills**: `bks-fe-api-integration`

---

# Task 06: Screen S2 & S3 (Customer Form) Data Layer

## Description
Task này chuẩn bị tầng dữ liệu và validation phục vụ cho biểu mẫu thêm mới (S2) và cập nhật (S3) thông tin bệnh nhân. Các hạng mục gồm viết Zod Schema định nghĩa luật validate đầu vào, và triển khai các React Query Mutation cùng hook nạp tỉnh thành/phường xã từ Master Data.

## Requirements

### 1. Zod Schema Validation (NEW & MODIFY)
Tạo/Cập nhật file schema validation (ví dụ `frontend/features/customers/schemas/customer.schema.ts`):
- Định nghĩa Zod object `customerSchema`:
  - `full_name`: string, required, max 255.
  - `phone`: string, required, max 50, đúng định dạng.
  - `phone_secondary`: string, optional, đúng định dạng nếu có nhập.
  - `birth_date`: date/string, required, ngày sinh hợp lệ (không vượt quá ngày hiện tại).
  - `gender`: number (1: Nam, 2: Nữ, 3: Khác), required.
  - `status`: number (0: Inactive, 1: Active), required.
  - `house_number`: string, optional.
  - `province_id`: number/string, optional.
  - `ward_id`: number/string, optional.
  - `address`: string, optional, max 255.
  - `is_address_manually_edited`: boolean.

### 2. Mutation Hooks (NEW & MODIFY)
Xây dựng các hooks trong `frontend/features/customers/hooks/`:
- `useCreateCustomer()`: Sử dụng `useMutation` gọi `CustomerRepository.create(data)` kết nối đến `POST /api/customers`. Sau thành công, invalidate query `customers`.
- `useUpdateCustomer(id)`: Sử dụng `useMutation` gọi `CustomerRepository.update(id, data)` kết nối đến `PATCH /api/customers/{id}`. Sau thành công, invalidate query `customers` và `customer-detail`.

### 3. Location Lookup Hooks (NEW)
Xây dựng các hooks lấy dữ liệu tỉnh/phường xã từ Master Data API:
- `useProvinces()`: Gọi API `/api/master-data?resources[provinces]={}`.
- `useWards(provinceId)`: Gọi API `/api/master-data?resources[wards]={"province_id":provinceId}`. Chỉ gọi (enabled) khi `provinceId` hợp lệ.

---

## Status
- [x] Định nghĩa Zod Schema `customerSchema` cho form bệnh nhân.
- [x] Triển khai hook `useCreateCustomer`.
- [x] Triển khai hook `useUpdateCustomer`.
- [x] Triển khai hook `useProvinces` và `useWards`.
- [x] Chạy lệnh `pnpm lint` (Frontend) kiểm tra định dạng code.
- [x] Chạy lệnh `pnpm test:unit` để kiểm tra Zod validation.

---

## Acceptance Criteria
1. Zod Schema chặn thành công lỗi bỏ trống các trường bắt buộc (`full_name`, `phone`, `birth_date`, `gender`, `status`).
2. Hook `useWards(provinceId)` tự động cập nhật hoặc gọi lại API khi `provinceId` thay đổi.
3. API mutation xử lý lỗi 422 từ máy chủ và trả về định dạng map lỗi trường thông tin chính xác.
