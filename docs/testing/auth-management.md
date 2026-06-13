# Báo cáo Test: Authentication Management

## 1. Thông tin chung
- **Ngày test**: 2026-05-28
- **Môi trường**: Local / Testing

## 2. Chi tiết kết quả chạy test

### `tests/Feature/Api/Auth/UserRegisterTest.php` (Đăng ký người dùng)

#### Test Case 1: `test_user_can_register_successfully`
- **Nội dung test**: Đăng ký tài khoản thành công với thông tin hợp lệ, kiểm tra xem mật khẩu có được hash không, trạng thái có là ACTIVE không, email có được tự động chuyển thành chữ thường không, và hành động có được ghi log hoạt động (Activity Log) đầy đủ mà không lưu thông tin nhạy cảm.
- **Kết quả**: `pass`

#### Test Case 2: `test_register_fails_when_required_fields_are_missing`
- **Nội dung test**: Đăng ký thất bại khi thiếu các trường bắt buộc (`name`, `email`, `password`) và trả về lỗi validation 422.
- **Kết quả**: `pass`

#### Test Case 3: `test_register_fails_when_input_formats_are_invalid`
- **Nội dung test**: Đăng ký thất bại khi định dạng email không hợp lệ (không đúng format email) và trả về lỗi validation 422 cho trường email.
- **Kết quả**: `pass`

#### Test Case 4: `test_register_fails_when_password_does_not_meet_complexity`
- **Nội dung test**: Đăng ký thất bại khi mật khẩu không đáp ứng độ phức tạp tối thiểu (ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số, 1 ký tự đặc biệt, độ dài từ 6 đến 32 ký tự).
- **Kết quả**: `pass`

#### Test Case 5: `test_register_fails_when_password_is_not_confirmed`
- **Nội dung test**: Đăng ký thất bại khi mật khẩu xác nhận không khớp mật khẩu chính và trả về lỗi validation 422.
- **Kết quả**: `pass`

#### Test Case 6: `test_register_fails_when_fields_exceed_max_lengths`
- **Nội dung test**: Đăng ký thất bại khi các trường name hoặc email vượt quá độ dài tối đa được định nghĩa trong cấu hình hệ thống (50 ký tự cho name, 255 ký tự cho email).
- **Kết quả**: `fail` (Đã khắc phục thành `pass`)
- **Nguyên nhân**: Payload của test case tính toán độ dài email không chính xác (`$maxEmail - 9`), dẫn đến độ dài email chính xác bằng 255 ký tự (vẫn hợp lệ theo cấu hình) thay vì lớn hơn 255 ký tự (256 ký tự). Do đó, API trả về thành công/lỗi không đúng mong đợi của assertion validation lỗi email.
- **Các bước giải quyết**:
  1. Chỉnh sửa payload trong file `UserRegisterTest.php` để thiết lập độ dài email vượt quá giới hạn bằng cách thay đổi `$maxEmail - 9` thành `$maxEmail - 8`. Khi cộng thêm chuỗi `@test.com` (9 ký tự), tổng chiều dài email sẽ là 256 ký tự (vượt qua giới hạn 255).
  2. Chạy lại test và xác nhận validation lỗi email được trả về chính xác.

#### Test Case 7: `test_register_fails_when_email_already_exists`
- **Nội dung test**: Đăng ký thất bại khi email đã tồn tại trong hệ thống (kiểm tra không phân biệt chữ hoa chữ thường) và trả về lỗi validation 422 thay vì gây ra lỗi Integrity Constraint 500 của cơ sở dữ liệu.
- **Kết quả**: `fail` (Đã khắc phục thành `pass`)
- **Nguyên nhân**: Khi thực hiện validation bằng rule `unique:users,email`, SQLite kiểm tra phân biệt chữ hoa chữ thường nên cho phép email `'EXISTING@example.com'` đi qua (không trùng với `'existing@example.com'`). Sau đó, trong `AuthService`, email được convert thành chữ thường (`Str::lower($dto->email)`) thành `'existing@example.com'` và cố gắng insert vào DB, gây ra lỗi `SQLSTATE[23000]: Integrity constraint violation: 19 UNIQUE constraint failed: users.email` (lỗi 500).
- **Các bước giải quyết**:
  1. Cập nhật `RegisterRequest.php` bổ sung phương thức `prepareForValidation()` để chuẩn hóa email về dạng chữ thường trước khi chạy qua các rule validation:
     ```php
     protected function prepareForValidation(): void
     {
         if ($this->has('email')) {
             $this->merge([
                 'email' => strtolower($this->input('email')),
             ]);
         }
     }
     ```
  2. Việc chuẩn hóa này đảm bảo rằng email được gửi lên luôn ở dạng chữ thường và việc check unique thông qua rule validation `unique:users,email` sẽ chặn được tất cả các trường hợp trùng lặp kể cả khi người dùng nhập chữ hoa chữ thường khác nhau, tránh được lỗi crash database 500.

