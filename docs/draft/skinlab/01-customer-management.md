# Quản lý khách hàng

Tính năng quản lý thông tin khách hàng/bệnh nhân tại phòng khám da liễu.

---

## 1. Yêu cầu nghiệp vụ

Bác sĩ cần quản lý danh sách bệnh nhân đến khám để theo dõi lịch sử bệnh án và các giao dịch tài chính.

### 1.1. Thêm mới khách hàng
Khi có khách hàng mới, hệ thống cho phép tạo hồ sơ với các thông tin:
- Họ và tên (bắt buộc)
- Số điện thoại (bắt buộc, phải là duy nhất)
- Ngày sinh (không bắt buộc)
- Giới tính (Nam/Nữ/Khác)
- Địa chỉ (không bắt buộc)
- Nguồn khách (dạng Enum được định nghĩa sẵn để chuẩn hóa dữ liệu báo cáo: Facebook, Người quen giới thiệu, Google, TikTok, Khác)
- Trạng thái hoạt động (ACTIVE / INACTIVE): Khi tạo mới mặc định là ACTIVE. Nếu chuyển sang INACTIVE, khách hàng sẽ không xuất hiện khi chọn đặt lịch hẹn mới.

### 1.2. Danh sách khách hàng
- Hiển thị danh sách khách hàng dưới dạng bảng có phân trang.
- Cho phép tìm kiếm nhanh theo Họ tên hoặc Số điện thoại.
- Cho phép lọc danh sách theo Giới tính, Nguồn khách, và Trạng thái.

### 1.3. Xem chi tiết khách hàng
Khi chọn một khách hàng, bác sĩ có thể xem:
- Thông tin hành chính của khách hàng.
- Lịch sử các lần khám (Visits).
- Lịch sử các liệu trình đang và đã thực hiện (Treatment Plans).
- Lịch sử các hóa đơn và trạng thái thanh toán (Invoices & Payments).
- Công nợ hiện tại của khách hàng (được tính động thời gian thực bằng tổng số tiền còn thiếu `outstanding_amount` của tất cả hóa đơn chưa hoàn tất thanh toán).
