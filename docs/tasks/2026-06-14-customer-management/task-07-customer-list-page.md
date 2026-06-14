---
task_id: "07"
title: "3c — Screen S1 (Customer List) Page & Components"
description: "Phát triển giao diện trang Danh sách khách hàng (S1) sử dụng Design System, tích hợp bảng dữ liệu phân trang và bộ lọc tìm kiếm đồng bộ URL."
type: IMPLEMENTATION
phase: 3c
status: completed
estimated_effort: M
complexity: medium
risk: low
depends_on: ["05"]
rule_refs: []
date: "2026-06-15"
changelog:
  - version: 1.1
    date: "2026-06-15"
    summary: Cập nhật yêu cầu ẩn URL mặc định, điều kiện nút xóa bộ lọc (UI-005, UI-006, UI-007) và chuyển trạng thái về completed.
  - version: 1.0
    date: "2026-06-14"
    summary: Khởi tạo task FE S1 Page & Components.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-14-customer-management-implementation-tasks.md](../2026-06-14-customer-management-implementation-tasks.md)
- **Applicable Workflows**: (None)
- **Applicable Skills**: `bks-fe-implement-feature`, `bks-fe-list-url-state`, `bks-fe-ds-sdk-consumer`

---

# Task 07: Screen S1 (Customer List) Page & Components

## Description
Task này tập trung triển khai mã nguồn React/Next.js cho giao diện trang Danh sách khách hàng (S1), bao gồm bảng dữ liệu bệnh nhân hiển thị Mã BN, họ tên, số điện thoại, ngày sinh/tuổi, trạng thái hoạt động; bộ lọc thanh công cụ và logic điều khiển phân trang.

## Requirements

### 1. Customers Toolbar Component (NEW & MODIFY)
Xây dựng component bộ lọc phía trên bảng:
- Ô nhập tìm kiếm (Search Input) lọc theo Tên hoặc Số điện thoại. Sử dụng cơ chế debounce 300ms (**UI-001**).
- Dropdown lọc theo Giới tính (Tất cả, Nam, Nữ, Khác).
- Dropdown lọc theo Trạng thái khách hàng (Tất cả, Active, Inactive).
- Nút "Xóa bộ lọc": Trở về trạng thái mặc định (page=1, per_page=10, search="", status=Tất cả, gender=Tất cả). Nút này bị disabled nếu bộ lọc đang ở trạng thái mặc định.
- Nút "Thêm khách hàng": Căn phải, điều hướng sang màn hình hoặc mở Modal thêm mới.

### 2. Customers Table Component (NEW & MODIFY)
Xây dựng bảng hiển thị danh sách:
- Cột hiển thị:
  - Mã BN: Chữ in đậm, có liên kết đến trang chi tiết S4.
  - Họ tên: Hiển thị kèm Avatar thu nhỏ.
  - Số điện thoại chính.
  - Giới tính (hiển thị nhãn dịch từ localization key).
  - Ngày sinh / Tuổi (Hiển thị song song, ví dụ: `1995-10-12 (31 tuổi)`).
  - Trạng thái: Badge màu sắc (Active = Xanh lá, Inactive = Xám).
  - Hành động (Actions): Nút/Icon Xem (Chi tiết), Sửa, Xóa (Soft delete).
- Trạng thái Loading: Hiển thị bộ xương (Skeleton) bảng trong khi dữ liệu đang tải.
- Trạng thái Trống: Render hình ảnh minh họa hoặc text thông báo khi danh sách rỗng.

### 3. Page Integration & URL state (MODIFY)
Cập nhật `frontend/app/(main)/customers/page.tsx`:
- Import và tích hợp `useCustomers` hook.
- Liên kết các tham số bộ lọc và phân trang với URL search params sử dụng chuẩn Next.js App Router và next-intl i18n.
- Tích hợp logic nút "Xóa bộ lọc": Chỉ enabled khi `search !== ""`, `gender !== "all"`, hoặc `status !== "all"` (**UI-005**).
- Tích hợp logic ẩn các tham số mặc định trên URL: Không hiển thị `page=1`, `per_page=10`, `search=""`, `gender="all"`, `status="all"` trên URL query string (**UI-006**).
- Tích hợp nút "Thêm khách hàng" kích hoạt Modal `CustomerFormModal` chế độ Tạo mới (Create Mode) thay vì điều hướng trang (**UI-007**).

---

## Status
- [x] Xây dựng component thanh công cụ bộ lọc `CustomersToolbar`.
- [x] Xây dựng bảng hiển thị dữ liệu `CustomersTable` kèm cột Mã BN, Họ tên, Tuổi, Trạng thái.
- [x] Tích hợp giao diện và URL sync state trong `frontend/app/(main)/customers/page.tsx` theo yêu cầu UI-005, UI-006, UI-007.
- [x] Cấu hình localization đầy đủ các nhãn bằng `next-intl`.
- [x] Chạy lệnh `pnpm lint` (Frontend) kiểm tra code style.
- [x] Chạy lệnh `pnpm test:unit` để kiểm tra render component.

---

## Acceptance Criteria
1. Bảng danh sách hiển thị đúng và đủ thông tin bệnh nhân trả về từ API.
2. Bộ lọc tìm kiếm có debounce hoạt động, khi gõ từ khóa tự động cập nhật URL và danh sách.
3. Thay đổi per_page (số bản ghi mỗi trang) tự động reset page về 1.
4. Trạng thái Loading hiển thị Skeleton chứ không hiển thị vòng xoay spinner trống trải.
5. Nút "Xóa bộ lọc" bị disabled ở trạng thái mặc định, chỉ enabled khi bộ lọc có sự thay đổi (search, gender, status). Thay đổi page/per_page không làm thay đổi trạng thái nút này.
6. URL sạch gọn, không hiển thị các tham số mặc định (`page=1`, `per_page=10`, v.v.) trên thanh địa chỉ.
7. Click nút "Thêm khách hàng" kích hoạt chính xác Modal Tạo mới tại trang danh sách.
