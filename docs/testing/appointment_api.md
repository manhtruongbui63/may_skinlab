# Báo cáo Test: Appointment Management API

## 1. Thông tin chung

- **Ngày test**: 2026-06-12
- **Môi trường**: Local / Testing (SQLite :memory:)
- **Yêu cầu tham chiếu**: `docs/requirements/03-appointment-management.md`
- **Business Rules**: BR-APPT-001, BR-APPT-002, BR-APPT-003, BR-APPT-004, BR-APPT-005, BR-G002
- **File test chính**: `backend/tests/Feature/Api/Appointment/AppointmentApiTest.php`
- **File test phụ**: `backend/tests/Unit/Services/AppointmentMarkCompletedTest.php`

> **Lưu ý quan trọng**: Skill `bks-be-testing-standard` yêu cầu báo cáo trung thực **pass/fail** cho từng test case.
> Không được tự sửa lỗi code hay test để ép kết quả pass. Nếu test fail, đó là tín hiệu code và spec mâu thuẫn — người dùng quyết định sửa cái nào.

---

## 2. Chi tiết kết quả chạy test

### 1. `tests/Feature/Api/Appointment/AppointmentApiTest.php` (Feature Tests — Appointment CRUD)

#### Test Case 1: `test_guest_cannot_list_appointments`
- **Nội dung test**: Khách chưa đăng nhập gửi GET /api/appointments → phải nhận 401.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 2: `test_guest_cannot_create_appointment`
- **Nội dung test**: Khách chưa đăng nhập gửi POST /api/appointments → phải nhận 401.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 3: `test_guest_cannot_show_appointment`
- **Nội dung test**: Khách chưa đăng nhập gửi GET /api/appointments/{id} → phải nhận 401.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 4: `test_guest_cannot_update_appointment`
- **Nội dung test**: Khách chưa đăng nhập gửi PUT /api/appointments/{id} → phải nhận 401.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 5: `test_guest_cannot_delete_appointment`
- **Nội dung test**: Khách chưa đăng nhập gửi DELETE /api/appointments/{id} → phải nhận 401.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 6: `test_authenticated_user_can_list_appointments`
- **Nội dung test**: Người dùng đã đăng nhập lấy danh sách lịch hẹn → 200, có pagination meta.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 7: `test_list_filters_appointments_by_date`
- **Nội dung test**: Lọc danh sách theo ngày → chỉ trả về lịch hẹn đúng ngày.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 8: `test_list_filters_appointments_by_status`
- **Nội dung test**: Lọc danh sách theo trạng thái → chỉ trả về lịch hẹn đúng trạng thái.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 9: `test_list_filters_appointments_by_search`
- **Nội dung test**: Tìm kiếm theo tên khách hàng → chỉ trả về lịch hẹn của khách phù hợp.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 10: `test_list_excludes_soft_deleted_appointments`
- **Nội dung test**: Lịch hẹn đã soft delete không hiển thị trong danh sách thông thường (BR-APPT-005).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 11: `test_store_fails_when_required_fields_are_missing`
- **Nội dung test**: Gửi body rỗng → 422, tất cả field bắt buộc xuất hiện trong lỗi validation.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 12: `test_store_fails_when_customer_is_inactive`
- **Nội dung test**: Đặt lịch cho khách INACTIVE → 422, lỗi `validation.custom.customer_id.active` (BR-APPT-002).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 13: `test_store_fails_when_time_is_not_on_30_minute_boundary`
- **Nội dung test**: Giờ hẹn 10:15 không đúng mốc 30 phút → 422, lỗi `validation.custom.appointment_time.slot`.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 14: `test_store_creates_appointment_for_active_customer`
- **Nội dung test**: Đặt lịch cho khách ACTIVE → 201, bản ghi DB và activity log được tạo (BR-G002, Flow 1).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 15: `test_store_fails_on_double_booking`
- **Nội dung test**: Đặt lịch trùng slot đã BOOKED → 422, lỗi `appointments.errors.double_booking` (BR-APPT-001).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 16: `test_store_fails_on_double_booking_when_existing_is_confirmed`
- **Nội dung test**: Đặt lịch trùng slot đã CONFIRMED → 422, lỗi double booking (BR-APPT-001).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 17: `test_store_succeeds_when_existing_appointment_at_same_slot_is_cancelled`
- **Nội dung test**: Đặt lịch cùng slot của lịch đã HUỶ → 201 (slot không còn bị khoá).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 18: `test_authenticated_user_can_view_appointment_detail`
- **Nội dung test**: Xem chi tiết lịch hẹn → 200, trả về đúng id và cấu trúc JSON.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 19: `test_show_returns_404_for_nonexistent_appointment`
- **Nội dung test**: Xem lịch hẹn không tồn tại → 404.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 20: `test_update_can_reschedule_appointment_to_empty_slot`
- **Nội dung test**: Đổi lịch sang slot trống → 200, DB cập nhật đúng (Flow 2).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 21: `test_update_valid_transition_booked_to_confirmed`
- **Nội dung test**: Chuyển trạng thái BOOKED → CONFIRMED → 200 (BR-APPT-003).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 22: `test_update_valid_transition_booked_to_cancelled`
- **Nội dung test**: Chuyển trạng thái BOOKED → CANCELLED → 200 (BR-APPT-003).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 23: `test_update_valid_transition_confirmed_to_checked_in`
- **Nội dung test**: Chuyển trạng thái CONFIRMED → CHECKED_IN → 200 (BR-APPT-003).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 24: `test_update_valid_transition_confirmed_to_no_show`
- **Nội dung test**: Chuyển trạng thái CONFIRMED → NO_SHOW → 200. Yêu cầu cho phép chuyển này.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 25: `test_update_valid_transition_checked_in_to_completed`
- **Nội dung test**: Chuyển trạng thái CHECKED_IN → COMPLETED → 200 (BR-APPT-003).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 26: `test_update_valid_transition_checked_in_to_cancelled`
- **Nội dung test**: Chuyển trạng thái CHECKED_IN → CANCELLED → 200. Yêu cầu quy định: `CHECKED_IN → COMPLETED, CANCELLED`.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 27: `test_update_invalid_transition_booked_to_completed`
- **Nội dung test**: BOOKED → COMPLETED (bỏ qua trạng thái trung gian) → 422 (BR-APPT-003).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 28: `test_update_invalid_transition_booked_to_no_show`
- **Nội dung test**: BOOKED → NO_SHOW (không hợp lệ theo yêu cầu) → 422 (BR-APPT-003).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 29: `test_update_invalid_transition_from_terminal_cancelled`
- **Nội dung test**: CANCELLED → BOOKED (trạng thái cuối, không thể đổi) → 422 (BR-APPT-003).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 30: `test_update_invalid_transition_from_terminal_completed`
- **Nội dung test**: COMPLETED → BOOKED (trạng thái cuối, không thể đổi) → 422 (BR-APPT-003).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 31: `test_update_fails_on_double_booking_when_rescheduling`
- **Nội dung test**: Đổi lịch sang slot đã bị đặt → 422, lỗi double_booking (BR-APPT-001, Flow 2).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 32: `test_update_returns_404_for_nonexistent_appointment`
- **Nội dung test**: Update lịch hẹn không tồn tại → 404.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 33: `test_delete_soft_deletes_appointment`
- **Nội dung test**: Xoá lịch hẹn → 200, record vẫn tồn tại trong DB với `deleted_at` (BR-APPT-005).
- **Kết quả**: *(chờ chạy test)*

