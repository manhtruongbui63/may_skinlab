# Appointment Module Business Rules Index

Tài liệu này tổng hợp danh sách các Quy tắc Nghiệp vụ (Business Rules - BR) và luồng xử lý liên quan đến module Quản lý Lịch hẹn (Appointment Management).

## Danh sách Business Rules

| Mã BR | Tên quy tắc | Trạng thái | Mô tả chi tiết |
|---|---|---|---|
| [BR-APPT-001](../system/br-registry.md) | Double-booking Check | Hoạt động | Mỗi slot 30 phút chỉ được phép có một lịch hẹn đang hoạt động (status: BOOKED, CONFIRMED, CHECKED_IN). |
| [BR-APPT-002](../system/br-registry.md) | Active Customer Validation | Hoạt động | Chỉ cho phép tạo lịch hẹn đối với khách hàng đang ở trạng thái ACTIVE. |
| [BR-APPT-003](../system/br-registry.md) | State Machine Transitions | Hoạt động | Chuyển đổi trạng thái của lịch hẹn phải tuân thủ ma trận chuyển đổi hợp lệ. |
| [BR-APPT-004](../system/br-registry.md) | Auto Complete on Visit Creation | Hoạt động | Khi một Visit được tạo thành công gắn với lịch hẹn, trạng thái lịch hẹn tự động chuyển sang COMPLETED. |
| [BR-APPT-005](../system/br-registry.md) | Soft Delete Preservation | Hoạt động | Lịch hẹn khi xóa chỉ được phép soft-delete để lưu lại lịch sử cho hệ thống. |
| [BR-G002](../system/br-registry.md) | Activity Logging | Hoạt động | Ghi log hoạt động khi tạo hoặc cập nhật lịch hẹn. |

## Tài liệu chi tiết

- [Appointment Management CRUD Logic](appointment-management.md) — Chi tiết luồng nghiệp vụ, kiểm tra ràng buộc thời gian, cấu hình RBAC, và các case đặc biệt.
