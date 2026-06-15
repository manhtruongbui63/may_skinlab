# Đăng ký khám

## 1. Mô tả

Cho phép tạo mới phiếu đăng ký khám.

---

## 2. Thông tin phiếu đăng ký khám

Bao gồm:

- Mã đăng ký khám.
- Hình thức đăng ký.
- Ngày khám.
- Ưu tiên (Có/Không).
- Phòng khám.
- Dịch vụ khám.
- Gói khám.
- Lý do khám.

---

## 3. Hình thức đăng ký

### 3.1 Chờ khám
- Mã đăng ký khám được auto generate và không được sửa
- Không hiển thị trường ngày khám.
- Khách hàng được tiếp nhận theo quy trình khám trong ngày.
- Ngày khám lấy luôn thời điểm tạo
- Thứ tự khám được auto generate và không được sửa
- Chọn phòng khám và chọn dịch vụ là yêu cầu bắt buộc

### 3.2 Đặt lịch

- Hiển thị trường ngày khám.
- Bắt buộc nhập ngày khám.

---

## 4. Quy tắc ngày khám

Cho phép:

- Chọn ngày trong tương lai.

Không cho phép:

- Ngày hiện tại.
- Ngày quá khứ.

Ví dụ:

Nếu hôm nay là 15/05/2026:

Hợp lệ:

- 16/05/2026.
- 17/05/2026.

Không hợp lệ:

- 15/05/2026.
- 14/05/2026.

---

## 5. Kết quả

Sau khi lưu:

- Sinh mã đăng ký khám.
- Lưu phiếu đăng ký khám.