### `tests/Feature/Api/Auth/UserLoginTest.php` (Đăng nhập người dùng)

#### Test Case 1: `test_user_can_login_successfully`
- **Nội dung test**: Đăng nhập tài khoản thành công với thông tin hợp lệ (kiểm tra không phân biệt chữ hoa chữ thường của email) và trả về token truy cập cùng kiểu token hợp lệ.
- **Kết quả**: `pass`

#### Test Case 2: `test_login_fails_when_required_fields_are_missing`
- **Nội dung test**: Đăng nhập thất bại khi thiếu các trường bắt buộc (`email`, `password`) và trả về lỗi validation 422.
- **Kết quả**: `pass`

#### Test Case 3: `test_login_fails_when_email_format_is_invalid`
- **Nội dung test**: Đăng nhập thất bại khi định dạng email không hợp lệ và trả về lỗi validation 422 cho trường email.
- **Kết quả**: `pass`

#### Test Case 4: `test_login_fails_when_fields_exceed_max_lengths`
- **Nội dung test**: Đăng nhập thất bại khi email vượt quá 255 ký tự hoặc mật khẩu vượt quá 32 ký tự, trả về lỗi validation 422.
- **Kết quả**: `pass`

#### Test Case 5: `test_login_fails_with_wrong_credentials`
- **Nội dung test**: Đăng nhập thất bại khi nhập sai email hoặc mật khẩu, trả về lỗi unauthorized 401.
- **Kết quả**: `pass`

#### Test Case 6: `test_login_rate_limiting_lockout`
- **Nội dung test**: Đăng nhập thất bại quá 5 lần liên tiếp sẽ kích hoạt tính năng chặn truy cập (Throttling/Rate Limiter) và trả về lỗi Bad Request 400 cùng thông điệp giới hạn thời gian.
- **Kết quả**: `pass`

### `tests/Feature/Api/Auth/UserLogoutTest.php` (Đăng xuất người dùng)

#### Test Case 1: `test_user_can_logout_successfully`
- **Nội dung test**: Đăng xuất tài khoản thành công khi gửi request có kèm token hợp lệ, kiểm tra xem access token hiện tại có bị xóa khỏi database không và trả về trạng thái thành công 200.
- **Kết quả**: `pass`

#### Test Case 2: `test_guest_cannot_logout`
- **Nội dung test**: Khách (chưa đăng nhập) cố gắng gọi api logout sẽ bị từ chối truy cập và trả về mã lỗi unauthorized 401.
- **Kết quả**: `pass`

### `tests/Feature/Api/Auth/UserMeTest.php` (Thông tin người dùng hiện tại)

#### Test Case 1: `test_user_can_retrieve_profile_successfully`
- **Nội dung test**: Người dùng đã đăng nhập có thể lấy thông tin chi tiết tài khoản thành công với cấu trúc tài nguyên `MeResource` chuẩn (gồm `id`, `name`, `email`, `status`, `roles`, `permissions`).
- **Kết quả**: `pass`

#### Test Case 2: `test_guest_cannot_retrieve_profile`
- **Nội dung test**: Khách (chưa đăng nhập) cố gắng gọi api lấy thông tin tài khoản sẽ bị trả về mã lỗi unauthorized 401.
- **Kết quả**: `pass`

