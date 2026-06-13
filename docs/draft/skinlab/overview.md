# Draft Tổng Quan Dự Án: Dermatology Clinic OS

Tài liệu nháp này mô tả bức tranh tổng thể của hệ thống quản lý phòng khám da liễu dành cho một bác sĩ vận hành độc lập.

---

# 1. Mục Tiêu & Phạm Vi Dự Án (Project Goal & Scope)

## Mục tiêu chính

Xây dựng một hệ thống quản lý phòng khám da liễu tập trung vào việc giảm thiểu tối đa các công việc hành chính và theo dõi thủ công của bác sĩ.

Hệ thống hỗ trợ toàn bộ vòng đời khách hàng:

* Tiếp nhận khách hàng
* Đặt lịch khám
* Khám và lưu hồ sơ
* Tư vấn dịch vụ
* Quản lý liệu trình điều trị
* Kê đơn thuốc
* Thanh toán
* Theo dõi sau điều trị
* Nhắc tái khám

Mục tiêu cuối cùng:

* Giảm thời gian nhập liệu
* Chuẩn hóa quy trình khám chữa bệnh
* Theo dõi lịch sử điều trị đầy đủ
* Quản lý doanh thu và công nợ
* Tăng tỷ lệ khách quay lại tái khám

---

## Đối tượng sử dụng

### Primary User

Bác sĩ da liễu (chủ phòng khám)

Là người trực tiếp:

* Quản lý khách hàng
* Đặt lịch
* Khám bệnh
* Kê đơn
* Quản lý điều trị
* Thu tiền
* Chăm sóc khách hàng

### Secondary User (Future)

* Lễ tân
* Điều dưỡng
* Kế toán
* Quản lý phòng khám

Hiện tại chưa nằm trong phạm vi MVP.

---

## Phạm vi triển khai

### Giai đoạn MVP

Web Application

* Responsive Desktop
* Responsive Mobile Browser

### Giai đoạn mở rộng

* Progressive Web App (PWA)
* Mobile App (iOS / Android)
* Tích hợp Zalo OA
* Tích hợp SMS
* Tích hợp cổng thanh toán
* Tích hợp AI hỗ trợ khám và soạn hồ sơ

---

# 2. Nhóm Người Dùng & Phân Quyền (User Roles & Permissions)

## Admin

Toàn quyền hệ thống

Chức năng:

* Quản lý tài khoản
* Quản lý phân quyền
* Xem toàn bộ dữ liệu
* Cấu hình hệ thống
* Xem báo cáo tổng hợp

---

## Doctor

Người sử dụng chính

Chức năng:

* Quản lý khách hàng
* Đặt lịch hẹn
* Tạo hồ sơ khám
* Tạo liệu trình
* Kê đơn thuốc
* Thu tiền
* Theo dõi điều trị
* Thực hiện follow-up

Không được:

* Quản lý tài khoản hệ thống
* Cấu hình bảo mật

---

## Receptionist (Future)

Chức năng:

* Tạo khách hàng
* Đặt lịch
* Check-in khách

Không được:

* Chỉnh sửa hồ sơ điều trị
* Kê đơn thuốc
* Xem báo cáo tài chính

---

# 3. Bản Đồ Module & Tính Năng Dự Kiến (Functional Modules)

## Module 1: Authentication & User Management

* Đăng nhập
* Đăng xuất
* Đổi mật khẩu
* Quản lý tài khoản
* Phân quyền

---

## Module 2: Customer Management

Quản lý hồ sơ khách hàng

Thông tin:

* Họ tên
* Số điện thoại
* Ngày sinh
* Giới tính
* Địa chỉ
* Nguồn khách

Chức năng:

* Tìm kiếm khách hàng
* Xem lịch sử khám
* Xem lịch sử thanh toán
* Xem công nợ

---

## Module 3: Appointment Management

Quản lý lịch hẹn

Chức năng:

* Tạo lịch hẹn
* Cập nhật lịch hẹn
* Hủy lịch hẹn
* Đổi lịch hẹn
* Check-in khách

Trạng thái:

* BOOKED
* CONFIRMED
* CHECKED_IN
* COMPLETED
* CANCELLED
* NO_SHOW

---

## Module 4: Visit Management

Quản lý từng lần khám

Thông tin:

* Triệu chứng
* Chẩn đoán
* Hình ảnh
* Ghi chú bác sĩ

Chức năng:

* Tạo hồ sơ khám
* Upload ảnh trước/sau
* Theo dõi tiến triển

---

## Module 5: Treatment Plan Management

Quản lý liệu trình điều trị

Thông tin:

* Tên liệu trình
* Giá bán
* Tổng số buổi
* Số buổi đã sử dụng
* Số buổi còn lại

Chức năng:

* Tạo liệu trình
* Theo dõi tiến độ
* Kết thúc liệu trình

Ví dụ:

* Trị mụn
* Trị nám
* Trẻ hóa da

---

## Module 6: Service Management

Quản lý dịch vụ lẻ

Ví dụ:

* Peel
* Laser
* Mesotherapy
* Botox

Chức năng:

* Bán dịch vụ lẻ
* Thực hiện dịch vụ
* Theo dõi lịch sử sử dụng

---

## Module 7: Prescription Management

Quản lý đơn thuốc

Chức năng:

* Kê đơn thuốc
* Tạo thư viện thuốc mẫu
* In đơn thuốc PDF

Thông tin:

* Tên thuốc
* Liều dùng
* Hướng dẫn sử dụng
* Thời gian điều trị

---

## Module 8: Billing & Payment Management

