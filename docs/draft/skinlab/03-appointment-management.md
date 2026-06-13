# Quản lý lịch hẹn

Tính năng quản lý lịch hẹn (Appointment) của khách hàng/bệnh nhân tại phòng khám da liễu.

---

## 1. Yêu cầu nghiệp vụ

Bác sĩ cần quản lý lịch hẹn của khách hàng để chủ động sắp xếp thời gian khám, tránh bị trùng lịch và chuẩn bị hồ sơ trước khi khách đến.

### 1.1. Tạo lịch hẹn mới
Khi khách hàng có nhu cầu hẹn khám, hệ thống cho phép tạo lịch hẹn mới với các thông tin:
- Khách hàng (bắt buộc, chọn từ danh sách khách hàng có trạng thái `ACTIVE`).
- Ngày hẹn (bắt buộc, định dạng YYYY-MM-DD).
- Giờ hẹn (bắt buộc, định dạng HH:MM).
- Ghi chú (không bắt buộc, ghi nhận yêu cầu đặc biệt của khách hàng hoặc lý do khám).
- Trạng thái ban đầu mặc định là `BOOKED` hoặc `CONFIRMED`.

### 1.2. Danh sách lịch hẹn
- Hiển thị danh sách lịch hẹn dưới dạng lịch (Calendar) hoặc dạng danh sách (List) có phân trang.
- Cho phép tìm kiếm nhanh theo Họ tên hoặc Số điện thoại của khách hàng.
- Cho phép lọc danh sách lịch hẹn theo Ngày hẹn, Khung giờ và Trạng thái.
- Cho phép xem nhanh danh sách các lịch hẹn trong ngày hôm nay tại Dashboard để chuẩn bị tiếp đón.

### 1.3. Cập nhật và Hủy lịch hẹn
Bác sĩ hoặc lễ tân (trong tương lai) có thể cập nhật các thông tin của lịch hẹn:
- Cập nhật thời gian hẹn (Ngày/Giờ) khi khách muốn đổi lịch.
- Cập nhật trạng thái lịch hẹn theo vòng đời:
  - `BOOKED`: Khách mới đặt lịch hẹn qua hệ thống/kênh online.
  - `CONFIRMED`: Bác sĩ/phòng khám đã xác nhận lịch hẹn với khách hàng.
  - `CHECKED_IN`: Khách hàng đã đến phòng khám và đang chờ khám.
  - `COMPLETED`: Khách hàng đã hoàn thành buổi khám/điều trị của lịch hẹn đó.
  - `CANCELLED`: Khách hàng yêu cầu hủy lịch hoặc phòng khám hủy lịch hẹn.
  - `NO_SHOW`: Khách hàng không đến mà không báo trước sau một khoảng thời gian quy định.
- Khi trạng thái lịch hẹn chuyển sang `CHECKED_IN`, hệ thống sẽ hỗ trợ hoặc tự động cho phép tạo một hồ sơ khám (Visit) tương ứng cho khách hàng đó.

---

## 2. Quy tắc nghiệp vụ liên quan

- **Không đặt trùng lịch (No Double Booking)**: Một khung giờ cụ thể chỉ được phép có tối đa một lịch hẹn ở trạng thái hoạt động (`BOOKED`, `CONFIRMED`, `CHECKED_IN`). Các lịch hẹn có trạng thái `CANCELLED`, `COMPLETED` hoặc `NO_SHOW` sẽ không bị tính là trùng lịch.
- **Tính toàn vẹn dữ liệu (Soft Delete)**: Lịch hẹn sử dụng cơ chế Soft Delete để không làm mất dữ liệu thống kê tỷ lệ đến hẹn và lịch sử tương tác của khách hàng.
- **Ràng buộc trạng thái khách hàng**: Chỉ cho phép đặt lịch hẹn cho khách hàng có trạng thái `ACTIVE`. Khách hàng ở trạng thái `INACTIVE` sẽ không hiển thị trong danh sách lựa chọn tạo lịch hẹn.
