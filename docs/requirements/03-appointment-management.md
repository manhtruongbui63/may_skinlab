---
title: Đặc tả yêu cầu Module 3: Quản lý lịch hẹn (Appointment Management)
description: Đặc tả yêu cầu chi tiết về tính năng đặt lịch, vòng đời lịch hẹn, quy tắc chống trùng lịch và luồng tạo hồ sơ khám (Visit) liên kết.
status: pending_implementation
date: 2026-06-12
version: 1.0
changelog:
  - version: 1.0
    date: 2026-06-12
    summary: Khởi tạo tài liệu đặc tả yêu cầu cho Quản lý lịch hẹn.
---

## 2. OVERVIEW

Hệ thống quản lý lịch hẹn (Appointment Management) giúp bác sĩ (hoặc lễ tân trong tương lai) tại phòng khám da liễu có thể chủ động sắp xếp và tối ưu hóa thời gian làm việc. Module này bao gồm việc đặt lịch hẹn cho khách hàng hoạt động (Active), theo dõi trạng thái lịch hẹn qua từng giai đoạn, ngăn chặn việc đặt lịch chồng chéo (Double Booking), và hỗ trợ bắt đầu hồ sơ khám nhanh chóng khi khách đến phòng khám (Checked-In).

---

## 3. CONTEXT

- **Modules**: Customer Management (Module 2), Visit Management (Module 4).
- **Features**: Quản lý lịch hẹn (Đặt lịch, Xem lịch dạng Calendar & Danh sách, Chuyển trạng thái, Hủy/Đổi lịch, Khởi tạo Lần khám).
- **Guards**: `api` (Bác sĩ / Nhân viên phòng khám sử dụng Token).
- **Third-parties**: Không có (ở giai đoạn MVP này).

---

## 4. OUT OF SCOPE

- Gửi tin nhắn SMS hoặc Zalo nhắc hẹn tự động (Sẽ triển khai ở giai đoạn mở rộng).
- Phân chia lịch làm việc của nhiều bác sĩ (MVP phục vụ phòng khám của một bác sĩ độc lập).
- Đồng bộ hóa lịch hẹn với Google Calendar hoặc ứng dụng ngoài.

---

## 5. BUSINESS RULES

| BR | Rule | Referenced in | Enforced in (BE) | Enforced in (FE) |
|---|---|---|---|---|
| BR-APPT-001 | **Không đặt trùng lịch (No Double Booking)**: Một khung giờ (slot 30 phút) chỉ được phép có tối đa một lịch hẹn ở trạng thái hoạt động (`BOOKED`, `CONFIRMED`, `CHECKED_IN`). | Flow 1, Flow 2 | Validation rule trong `AppointmentRequest` kèm theo `lockForUpdate()` | Trực quan hóa khung giờ bị trùng trên Calendar, chặn gửi form |
| BR-APPT-002 | **Giới hạn Khách hàng Active**: Chỉ được phép tạo lịch hẹn cho khách hàng có trạng thái `ACTIVE`. | Flow 1 | Validation rule `exists:customers,id,status,1` | Lọc danh sách khách hàng trong dropdown chỉ hiển thị khách hàng Active |
| BR-APPT-003 | **Vòng đời chuyển trạng thái hợp lệ**: Trạng thái lịch hẹn phải tuân thủ ma trận chuyển đổi hợp lệ. Không được phép quay lại trạng thái trước hoặc chuyển đổi từ các trạng thái cuối (`COMPLETED`, `CANCELLED`, `NO_SHOW`). | Flow 2 | `AppointmentService` / State Validation | Vô hiệu hóa hoặc ẩn các nút chuyển trạng thái không hợp lệ trong UI |
| BR-APPT-004 | **Tự động chuyển Completed khi khởi tạo Visit**: Khi một Visit được tạo và liên kết với Appointment thành công, Appointment đó sẽ tự động chuyển sang trạng thái `COMPLETED`. | Flow 3 | `VisitService` (trong quá trình store Visit) | Tự động cập nhật UI sau khi lưu Visit thành công |
| BR-APPT-005 | **Lưu lịch sử xóa lịch hẹn (Soft Delete)**: Khi xóa lịch hẹn, dữ liệu chỉ bị ẩn đi (Soft Delete) để đảm bảo toàn vẹn dữ liệu báo cáo tỷ lệ đến hẹn. | Flow 4 | Sử dụng Trait `SoftDeletes` trên Model `Appointment` | Lọc các lịch hẹn chưa xóa trong danh sách hiển thị thông thường |