Quản lý tài chính

Bao gồm:

### Invoice

Theo dõi số tiền phải thanh toán

### Payment

Theo dõi các lần thanh toán

Hỗ trợ:

* Khách lẻ
* Khách liệu trình
* Đặt cọc
* Trả góp
* Công nợ
* Hoàn tiền

---

## Module 9: Follow-up Management

Quản lý chăm sóc khách hàng

Chức năng:

* Tạo lịch follow-up
* Nhắc tái khám
* Nhắc chăm sóc sau điều trị
* Quản lý khách hàng cần liên hệ

---

## Module 10: Dashboard & Reporting

Bao gồm:

* Lịch hẹn hôm nay
* Khách đang điều trị
* Công nợ
* Doanh thu ngày
* Doanh thu tháng
* Tỷ lệ tái khám

---

# 4. Dữ Liệu Cốt Lõi (Core Entity & Domain Model)

## User

Thông tin:

* id
* username
* password_hash
* role
* status

---

## Customer

Thông tin:

* full_name
* phone
* date_of_birth
* gender
* address
* lead_source

Quan hệ:

* Has Many Appointments
* Has Many Visits
* Has Many Treatment Plans
* Has Many Invoices

---

## Appointment

Thông tin:

* appointment_date
* appointment_time
* status
* note

Quan hệ:

* Belongs To Customer

---

## Visit

Thông tin:

* visit_date
* symptoms
* diagnosis
* doctor_note

Quan hệ:

* Belongs To Customer
* Has Many Photos
* Has Many Prescriptions

---

## VisitPhoto

Thông tin:

* image_url
* photo_type
* captured_at

Quan hệ:

* Belongs To Visit

---

## TreatmentPlan

Thông tin:

* name
* total_sessions
* completed_sessions
* price
* status

Quan hệ:

* Belongs To Customer

---

## TreatmentSession

Thông tin:

* session_no
* treatment_date
* note

Quan hệ:

* Belongs To TreatmentPlan

---

## ServiceOrder

Thông tin:

* service_name
* quantity
* price
* status

Quan hệ:

* Belongs To Customer

---

## Prescription

Thông tin:

* prescribed_date
* note

Quan hệ:

* Belongs To Visit

---

## PrescriptionItem

Thông tin:

* medication_name
* dosage
* instruction
* duration

Quan hệ:

* Belongs To Prescription

---

## Invoice

Thông tin:

* invoice_no
* total_amount
* paid_amount
* outstanding_amount
* status

Quan hệ:

* Belongs To Customer

---

## Payment

Thông tin:

* payment_date
* amount
* payment_method

Quan hệ:

* Belongs To Invoice

---

## FollowUp

Thông tin:

* followup_date
* followup_type
* status
* note

Quan hệ:

* Belongs To Customer

---

# 5. Quy Tắc Nghiệp Vụ Cấp Hệ Thống (Global Business Rules)

## Auth & Security

[PROPOSED_BR:user_active_only]

Chỉ tài khoản ACTIVE mới được đăng nhập.

---

[PROPOSED_BR:password_policy]

Mật khẩu tối thiểu 8 ký tự.

---

## Customer

[PROPOSED_BR:customer_phone_unique]

Số điện thoại khách hàng phải duy nhất.

---

## Appointment

[PROPOSED_BR:no_double_booking]

Một khung giờ chỉ được có tối đa một lịch hẹn đang hoạt động.

---

[PROPOSED_BR:appointment_to_visit]

Khi khách CHECK_IN, hệ thống cho phép tạo Visit tương ứng.

---

## Visit

[PROPOSED_BR:visit_immutable_after_finalized]

Visit đã hoàn tất chỉ được chỉnh sửa bởi Admin.

---

## Treatment

[PROPOSED_BR:treatment_session_limit]

Không được tạo số buổi điều trị vượt quá tổng số buổi của liệu trình.

---

[PROPOSED_BR:treatment_plan_independent]

Mỗi liệu trình được quản lý độc lập với các liệu trình khác của cùng khách hàng.

---

## Service

[PROPOSED_BR:service_independent_from_treatment]

Dịch vụ lẻ không làm thay đổi dữ liệu liệu trình hiện có.

---

## Billing

[PROPOSED_BR:invoice_auto_number]

Mã hóa đơn được sinh tự động.

Định dạng:

INV-YYYYMMDD-XXXX

---

[PROPOSED_BR:payment_not_exceed_invoice]

Tổng thanh toán không được vượt quá giá trị hóa đơn.

---

[PROPOSED_BR:invoice_outstanding_calculation]

Outstanding Amount = Total Amount - Paid Amount

---

[PROPOSED_BR:invoice_soft_delete]

Không được xóa hóa đơn đã phát sinh thanh toán.

---

## Treatment & Billing

[PROPOSED_BR:treatment_and_finance_separated]

Liệu trình và công nợ là hai đối tượng độc lập.

Tiến độ điều trị không phụ thuộc vào trạng thái thanh toán.

---

## Audit

[PROPOSED_BR:audit_log_all]

Toàn bộ thao tác CRUD trên Customer, Visit, TreatmentPlan, Invoice và Payment phải được ghi Audit Log.

---

## Follow-up

[PROPOSED_BR:followup_reminder]

Hệ thống phải hiển thị danh sách khách hàng cần follow-up theo ngày.

---

## Data Integrity

[PROPOSED_BR:soft_delete_master_data]

Các dữ liệu cốt lõi sử dụng Soft Delete để đảm bảo không ảnh hưởng lịch sử điều trị và tài chính.
