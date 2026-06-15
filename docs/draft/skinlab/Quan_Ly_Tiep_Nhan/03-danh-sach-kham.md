# Danh sách khám

## 1. Mô tả

Quản lý danh sách khách hàng đã được tiếp nhận.

---

## 2. Bộ lọc

### Khoảng thời gian

- Mặc định hiển thị dữ liệu trong ngày hiện tại.
- Sử dụng Date Range Picker.

### Quy tắc

Chỉ cho phép chọn khoảng thời gian trong cùng một tháng.

Ví dụ:

Hợp lệ:

- 01/05/2026 → 31/05/2026

Không hợp lệ:

- 28/04/2026 → 31/05/2026

Ngoài ra:

- Không cho phép chọn ngày trong tương lai.

---

## 3. Danh sách dữ liệu

Hiển thị bảng gồm:

| STT khám | Mã khách hàng | Mã đăng ký khám | Tên khách hàng | Thời gian đăng ký khám | Giới tính | Số điện thoại | Trạng thái khám | Hành động |

Trong đó:

- Thời gian đăng ký khám hiển thị theo định dạng DateTime.

---

## 4. Hành động

### Huỷ lịch khám

Điều kiện:

- Lịch khám chưa hoàn thành.

Kết quả:

- Chuyển trạng thái thành Đã huỷ.
- Không xoá dữ liệu lịch sử.

### Xoá lịch khám

Điều kiện:

- Theo phân quyền hệ thống.

Kết quả:

- Hiển thị popup xác nhận.
- Xoá dữ liệu sau khi xác nhận thành công.