---
title: Quản Lý Tiếp Nhận — Reception Management
description: Đặc tả kỹ thuật đầy đủ cho module tiếp nhận bệnh nhân tại phòng khám da liễu. Bao gồm tạo phiếu khám (Visit), tra cứu khách hàng, quản lý danh sách khám, và tiếp nhận từ lịch hẹn.
status: pending_implementation
date: 2026-06-15
version: 1.0
changelog:
  - version: 1.0
    date: 2026-06-15
    summary: Đặc tả ban đầu từ draft Quan_Ly_Tiep_Nhan (overview + 4 sub-files). Xác nhận qua Phase V với stakeholder.
---

## 2. OVERVIEW

Module **Quản Lý Tiếp Nhận** cung cấp giao diện làm việc chính cho lễ tân/tiếp nhận tại phòng khám da liễu. Đây là điểm khởi đầu của toàn bộ quy trình khám — từ khi bệnh nhân đến phòng khám cho đến khi được phân công vào hàng đợi khám.

**Phạm vi thay đổi toàn diện:**

1. **Entity mới `Visit`** (Phiếu khám): thực thể trung tâm đại diện cho một lần khám thực tế, phân biệt với `Appointment` (lịch hẹn trước). `Visit` có thể được tạo trực tiếp (walk-in) hoặc từ một `Appointment` hiện có (scheduled).

2. **3 Master Data entities mới**: `clinic_rooms` (Phòng khám), `services` (Dịch vụ khám), `service_packages` (Gói khám) — cung cấp lookup cho form phiếu đăng ký.

3. **Giao diện 2 cột**: Cột 1 (phiếu đăng ký) luôn hiển thị, Cột 2 chứa 3 tab nghiệp vụ (Thông tin KH / Danh sách khám / KH đặt lịch trước). Dữ liệu Cột 1 được chia sẻ xuyên suốt các tab.

4. **Tích hợp `Appointment`**: Khi lễ tân tiếp nhận từ Tab 3, hệ thống tạo `Visit` mới liên kết `appointment_id` và chuyển `Appointment.status → CHECKED_IN`. Khi Visit hoàn thành (scope sau), `Appointment.status → COMPLETED`.

5. **Scheduled job `MarkOverdueAppointments`**: Tự động set `AppointmentStatus = OVERDUE` cho các lịch hẹn quá ngày mà chưa được tiếp nhận.

---

## 3. CONTEXT

- **Modules mới**: `reception` (Visit CRUD + tiếp nhận), mở rộng `appointment`, tạo master data cho clinic_rooms/services/packages.
- **Modules sử dụng**: `customer` (tra cứu), `appointment` (đọc và cập nhật status).
- **Features**: Tạo phiếu khám walk-in, Tạo phiếu khám scheduled, Tra cứu bệnh nhân, Danh sách khám trong ngày, Hủy/Xóa phiếu khám, Tiếp nhận từ lịch hẹn, Hủy lịch hẹn, Xem chi tiết lịch hẹn, Tự động đánh dấu quá hẹn.
- **Guards**: `auth:sanctum` (tất cả endpoints đều yêu cầu đăng nhập).
- **Third-parties**: Không có.

---

## 4. OUT OF SCOPE

- **Quy trình khám (examination flow)**: Module này chỉ phụ trách tiếp nhận — không bao gồm ghi kết quả khám, kê đơn, hay thanh toán.
- **Phân quyền chi tiết theo vai trò**: Hiện tại admin và manager đều có quyền như nhau; phân cấp quyền chi tiết hơn sẽ làm trong sprint sau.
- **Thông báo (notification)**: Không gửi SMS/email cho khách hàng trong giai đoạn này.
- **CRUD quản lý `clinic_rooms`, `services`, `service_packages`**: Scope này chỉ tạo bảng và Master Data lookup — giao diện quản lý (tạo/sửa/xóa) các entity này là scope riêng.
- **Kết thúc Visit (Visit completion)**: `Visit.status → COMPLETED` do bác sĩ kích hoạt — thuộc module khám bệnh, không thuộc module tiếp nhận.
- **Lịch sử khám của bệnh nhân**: Xem toàn bộ lịch sử nhiều lần khám — thuộc module hồ sơ bệnh nhân.

---

## 5. BUSINESS RULES

| BR | Rule | Referenced in | Enforced in (BE) | Enforced in (FE) |
|----|------|---------------|------------------|------------------|
| PROPOSED_BR:visit-code-daily-seq | Mã đăng ký khám auto-generated không chỉnh sửa, format `KByyMMdd-NNNN`, reset theo ngày | Flow 1, Flow 2 | `VisitService::create()` (boot model) | Trường disabled (S1 form) |
| PROPOSED_BR:visit-queue-number-daily | Số thứ tự (STT) khám auto-generated, tính theo số lượng Visit đã tạo trong cùng ngày + cùng phòng khám | Flow 1, Flow 2 | `VisitService::create()` | Trường disabled (S1 form) |
| PROPOSED_BR:walkin-no-appointment-date | Hình thức "Chờ khám" (WALK_IN): trường ngày khám bị ẩn; `visited_at` = thời điểm tạo Visit | Flow 1 | `StoreVisitRequest` | Ẩn field ngày (S1 — UI-001) |
| PROPOSED_BR:scheduled-future-date-only | Hình thức "Đặt lịch" (SCHEDULED): `appointment_date` bắt buộc nhập, chỉ cho phép ngày trong tương lai (> ngày hiện tại) | Flow 2 | `StoreVisitRequest` | Zod date validation (S1) |
| PROPOSED_BR:walkin-requires-room-service | Hình thức WALK_IN: bắt buộc chọn `clinic_room_id` và ít nhất một `service_id` | Flow 1 | `StoreVisitRequest` | Zod required (S1) |
| PROPOSED_BR:visit-cancel-condition | Chỉ Visit chưa hoàn thành (status ≠ `COMPLETED`) mới được hủy | Flow 3 | `VisitService::cancel()` | Disable nút Hủy khi status = COMPLETED |
| PROPOSED_BR:visit-delete-permission | Xóa Visit chỉ dành cho `admin` và `manager` role | Flow 4 | `VisitPolicy::delete()` | Ẩn nút Xóa với role khác |
| PROPOSED_BR:visit-delete-soft | Visit không bao giờ hard-delete; luôn dùng soft delete | Flow 4 | `VisitService::delete()` | — |
| PROPOSED_BR:appointment-checkin-on-visit | Khi tạo Visit từ Appointment, `Appointment.status → CHECKED_IN` atomically | Flow 5 | `VisitService::createFromAppointment()` trong transaction | — |
| PROPOSED_BR:appointment-cancel-precheck-only | Chỉ Appointment có status `BOOKED` mới được hủy từ Tab 3 của module tiếp nhận | Flow 6 | `AppointmentService::cancel()` | Disable nút Hủy khi status ≠ BOOKED |
| PROPOSED_BR:overdue-auto-mark | Appointment có `appointment_date < today` và status `BOOKED` tự động chuyển sang `OVERDUE` | Flow 7 | `MarkOverdueAppointmentsJob` (scheduled daily) | Hiển thị badge OVERDUE (S3) |
| PROPOSED_BR:visit-list-date-same-month | Bộ lọc danh sách khám (Tab 2) chỉ cho phép chọn khoảng thời gian trong cùng một tháng | Flow — List | `IndexVisitRequest` | Zod date range validation (S2) |
| PROPOSED_BR:visit-list-no-future-date | Bộ lọc danh sách khám không cho phép chọn ngày trong tương lai | Flow — List | `IndexVisitRequest` | Zod max date = today (S2) |
| BR-G002 | Tất cả thao tác tạo/cập nhật phải tự động ghi Activity Log qua Spatie `LogsActivity` | Flow 1-6 | Model `Visit` (trait) | — |
| BR-APPT-003 | Chuyển trạng thái Appointment phải theo ma trận ALLOWED_TRANSITIONS | Flow 6 | `AppointmentService::cancel()` | — |
| BR-APPT-005 | Appointment không hard-delete | Flow 6 | `AppointmentService` | — |
| BR-CUST-001 | Customer code format `BNxxxxxx` | Tham chiếu | `CustomerService` (hiện có) | — |

