## Cập nhật yêu cầu nghiệp vụ

### Giá trị mặc định

Khi người dùng truy cập màn hình Danh sách khách hàng:

* Page mặc định = 1
* Per Page mặc định = 10

Hệ thống tự động tải dữ liệu với:

```text
page = 1
per_page = 10
```

---

### Thêm khách hàng

#### Nút chức năng

Label:

```text
Thêm khách hàng
```

#### Hành động

Khi người dùng nhấn nút "Thêm khách hàng":

* Điều hướng đến màn hình Form thông tin khách hàng / bệnh nhân.
* Mở ở chế độ Tạo mới.

#### Vị trí hiển thị

* Hiển thị phía trên bên phải của màn hình danh sách.
* Cùng khu vực với bộ lọc tìm kiếm.

---

## Cập nhật Thiết kế UI

### Header Action

[Search Input]

[Dropdown Giới tính]

[Dropdown Trạng thái khách hàng]

[Button Xóa bộ lọc]

[Button Thêm khách hàng]

### Trạng thái mặc định

| Thuộc tính            | Giá trị  |
| --------------------- | -------- |
| Page                  | 1        |
| Per Page              | 10       |
| Search                | Rỗng     |
| Giới tính             | Tất cả   |
| Trạng thái khách hàng | Tất cả   |
| Xóa bộ lọc            | Disabled |

---

## Cập nhật Pagination

### Giá trị mặc định

| Thuộc tính | Giá trị |
| ---------- | ------- |
| Page       | 1       |
| Per Page   | 10      |

### Quy tắc tải dữ liệu

Khi mở màn hình:

* Hệ thống gọi API lấy danh sách khách hàng với:

  * page = 1
  * per_page = 10

Khi thay đổi Per Page:

* Reset Page về 1.
* Gọi lại API với giá trị Per Page mới.

Ví dụ:

* page = 1
* per_page = 20

---

## Cập nhật Validation

### Nút Thêm khách hàng

* Luôn hiển thị trên màn hình.
* Luôn ở trạng thái Active.
* Điều hướng thành công đến màn hình Tạo mới khách hàng khi được nhấn.

### Giá trị mặc định

Khi tải màn hình lần đầu:

* Page phải bằng 1.
* Per Page phải bằng 10.
* Danh sách dữ liệu được tải theo các giá trị mặc định này.