### `tests/Feature/Api/Auth/UserUpdateProfileTest.php` (Cập nhật hồ sơ người dùng)

#### Test Case 1: `test_user_can_update_profile_successfully`
- **Nội dung test**: Người dùng có trạng thái `ACTIVE` cập nhật hồ sơ với tên (`name`) hợp lệ sẽ thành công, cơ sở dữ liệu được cập nhật đúng và trả về số bản ghi thay đổi.
- **Kết quả**: `pass`

#### Test Case 2: `test_update_profile_fails_when_name_is_missing`
- **Nội dung test**: Cập nhật thất bại và trả về lỗi validation 422 khi thiếu trường `name`.
- **Kết quả**: `pass`

#### Test Case 3: `test_update_profile_fails_when_name_is_not_string`
- **Nội dung test**: Cập nhật thất bại và trả về lỗi validation 422 khi trường `name` gửi lên không phải là chuỗi (ví dụ: là mảng).
- **Kết quả**: `pass`

#### Test Case 4: `test_update_profile_fails_when_name_exceeds_max_length`
- **Nội dung test**: Cập nhật thất bại và trả về lỗi validation 422 khi `name` vượt quá độ dài tối đa (51 ký tự - lớn hơn giới hạn 50 ký tự trong cấu hình hệ thống).
- **Kết quả**: `pass`

#### Test Case 5: `test_update_profile_fails_when_user_is_inactive`
- **Nội dung test**: Người dùng có trạng thái `INACTIVE` cố gắng cập nhật profile sẽ bị từ chối bằng mã lỗi Bad Request 400 cùng thông điệp lỗi logic tương ứng.
- **Kết quả**: `pass`

#### Test Case 6: `test_guest_cannot_update_profile`
- **Nội dung test**: Khách (chưa đăng nhập) cố gắng cập nhật profile sẽ bị từ chối và trả về mã lỗi unauthorized 401.
- **Kết quả**: `pass`

### `tests/Feature/Api/Auth/UserChangePasswordTest.php` (Đổi mật khẩu người dùng)

#### Test Case 1: `test_user_can_change_password_successfully`
- **Nội dung test**: Đổi mật khẩu thành công khi nhập đúng mật khẩu hiện tại và mật khẩu mới thỏa mãn yêu cầu độ phức tạp. Hệ thống mã hóa mật khẩu mới và cập nhật thành công vào cơ sở dữ liệu.
- **Kết quả**: `pass`

#### Test Case 2: `test_change_password_fails_when_required_fields_are_missing`
- **Nội dung test**: Đổi mật khẩu thất bại và trả về lỗi validation 422 khi thiếu mật khẩu hiện tại hoặc mật khẩu mới.
- **Kết quả**: `pass`

#### Test Case 3: `test_change_password_fails_when_password_is_not_confirmed`
- **Nội dung test**: Đổi mật khẩu thất bại và trả về lỗi validation 422 khi mật khẩu mới và mật khẩu xác nhận không khớp nhau.
- **Kết quả**: `pass`

#### Test Case 4: `test_change_password_fails_when_new_password_does_not_meet_complexity`
- **Nội dung test**: Đổi mật khẩu thất bại và trả về lỗi validation 422 khi mật khẩu mới không đáp ứng đủ yêu cầu độ phức tạp (thiếu chữ hoa, chữ thường, chữ số, ký tự đặc biệt, hoặc độ dài dưới 6 hay trên 32 ký tự).
- **Kết quả**: `pass`

#### Test Case 5: `test_change_password_fails_when_current_password_is_wrong`
- **Nội dung test**: Đổi mật khẩu thất bại và trả về mã lỗi Bad Request 400 cùng thông điệp tương ứng khi mật khẩu hiện tại nhập không chính xác.
- **Kết quả**: `pass`

#### Test Case 6: `test_guest_cannot_change_password`
- **Nội dung test**: Khách (chưa đăng nhập) cố gắng gọi API đổi mật khẩu sẽ bị từ chối với mã lỗi unauthorized 401.
- **Kết quả**: `pass`



