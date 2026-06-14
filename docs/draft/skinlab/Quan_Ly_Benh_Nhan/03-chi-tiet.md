## Cập nhật Thiết kế UI

### Header

Hiển thị:

* Tiêu đề: Chi tiết khách hàng
* Button: Chỉnh sửa

### Button Chỉnh sửa

Label:

```text
Chỉnh sửa
```

#### Hành động

Khi người dùng nhấn nút "Chỉnh sửa":

* Điều hướng đến màn hình Chỉnh sửa khách hàng.
* Truyền ID khách hàng hiện tại.
* Màn hình mở ở chế độ Chỉnh sửa.

#### Vị trí hiển thị

* Góc trên bên phải của màn hình.
* Cùng hàng với tiêu đề màn hình.

---

### Layout tổng thể

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Chi tiết khách hàng                                 [Chỉnh sửa]          │
├───────────────────────┬───────────────────────────────────────────────────┤
│                       │                                                   │
│                       │ [Lịch sử khám] [Liệu trình] [Hóa đơn công nợ]     │
│                       │                                                   │
│  Thông tin khách hàng │                                                   │
│                       │                Nội dung Tab                       │
│                       │                                                   │
│                       │                                                   │
├───────────────────────┴───────────────────────────────────────────────────┤
│                              [Quay lại]                                   │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Cập nhật yêu cầu nghiệp vụ

### Chỉnh sửa khách hàng

Người dùng có thể thực hiện chỉnh sửa thông tin khách hàng từ màn hình Chi tiết khách hàng.

#### Điều kiện

* Khách hàng tồn tại trong hệ thống.

#### Hành động

* Nhấn button "Chỉnh sửa".
* Hệ thống điều hướng đến màn hình Form thông tin khách hàng.
* Dữ liệu hiện tại được tải sẵn lên form.

---

## Cập nhật Validation

### Button Chỉnh sửa

* Luôn hiển thị trên màn hình.
* Luôn ở trạng thái Active.
* Chỉ điều hướng khi tồn tại thông tin khách hàng hợp lệ.
