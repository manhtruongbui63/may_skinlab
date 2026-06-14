# Quản lý khách hàng

Form thông tin khách hàng / bệnh nhân

---

## 1. Yêu cầu nghiệp vụ

### Mục đích

Form được sử dụng cho các chức năng:

* Tạo mới khách hàng / bệnh nhân.
* Chỉnh sửa thông tin khách hàng / bệnh nhân.

### Thông tin cá nhân

| Trường thông tin      | Bắt buộc     | Tạo mới                   | Chỉnh sửa |
| --------------------- | ------------ | ------------------------- | --------- |
| Mã BN                 | Có           | Read Only (Auto Generate) | Read Only |
| Họ tên                | Có           | Nhập                      | Chỉnh sửa |
| Giới tính             | Có           | Chọn                      | Chỉnh sửa |
| Năm sinh              | Có           | Nhập                      | Chỉnh sửa |
| Tuổi                  | Tự động tính | Read Only                 | Read Only |
| Trạng thái khách hàng | Có           | Chọn                      | Chỉnh sửa |
| Số điện thoại chính   | Có           | Nhập                      | Chỉnh sửa |
| Số điện thoại phụ     | Không        | Nhập                      | Chỉnh sửa |
| Số nhà                | Không        | Nhập                      | Chỉnh sửa |
| Tỉnh/Thành phố        | Không        | Chọn                      | Chỉnh sửa |
| Phường/Xã             | Không        | Chọn                      | Chỉnh sửa |
| Địa chỉ               | Không        | Nhập                      | Chỉnh sửa |
| Ảnh đại diện          | Không        | Upload                    | Cập nhật  |

### Quy tắc nghiệp vụ

#### Mã BN

* Là mã định danh duy nhất của bệnh nhân trong hệ thống.
* Được hệ thống tự động sinh.
* Không cho phép người dùng chỉnh sửa.
* Hiển thị ở trạng thái Read Only trên cả màn hình Tạo mới và Chỉnh sửa.
* Hệ thống đảm bảo không phát sinh trùng lặp.

##### Định dạng mã

Ví dụ:

* BN000001
* BN000002
* BN000003

##### Thời điểm sinh mã

* Hệ thống sinh mã khi người dùng thực hiện lưu thành công hồ sơ bệnh nhân.
* Hệ thống tự động đảm bảo tính duy nhất của mã.

#### Họ tên

* Không được để trống.

#### Giới tính

Bao gồm các giá trị:

* Nam
* Nữ
* Khác

#### Năm sinh

* Không được để trống.
* Phải là năm hợp lệ.
* Không lớn hơn năm hiện tại.

#### Tuổi

* Hệ thống tự động tính từ Năm sinh.
* Chỉ hiển thị để tham khảo.
* Không cho phép người dùng chỉnh sửa.
* Khi Năm sinh thay đổi, hệ thống tự động tính lại Tuổi.

#### Trạng thái khách hàng

* Là trường bắt buộc.
* Dữ liệu lấy từ Master Data.

Ví dụ:

* Tiềm năng
* Đang chăm sóc
* Đang điều trị
* Tạm ngưng
* Hoàn thành điều trị
* Không hoạt động

#### Số điện thoại chính

* Bắt buộc nhập.
* Kiểm tra đúng định dạng số điện thoại.

#### Số điện thoại phụ

* Không bắt buộc.
* Kiểm tra định dạng nếu có nhập.

#### Tỉnh/Thành phố

* Kiểu dữ liệu: Dropdown.
* Dữ liệu lấy từ Master Data.
* Hỗ trợ tìm kiếm.

#### Phường/Xã

* Kiểu dữ liệu: Dropdown.
* Dữ liệu lấy từ Master Data.
* Hỗ trợ tìm kiếm.
* Là danh sách phụ thuộc theo Tỉnh/Thành phố đã chọn.

#### Quy tắc phụ thuộc dữ liệu

* Người dùng chọn Tỉnh/Thành phố trước.
* Sau khi chọn Tỉnh/Thành phố, hệ thống chỉ hiển thị danh sách Phường/Xã thuộc Tỉnh/Thành phố đó.
* Khi thay đổi Tỉnh/Thành phố:

  * Hệ thống tự động xóa giá trị Phường/Xã đã chọn.
  * Người dùng phải chọn lại Phường/Xã phù hợp.

#### Địa chỉ

* Kiểu dữ liệu: Textarea.
* Cho phép người dùng nhập tự do.
* Hệ thống hỗ trợ tự động sinh địa chỉ từ:

  * Số nhà
  * Phường/Xã
  * Tỉnh/Thành phố

##### Quy tắc tự động sinh địa chỉ

Khi người dùng nhập hoặc thay đổi:

* Số nhà
* Phường/Xã
* Tỉnh/Thành phố

Hệ thống tự động tạo địa chỉ theo định dạng:

[Số nhà], [Phường/Xã], [Tỉnh/Thành phố]

##### Quy tắc chỉnh sửa thủ công

* Người dùng được phép chỉnh sửa trường Địa chỉ.
* Sau khi người dùng chỉnh sửa thủ công, hệ thống không tự động ghi đè dữ liệu.
* Người dùng có thể chủ động sử dụng chức năng:

  * Tạo lại địa chỉ
  * Hoặc biểu tượng lấy địa chỉ tự động

để cập nhật lại địa chỉ từ các trường thành phần.

---

## 2. Thiết kế UI

### Thông tin cá nhân

#### Hàng 1

* Mã BN (Read Only)
* Họ tên

#### Hàng 2

* Giới tính
* Năm sinh
* Tuổi (Read Only)

#### Hàng 3

* Trạng thái khách hàng

#### Hàng 4

* Số điện thoại chính
* Số điện thoại phụ

#### Hàng 5

* Số nhà
* Tỉnh/Thành phố (Dropdown)

#### Hàng 6

* Phường/Xã (Dropdown)

#### Hàng 7

* Địa chỉ (Textarea)
* Nút/biểu tượng: Tạo địa chỉ tự động

#### Hàng 8

* Ảnh đại diện

### Action

* Lưu
* Lưu và tạo mới (chỉ áp dụng với màn hình Tạo mới)
* Hủy

---

## 3. Validation

### Trường bắt buộc

* Họ tên
* Giới tính
* Năm sinh
* Trạng thái khách hàng
* Số điện thoại chính

### Kiểm tra dữ liệu

* Năm sinh phải hợp lệ.
* Số điện thoại đúng định dạng.
* Chỉ cho phép chọn giá trị tồn tại trong Master Data đối với:

  * Trạng thái khách hàng
  * Tỉnh/Thành phố
  * Phường/Xã

### Quy tắc dữ liệu phụ thuộc

* Khi thay đổi Tỉnh/Thành phố:

  * Reset giá trị Phường/Xã.
* Chỉ hiển thị Phường/Xã thuộc Tỉnh/Thành phố đã chọn.

### Giới hạn dữ liệu

* Địa chỉ tối đa 255 ký tự.
* Cho phép lưu địa chỉ nhập tay hoặc địa chỉ sinh tự động.

### Quyền chỉnh sửa

* Không cho phép chỉnh sửa:

  * Mã BN
  * Tuổi
