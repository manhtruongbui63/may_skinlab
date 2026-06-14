---
task_id: "05"
title: "3a — Screen S1 (Customer List) Data Layer"
description: "Thiết lập TypeScript types và hook React Query useCustomers truy xuất danh sách bệnh nhân có phân trang, tìm kiếm và đồng bộ URL filter state."
type: IMPLEMENTATION
phase: 3a
status: completed
estimated_effort: S
complexity: low
risk: low
depends_on: ["03"]
rule_refs: []
date: "2026-06-14"
changelog:
  - version: 1.0
    date: "2026-06-14"
    summary: Khởi tạo task FE S1 Data Layer.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-14-customer-management-implementation-tasks.md](../2026-06-14-customer-management-implementation-tasks.md)
- **Applicable Workflows**: (None)
- **Applicable Skills**: `bks-fe-api-integration`, `bks-fe-list-url-state`

---

# Task 05: Screen S1 (Customer List) Data Layer

## Description
Task này tập trung xây dựng tầng dữ liệu cho màn hình Danh sách bệnh nhân (S1), bao gồm việc định nghĩa/cập nhật TypeScript Interface cho Bệnh nhân, viết phương thức truy xuất trong Repository, và tạo hook React Query kết hợp đồng bộ trạng thái bộ lọc lên URL search params.

## Requirements

### 1. TypeScript Types (MODIFY)
Cập nhật file `frontend/features/customers/types.ts` để bổ sung các thuộc tính:
- `code`: `string`
- `phone_secondary`: `string | null`
- `house_number`: `string | null`
- `province`: `{ id: number; name: string } | null`
- `ward`: `{ id: number; name: string } | null`
- `is_address_manually_edited`: `boolean`
- `avatar_path`: `string | null`
- `age`: `number | null`

### 2. Repository & Fetch Methods (MODIFY)
Cập nhật Repository lớp khách hàng (`frontend/features/customers/services/`):
- Viết phương thức fetch danh sách khách hàng `list(params: IndexCustomerParams): Promise<PaginatedResponse<Customer>>`.
- Gọi đến endpoint `GET /api/customers` và truyền các query params.

### 3. TanStack Query Hook (MODIFY)
Cập nhật/tạo mới hook `useCustomers` trong `frontend/features/customers/hooks/`:
- Sử dụng React Query `useQuery` để cache và tự động tải lại danh sách khách hàng.
- Đồng bộ các filter state (search, status, gender, page, per_page) với URL search params của Next.js App Router (sử dụng hook `useSearchParams` hoặc các thư viện/helper đồng bộ URL của dự án).

---

## Status
- [x] Cập nhật Interface `Customer` trong `frontend/features/customers/types.ts`.
- [x] Cập nhật phương thức `list` trong Customer Repository.
- [x] Triển khai hook `useCustomers` có đồng bộ URL filter state.
- [x] Chạy lệnh `pnpm lint` (Frontend) kiểm tra và sửa các cảnh báo code style.
- [x] Chạy lệnh `pnpm test:unit` để kiểm tra hoạt động của repository/hook nếu có test có sẵn.

---

## Acceptance Criteria
1. Interface `Customer` khớp hoàn toàn với định dạng response JSON trả về từ API Backend.
2. Hook `useCustomers` gọi API đúng URL `GET /api/customers` với đầy đủ query parameters khi filter thay đổi.
3. Các tham số lọc được đồng bộ hai chiều lên thanh địa chỉ trình duyệt (URL query params).
