---
task_id: "09"
title: "3c — Screen S4 (Customer Detail) Page & Components"
description: "Xây dựng trang Chi tiết khách hàng (S4) với bố cục 2 cột: Cột trái hiển thị thông tin cá nhân, Cột phải hiển thị các Tab Lịch sử khám, Liệu trình, Hóa đơn công nợ."
type: IMPLEMENTATION
phase: 3c
status: completed
estimated_effort: M
complexity: medium
risk: low
depends_on: ["03"]
rule_refs: []
date: "2026-06-14"
changelog:
  - version: 1.0
    date: "2026-06-14"
    summary: Khởi tạo task FE S4 Detail Page.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-14-customer-management-implementation-tasks.md](../2026-06-14-customer-management-implementation-tasks.md)
- **Applicable Workflows**: (None)
- **Applicable Skills**: `bks-fe-implement-feature`, `bks-fe-ds-sdk-consumer`

---

# Task 09: Screen S4 (Customer Detail) Page & Components

## Description
Task này tập trung thiết kế và triển khai trang Chi tiết bệnh nhân (S4) sử dụng Next.js 16. Giao diện được thiết kế dạng 2 cột trực quan giúp bác sĩ dễ dàng vừa xem thông tin cá nhân khách hàng vừa tra cứu nhanh hồ sơ khám bệnh, liệu trình điều trị và tình trạng công nợ liên quan.

## Requirements

### 1. Overall Layout (2 Columns Layout)
Thiết kế trang `/customers/[id]/page.tsx`:
- **Header**:
  - Tiêu đề: "Chi tiết khách hàng".
  - Nút "Chỉnh sửa": Căn phải, click điều hướng sang trang Sửa thông tin S3 (truyền ID bệnh nhân).
- **Cột trái (Thông tin cá nhân)**:
  - Hiển thị Avatar kích thước lớn, Mã BN, Họ tên, Giới tính, Ngày sinh (Tuổi), Số điện thoại chính, Số điện thoại phụ.
  - Địa chỉ đầy đủ, nguồn khách hàng, trạng thái (badge).
- **Cột phải (Tabs thông tin)**:
  - Tab 1: **Lịch sử khám** (`visits`) - Hiển thị danh sách các lần khám.
  - Tab 2: **Liệu trình** (`treatment-plans`) - Hiển thị danh sách liệu trình điều trị.
  - Tab 3: **Hóa đơn công nợ** (`invoices`) - Hiển thị danh sách hóa đơn và khoản nợ chưa thanh toán.
- **Footer / Bottom Action**:
  - Nút "Quay lại": Điều hướng trở về trang danh sách S1.

### 2. Tab Navigation & Lazy Loading
- Tích hợp Component Tabs từ Design System.
- Sử dụng React Query để fetch dữ liệu song song hoặc lazy load dữ liệu tab khi người dùng chuyển tab.
- Mỗi tab hiển thị skeleton loader riêng khi dữ liệu đang tải.

---

## Status
- [x] Thiết kế layout 2 cột cho trang chi tiết bệnh nhân.
- [x] Xây dựng card thông tin cá nhân bên cột trái `CustomerDetailCard`.
- [x] Tích hợp component Tabs và danh sách hồ sơ y tế bên cột phải.
- [x] Triển khai nút "Chỉnh sửa" điều hướng đến trang sửa.
- [x] Triển khai nút "Quay lại" điều hướng về danh sách.
- [x] Chạy lệnh `pnpm lint` (Frontend) kiểm tra và sửa lỗi.
- [x] Chạy lệnh `pnpm test:unit` để kiểm tra trang chi tiết.

---

## Acceptance Criteria
1. Trang chi tiết nạp chính xác thông tin bệnh nhân tương ứng với ID trên URL.
2. Nút chỉnh sửa dẫn đúng sang `/customers/[id]/edit`.
3. Bố cục 2 cột hiển thị cân đối trên màn hình Desktop, tự động chuyển thành 1 cột dọc (responsive) trên Mobile.
4. Chuyển đổi giữa các Tab mượt mà, hiển thị đúng dữ liệu liên quan.