---

## 6. REQUIREMENT ANALYSIS

### 6.1 Kiến Trúc Giao Diện

Màn hình Tiếp Nhận chia 2 cột bất biến:

```
┌─────────────────────────────────────────────────────────────────┐
│  CỘT 1 (luôn hiển thị)    │  CỘT 2 (3 tab)                     │
│  Phiếu Đăng Ký Khám        │  [Tab 1: Thông tin KH]             │
│  ─ Mã đăng ký (disabled)  │  [Tab 2: Danh sách khám]           │
│  ─ Hình thức đăng ký      │  [Tab 3: KH đã đặt lịch trước]     │
│  ─ Ngày khám (cond.)      │                                     │
│  ─ Ưu tiên (toggle)       │                                     │
│  ─ Phòng khám             │                                     │
│  ─ Dịch vụ khám           │                                     │
│  ─ Gói khám               │                                     │
│  ─ Lý do khám             │                                     │
│                            │                                     │
│  [Lưu phiếu]              │                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Quy tắc chuyển tab**: Khi chuyển tab, dữ liệu Cột 1 KHÔNG bị reset — chỉ Cột 2 thay đổi nội dung.

### 6.2 Luồng Tạo Phiếu Walk-in

1. Lễ tân chọn hình thức "Chờ khám" → trường ngày khám ẩn (`UI-001`).
2. Bắt buộc chọn Phòng khám và Dịch vụ khám (`PROPOSED_BR:walkin-requires-room-service`).
3. Mã đăng ký khám auto-gen (`PROPOSED_BR:visit-code-daily-seq`).
4. STT khám auto-gen theo số Visit đã có trong ngày + phòng khám (`PROPOSED_BR:visit-queue-number-daily`).
5. `visited_at` = timestamp hiện tại.
6. Sau khi lưu, Visit xuất hiện ngay trong Tab 2 Danh sách khám với `status = WAITING`.

### 6.3 Luồng Tạo Phiếu Scheduled (Đặt Lịch)

1. Lễ tân chọn hình thức "Đặt lịch" → trường ngày khám hiển thị, bắt buộc nhập (`PROPOSED_BR:scheduled-future-date-only`).
2. Ngày khám chỉ chấp nhận ngày tương lai (> ngày hôm nay).
3. Không bắt buộc chọn Phòng khám và Dịch vụ (khác với walk-in).
4. Mã đăng ký và STT auto-gen tương tự walk-in.
5. Visit được tạo với `registration_type = SCHEDULED`, `status = WAITING`.
6. **Lưu ý**: Luồng "Đặt lịch" từ Cột 1 không tự động tạo `Appointment` entity — `Appointment` chỉ được tạo qua `AppointmentController`. Nếu muốn liên kết, phải tiếp nhận từ Tab 3.

### 6.4 Tra Cứu Khách Hàng (Tab 1)

- Tìm theo: Mã bệnh nhân (`code`), Tên (`full_name`), SĐT (`phone`).
- **1 kết quả**: Tự động điền form, không hiển thị modal.
- **Nhiều kết quả**: Mở modal danh sách (code, full_name, phone, province), click chọn → đóng modal + điền form.
- Tất cả trường thông tin KH ở trạng thái `disabled` — không cho chỉnh sửa trong module tiếp nhận.
- Nếu không tìm thấy → hiển thị trạng thái empty với gợi ý tạo mới (link đến module KH).

### 6.5 Điều Kiện Hủy / Xóa Phiếu Khám (Tab 2)

| Hành động | Điều kiện | Kết quả |
|-----------|-----------|---------|
| Hủy Visit | `status ∈ {WAITING, IN_PROGRESS}` | `status → CANCELLED`, lưu history |
| Xóa Visit | Role `admin` hoặc `manager` | Hiển thị dialog xác nhận → soft delete |

### 6.6 Tiếp Nhận Từ Lịch Hẹn (Tab 3)

- Chỉ Appointment có `status = BOOKED` mới có nút "Tiếp nhận".
- Khi nhấn "Tiếp nhận": tạo `Visit` mới với `appointment_id` liên kết, `registration_type = SCHEDULED`, STT auto-gen, `Appointment.status → CHECKED_IN` — trong 1 DB transaction.
- Visit mới xuất hiện ngay trong Tab 2.

### 6.7 Hủy Lịch Hẹn (Tab 3)

- Điều kiện: `Appointment.status = BOOKED`.
- Kết quả: `Appointment.status → CANCELLED`, ghi activity log.

### 6.8 Tự Động Đánh Dấu Quá Hẹn

- Job chạy hàng ngày lúc 00:01.
- Query: `appointments WHERE appointment_date < TODAY AND status = BOOKED`.
- Cập nhật hàng loạt: `status → OVERDUE`.

---

## 7. DATA MODEL UPDATES

### 7.1 Bảng Mới

#### Table: `visits`

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| `id` | bigint | 20 | NO | YES | — | ADDED | Primary key | Auto increment |
| `code` | string | 20 | NO | YES | — | ADDED | Mã đăng ký khám, format `KByyMMdd-NNNN` | PROPOSED_BR:visit-code-daily-seq |
| `queue_number` | smallint | — | NO | NO | — | ADDED | Số thứ tự khám trong ngày, tính theo phòng | PROPOSED_BR:visit-queue-number-daily |
| `customer_id` | bigint | 20 | YES | NO | NULL | ADDED | FK → customers.id | Nullable: có thể tạo phiếu trước khi tra cứu KH |
| `appointment_id` | bigint | 20 | YES | NO | NULL | ADDED | FK → appointments.id | Nullable: walk-in không có appointment |
| `clinic_room_id` | bigint | 20 | YES | NO | NULL | ADDED | FK → clinic_rooms.id | Bắt buộc với WALK_IN |
| `registration_type` | tinyInteger | — | NO | NO | 1 | ADDED | Hình thức đăng ký | Enum `RegistrationTypeEnum` |
| `status` | tinyInteger | — | NO | NO | 1 | ADDED | Trạng thái phiếu khám | Enum `VisitStatusEnum` |
| `is_priority` | boolean | — | NO | NO | false | ADDED | Ưu tiên Có/Không | — |
| `visited_at` | datetime | — | NO | NO | — | ADDED | Thời điểm đăng ký khám | WALK_IN: `now()`, SCHEDULED: ngày khám |
| `appointment_date` | date | — | YES | NO | NULL | ADDED | Ngày khám đặt trước | Chỉ có với SCHEDULED |
| `reason` | string | 500 | YES | NO | NULL | ADDED | Lý do khám | max:500 |
| `deleted_at` | timestamp | — | YES | NO | NULL | ADDED | Soft delete | — |
| `created_at` | timestamp | — | NO | NO | — | ADDED | — | — |
| `updated_at` | timestamp | — | NO | NO | — | ADDED | — | — |

#### Table: `visit_services` (pivot)

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| `id` | bigint | 20 | NO | YES | — | ADDED | Primary key | — |
| `visit_id` | bigint | 20 | NO | NO | — | ADDED | FK → visits.id | — |
| `service_id` | bigint | 20 | NO | NO | — | ADDED | FK → services.id | — |
| `created_at` | timestamp | — | NO | NO | — | ADDED | — | — |
| `updated_at` | timestamp | — | NO | NO | — | ADDED | — | — |

#### Table: `visit_packages` (pivot)

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| `id` | bigint | 20 | NO | YES | — | ADDED | Primary key | — |
| `visit_id` | bigint | 20 | NO | NO | — | ADDED | FK → visits.id | — |
| `service_package_id` | bigint | 20 | NO | NO | — | ADDED | FK → service_packages.id | — |
| `created_at` | timestamp | — | NO | NO | — | ADDED | — | — |
| `updated_at` | timestamp | — | NO | NO | — | ADDED | — | — |

#### Table: `clinic_rooms`

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| `id` | bigint | 20 | NO | YES | — | ADDED | Primary key | — |
| `name` | string | 100 | NO | NO | — | ADDED | Tên phòng khám | VD: "Phòng 1", "Phòng Da Liễu" |
| `code` | string | 20 | YES | YES | NULL | ADDED | Mã phòng | — |
| `is_active` | boolean | — | NO | NO | true | ADDED | Trạng thái hoạt động | — |
| `created_at` | timestamp | — | NO | NO | — | ADDED | — | — |
| `updated_at` | timestamp | — | NO | NO | — | ADDED | — | — |

#### Table: `services`

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| `id` | bigint | 20 | NO | YES | — | ADDED | Primary key | — |
| `name` | string | 255 | NO | NO | — | ADDED | Tên dịch vụ khám | — |
| `code` | string | 30 | YES | YES | NULL | ADDED | Mã dịch vụ | — |
| `price` | decimal | 12,2 | YES | NO | NULL | ADDED | Giá dịch vụ | — |
| `is_active` | boolean | — | NO | NO | true | ADDED | Trạng thái hoạt động | — |
| `created_at` | timestamp | — | NO | NO | — | ADDED | — | — |
| `updated_at` | timestamp | — | NO | NO | — | ADDED | — | — |

#### Table: `service_packages`

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| `id` | bigint | 20 | NO | YES | — | ADDED | Primary key | — |
| `name` | string | 255 | NO | NO | — | ADDED | Tên gói khám | — |
| `code` | string | 30 | YES | YES | NULL | ADDED | Mã gói | — |
| `price` | decimal | 12,2 | YES | NO | NULL | ADDED | Giá gói | — |
| `is_active` | boolean | — | NO | NO | true | ADDED | Trạng thái hoạt động | — |
| `created_at` | timestamp | — | NO | NO | — | ADDED | — | — |
| `updated_at` | timestamp | — | NO | NO | — | ADDED | — | — |

### 7.2 Bảng Hiện Có — Thay Đổi

#### Table: `appointments` (MODIFIED)

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| `status` | tinyInteger | — | NO | NO | 1 | MODIFIED | Thêm case `OVERDUE(7)` vào AppointmentStatusEnum | Xem Enum bên dưới |

### 7.3 Enum Definitions

#### Enum: `RegistrationTypeEnum`

| Value (int) | Name | Mô tả | Localization Key |
|-------------|------|-------|-----------------|
| 1 | `WALK_IN` | Khám trong ngày, không qua lịch hẹn | `enums.registration_type.walk_in` |
| 2 | `SCHEDULED` | Đặt lịch trước | `enums.registration_type.scheduled` |

**Transitions**: Không có (immutable sau khi tạo).

#### Enum: `VisitStatusEnum`

| Value (int) | Name | Mô tả | Localization Key |
|-------------|------|-------|-----------------|
| 1 | `WAITING` | Đang chờ khám | `enums.visit_status.waiting` |
| 2 | `IN_PROGRESS` | Đang khám | `enums.visit_status.in_progress` |
| 3 | `COMPLETED` | Đã hoàn thành | `enums.visit_status.completed` |
| 4 | `CANCELLED` | Đã hủy | `enums.visit_status.cancelled` |

**State Transitions:**

| From | To | Trigger | Enforced by |
|------|----|---------|-----------  |
| `WAITING` | `IN_PROGRESS` | Bác sĩ bắt đầu khám (scope sau) | `VisitService` |
| `WAITING` | `CANCELLED` | Lễ tân hủy | `VisitService::cancel()` |
| `IN_PROGRESS` | `COMPLETED` | Bác sĩ hoàn thành (scope sau) | `VisitService` |
| `IN_PROGRESS` | `CANCELLED` | Hủy khẩn cấp | `VisitService::cancel()` |
| `COMPLETED` | _(không có)_ | Trạng thái cuối | — |
| `CANCELLED` | _(không có)_ | Trạng thái cuối | — |

#### Enum: `AppointmentStatusEnum` (MODIFIED — thêm OVERDUE)

> Thêm case mới vào enum hiện có tại `backend/app/Enums/AppointmentStatusEnum.php`.

| Value (int) | Name | Mô tả | Localization Key |
|-------------|------|-------|-----------------|
| 1 | `BOOKED` | Đã đặt lịch | `enums.appointment_status.booked` _(hiện có)_ |
| 2 | `CONFIRMED` | Đã xác nhận | `enums.appointment_status.confirmed` _(hiện có)_ |
| 3 | `CHECKED_IN` | Đã check-in / Đã tiếp nhận | `enums.appointment_status.checked_in` _(hiện có)_ |
| 4 | `COMPLETED` | Đã hoàn thành | `enums.appointment_status.completed` _(hiện có)_ |
| 5 | `CANCELLED` | Đã hủy | `enums.appointment_status.cancelled` _(hiện có)_ |
| 6 | `NO_SHOW` | Không đến hẹn | `enums.appointment_status.no_show` _(hiện có)_ |
| **7** | **`OVERDUE`** | **Quá hẹn (auto-set)** | **`enums.appointment_status.overdue`** _(MỚI)_ |

**Transition additions (thêm vào BR-APPT-003):**

| From | To | Trigger |
|------|----|---------|
| `BOOKED` | `CHECKED_IN` | Lễ tân tiếp nhận (tạo Visit) |
| `BOOKED` | `CANCELLED` | Lễ tân hủy từ Tab 3 |
| `BOOKED` | `OVERDUE` | Scheduled Job (auto, hàng ngày) |

---

## 8. PROCESSING FLOWS

### Flow 1: Tạo Phiếu Khám Walk-in

1. Lễ tân chọn hình thức `WALK_IN` trong Cột 1. (PROPOSED_BR:walkin-no-appointment-date)
   - **State Changes**: UI ẩn trường "Ngày khám".
2. Lễ tân chọn `clinic_room_id`, ít nhất một `service_id`. (PROPOSED_BR:walkin-requires-room-service)
3. Lễ tân nhập các trường tùy chọn: `is_priority`, `service_package_ids`, `reason`.
4. Lễ tân nhấn "Lưu phiếu" → `POST /api/v1/visits`.
5. Backend validate `StoreVisitRequest`.
6. `VisitService::create()` trong DB transaction:
   - a. Query đếm số Visit trong ngày + phòng: `SELECT COUNT(*) FROM visits WHERE DATE(visited_at) = TODAY AND clinic_room_id = ? AND deleted_at IS NULL` → `queue_number = count + 1`.
   - b. Sinh `code`: format `KB{yy}{MM}{dd}-{NNNN}`, NNNN là số Visit trong ngày (toàn hệ thống) + 1.
   - c. Tạo record `Visit` với `registration_type = WALK_IN`, `status = WAITING`, `visited_at = now()`.
   - d. Insert `visit_services` pivot cho mỗi `service_id`.
   - e. Insert `visit_packages` pivot nếu có `service_package_ids`.
   - **State Changes**:
     - `visits.status` = `WAITING (1)`
     - `visits.registration_type` = `WALK_IN (1)`
     - `visits.visited_at` = `now()`
     - `visits.queue_number` = `{auto}`
     - `visits.code` = `{KB...}`
7. Response: `VisitResource` HTTP 201.
8. Activity Log ghi `created` event (BR-G002).
9. Tab 2 realtime refresh hiển thị Visit mới.

**Acceptance Criteria:**
- [ ] Visit xuất hiện ngay trong Tab 2 sau khi lưu
- [ ] `code` đúng format `KByyMMdd-NNNN`
- [ ] `queue_number` tăng dần đúng theo phòng trong ngày

**Error Cases:**

| Error Condition | System Behavior | State Changes |
|-----------------|-----------------|---------------|
| Thiếu `clinic_room_id` (WALK_IN) | 422 `reception.errors.room_required` | No change |
| Thiếu `service_id` (WALK_IN) | 422 `reception.errors.service_required` | No change |
| `clinic_room_id` không tồn tại / inactive | 422 `reception.errors.room_invalid` | No change |
| Race condition tạo queue_number | `lockForUpdate()` đảm bảo sequential | No change |
| DB transaction fail | Rollback toàn bộ | No change |

---

### Flow 2: Tạo Phiếu Khám Scheduled (Đặt Lịch)

1. Lễ tân chọn hình thức `SCHEDULED` trong Cột 1. (PROPOSED_BR:walkin-no-appointment-date)
   - **State Changes**: UI hiển thị trường "Ngày khám".
2. Lễ tân nhập `appointment_date` (bắt buộc, chỉ tương lai). (PROPOSED_BR:scheduled-future-date-only)
3. Các trường khác tùy chọn (clinic_room, service, package, reason).
4. Lễ tân nhấn "Lưu phiếu" → `POST /api/v1/visits`.
5. `VisitService::create()`:
   - Sinh `code` và `queue_number` tương tự Flow 1.
   - Tạo record `Visit` với `registration_type = SCHEDULED`, `status = WAITING`, `appointment_date = {input}`.
   - **State Changes**:
     - `visits.registration_type` = `SCHEDULED (2)`
     - `visits.appointment_date` = `{date}`
     - `visits.status` = `WAITING (1)`
6. Response: `VisitResource` HTTP 201.

**Error Cases:**

| Error Condition | System Behavior | State Changes |
|-----------------|-----------------|---------------|
| `appointment_date` = ngày hôm nay | 422 `reception.errors.date_must_be_future` | No change |
| `appointment_date` = ngày quá khứ | 422 `reception.errors.date_must_be_future` | No change |
| `appointment_date` sai format | 422 `reception.errors.date_format_invalid` | No change |

---

### Flow 3: Hủy Phiếu Khám

1. Lễ tân nhấn "Hủy" tại hàng trong Tab 2. (PROPOSED_BR:visit-cancel-condition)
2. Frontend disable nút Hủy nếu `status = COMPLETED`.
3. Hiển thị dialog xác nhận: "Bạn có chắc muốn hủy phiếu khám này?"
4. Lễ tân xác nhận → `PATCH /api/v1/visits/{id}/cancel`.
5. `VisitService::cancel()`:
   - Kiểm tra `status ∈ {WAITING, IN_PROGRESS}` — nếu không → 422.
   - Cập nhật `status = CANCELLED`.
   - **State Changes**:
     - `visits.status` = `CANCELLED (4)`
6. Response: `VisitResource` HTTP 200.
7. Activity Log ghi `cancelled` event.

**Error Cases:**

| Error Condition | System Behavior | State Changes |
|-----------------|-----------------|---------------|
| Visit đã COMPLETED | 422 `reception.errors.visit_already_completed` | No change |
| Visit đã CANCELLED | 422 `reception.errors.visit_already_cancelled` | No change |
| Visit không tồn tại | 404 | No change |
| Không có quyền | 403 | No change |

---

### Flow 4: Xóa Phiếu Khám

1. Lễ tân (role `admin`/`manager`) nhấn "Xóa" trong Tab 2. (PROPOSED_BR:visit-delete-permission)
2. Frontend chỉ hiển thị nút Xóa cho `admin` và `manager`.
3. Hiển thị dialog xác nhận.
4. Xác nhận → `DELETE /api/v1/visits/{id}`.
5. Backend kiểm tra `VisitPolicy::delete()`.
6. `VisitService::delete()`:
   - Soft delete: `$visit->delete()`.
   - **State Changes**:
     - `visits.deleted_at` = `now()`

**Error Cases:**

| Error Condition | System Behavior | State Changes |
|-----------------|-----------------|---------------|
| Role không phải admin/manager | 403 `reception.errors.unauthorized_delete` | No change |
| Visit không tồn tại | 404 | No change |

---

### Flow 5: Tiếp Nhận Khách Hàng Từ Lịch Hẹn

1. Lễ tân mở Tab 3, tìm lịch hẹn cần tiếp nhận.
2. Chỉ hàng có `Appointment.status = BOOKED` hiển thị nút "Tiếp nhận". (PROPOSED_BR:appointment-checkin-on-visit)
3. Lễ tân nhấn "Tiếp nhận" → `POST /api/v1/visits/from-appointment`.
   - Body: `{ appointment_id: {id}, clinic_room_id?: ..., is_priority?: ... }`
4. `VisitService::createFromAppointment()` trong DB transaction:
   - a. Load `Appointment` với `lockForUpdate()`, kiểm tra `status = BOOKED` — nếu không → 422.
   - b. Sinh `code` và `queue_number` tương tự Flow 1.
   - c. Tạo `Visit` với `appointment_id`, `customer_id` từ appointment, `registration_type = SCHEDULED`, `status = WAITING`.
   - d. Cập nhật `Appointment.status = CHECKED_IN`. (PROPOSED_BR:appointment-checkin-on-visit)
   - **State Changes**:
     - `visits` record mới: `status = WAITING (1)`, `appointment_id = {id}`, `registration_type = SCHEDULED (2)`
     - `appointments.status` = `CHECKED_IN (3)`
5. Response: `VisitResource` HTTP 201.
6. Activity Log ghi `created` event trên Visit, `status_changed` trên Appointment.
7. Visit mới xuất hiện trong Tab 2; hàng Appointment trong Tab 3 cập nhật badge → `CHECKED_IN`.

**Concurrency Handling**: `lockForUpdate()` đảm bảo không thể tiếp nhận cùng 1 appointment 2 lần.

**Error Cases:**

| Error Condition | System Behavior | State Changes |
|-----------------|-----------------|---------------|
| `Appointment.status ≠ BOOKED` | 422 `reception.errors.appointment_not_bookable` | No change |
| Race condition (2 lễ tân cùng tiếp nhận) | lockForUpdate: request sau nhận 422 | No change |
| Appointment không tồn tại | 404 | No change |
| Transaction fail | Rollback (cả Visit + Appointment) | No change |

---

### Flow 6: Hủy Lịch Hẹn Từ Tab 3

1. Lễ tân nhấn "Hủy" tại hàng Appointment trong Tab 3. (PROPOSED_BR:appointment-cancel-precheck-only)
2. Chỉ hàng có `status = BOOKED` hiển thị nút Hủy.
3. Dialog xác nhận → `PATCH /api/v1/appointments/{id}/cancel`.
4. `AppointmentService::cancel()`:
   - Kiểm tra `status = BOOKED` (BR-APPT-003).
   - Cập nhật `status = CANCELLED`.
   - **State Changes**:
     - `appointments.status` = `CANCELLED (5)`
5. Activity Log ghi `updated` event.
6. Response: `AppointmentResource` HTTP 200.

**Error Cases:**

| Error Condition | System Behavior | State Changes |
|-----------------|-----------------|---------------|
| `status ≠ BOOKED` | 422 `reception.errors.appointment_not_cancellable` | No change |
| Appointment không tồn tại | 404 | No change |

---

### Flow 7: Tự Động Đánh Dấu Quá Hẹn (Scheduled Job)

1. Job `MarkOverdueAppointmentsJob` chạy hàng ngày lúc 00:01 server time.
2. Query: `appointments WHERE appointment_date < CURDATE() AND status = BOOKED AND deleted_at IS NULL`.
3. Bulk update: `status = OVERDUE (7)`.
   - **State Changes**:
     - `appointments.status` = `OVERDUE (7)` (cho tất cả records thỏa điều kiện)
4. Log số lượng records đã cập nhật.

**Error Cases:**

| Error Condition | System Behavior | State Changes |
|-----------------|-----------------|---------------|
| DB timeout | Log error, retry lần sau | No change |
| Job overlap | Dùng `withoutOverlapping()` trong schedule | No change |

---

### Flow 8: Danh Sách Khám — List & Filter (Tab 2)

1. Mặc định hiển thị Visit trong ngày hiện tại.
2. Lễ tân có thể thay đổi Date Range (cùng tháng, không chọn ngày tương lai). (PROPOSED_BR:visit-list-date-same-month, PROPOSED_BR:visit-list-no-future-date)
3. `GET /api/v1/visits?from=...&to=...&status=...` → `VisitService::list()`.
4. Kết quả: bảng STT khám / Mã KH / Mã phiếu / Tên KH / Thời gian đăng ký / Giới tính / SĐT / Trạng thái / Hành động.

---

### Flow 9: Danh Sách Lịch Hẹn — List & Filter (Tab 3)

1. Lễ tân filter theo: Mã đăng ký, Mã KH, Tên KH, SĐT, Khoảng ngày khám, Trạng thái.
2. `GET /api/v1/appointments?search=...&date_from=...&date_to=...&status=...`
3. Kết quả: bảng Mã ĐK / Mã KH / Tên KH / Ngày khám / Phòng khám / Dịch vụ / SĐT / Trạng thái / Ngày tạo / Hành động.

---

### Flow 10: Xem Chi Tiết Lịch Hẹn

1. Lễ tân nhấn "Xem chi tiết" → mở drawer/modal.
2. `GET /api/v1/appointments/{id}`.
3. Hiển thị: Thông tin phiếu đăng ký, Thông tin khách hàng, Lịch sử thao tác (Spatie Activity Log).

---

## 9. UI/UX & FRONTEND IMPLICATIONS

### 9.1 FE Scope Classification

- **Complexity tier**: Complex
- **Flow type**: C (full CRUD) — phiếu khám; B (list) — danh sách khám; B (list + action) — lịch hẹn; D (detail) — chi tiết lịch hẹn.
- **Data mode**: `http` (API ready sau khi BE hoàn thành).

### 9.2 Screen & Route Inventory

| # | Screen / Dialog | Route (App Router) | Flow | Renders | Primary API | Notes |
|---|--|----|--|--|--|--|
| S1 | Màn hình Tiếp Nhận (layout 2 cột) | `app/(main)/reception/page.tsx` | C | RegistrationForm (Cột 1) + TabPanel (Cột 2) | `POST /api/v1/visits` | Persistent Cột 1 xuyên tab |
| S2 | Tab 1 — Thông tin Khách Hàng | (tab trong S1) | B+D | Search + CustomerDetail | `GET /api/v1/customers` | readonly |
| S3 | Tab 2 — Danh sách khám | (tab trong S1) | B | Table + Date filter | `GET /api/v1/visits` | URL-synced filters |
| S4 | Tab 3 — Lịch hẹn đã đặt | (tab trong S1) | B | Table + multi-filter | `GET /api/v1/appointments` | URL-synced filters |
| S5 | Modal tìm kiếm khách hàng | (modal trong S2) | B | List: code, name, phone, province | `GET /api/v1/customers?search=` | Hiện khi >1 kết quả |
| S6 | Dialog xác nhận Hủy Visit | (dialog trong S3) | — | Confirm dialog | `PATCH /api/v1/visits/{id}/cancel` | — |
| S7 | Dialog xác nhận Xóa Visit | (dialog trong S3) | — | Confirm dialog | `DELETE /api/v1/visits/{id}` | Chỉ admin/manager |
| S8 | Dialog xác nhận Hủy Appointment | (dialog trong S4) | — | Confirm dialog | `PATCH /api/v1/appointments/{id}/cancel` | — |
| S9 | Drawer chi tiết Appointment | (drawer trong S4) | D | Detail + Activity log | `GET /api/v1/appointments/{id}` | — |

### 9.3 Component Tree (per screen)

```
S1 — ReceptionPage (features/reception/)
  - ReceptionLayout (container)          → 2-column layout, shared Cột 1 state
    - RegistrationForm (container)       → owns form state, submit
      - RegistrationCodeField (present.) → disabled field
      - RegistrationTypeSelect (present.)→ WALK_IN / SCHEDULED toggle
      - AppointmentDatePicker (present.) → conditional display (UI-001)
      - PriorityToggle (present.)        → boolean switch
      - ClinicRoomSelect (present.)      → Master Data dropdown
      - ServiceMultiSelect (present.)    → Master Data multi-select
      - PackageMultiSelect (present.)    → Master Data multi-select
      - ReasonTextarea (present.)        → max 500 chars
      - SubmitButton (present.)          → loading state
    - TabNavigation (present.)           → Tab 1/2/3 switcher (no reset Cột 1)
    - TabPanel (container)               → renders S2/S3/S4 based on active tab

