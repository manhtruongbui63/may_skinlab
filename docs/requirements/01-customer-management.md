---
title: Quản lý khách hàng
description: Yêu cầu chuẩn cho tính năng Quản lý khách hàng trong hệ thống phòng khám da liễu.
status: pending_implementation
date: 2026-06-11
version: 0.1.0
changelog:
  - tạo tài liệu yêu cầu dựa trên bản thảo 01-customer-management.md
---

## 2. OVERVIEW

Xây dựng tính năng quản lý thông tin khách hàng/bệnh nhân, cho phép bác sĩ thực hiện các thao tác CRUD, tra cứu lịch sử khám, liệu trình, hoá đơn và tính công nợ theo thời gian thực. Tính năng bao gồm tạo mới, danh sách, tìm kiếm, lọc, chi tiết và chuyển trạng thái hoạt động.

## 3. CONTEXT

- **Module**: `Customer` thuộc domain `Patient Management`.
- **Related modules**: `Visit`, `TreatmentPlan`, `Invoice`, `Payment`.
- **Guards**: `auth:sanctum` – chỉ người dùng đã xác thực (bác sĩ, nhân viên).
- **Third‑party**: Không có tích hợp ngoài hệ thống.

## 4. OUT OF SCOPE

- Quản lý hồ sơ y tế chi tiết (beyond basic visit history).
- Tích hợp với hệ thống thanh toán bên thứ ba.
- Báo cáo thống kê tổng hợp toàn hệ thống.

## 5. BUSINESS RULES

| ID | Rule | Enforced In |
|---|---|---|
| PROPOSED_BR:customer-unique-phone | Số điện thoại khách hàng phải là duy nhất trên toàn hệ thống. | BE, FE |
| PROPOSED_BR:customer-status-active | Khi trạng thái `INACTIVE` khách hàng không xuất hiện trong danh sách đặt lịch mới. | BE, FE |
| PROPOSED_BR:outstanding‑calculation | `outstanding_amount` được tính bằng tổng số tiền chưa thanh toán của tất cả hoá đơn liên quan, cập nhật thời gian thực. | BE, FE |

## 6. REQUIREMENT ANALYSIS

- **Gap 1**: Bản thảo không chỉ định cách tính `outstanding_amount`. Đề xuất tính ngay trong model bằng accessor hoặc view.
- **Gap 2**: Không có quy tắc soft‑delete. Đề xuất hỗ trợ soft‑delete cho bảng `customers` để bảo toàn dữ liệu.
- **Gap 3**: Không đề cập đến thông báo nhắc nợ. Đề xuất thêm job gửi email nhắc nhở khi `outstanding_amount` > 0 và quá hạn 30 ngày.
- **Gap 4**: Không có quy tắc bảo mật dữ liệu bệnh nhân. Đề xuất tuân thủ GDPR/HIPAA (mã hoá dữ liệu nhạy cảm, log truy cập).

## 7. DATA MODEL UPDATES

### Table: `customers`
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | bigInt | No | – | Primary key |
| full_name | string | No | – | Họ và tên (bắt buộc) |
| phone | string | No | – | Số điện thoại (unique, bắt buộc) |
| birth_date | date | Yes | null | Ngày sinh |
| gender | enum(`male`,`female`,`other`) | Yes | null | Giới tính |
| address | text | Yes | null | Địa chỉ |
| source | enum(`facebook`,`referral`,`google`,`tiktok`,`other`) | No | `other` | Nguồn khách |
| status | enum(`active`,`inactive`) | No | `active` | Trạng thái hoạt động |
| deleted_at | timestamp | Yes | null | Soft‑delete timestamp |
| created_at | timestamp | No | – | Tạo lúc |
| updated_at | timestamp | No | – | Cập nhật lúc |

**Enum definitions** (placed in `app/Enums`):
- `GenderEnum` – `male`, `female`, `other` (labels `gender.male`, ...)
- `CustomerSourceEnum` – `facebook`, `referral`, `google`, `tiktok`, `other`
- `CustomerStatusEnum` – `active`, `inactive`

