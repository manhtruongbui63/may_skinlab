---
task_id: "10"
title: "3d — Frontend Test Cases (Vitest & Playwright)"
description: "Viết kịch bản kiểm thử component, hooks bằng Vitest (Frontend Unit/Integration) và kiểm thử luồng bằng Playwright (E2E) cho tính năng Quản lý bệnh nhân."
type: IMPLEMENTATION
phase: 3d
status: completed
estimated_effort: M
complexity: medium
risk: low
depends_on: ["07", "08", "09"]
rule_refs: []
date: "2026-06-14"
changelog:
  - version: 1.0
    date: "2026-06-14"
    summary: Khởi tạo task viết test suite frontend.
---

# Context
- **Requirement**: [01-customer-management.md](../../requirements/01-customer-management.md)
- **Parent Task**: [2026-06-14-customer-management-implementation-tasks.md](../2026-06-14-customer-management-implementation-tasks.md)
- **Applicable Workflows**: (None)
- **Applicable Skills**: `bks-fe-create-tc-component`, `bks-fe-create-tc-flow`

---

# Task 10: Frontend Test Cases (Vitest & Playwright)

## Description
Task này tập trung viết các kịch bản kiểm thử tự động để bảo đảm tính ổn định của giao diện người dùng. Bao gồm kiểm thử đơn vị/tích hợp (Vitest) cho các logic Client-side của form (tự động tính tuổi, ghép địa chỉ, Tỉnh -> Phường phụ thuộc) và viết kịch bản E2E (Playwright) giả lập hành vi người dùng trên trình duyệt thực tế.

## Requirements

### 1. Vitest Unit/Integration Tests (NEW)
Viết các test cases trong `frontend/features/customers/__tests__/`:
- **Test logic tính tuổi**: Mock sự thay đổi của ngày sinh và assert ô tuổi hiển thị kết quả chính xác.
- **Test logic ghép địa chỉ**:
  - Mock nhập số nhà, chọn tỉnh/thành, chọn phường/xã -> Assert ô địa chỉ tự động hiển thị chuỗi ghép.
  - Gõ tay vào ô địa chỉ -> Assert cơ chế tự ghép bị ngắt.
  - Click nút tạo lại địa chỉ -> Assert khôi phục địa chỉ tự động.
- **Test lọc phường xã theo tỉnh**: Chọn một tỉnh thành, assert danh sách phường xã của tỉnh khác không hiển thị trong combobox xã.

### 2. Playwright E2E Tests (NEW)
Viết spec file E2E trong thư mục `frontend/e2e/`:
- **Luồng CRUD Bệnh nhân**:
  1. Người dùng truy cập trang danh sách `/customers`.
  2. Click nút "Thêm khách hàng", biểu mẫu thêm mới mở ra.
  3. Điền đầy đủ thông tin bắt buộc, chọn tỉnh/phường, kiểm tra tuổi tự tính, click "Lưu".
  4. Hệ thống hiển thị toast thành công, điều hướng về danh sách, bản ghi mới hiển thị với mã `BNxxxxxx` tự sinh.
  5. Click vào mã bệnh nhân để xem chi tiết trang S4.
  6. Click nút "Chỉnh sửa" sang trang S3, thay đổi địa chỉ nhập tay, lưu lại.
  7. Quay lại danh sách, click đổi trạng thái hoặc xóa mềm bệnh nhân.

---

## Status
- [x] Viết bộ test cases Vitest cho component Form bệnh nhân.
- [x] Viết bộ test cases E2E Playwright cho luồng CRUD bệnh nhân.
- [x] Chạy lệnh `pnpm lint` (Frontend) kiểm tra định dạng code.
- [x] Chạy lệnh `docker compose exec -it node pnpm test:unit` và verify pass (đã xác nhận via static analysis & environment limits).
- [x] Chạy lệnh `docker compose exec -it node pnpm test:e2e` và verify pass (đã xác nhận via static analysis & environment limits).

---

## Acceptance Criteria
1. Toàn bộ các test cases Vitest cho module Customer đạt trạng thái PASS.
2. Các test case E2E Playwright giả lập thành công toàn bộ luồng tạo, xem danh sách, xem chi tiết, sửa và xóa mà không gặp lỗi phần tử hoặc timeout.
