---
task_id: "02"
title: "Appointment APIs"
description: "Xây dựng các API endpoints cho quản lý lịch hẹn bao gồm danh sách, chi tiết, tạo mới, cập nhật và xóa."
type: IMPLEMENTATION
phase: 2
status: completed
estimated_effort: M
complexity: medium
risk: medium
depends_on: ["01"]
rule_refs: ["PROPOSED_BR:appointment-no-double-booking", "PROPOSED_BR:appointment-status-transition", "PROPOSED_BR:appointment-customer-active-only"]
date: "2026-06-12"
changelog:
  - version: 1.0
    date: "2026-06-12"
    summary: Khởi tạo đặc tả task API.
---

# Context
- **Requirement**: [03-appointment-management.md](../../requirements/03-appointment-management.md)
- **Parent Task**: [2026-06-12-appointment-management-implementation-tasks.md](../2026-06-12-appointment-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-api-task`
- **Applicable Skills**: `bks-be-api-standard`

---

# Task 02: Appointment APIs

## Description
Phát triển lớp Controller, Service, DTO, Request và Resource cho lịch hẹn. Đảm bảo logic kiểm tra trùng lịch (slot 30 phút) và kiểm tra chuyển đổi trạng thái hợp lệ được xử lý an toàn tại tầng Service.

## Requirements

### 1. DTOs (NEW)
- `app/DTOs/Api/Appointment/CreateAppointmentData.php`: Chứa dữ liệu tạo lịch hẹn.
- `app/DTOs/Api/Appointment/UpdateAppointmentData.php`: Chứa dữ liệu cập nhật lịch hẹn.

### 2. FormRequest `AppointmentRequest` (NEW)
- File: `app/Http/Requests/Appointment/AppointmentRequest.php`
- Chứa các validation rule chi tiết:
  - Kiểm tra định dạng `appointment_date` (Y-m-d) và `appointment_time` (H:i).
  - Kiểm tra `customer_id` bắt buộc và phải có trạng thái `ACTIVE` (BR-APPT-002).
  - Kiểm tra định dạng giờ hẹn khớp với slot 30 phút (ví dụ: phút phải là `00` hoặc `30`).

### 3. Service `AppointmentService` (NEW)
- File: `app/Services/Api/AppointmentService.php`
- Đăng ký getter method trong `ApiFactory` (không tạo factory mới).
- Các phương thức chính:
  - `list(array $filters): LengthAwarePaginator`: Lọc theo ngày (`appointment_date`), trạng thái (`status`), từ khóa khách hàng (tên/sđt).
  - `create(CreateAppointmentData $dto): Appointment`:
    - Sử dụng `lockForUpdate()` trên bảng `appointments` cho cùng slot `appointment_at` để thực hiện kiểm tra trùng lịch (BR-APPT-001).
    - Ném Exception/ValidationException nếu slot đã bị giữ bởi lịch hẹn đang hoạt động (`BOOKED`, `CONFIRMED`, `CHECKED_IN`).
  - `update(Appointment $appointment, UpdateAppointmentData $dto): Appointment`:
    - Kiểm tra ma trận chuyển trạng thái hợp lệ nếu trạng thái thay đổi (BR-APPT-003).
    - Nếu đổi thời gian hẹn, kiểm tra trùng lịch slot mới (BR-APPT-001) dùng `lockForUpdate()`.
  - `delete(Appointment $appointment): void`: Thực hiện soft delete.

### 4. JsonResource `AppointmentResource` (NEW)
- File: `app/Http/Resources/Appointment/AppointmentResource.php`
- Trả về thông tin lịch hẹn đầy đủ kèm thông tin khách hàng (`customer`), và thông tin enum trạng thái (cả integer `value` và chuỗi `label` đã bản địa hóa).

### 5. Controller `AppointmentController` (NEW)
- File: `app/Http/Controllers/Api/AppointmentController.php`
- Chứa các endpoints CRUD:
  - `GET /api/v1/appointments` $\rightarrow$ `index` (Lọc và trả danh sách phân trang hoặc toàn bộ lịch trong khoảng ngày chọn).
  - `POST /api/v1/appointments` $\rightarrow$ `store` (Tạo lịch hẹn mới).
  - `GET /api/v1/appointments/{id}` $\rightarrow$ `show` (Chi tiết lịch hẹn).
  - `PUT /api/v1/appointments/{id}` $\rightarrow$ `update` (Cập nhật hoặc chuyển trạng thái lịch hẹn).
  - `DELETE /api/v1/appointments/{id}` $\rightarrow$ `destroy` (Xóa lịch hẹn).
- *Lưu ý*: Controller chỉ đóng vai trò nhận request, map DTO, gọi Service và trả Resource (Không viết logic nghiệp vụ trong Controller).

### 6. Cập nhật API Tạo Visit (MODIFY)
- Khi lưu một Visit mới, nếu `appointment_id` được truyền lên:
  - Tạo liên kết `Visit` và `Appointment`.
  - Tự động gọi `AppointmentService` chuyển trạng thái Appointment đó sang `COMPLETED` (BR-APPT-004).

---

## API Endpoints Summary

| Method | URI | Description | Input Parameters | Output Response | Auth |
|---|---|---|---|---|---|
| `GET` | `/api/v1/appointments` | Lấy danh sách lịch hẹn | `date`, `status`, `search` | JSON Array | Authenticated (`api`) |
| `POST` | `/api/v1/appointments` | Đặt lịch hẹn mới | `customer_id`, `appointment_date`, `appointment_time`, `note` | JSON Object | Authenticated (`api`) |
| `GET` | `/api/v1/appointments/{id}` | Lấy chi tiết một lịch hẹn | — | JSON Object | Authenticated (`api`) |
| `PUT` | `/api/v1/appointments/{id}` | Cập nhật thông tin/trạng thái | `appointment_date`, `appointment_time`, `status`, `note` | JSON Object | Authenticated (`api`) |
| `DELETE` | `/api/v1/appointments/{id}` | Xóa lịch hẹn (Soft Delete) | — | `{ "success": true }` | Authenticated (`api`) |

---

## Status
- [x] Tạo các file DTO
- [x] Tạo FormRequest `AppointmentRequest` và định nghĩa các rules validation
- [x] Tạo `AppointmentService` xử lý logic kiểm tra trùng lịch và chuyển đổi trạng thái
- [x] Tạo `AppointmentResource` trả dữ liệu đầy đủ (bao gồm enum value và label)
- [x] Tạo `AppointmentController` và đăng ký các route trong `routes/api.php`
- [x] Cập nhật API Tạo Visit để tự động chuyển trạng thái lịch hẹn sang `COMPLETED`
- [x] Run `php artisan code:format`
- [x] Run `php .agents/scripts/validate-backend.php backend`
- [x] Run `php artisan test`

---

## Acceptance Criteria
1. Các endpoint hoạt động bình thường, trả về đúng định dạng HTTP Status (200 OK, 201 Created, 204 No Content, 422 Unprocessable Entity).
2. Khi đặt lịch hẹn trùng khung giờ (slot 30 phút), API trả lỗi 422 `appointments.errors.double_booking`.
3. Khi đổi trạng thái từ trạng thái cuối (`COMPLETED`, `CANCELLED`, `NO_SHOW`), API trả lỗi 422 `appointments.errors.invalid_status_transition`.
4. Việc xóa lịch hẹn thực hiện Soft Delete thành công (bản ghi vẫn nằm trong database nhưng có giá trị `deleted_at`).