### Relationships
- `Customer` hasMany `Visit`
- `Customer` hasMany `TreatmentPlan`
- `Customer` hasMany `Invoice`
- `Customer` hasOne `OutstandingAmount` (computed accessor).

## 8. PROCESSING FLOWS

### Flow 1: Tạo mới khách hàng
1. Người dùng mở modal "Thêm khách hàng".
2. Nhập các trường bắt buộc (`full_name`, `phone`). Các trường tùy chọn có thể để trống.
3. Submit → Frontend gọi API `POST /api/customers` với payload JSON.
4. Backend vali‑date:
   - `full_name` required, max 255.
   - `phone` required, unique, regex `/^\+?[0-9]{7,15}$/`.
   - `source` enum, default `other`.
   - `status` default `active`.
5. Service `CustomerService::create()` tạo model, ghi log, trả về `CustomerResource`.
6. Frontend hiển thị toast "Khách hàng được tạo thành công" và cập nhật danh sách.

### Flow 2: Đọc danh sách khách hàng
1. Component `CustomerList` gọi hook `useCustomers()`.
2. Hook thực hiện request `GET /api/customers` với query params: `search`, `gender`, `source`, `status`, `page`, `per_page`.
3. Backend áp dụng scope `filterBy...` và pagination.
4. Response trả về `data` + meta (total, per_page, current_page).
5. UI render table, cho phép người dùng filter, search, pagination.

### Flow 3: Xem chi tiết khách hàng
1. Người dùng click "Xem" → navigate tới `/customers/[id]`.
2. Trang chi tiết tải các tab song song:
   - `GET /api/customers/{id}` → thông tin cá nhân.
   - `GET /api/customers/{id}/visits`.
   - `GET /api/customers/{id}/treatment-plans`.
   - `GET /api/customers/{id}/invoices` (bao gồm `outstanding_amount`).
3. Mỗi tab hiển thị dữ liệu, cho phép mở modal chi tiết nếu cần.

### Flow 4: Cập nhật trạng thái (ACTIVE / INACTIVE)
1. Người dùng click nút chuyển trạng thái trên danh sách.
2. Frontend gửi `PATCH /api/customers/{id}` với trường `status`.
3. Service cập nhật, xóa/khôi phục cache, trả về `CustomerResource`.
4. UI cập nhật bảng và hiển thị toast.

### Flow 5: Xóa khách hàng (soft‑delete)
1. Người dùng click nút Xóa → xác nhận.
2. Frontend gửi `DELETE /api/customers/{id}`.
3. Backend thực hiện soft‑delete (`deleted_at` timestamp).
4. Khách hàng không xuất hiện trong danh sách, nhưng dữ liệu vẫn tồn tại cho mục đích audit.

**Error Cases** (cho mọi flow):
| Scenario | HTTP Code | Message |
|---|---|---|
| Validation lỗi | 422 | `validation_error` + chi tiết các trường |
| Không tìm thấy khách hàng | 404 | `customer_not_found` |
| Truy cập không cho phép | 403 | `unauthorized_action` |
| Server error | 500 | `internal_error` |

## 9. UI/UX & FRONTEND IMPLICATIONS

- **Customer List Page** (`/customers`)
  - Table component (`shadcn/ui` Table) với sticky header, pagination, search input, filter dropdowns.
  - Action column: Xem, Sửa, Đổi trạng thái, Xóa.
  - Toast notifications (`sonner`).
  - Internationalisation (`next-intl`) cho mọi nhãn.
- **Customer Detail Page** (`/customers/[id]`)
  - Tab navigation (`Tabs` component) – Profile, Visits, Treatment Plans, Invoices, Outstanding.
  - Mỗi tab sử dụng React Query (`tanstack/query`) để fetch dữ liệu, cache, refetch on focus.
  - Real‑time `outstanding_amount` hiển thị bằng hook tính toán dựa trên dữ liệu invoices.