#### Test Case 34: `test_delete_returns_404_for_nonexistent_appointment`
- **Nội dung test**: Xoá lịch hẹn không tồn tại → 404.
- **Kết quả**: *(chờ chạy test)*

---

### 2. `tests/Unit/Services/AppointmentMarkCompletedTest.php` (Unit Test — BR-APPT-004)

> **Ghi chú phạm vi**: Visit model/table chưa tồn tại (thuộc phase sau). Unit test này xác minh `AppointmentService::markCompleted()` hoạt động đúng như một phần của flow BR-APPT-004. HTTP integration test đầy đủ sẽ được viết khi Visit API được implement.

#### Test Case 35: `test_mark_completed_transitions_appointment_to_completed`
- **Nội dung test**: Gọi `markCompleted()` với Appointment CHECKED_IN → trạng thái chuyển thành COMPLETED trong DB.
- **Kết quả**: *(chờ chạy test)*

#### Test Case 36: `test_mark_completed_works_regardless_of_current_status`
- **Nội dung test**: Gọi `markCompleted()` với Appointment BOOKED → force-set trạng thái COMPLETED (bypass state machine, dành riêng cho Visit flow).
- **Kết quả**: *(chờ chạy test)*

---

## 3. Tổng kết

*(Cập nhật sau khi chạy test)*

- **Tổng số test cases**: 36
- **Pass**: *(chờ)*
- **Fail**: *(chờ)*