S2 — CustomerSearchTab (features/reception/components/)
  - CustomerSearchBar (present.)         → input + search button
  - CustomerInfoCard (present.)          → readonly fields, disabled
  - CustomerSearchModal (S5)             → opens when >1 result

S3 — ExaminationListTab (features/reception/components/)
  - ExaminationFilters (present.)        → date range picker (same-month validation)
  - ExaminationTable (present.)          → columns + row badges
  - CancelVisitDialog (S6) (present.)    → confirm cancel
  - DeleteVisitDialog (S7) (present.)    → confirm delete (admin/manager only)

S4 — AppointmentListTab (features/reception/components/)
  - AppointmentFilters (present.)        → search + date range + status select
  - AppointmentTable (present.)          → columns + row badges + actions
  - CheckInButton (present.)             → only when status=BOOKED
  - CancelAppointmentDialog (S8) (pres.)→ confirm cancel
  - AppointmentDetailDrawer (S9) (pres.)→ detail + activity log
```

### 9.4 Data Layer

| Hook | Repository method | API endpoint | Returns | Used by |
|------|-------------------|--------------|---------|----|
| `useCreateVisit()` | `VisitRepository.create` | `POST /api/v1/visits` | `Visit` | S1 |
| `useCreateVisitFromAppointment()` | `VisitRepository.createFromAppointment` | `POST /api/v1/visits/from-appointment` | `Visit` | S4 |
| `useSearchCustomers(query)` | `CustomerRepository.list` | `GET /api/v1/customers?search=` | `Customer[]` | S2, S5 |
| `useVisits(filters)` | `VisitRepository.list` | `GET /api/v1/visits` | paginated `Visit[]` | S3 |
| `useCancelVisit()` | `VisitRepository.cancel` | `PATCH /api/v1/visits/{id}/cancel` | `Visit` | S6 |
| `useDeleteVisit()` | `VisitRepository.delete` | `DELETE /api/v1/visits/{id}` | void | S7 |
| `useAppointments(filters)` | `AppointmentRepository.list` | `GET /api/v1/appointments` | paginated `Appointment[]` | S4 |
| `useCancelAppointment()` | `AppointmentRepository.cancel` | `PATCH /api/v1/appointments/{id}/cancel` | `Appointment` | S8 |
| `useAppointmentDetail(id)` | `AppointmentRepository.get` | `GET /api/v1/appointments/{id}` | `Appointment` | S9 |
| `useReceptionMasterData()` | `MasterDataRepository.get` | `GET /api/v1/master-data` | lookup arrays | S1 |

**Master Data batch** cho S1: `resources[clinic_rooms]`, `resources[services]`, `resources[service_packages]` — một request duy nhất khi load trang.

### 9.5 Forms & Zod Schemas

**Schema: `StoreVisitSchema`** (`features/reception/schemas/store-visit.schema.ts`)

| Field | Type | Client Rule | Error Key |
|-------|------|-------------|-----------|
| `registration_type` | number | required, enum [1,2] | `reception.errors.registration_type_required` |
| `appointment_date` | string \| null | if type=SCHEDULED: required, future date | `reception.errors.date_must_be_future` |
| `is_priority` | boolean | optional, default false | — |
| `clinic_room_id` | number \| null | if type=WALK_IN: required | `reception.errors.room_required` |
| `service_ids` | number[] | if type=WALK_IN: min length 1 | `reception.errors.service_required` |
| `service_package_ids` | number[] | optional | — |
| `reason` | string \| null | optional, max 500 | `reception.errors.reason_too_long` |
| `customer_id` | number \| null | optional | — |

### 9.6 UI States (per screen)

| Screen | Loading | Empty | Error | Permission-denied | Success feedback |
|--------|---------|-------|-------|-------------------|-----------------|
| S1 RegistrationForm | submit spinner trên nút Lưu | — | field errors via `mapBackendErrors` | — | toast `reception.toasts.visit_created` |
| S2 CustomerSearch | search spinner | empty-state "Không tìm thấy khách hàng" | inline error banner | — | — |
| S3 ExaminationList | table skeleton | empty-state "Không có phiếu khám trong khoảng thời gian này" | retry banner | Ẩn nút Xóa với non-admin | toast cancel/delete success |
| S4 AppointmentList | table skeleton | empty-state "Không có lịch hẹn" | retry banner | — | toast check-in / cancel success |
| S5 CustomerModal | list skeleton | "Không tìm thấy" | inline error | — | — |
| S9 AppointmentDrawer | skeleton | — | error state | — | — |

### 9.7 Presentation & UX Behavior

- **UI-001**: Field "Ngày khám" chỉ hiển thị khi `registration_type = SCHEDULED`; ẩn hoàn toàn (unmount) khi `WALK_IN`. Reflects PROPOSED_BR:walkin-no-appointment-date.
- **UI-002**: Chuyển giữa Tab 1/2/3 không reset state của RegistrationForm (Cột 1). Store form state trong feature-level Zustand store hoặc React state lifted lên `ReceptionLayout`.
- **UI-003**: Kết quả tìm kiếm KH = 1 → auto-fill không mở modal; > 1 → mở `CustomerSearchModal`. Reflects Flow của §6.4.
- **UI-004**: Nút "Tiếp nhận" ở Tab 3 chỉ visible khi `Appointment.status = BOOKED`. Nút "Hủy" ở Tab 3 chỉ visible khi `status = BOOKED`. Reflects PROPOSED_BR:appointment-cancel-precheck-only.
- **UI-005**: Date Range Picker ở Tab 2 enforce cùng tháng — nếu chọn ngày cuối sang tháng khác, auto clamp về ngày cuối tháng hiện tại. Reflects PROPOSED_BR:visit-list-date-same-month.
- **UI-006**: Nút "Xóa" ở Tab 2 chỉ render với role `admin` / `manager`. Reflects PROPOSED_BR:visit-delete-permission.
- **UI-007**: Search input tra cứu KH debounced 300ms trước khi gọi API.
- **UI-008**: Badge trạng thái tô màu: WAITING (yellow), IN_PROGRESS (blue), COMPLETED (green), CANCELLED (red), OVERDUE (orange).

### 9.8 Navigation, Global State & i18n

- **Navigation**: Tất cả trên 1 route `/reception`. Tab switch = URL query param `?tab=1|2|3` để giữ state khi refresh.
- **Global state**: Auth store (role check cho nút Xóa). Form Cột 1 dùng feature-local Zustand store `useReceptionFormStore`.
- **i18n namespaces mới**:
  - `messages/{locale}/reception.json` — labels, errors, toasts, empty states
  - `messages/{locale}/enums.json` — thêm keys: `registration_type.*`, `visit_status.*`, `appointment_status.overdue`

---

## 10. NOTIFICATIONS

Không có notification trong giai đoạn này. (Out of scope — xem §4)

---

## 11. API ENDPOINT INVENTORY

| Method | Endpoint | Guard | Description | Related Flow |
|--------|----------|-------|-------------|--------------|
| `POST` | `/api/v1/visits` | sanctum | Tạo phiếu khám mới (walk-in hoặc scheduled) | Flow 1, Flow 2 |
| `POST` | `/api/v1/visits/from-appointment` | sanctum | Tiếp nhận KH từ lịch hẹn → tạo Visit + update Appointment | Flow 5 |
| `GET` | `/api/v1/visits` | sanctum | Danh sách phiếu khám với filter ngày, trạng thái, phân trang | Flow 8 |
| `PATCH` | `/api/v1/visits/{id}/cancel` | sanctum | Hủy phiếu khám (status: WAITING/IN_PROGRESS → CANCELLED) | Flow 3 |
| `DELETE` | `/api/v1/visits/{id}` | sanctum (admin/manager) | Xóa mềm phiếu khám | Flow 4 |
| `PATCH` | `/api/v1/appointments/{id}/cancel` | sanctum | Hủy lịch hẹn (status: BOOKED → CANCELLED) | Flow 6 |
| `GET` | `/api/v1/appointments` | sanctum | Danh sách lịch hẹn với multi-filter | Flow 9 _(hiện có, cần thêm filter)_ |
| `GET` | `/api/v1/appointments/{id}` | sanctum | Chi tiết lịch hẹn + activity log | Flow 10 _(hiện có)_ |
| `GET` | `/api/v1/master-data` | sanctum | Batch lookup: clinic_rooms, services, service_packages | S1 form dropdowns |

**API mới cho Appointment (method chuyên biệt):**

> Thay vì dùng `PATCH /appointments/{id}` với `body.status = CANCELLED` (generic update), cần thêm route chuyên biệt `/cancel` để xử lý validation nghiệp vụ riêng của module tiếp nhận mà không làm phức tạp generic update endpoint.

---

## 12. IMPLEMENTATION TASKS

### Phase 1 — Database Foundation

- [ ] Migration: tạo bảng `clinic_rooms`
- [ ] Migration: tạo bảng `services`
- [ ] Migration: tạo bảng `service_packages`
- [ ] Migration: tạo bảng `visits`
- [ ] Migration: tạo pivot `visit_services`
- [ ] Migration: tạo pivot `visit_packages`
- [ ] Migration: thêm column `OVERDUE(7)` vào `AppointmentStatusEnum` (và update migration nếu cần)
- [ ] Model: `Visit` (relations, soft delete, LogsActivity, boot for code/queue_number)
- [ ] Model: `ClinicRoom`, `Service`, `ServicePackage`
- [ ] Enum: `RegistrationTypeEnum`, `VisitStatusEnum`
- [ ] Enum: Update `AppointmentStatusEnum` + i18n key `overdue`
- [ ] Seeder: dữ liệu mẫu clinic_rooms, services, service_packages
- [ ] Factory: `VisitFactory` cho testing

### Phase 2a — Background Job

- [ ] Job: `MarkOverdueAppointmentsJob` (query + bulk update)
- [ ] Schedule: đăng ký cron 00:01 hàng ngày trong `routes/console.php`
- [ ] Test: Unit test cho job

### Phase 2b — API Backend

- [ ] Master Data: đăng ký resources `clinic_rooms`, `services`, `service_packages` trong `MasterDataService`
- [ ] Visit API: `StoreVisitRequest`, `VisitService::create()`, `VisitController::store()`
- [ ] Visit API: `POST /visits/from-appointment` — `VisitService::createFromAppointment()`
- [ ] Visit API: `GET /visits` — `IndexVisitRequest`, `VisitService::list()`, `VisitResource`
- [ ] Visit API: `PATCH /visits/{id}/cancel` — `VisitService::cancel()`
- [ ] Visit API: `DELETE /visits/{id}` — `VisitPolicy`, `VisitService::delete()`
- [ ] Appointment API: `PATCH /appointments/{id}/cancel` — route chuyên biệt + validation BOOKED
- [ ] Feature tests: Flow 1-7

### Phase 3a — FE Foundation

- [ ] `useReceptionFormStore` (Zustand) — state Cột 1 persistent across tabs
- [ ] `VisitRepository` + `IVisitRepository` interface + Zod schemas
- [ ] MSW mocks cho tất cả Visit endpoints
- [ ] `useReceptionMasterData()` hook — batch master data

### Phase 3b — FE Registration Form (Cột 1 — S1)

- [ ] `RegistrationForm` container + `StoreVisitSchema`
- [ ] `RegistrationTypeSelect`, `AppointmentDatePicker` (conditional)
- [ ] `ClinicRoomSelect`, `ServiceMultiSelect`, `PackageMultiSelect` (Master Data)
- [ ] `PriorityToggle`, `ReasonTextarea`
- [ ] Submit handler + `useCreateVisit()` hook + toast feedback

### Phase 3c — FE Tab 1 (Thông Tin KH — S2)

- [ ] `CustomerSearchBar` + `useSearchCustomers()` hook (debounced 300ms)
- [ ] `CustomerSearchModal` (S5) — multi-result list
- [ ] `CustomerInfoCard` — readonly display, disabled fields

### Phase 3d — FE Tab 2 (Danh Sách Khám — S3)

- [ ] `ExaminationFilters` — date range picker với same-month enforcement
- [ ] `ExaminationTable` — columns + status badges + actions
- [ ] `useCancelVisit()` + `CancelVisitDialog` (S6)
- [ ] `useDeleteVisit()` + `DeleteVisitDialog` (S7) — conditional render by role

### Phase 3e — FE Tab 3 (Lịch Hẹn — S4)

- [ ] `AppointmentFilters` — multi-field search + date + status
- [ ] `AppointmentTable` — columns + badges + BOOKED-conditional actions
- [ ] `useCreateVisitFromAppointment()` + check-in handler
- [ ] `CancelAppointmentDialog` (S8)
- [ ] `AppointmentDetailDrawer` (S9) — info + activity log

### Phase 4 — Quality

- [ ] Unit tests: `VisitStatusEnum` transitions, `RegistrationTypeEnum`
- [ ] Feature tests: tất cả flows (happy + error cases)
- [ ] FE Vitest: `RegistrationForm`, `ExaminationTable`, `AppointmentTable`
- [ ] i18n: `reception.json` cho vi/en
- [ ] Code format: `php artisan code:format` + `pnpm run lint`

---

## 13. DRAFT COVERAGE MATRIX

| Draft File | Draft Section | Draft Item | Requirement Section | Status |
|------------|---------------|-----------|---------------------|--------|
| overview.md | §1 Mục đích | Tạo phiếu đăng ký khám | Flow 1, Flow 2 | ✅ Covered |
| overview.md | §1 Mục đích | Tra cứu thông tin KH | Flow §6.4, S2 | ✅ Covered |
| overview.md | §1 Mục đích | Tiếp nhận KH đến khám | Flow 5 | ✅ Covered |
| overview.md | §1 Mục đích | Quản lý danh sách khám | Flow 8, S3 | ✅ Covered |
| overview.md | §1 Mục đích | Quản lý KH đặt lịch trước | Flow 9, S4 | ✅ Covered |
| overview.md | §2.1 Cột 1 | Mã đăng ký khám | `visits.code`, PROPOSED_BR:visit-code-daily-seq | ✅ Covered |
| overview.md | §2.1 Cột 1 | Hình thức đăng ký | `RegistrationTypeEnum`, `visits.registration_type` | ✅ Covered |
| overview.md | §2.1 Cột 1 | Ngày khám | `visits.appointment_date` (SCHEDULED only) | ✅ Covered |
| overview.md | §2.1 Cột 1 | Ưu tiên | `visits.is_priority` (boolean) | ✅ Covered |
| overview.md | §2.1 Cột 1 | Phòng khám | `clinic_rooms` table, `visits.clinic_room_id` | ✅ Covered |
| overview.md | §2.1 Cột 1 | Dịch vụ khám | `services` table, `visit_services` pivot | ✅ Covered |
| overview.md | §2.1 Cột 1 | Gói khám | `service_packages` table, `visit_packages` pivot | ✅ Covered |
| overview.md | §2.1 Cột 1 | Lý do khám | `visits.reason`, max:500 | ✅ Covered |
| overview.md | §3 Quy tắc chuyển tab | Không reset Cột 1 khi chuyển tab | UI-002, `useReceptionFormStore` | ✅ Covered |
| 01-dang-ky-kham.md | §3.1 Chờ khám | Mã auto gen, không sửa | PROPOSED_BR:visit-code-daily-seq | ✅ Covered |
| 01-dang-ky-kham.md | §3.1 Chờ khám | Không hiển thị ngày khám | UI-001, PROPOSED_BR:walkin-no-appointment-date | ✅ Covered |
| 01-dang-ky-kham.md | §3.1 Chờ khám | Bắt buộc phòng khám + dịch vụ | PROPOSED_BR:walkin-requires-room-service | ✅ Covered |
| 01-dang-ky-kham.md | §3.1 Chờ khám | Thứ tự khám auto gen | PROPOSED_BR:visit-queue-number-daily | ✅ Covered |
| 01-dang-ky-kham.md | §3.2 Đặt lịch | Hiển thị ngày khám | UI-001 | ✅ Covered |
| 01-dang-ky-kham.md | §3.2 Đặt lịch | Bắt buộc nhập ngày khám | PROPOSED_BR:scheduled-future-date-only | ✅ Covered |
| 01-dang-ky-kham.md | §4 Quy tắc ngày | Chỉ ngày tương lai | PROPOSED_BR:scheduled-future-date-only | ✅ Covered |
| 01-dang-ky-kham.md | §4 Quy tắc ngày | Không cho ngày hiện tại | PROPOSED_BR:scheduled-future-date-only (> today, not ≥) | ✅ Covered |
| 01-dang-ky-kham.md | §5 Kết quả | Sinh mã đăng ký | PROPOSED_BR:visit-code-daily-seq | ✅ Covered |
| 02-thong-tin-khach-hang.md | §2 Tìm kiếm | Theo mã, tên, SĐT | §6.4, `useSearchCustomers()` | ✅ Covered |
| 02-thong-tin-khach-hang.md | §3 Kết quả | Nhiều kết quả → modal | S5, UI-003 | ✅ Covered |
| 02-thong-tin-khach-hang.md | §3 Kết quả | 1 kết quả → auto fill | UI-003 | ✅ Covered |
| 02-thong-tin-khach-hang.md | §4 Thông tin chi tiết | Tất cả trường disabled | `CustomerInfoCard` disabled | ✅ Covered |
| 03-danh-sach-kham.md | §2 Bộ lọc | Date range mặc định hôm nay | `IndexVisitRequest` default | ✅ Covered |
| 03-danh-sach-kham.md | §2 Quy tắc | Cùng tháng | PROPOSED_BR:visit-list-date-same-month | ✅ Covered |
| 03-danh-sach-kham.md | §2 Quy tắc | Không chọn ngày tương lai | PROPOSED_BR:visit-list-no-future-date | ✅ Covered |
| 03-danh-sach-kham.md | §3 Danh sách | Các cột bảng | §9.3 ExaminationTable columns | ✅ Covered |
| 03-danh-sach-kham.md | §4 Hủy lịch | Chưa hoàn thành | PROPOSED_BR:visit-cancel-condition | ✅ Covered |
| 03-danh-sach-kham.md | §4 Hủy lịch | Chuyển → Đã hủy | Flow 3 State Changes | ✅ Covered |
| 03-danh-sach-kham.md | §4 Xóa lịch | Theo phân quyền | PROPOSED_BR:visit-delete-permission | ✅ Covered |
| 03-danh-sach-kham.md | §4 Xóa lịch | Popup xác nhận | S7 DeleteVisitDialog | ✅ Covered |
| 04-dat-lich.md | §2 Bộ lọc | Các trường filter | Flow 9, `IndexAppointmentRequest` | ✅ Covered |
| 04-dat-lich.md | §3 Danh sách | Các cột bảng | §9.3 AppointmentTable columns | ✅ Covered |
| 04-dat-lich.md | §4 Tiếp nhận | Lịch hẹn còn hiệu lực | PROPOSED_BR:appointment-checkin-on-visit | ✅ Covered |
| 04-dat-lich.md | §4 Tiếp nhận | Cấp STT khám | PROPOSED_BR:visit-queue-number-daily | ✅ Covered |
| 04-dat-lich.md | §4 Tiếp nhận | Chuyển → Đã tiếp nhận | Flow 5 State Changes (CHECKED_IN) | ✅ Covered |
| 04-dat-lich.md | §4 Tiếp nhận | Xuất hiện trong DS khám | §6.6, S3 realtime refresh | ✅ Covered |
| 04-dat-lich.md | §4 Hủy lịch | Chưa tiếp nhận | PROPOSED_BR:appointment-cancel-precheck-only | ✅ Covered |
| 04-dat-lich.md | §4 Hủy lịch | Lưu lịch sử | BR-G002 Activity Log | ✅ Covered |
| 04-dat-lich.md | §4 Xem chi tiết | Thông tin phiếu + KH + lịch sử | S9 AppointmentDetailDrawer | ✅ Covered |
| 04-dat-lich.md | §5 Trạng thái | Chờ tiếp nhận / Đã tiếp nhận / Đã hủy / Quá hẹn | `AppointmentStatusEnum` (BOOKED/CHECKED_IN/CANCELLED/OVERDUE) | ✅ Covered |