- **Create/Edit Modal**
  - Form built with `react-hook-form` + Zod schema.
  - Validation messages localized.
  - Submit disabled until form valid, shows spinner.
- **State Management**
  - Zustand store `useCustomerStore` chứa danh sách, filter state, pagination.
  - Selector hooks để lấy dữ liệu đã cache.
- **Accessibility**
  - ARIA labels cho các control, focus trap trong modal.

## 10. NOTIFICATIONS

- **Toast** khi tạo/sửa/xóa thành công.
- **Email reminder job** (optional) – gửi email nhắc nợ cho khách hàng có `outstanding_amount` > 0 và overdue > 30 ngày. Job `RecalculateOutstandingAmountJob` sẽ chạy hàng ngày để cập nhật trạng thái.

## 11. API ENDPOINT INVENTORY

| Method | URI | Guard | Description |
|---|---|---|---|
| GET | `/api/customers` | `auth:sanctum` | Danh sách phân trang, hỗ trợ filter (name, phone, gender, source, status).
| POST | `/api/customers` | `auth:sanctum` | Tạo khách hàng mới, validation theo yêu cầu.
| GET | `/api/customers/{id}` | `auth:sanctum` | Chi tiết khách hàng, bao gồm visits, treatment plans, invoices.
| PATCH | `/api/customers/{id}` | `auth:sanctum` | Cập nhật các trường (full_name, phone, gender, source, status).
| DELETE | `/api/customers/{id}` | `auth:sanctum` | Soft‑delete khách hàng.

## 12. IMPLEMENTATION TASKS

### Backend
1. Tạo migration `create_customers_table` (fields, soft deletes, indexes).
2. Định nghĩa enums `GenderEnum`, `CustomerSourceEnum`, `CustomerStatusEnum`.
3. Tạo model `Customer` + relationships.
4. Tạo FormRequest `StoreCustomerRequest`, `UpdateCustomerRequest`.
5. Xây dựng `CustomerService` (CRUD, status toggle, outstanding calculation).
6. Tạo `CustomerController` + Resource `CustomerResource`.
7. Định nghĩa policies `CustomerPolicy`.
8. (Optional) Job `RecalculateOutstandingAmountJob` và schedule.
9. Viết PHPUnit feature tests cho API (CRUD, validation, soft‑delete, pagination, filters).

### Frontend
1. Thêm route `/customers` và `/customers/[id]` trong Next.js App Router.
2. Tạo Zustand store `customerStore` (list, filters, pagination).
3. Implement repository `CustomerRepository` extending `BaseRepository`.
4. Tạo hook `useCustomers`, `useCustomerDetail` với TanStack Query.
5. Xây dựng component `CustomerList` (table, search, filter, actions).
6. Xây dựng component `CustomerDetail` (tabs, data fetching).
7. Tạo modal `CustomerFormModal` (React Hook Form + Zod).
8. Viết Zod schemas cho API responses.
9. Thêm toast notifications (`sonner`).
10. Thêm i18n cho tất cả nhãn (`next-intl`).
11. Viết Vitest unit tests cho store, hooks, components.
12. Viết Playwright e2e tests cho luồng: tạo > danh sách > chi tiết > cập nhật trạng thái > xóa.

### Documentation & Traceability
- Thêm `PROPOSED_BR:customer-unique-phone`, `PROPOSED_BR:customer-status-active`, `PROPOSED_BR:outstanding‑calculation` vào `docs/system/br-registry.md`.
- Cập nhật `docs/logic/` với mô tả `Customer` service và enum reuse.
- Đảm bảo các enum mới được liệt kê trong `docs/logic/enums/`.

---
*Đây là tài liệu yêu cầu chính thức, tuân thủ quy trình `bks-requirement-analysis`. Khi đã xác nhận, chúng ta sẽ tiến hành thực hiện các task đã liệt kê.*