---

## 6. REQUIREMENT ANALYSIS

### Quy tắc chia Slot thời gian:
- Mỗi slot hẹn mặc định là **30 phút** (Ví dụ: 08:00, 08:30, 09:00...).
- Khi người dùng chọn thời gian hẹn, hệ thống sẽ kiểm tra xem giờ hẹn có nằm đúng vào các mốc 30 phút hay không (hoặc tự động làm tròn về mốc 30 phút gần nhất).
- Một slot được coi là bị trùng nếu đã tồn tại một lịch hẹn hoạt động có `appointment_at` trùng khớp hoàn toàn (cùng ngày và cùng giờ slot).

### Ma trận chuyển đổi trạng thái (State Transition Matrix):
- Trạng thái bắt đầu: `BOOKED` hoặc `CONFIRMED`.
- Ma trận:
  - `BOOKED` $\rightarrow$ `CONFIRMED`, `CANCELLED`
  - `CONFIRMED` $\rightarrow$ `CHECKED_IN`, `CANCELLED`, `NO_SHOW`
  - `CHECKED_IN` $\rightarrow$ `COMPLETED`, `CANCELLED`
  - `COMPLETED`, `CANCELLED`, `NO_SHOW` $\rightarrow$ Trạng thái cuối (Terminal), không thể thay đổi thêm.

---

## 7. DATA MODEL UPDATES

### Bảng mới: `appointments`

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | bigint unsigned | No | Auto increment | Primary key |
| `customer_id` | bigint unsigned | No | | Foreign key liên kết với bảng `customers.id` |
| `appointment_at` | datetime | No | | Thời điểm hẹn (UTC ở DB, hiển thị local) |
| `appointment_date` | date | No | | Phục vụ index để filter nhanh theo ngày |
| `status` | tinyInteger | No | `1` | Trạng thái (Enum: 1=BOOKED, 2=CONFIRMED, 3=CHECKED_IN, 4=COMPLETED, 5=CANCELLED, 6=NO_SHOW) |
| `note` | text | Yes | NULL | Ghi chú thêm từ khách hàng/bác sĩ |
| `created_at` | timestamp | Yes | NULL | |
| `updated_at` | timestamp | Yes | NULL | |
| `deleted_at` | timestamp | Yes | NULL | Hỗ trợ Soft Delete |

**Indexes**:
- `appointments_appointment_date_status_index` (`appointment_date`, `status`)
- `appointments_customer_id_index` (`customer_id`)

---

### Enum: `AppointmentStatusEnum`

| Value (int) | Name | Description | Localization Key |
|---|---|---|---|
| 1 | BOOKED | Đã đặt lịch (chờ xác nhận) | `enums.appointment_status.booked` |
| 2 | CONFIRMED | Đã xác nhận lịch hẹn | `enums.appointment_status.confirmed` |
| 3 | CHECKED_IN | Đã đến phòng khám (chờ khám) | `enums.appointment_status.checked_in` |
| 4 | COMPLETED | Đã hoàn thành cuộc khám | `enums.appointment_status.completed` |
| 5 | CANCELLED | Đã hủy lịch hẹn | `enums.appointment_status.cancelled` |
| 6 | NO_SHOW | Không đến hẹn | `enums.appointment_status.no_show` |

**Transitions:**
- Xem chi tiết tại phần **6. REQUIREMENT ANALYSIS**.

---

