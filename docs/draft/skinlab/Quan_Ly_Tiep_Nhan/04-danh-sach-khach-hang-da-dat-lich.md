# Danh sách khách hàng đã đặt lịch trước

## 1. Mô tả

Quản lý khách hàng đã đăng ký khám theo lịch hẹn.

---

## 2. Bộ lọc

Cho phép tìm kiếm theo:

- Mã đăng ký khám.
- Mã khách hàng.
- Tên khách hàng.
- Số điện thoại.
- Khoảng thời gian ngày khám.
- Trạng thái lịch hẹn.

---

## 3. Danh sách dữ liệu

Hiển thị bảng gồm:

| Mã đăng ký khám | Mã khách hàng | Tên khách hàng | Ngày khám | Phòng khám | Dịch vụ khám | Số điện thoại | Trạng thái lịch hẹn | Ngày tạo lịch | Hành động |

---

## 4. Hành động

### Tiếp nhận khám

Điều kiện:

- Lịch hẹn còn hiệu lực.

Kết quả:

- Hệ thống cấp số thứ tự khám.
- Chuyển trạng thái thành Đã tiếp nhận.
- Dữ liệu xuất hiện trong Danh sách khám.

### Huỷ lịch hẹn

Điều kiện:

- Lịch hẹn chưa được tiếp nhận.

Kết quả:

- Chuyển trạng thái thành Đã huỷ.
- Lưu lịch sử thao tác.

### Xem chi tiết

Hiển thị:

- Thông tin phiếu đăng ký khám.
- Thông tin khách hàng.
- Lịch sử thao tác.

---

## 5. Trạng thái lịch hẹn

- Chờ tiếp nhận.
- Đã tiếp nhận.
- Đã huỷ.
- Quá hẹn.