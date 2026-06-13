---
task_id: "09"
title: "System Documentation Update"
description: "Cập nhật tài liệu thiết kế hệ thống, đăng ký các Business Rules chính thức vào registry và cập nhật logic index."
type: DOCUMENTATION
phase: 4
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: ["08"]
rule_refs: []
date: "2026-06-12"
changelog:
  - version: 1.0
    date: "2026-06-12"
    summary: Khởi tạo đặc tả task cập nhật tài liệu.
---

# Context
- **Requirement**: [03-appointment-management.md](../../requirements/03-appointment-management.md)
- **Parent Task**: [2026-06-12-appointment-management-implementation-tasks.md](../2026-06-12-appointment-management-implementation-tasks.md)
- **Applicable Skills**: `bks-doc-logic-standard`

---

# Task 09: System Documentation Update

## Description
Cập nhật tài liệu kỹ thuật của dự án để đảm bảo tính đồng bộ và khả năng hiểu code của các Agent/Developer tiếp theo. Đăng ký chính thức các mã `PROPOSED_BR` thành `BR-APPT-*` trong registry toàn hệ thống.

## Requirements

### 1. Đăng ký Business Rules (MODIFY)
- File: `docs/system/br-registry.md`
- Đăng ký các rules mới vào bảng Registry:
  - `BR-APPT-001` (Không đặt trùng lịch - No Double Booking)
  - `BR-APPT-002` (Giới hạn Khách hàng Active)
  - `BR-APPT-003` (Vòng đời chuyển trạng thái hợp lệ)
  - `BR-APPT-004` (Tự động chuyển Completed khi khởi tạo Visit)
  - `BR-APPT-005` (Lưu lịch sử xóa lịch hẹn - Soft Delete)

### 2. Thay thế `PROPOSED_BR` trong code & docs (MODIFY)
- Tìm và thay thế tất cả các tham chiếu `PROPOSED_BR:*` trong tài liệu đặc tả `docs/requirements/03-appointment-management.md` và các file task liên quan thành mã `BR-APPT-XXX` tương ứng đã đăng ký.

### 3. Tạo tài liệu Logic Module Lịch hẹn (NEW)
- File: `docs/logic/appointment/appointment-management.md`
- Viết tài liệu lưu trữ logic vận hành (System Intelligence) theo chuẩn `bks-doc-logic-standard` (bao gồm YAML frontmatter, các mô tả thiết kế Service, Controller, ma trận trạng thái, và cách kiểm thử).
- Đăng ký tài liệu này vào `docs/logic/index.md`.

---

## Status
- [ ] Đăng ký các Business Rules chính thức vào `docs/system/br-registry.md`
- [ ] Chuyển các tham chiếu `PROPOSED_BR` thành `BR-*` trong đặc tả yêu cầu và các task
- [ ] Tạo tài liệu logic tại `docs/logic/appointment/appointment-management.md`
- [ ] Cập nhật liên kết vào `docs/logic/index.md`

---

## Acceptance Criteria
1. File `docs/system/br-registry.md` chứa thông tin đăng ký chính xác của các mã `BR-APPT-001` đến `BR-APPT-005`.
2. Không còn bất kỳ từ khóa `PROPOSED_BR` nào trong các file đặc tả yêu cầu và task của module 3.
3. Tài liệu logic được viết đúng chuẩn, rõ ràng, giúp ích cho việc đọc hiểu nghiệp vụ hệ thống.