### Cập nhật bảng hiện có: `visits` [MODIFY]
- Thêm cột: `appointment_id` (bigint unsigned, nullable, Foreign key liên kết `appointments.id`).
- Khi tạo Visit từ một Appointment, cột này sẽ lưu ID của lịch hẹn đó để thiết lập quan hệ 1-1 hoặc N-1.

---

## 8. PROCESSING FLOWS

### Flow 1: Đặt lịch hẹn mới (Tạo mới)
1. Bác sĩ chọn khách hàng, chọn ngày và giờ hẹn, điền ghi chú. (BR-APPT-002)
2. Hệ thống kiểm tra trùng lịch trong slot 30 phút. (BR-APPT-001)
3. Nếu trùng, hệ thống trả về lỗi validation 422.
4. Nếu không trùng, hệ thống tạo bản ghi `Appointment` mới.
   **State Changes:**
   - `appointments.customer_id` = `{customer_id}`
   - `appointments.appointment_at` = `{appointment_at}`
   - `appointments.status` = `1` (BOOKED) hoặc `2` (CONFIRMED)
   - `appointments.note` = `{note}`

**Concurrency Handling**:
- Sử dụng Database Transaction kết hợp `lockForUpdate()` trên các bản ghi lịch hẹn có cùng `appointment_at` để tránh race condition khi hai người dùng cùng đặt một khung giờ cùng lúc.

**Acceptance Criteria (Happy Path)**:
- Lịch hẹn được tạo thành công và hiển thị trên giao diện Calendar.
- Trả về status 201 kèm thông tin chi tiết lịch hẹn.

**Error Cases**:
| Error Condition | System Behavior | State Changes |
|---|---|---|
| Khung giờ đã bị đặt trước bởi lịch hẹn active khác | Trả về lỗi 422 `appointments.errors.double_booking` | Không thay đổi |
| Khách hàng ở trạng thái INACTIVE | Trả về lỗi 422 `appointments.errors.customer_inactive` | Không thay đổi |
| Giờ hẹn không đúng mốc 30 phút | Tự động làm tròn hoặc trả về lỗi validation 422 | Không thay đổi |

---

### Flow 2: Cập nhật trạng thái / Đổi lịch hẹn
1. Bác sĩ chọn lịch hẹn và thay đổi ngày/giờ hoặc trạng thái của lịch hẹn.
2. Nếu đổi ngày/giờ, hệ thống kiểm tra trùng lịch slot mới. (BR-APPT-001)
3. Hệ thống kiểm tra tính hợp lệ của việc chuyển trạng thái. (BR-APPT-003)
4. Cập nhật bản ghi `Appointment`.
   **State Changes:**
   - `appointments.appointment_at` = `{appointment_at_new}` (nếu đổi lịch)
   - `appointments.status` = `{status_new}`

**Acceptance Criteria (Happy Path)**:
- Cập nhật thông tin lịch hẹn thành công, hiển thị chính xác trạng thái mới trên giao diện.

**Error Cases**:
| Error Condition | System Behavior | State Changes |
|---|---|---|
| Chuyển trạng thái từ terminal state (`COMPLETED`...) sang trạng thái khác | Trả về lỗi 422 `appointments.errors.invalid_status_transition` | Không thay đổi |
| Đổi giờ hẹn sang một slot đã bị trùng | Trả về lỗi 422 `appointments.errors.double_booking` | Không thay đổi |

---

### Flow 3: Khởi tạo hồ sơ khám (Visit) từ lịch hẹn Checked-In
1. Khi khách hàng đến phòng khám, trạng thái lịch hẹn được chuyển sang `CHECKED_IN` (3).
2. Bác sĩ click nút "Bắt đầu khám" trên UI lịch hẹn.
3. Hệ thống mở form tạo hồ sơ khám `Visit` với tham số `appointment_id`.
4. Khi bác sĩ lưu `Visit` thành công:
   - Hệ thống tạo bản ghi `Visit`.
   - Hệ thống tự động chuyển đổi trạng thái của `Appointment` liên quan sang `COMPLETED` (4). (BR-APPT-004)
   **State Changes:**
   - `visits.appointment_id` = `{appointment_id}`
   - `appointments.status` = `4` (COMPLETED)

---

### Flow 4: Soft Delete lịch hẹn
1. Bác sĩ click nút "Xóa lịch hẹn" từ UI.
2. Hệ thống kiểm tra quyền hạn.
3. Cập nhật trường `deleted_at` của lịch hẹn (Soft Delete). (BR-APPT-005)
   **State Changes:**
   - `appointments.deleted_at` = `NOW()`

---

## 9. UI/UX & FRONTEND IMPLICATIONS (Next.js App Router)

### 9.1 FE Scope Classification
- **Complexity tier**: Standard
- **Flow type**: C (Full CRUD)
- **Data mode**: `http`

### 9.2 Screen & Route Inventory

| # | Screen / Dialog | Route (App Router) | Flow | Renders | Primary API | Notes |
|---|---|---|---|---|---|---|
| S1 | Calendar & Danh sách lịch hẹn | `app/(main)/appointments/page.tsx` | B | Lịch tháng/tuần/ngày & Bảng danh sách phân trang | `GET /api/v1/appointments` | Hỗ trợ chuyển đổi tab giữa lịch dạng Calendar và dạng Table danh sách |
| S2 | Dialog Đặt lịch hẹn mới | (modal trên S1) | A | Form đặt lịch | `POST /api/v1/appointments` | Mở khi click "Đặt lịch mới" |
| S3 | Dialog Chi tiết & Cập nhật lịch | (modal trên S1) | C | Form chỉnh sửa và các nút đổi trạng thái | `GET /api/v1/appointments/{id}`, `PUT /api/v1/appointments/{id}` | Hiển thị chi tiết và lịch sử trạng thái |

### 9.3 Component Tree

```markdown
S1 - Calendar & Danh sách lịch hẹn (`features/appointments/`)
- AppointmentsPage (container)
  - AppointmentsHeader -> Tiêu đề, nút "Đặt lịch mới"
  - AppointmentsViewSwitcher -> Nút chuyển đổi view Calendar <-> Table
  - AppointmentsCalendarView (container) -> Hiển thị dạng lịch tháng/ngày
  - AppointmentsTableView (container) -> Hiển thị danh sách phân trang và bộ lọc
  - AppointmentCreateModal (container) -> Dialog S2
  - AppointmentDetailModal (container) -> Dialog S3
```

### 9.4 Data Layer

| Hook | Repository method | API endpoint | Returns | Used by |
|---|---|---|---|---|
| `useAppointments(filters)` | `AppointmentRepository.list` | `GET /api/v1/appointments` | `Appointment[]` | S1 |
| `useCreateAppointment()` | `AppointmentRepository.create` | `POST /api/v1/appointments` | `Appointment` | S2 |
| `useUpdateAppointment(id)` | `AppointmentRepository.update` | `PUT /api/v1/appointments/{id}` | `Appointment` | S3 |
| `useDeleteAppointment(id)` | `AppointmentRepository.delete` | `DELETE /api/v1/appointments/{id}` | `void` | S3 |

### 9.5 Forms & Zod Schemas

#### Form: Đặt lịch / Cập nhật lịch hẹn (`AppointmentForm`)
| Form | Field | Type | Client Rule | Error Key |
|---|---|---|---|---|
| AppointmentForm | `customer_id` | number | Bắt buộc | `appointments.errors.customer_required` |
| AppointmentForm | `appointment_date` | string | Bắt buộc (YYYY-MM-DD) | `appointments.errors.date_required` |
| AppointmentForm | `appointment_time` | string | Bắt buộc (HH:MM) | `appointments.errors.time_required` |
| AppointmentForm | `note` | string | Tùy chọn | |

### 9.6 UI States

| Screen | Loading | Empty | Error | Permission-denied | Success feedback |
|---|---|---|---|---|---|
| S1 | Calendar skeleton hoặc table loading state | Thông báo không có lịch hẹn trong ngày/tháng chọn | Banner thông báo lỗi kết nối kèm nút thử lại | Chặn truy cập hoặc ẩn các hành động tạo/sửa | |
| S2 | Submit spinner | | Hiển thị lỗi form hoặc Toast báo trùng lịch | Ẩn nút click mở Dialog | Toast `appointments.toasts.created` |
| S3 | Loading detail spinner | | Toast báo lỗi | Ẩn nút xóa/sửa | Toast `appointments.toasts.updated` |

### 9.7 Presentation & UX Behavior
- **UI-001**: Lọc lịch hẹn: Hỗ trợ lọc nhanh theo Ngày hiện tại (Hôm nay), Tuần này, Tháng này trên màn hình chính.
- **UI-002**: Đặt hẹn nhanh từ Calendar: Khi double click vào một ô ngày trên Calendar, mở Dialog tạo lịch hẹn và tự động điền sẵn ngày được click.
- **UI-003**: Cảnh báo trùng giờ: Khi nhập giờ hẹn mà slot đó đã bị đặt (dựa trên danh sách cached), hiển thị cảnh báo đỏ ngay trên form trước khi submit.

### 9.8 Navigation, Global State & i18n
- **Navigation**: Khi tạo hoặc chỉnh sửa xong, đóng Dialog và refresh data của view hiện tại (Calendar/Table). Khi click "Bắt đầu khám", chuyển hướng sang `/visits/create?appointment_id={id}`.
- **i18n keys**:
  - `appointments.title`
  - `appointments.toasts.created`
  - `appointments.toasts.updated`
  - `appointments.toasts.deleted`
  - `appointments.errors.double_booking`

---

## 10. NOTIFICATIONS

| Trigger Event | Channel | Template | Variables | Recipient |
|---|---|---|---|---|
| Không áp dụng trong MVP | | | | |

---

## 11. API ENDPOINT INVENTORY

| Method | Endpoint | Guard | Description | Related Flow |
|---|---|---|---|---|
| GET | `/api/v1/appointments` | api | Lấy danh sách/lịch hẹn | S1 |
| POST | `/api/v1/appointments` | api | Đặt lịch hẹn mới | Flow 1, S2 |
| GET | `/api/v1/appointments/{id}` | api | Chi tiết lịch hẹn | S3 |
| PUT | `/api/v1/appointments/{id}` | api | Cập nhật lịch hẹn / Chuyển trạng thái | Flow 2, S3 |
| DELETE | `/api/v1/appointments/{id}` | api | Xóa lịch hẹn (Soft Delete) | Flow 4, S3 |

---

## 12. IMPLEMENTATION TASKS

### Phase 1: Foundation & Database
- [ ] Tạo file migration tạo bảng `appointments` và cập nhật bảng `visits`.
- [ ] Tạo Model `Appointment` hỗ trợ Soft Delete và định nghĩa quan hệ với `Customer`.
- [ ] Tạo file `app/Enums/AppointmentStatusEnum.php` chứa các giá trị integer và method `label()`.
- [ ] Viết Seeder mẫu cho Appointment.

### Phase 2: API & Business Logic
- [ ] Tạo `AppointmentRequest` chứa validation (Check định dạng, Check khách hàng Active, Check trùng slot `no_double_booking`).
- [ ] Tạo `AppointmentService` xử lý đặt lịch, kiểm tra trùng lịch và chuyển đổi trạng thái an toàn.
- [ ] Tạo `AppointmentController` với đầy đủ các endpoint CRUD.
- [ ] Viết Feature Tests kiểm tra các case trùng lịch, chuyển trạng thái và soft delete.

### Phase 3: Frontend Implementation
- [ ] Khai báo interface `Appointment` và `IAppointmentRepository`.
- [ ] Tạo component Calendar View và List View trên màn hình `/appointments`.
- [ ] Tạo Dialog đặt lịch mới và Dialog chi tiết lịch hẹn.
- [ ] Tích hợp API và viết Test unit/integration bằng Vitest cho frontend.
- [ ] Viết Playwright E2E Test cho luồng đặt lịch hẹn mới và bắt đầu khám.
