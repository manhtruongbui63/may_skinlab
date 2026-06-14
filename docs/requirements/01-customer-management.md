---
title: Quản lý khách hàng
description: Yêu cầu chuẩn cho tính năng Quản lý khách hàng/bệnh nhân tại phòng khám da liễu May Skinlab.
status: pending_implementation
date: 2026-06-15
version: 1.1.0
changelog:
  - version: 1.1.0
    date: 2026-06-15
    summary: Cập nhật yêu cầu phân trang, bộ lọc danh sách và hành động nút Thêm khách hàng theo bản thảo 02-danh-sach.md.
  - version: 1.0.0
    date: 2026-06-14
    summary: Cập nhật đặc tả yêu cầu chi tiết dựa trên phản hồi của người dùng và các tài liệu bản thảo mới (Mã BN, Địa chỉ chi tiết, Ngày sinh, Số điện thoại phụ, Ảnh đại diện, Giữ nguyên trạng thái active/inactive).
---

## 2. OVERVIEW

Xây dựng tính năng quản lý thông tin khách hàng/bệnh nhân, cho phép bác sĩ và nhân viên phòng khám thực hiện các thao tác CRUD, tra cứu danh sách có phân trang và bộ lọc, xem chi tiết thông tin và các tab liên quan (Lịch sử khám, Liệu trình, Hóa đơn công nợ).

Tính năng được nâng cấp các quy tắc nghiệp vụ quan trọng bao gồm:
- Sinh mã bệnh nhân tự động không trùng lặp (`BNxxxxxx`).
- Quản lý địa chỉ chi tiết theo Tỉnh/Thành phố, Phường/Xã từ Master Data kèm cơ chế tự động ghép địa chỉ thông minh.
- Tính tuổi tự động dựa trên Ngày sinh (`birth_date`).
- Quản lý Số điện thoại phụ và Ảnh đại diện.
- Giữ nguyên trạng thái nhị phân của khách hàng (`ACTIVE` / `INACTIVE`).

## 3. CONTEXT

- **Module**: `Customer` thuộc domain `Patient Management`.
- **Related modules**: `Visit`, `TreatmentPlan`, `Invoice`, `Appointment`, `MasterData`.
- **Guards**: `auth:sanctum` – chỉ người dùng đã xác thực (Bác sĩ, Staff) được phép truy cập và thực hiện.
- **Third‑party**: Không có tích hợp bên thứ ba.

## 4. OUT OF SCOPE

- Quản lý thông tin chi tiết các buổi điều trị (nằm trong module `Visit` và `TreatmentPlan`).
- Quản lý chi tiết giao dịch thanh toán và in hóa đơn (nằm trong module `Invoice`).
- Đồng bộ thông tin địa chỉ với các đơn vị vận chuyển bên thứ ba.

## 5. BUSINESS RULES

| ID | Rule | Referenced in | Enforced in (BE) | Enforced in (FE) |
|----|------|---------------|------------------|------------------|
| `PROPOSED_BR:customer-unique-code` | Mã bệnh nhân (Mã BN) là duy nhất, tự động sinh theo định dạng `BNxxxxxx` (với `xxxxxx` là số tự tăng bắt đầu từ 000001), không cho phép chỉnh sửa. | Flow 1, Flow 3 | `Customer` Model Event `creating` | Trạng thái Read-only trong form |
| `PROPOSED_BR:customer-unique-phone` | Số điện thoại chính phải là duy nhất trên hệ thống (bỏ qua bản ghi hiện tại khi cập nhật). | Flow 1, Flow 2 | `StoreCustomerRequest`, `UpdateCustomerRequest` | Schema Zod validation |
| `PROPOSED_BR:customer-age-calculation` | Tuổi bệnh nhân được tính tự động dựa trên ngày sinh: `Tuổi = Năm hiện tại - Năm sinh của birth_date`. | Flow 1, Flow 3 | Accessor `age` trên Model `Customer` | Tính toán tự động tại Client khi thay đổi Ngày sinh |
| `PROPOSED_BR:customer-address-auto-generation` | Địa chỉ tự động ghép theo định dạng: `[Số nhà], [Phường/Xã], [Tỉnh/Thành phố]`. Nếu người dùng đã tự sửa Địa chỉ bằng tay, hệ thống sẽ bật cờ `is_address_manually_edited = true` và không tự động ghi đè trừ khi người dùng nhấn nút kích hoạt tạo lại địa chỉ tự động. | Flow 1 | `CustomerService` tạo mới/cập nhật | Logic form tương tác |
| `BR-APPT-002` | Chỉ cho phép tạo lịch hẹn đối với khách hàng đang ở trạng thái ACTIVE. | Flow 1 | `StoreAppointmentRequest` | Lọc danh sách hoặc thông báo lỗi |

## 6. REQUIREMENT ANALYSIS

- **Mã Bệnh nhân (Mã BN):** Mã này được sinh tự động khi bản ghi được tạo thành công trong DB. Ở chế độ tạo mới, giao diện sẽ hiển thị `BNxxxxxx` ở dạng Read-only (hoặc placeholder chờ sinh).
- **Trạng thái khách hàng:** Theo ý kiến người dùng, giữ nguyên 2 trạng thái nhị phân là `ACTIVE` (1) và `INACTIVE` (0).
- **Tính toán Tuổi:** Giữ lại cột `birth_date` hiện có và không thêm cột `birth_year`. Ở cả giao diện nhập và hiển thị, tuổi sẽ bằng `Năm hiện tại - Năm sinh`. Ví dụ: Ngày sinh là `1995-10-12` -> Năm sinh là `1995`. Năm hiện tại là `2026` -> Tuổi là `31`.
- **Tỉnh/Thành phố và Phường/Xã:** Hệ thống cần bổ sung 2 bảng danh mục địa lý `provinces` và `wards` để lưu danh sách địa phương phục vụ Master Data.
- **Tự động ghép địa chỉ:** Giao diện sẽ tự động ghép chuỗi địa chỉ khi thay đổi `house_number`, `province_id`, hoặc `ward_id` nếu người dùng chưa can thiệp sửa trực tiếp vào textarea `address`. Khi người dùng sửa tay vào textarea `address`, cờ `is_address_manually_edited` sẽ chuyển sang `true`. Một nút bấm "Tạo lại địa chỉ tự động" được hiển thị bên cạnh textarea để người dùng có thể xóa địa chỉ nhập tay và quay lại địa chỉ tự động ghép.

## 7. DATA MODEL UPDATES

### Table: `provinces` [NEW]
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | bigInt | No | – | Primary key |
| name | string | No | – | Tên Tỉnh/Thành phố |
| created_at | timestamp | Yes | null | Tạo lúc |
| updated_at | timestamp | Yes | null | Cập nhật lúc |

### Table: `wards` [NEW]
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | bigInt | No | – | Primary key |
| province_id | bigInt | No | – | Foreign key liên kết tới `provinces` |
| name | string | No | – | Tên Phường/Xã |
| created_at | timestamp | Yes | null | Tạo lúc |
| updated_at | timestamp | Yes | null | Cập nhật lúc |

### Table: `customers` [MODIFY]
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | bigInt | No | – | Primary key |
| code | varchar(20) | No | – | Mã bệnh nhân (Định dạng `BNxxxxxx`, UNIQUE) |
| full_name | string | No | – | Họ và tên khách hàng |
| phone | string | No | – | Số điện thoại chính (UNIQUE) |
| phone_secondary | string | Yes | null | Số điện thoại phụ |
| birth_date | date | Yes | null | Ngày sinh |
| gender | tinyInteger | Yes | null | Giới tính (Enum: 1 = Nam, 2 = Nữ, 3 = Khác) |
| house_number | string | Yes | null | Số nhà/tên đường |
| province_id | bigInt | Yes | null | FK liên kết tới `provinces` |
| ward_id | bigInt | Yes | null | FK liên kết tới `wards` |
| address | text | Yes | null | Địa chỉ đầy đủ (tối đa 255 ký tự) |
| is_address_manually_edited | boolean | No | `false` | Đánh dấu người dùng đã tự nhập tay địa chỉ |
| avatar_path | string | Yes | null | Đường dẫn file ảnh đại diện |
| source | tinyInteger | No | 5 | Nguồn khách hàng (Enum: 1 = Facebook, 2 = Google, 3 = Website, 4 = Referral, 5 = Walk-in) |
| status | tinyInteger | No | 1 | Trạng thái (Enum: 0 = Inactive, 1 = Active) |
| deleted_at | timestamp | Yes | null | Soft delete timestamp |
| created_at | timestamp | No | – | Tạo lúc |
| updated_at | timestamp | No | – | Cập nhật lúc |

---

## 8. PROCESSING FLOWS

### Flow 1: Tạo mới / Chỉnh sửa khách hàng
1. Người dùng mở Form thông tin khách hàng (chế độ Tạo mới hoặc Chỉnh sửa).
2. Nhập các thông tin cá nhân. Khi người dùng thay đổi Tỉnh/Thành phố (`province_id`), hệ thống:
   - Tự động xóa giá trị Phường/Xã (`ward_id`) hiện tại trên form.
   - Gọi API lấy danh sách Phường/Xã tương ứng với Tỉnh/Thành phố mới.
3. Khi người dùng nhập Ngày sinh (`birth_date`), hệ thống tự động tính tuổi hiển thị: `Năm hiện tại - Năm sinh`.
4. Khi thay đổi Số nhà (`house_number`), Phường/Xã (`ward_id`), hoặc Tỉnh/Thành phố (`province_id`), nếu cờ `is_address_manually_edited` đang là `false`, hệ thống tự động ghép địa chỉ ghi vào ô Địa chỉ (`address`).
5. Nếu người dùng chỉnh sửa thủ công nội dung trong ô Địa chỉ (`address`), cờ `is_address_manually_edited` sẽ chuyển sang `true`. Nếu nhấn nút "Tạo lại địa chỉ tự động", hệ thống sẽ reset cờ về `false` và tự động cập nhật lại địa chỉ từ Số nhà, Phường/Xã, Tỉnh/Thành phố.
6. Submit form:
   - **Tạo mới**: Hệ thống sinh tự động mã `code` bằng cách tìm mã lớn nhất dạng `BNxxxxxx` trong database, cộng 1 và lưu. Thực hiện trong database transaction với lock để tránh trùng lặp.
     **State Changes:**
     - `customers.code` = `BNxxxxxx`
     - `customers.is_address_manually_edited` = giá trị cờ trên Form
     - `customers.status` = `1` (Active)
   - **Chỉnh sửa**: Cập nhật các trường thông tin thay đổi. Mã `code` và Tuổi là Read-only không được phép chỉnh sửa.
7. Trả về thông tin khách hàng mới/đã cập nhật.

**Error Cases:**
| Error Condition | System Behavior | State Changes |
|-----------------|-----------------|---------------|
| Số điện thoại chính bị trùng | Trả về lỗi validate 422 `phone_taken` | Không có thay đổi |
| Tỉnh/Thành phố và Phường/Xã không khớp | Trả về lỗi validate 422 | Không có thay đổi |

---

### Flow 2: Đọc danh sách khách hàng
1. Component hiển thị danh sách khách hàng gọi API `GET /api/customers` kèm các tham số mặc định: `page = 1`, `per_page = 10`, `search = ""` (rỗng), `gender = "all"` (Tất cả), `status = "all"` (Tất cả).
2. Khi người dùng thay đổi kích thước trang (`per_page`), hệ thống tự động reset trang hiện tại (`page`) về 1, và gọi lại API danh sách với giá trị `per_page` mới.
3. Hệ thống tải danh sách khách hàng từ database (eager load `province` và `ward`).
4. Trả về danh sách định dạng JSON có phân trang kèm meta.

---

### Flow 3: Xem chi tiết khách hàng
1. Người dùng truy cập chi tiết một khách hàng. Giao diện thực hiện tải song song:
   - Thông tin cá nhân khách hàng (`GET /api/customers/{id}`).
   - Các thông tin liên quan theo dạng Tab: Lịch sử khám, Liệu trình, Hóa đơn công nợ.
2. Trả về và hiển thị thông tin.

---

## 9. UI/UX & FRONTEND IMPLICATIONS

### 9.1 FE Scope Classification
- **Complexity tier**: Standard
- **Flow type**: C (Full CRUD)
- **Data mode**: `http` (API ready)

### 9.2 Screen & Route Inventory

| # | Screen / Dialog | Route (App Router) | Flow | Renders | Primary API | Notes |
|---|-----------------|--------------------|------|---------|-------------|-------|
| S1 | Danh sách khách hàng | `app/(main)/customers/page.tsx` | B | Bảng danh sách khách hàng + bộ lọc + phân trang | `GET /api/customers` | Synced URL filters (page, per_page, search, status, gender) |
| S2 | Tạo mới khách hàng | `app/(main)/customers/create/page.tsx` (hoặc Dialog) | A | Form điền thông tin đầy đủ | `POST /api/customers` | Mở từ S1 |
| S3 | Chỉnh sửa khách hàng | `app/(main)/customers/[id]/edit/page.tsx` (hoặc Dialog) | A | Form điền thông tin được điền sẵn dữ liệu | `PATCH /api/customers/{id}` | Mở từ S1 hoặc S4 |
| S4 | Chi tiết khách hàng | `app/(main)/customers/[id]/page.tsx` | D | Layout 2 cột: Cột trái (Thông tin cá nhân), Cột phải (Tabs nội dung) | `GET /api/customers/{id}` | Nút quay lại danh sách, Nút sửa |

### 9.3 Component Tree
S1 — Danh sách khách hàng (`features/customers/`)
- CustomersPage (Container)
  - CustomersToolbar (Thanh công cụ: Ô tìm kiếm, Dropdown lọc giới tính, trạng thái, Nút Xóa bộ lọc, Nút Thêm khách hàng)
  - CustomersTable (Bảng hiển thị: Mã BN, Họ tên, SĐT chính, Giới tính, Ngày sinh/Tuổi, Trạng thái, Cột Action)
  - CustomersPagination (Phân trang: trang hiện tại, số bản ghi trên mỗi trang)

S2/S3 — Form thông tin khách hàng (`features/customers/`)
- CustomerFormModal (Hoặc page)
  - Form field Mã BN (Read-only)
  - Form field Họ tên
  - Form field Giới tính (Select), Năm sinh (Date Picker), Tuổi (Read-only)
  - Form field Trạng thái (Select)
  - Form field Số điện thoại chính, Số điện thoại phụ
  - Form field Số nhà, Tỉnh/Thành phố (Select tìm kiếm), Phường/Xã (Select tìm kiếm)
  - Form field Địa chỉ (Textarea) + Nút Tạo địa chỉ tự động
  - Form field Ảnh đại diện (File upload component)
  - Action buttons: Lưu, Lưu & Tạo mới, Hủy

S4 — Chi tiết khách hàng (`features/customers/`)
- CustomerDetailPage
  - CustomerDetailCard (Thông tin cơ bản cột trái)
  - CustomerRelatedTabs (Tab chứa Lịch sử khám, Liệu trình, Hóa đơn công nợ cột phải)

### 9.4 Data Layer

| Hook | Repository method | API endpoint | Returns | Used by |
|------|-------------------|--------------|---------|---------|
| `useCustomers(filters)` | `CustomerRepository.list` | `GET /api/customers` | Paginated `Customer[]` | S1 |
| `useCustomer(id)` | `CustomerRepository.get` | `GET /api/customers/{id}` | `Customer` | S4, S3 |
| `useCreateCustomer()` | `CustomerRepository.create` | `POST /api/customers` | `Customer` | S2 |
| `useUpdateCustomer(id)` | `CustomerRepository.update` | `PATCH /api/customers/{id}` | `Customer` | S3 |
| `useProvinces()` | `MasterDataRepository.provinces` | `GET /api/master-data?resources[provinces]={}` | `Province[]` | S2, S3 |
| `useWards(provinceId)` | `MasterDataRepository.wards` | `GET /api/master-data?resources[wards]={"province_id":id}` | `Ward[]` | S2, S3 |

### 9.5 Forms & Zod Schemas
Zod Schema: `customerSchema`
- `full_name`: string (bắt buộc, tối đa 255 ký tự)
- `phone`: string (bắt buộc, đúng định dạng số điện thoại, duy nhất)
- `phone_secondary`: string (tùy chọn, đúng định dạng số điện thoại nếu nhập)
- `birth_date`: date/string (bắt buộc, ngày sinh hợp lệ không quá năm hiện tại)
- `gender`: number (bắt buộc, in [1, 2, 3])
- `status`: number (bắt buộc, in [0, 1])
- `house_number`: string (tùy chọn)
- `province_id`: number (tùy chọn)
- `ward_id`: number (tùy chọn)
- `address`: string (tùy chọn, tối đa 255 ký tự)
- `is_address_manually_edited`: boolean

### 9.6 UI States
- Loading: Skeleton table hiển thị trên S1 khi danh sách đang tải, Spinner hiển thị khi submit form trên S2/S3.
- Empty: Trạng thái trống trên bảng S1 nếu không tìm thấy bản ghi.
- Error: Thông báo validation dưới các trường nhập liệu tương ứng trên form.

### 9.7 Presentation & UX Behavior
- **UI-001**: Ô tìm kiếm danh sách khách hàng được debounce 300ms trước khi gọi API.
- **UI-002**: Khi thay đổi Tỉnh/Thành phố, reset giá trị Phường/Xã trên form và gọi API fetch danh sách Phường/Xã mới.
- **UI-003**: Khi gõ vào ô Địa chỉ (address), set cờ `is_address_manually_edited` thành `true`.
- **UI-004**: Nhấn nút "Tạo địa chỉ tự động" sẽ reset cờ và ghép địa chỉ theo định dạng `[Số nhà], [Phường/Xã], [Tỉnh/Thành phố]`.
- **UI-005**: Nút "Xóa bộ lọc" (Clear Filters) ở trạng thái mặc định sẽ bị Disabled. Nút này chỉ chuyển sang Enabled khi tồn tại ít nhất một bộ lọc khác giá trị mặc định (`search !== ""` hoặc `gender !== "all"` hoặc `status !== "all"`). Việc thay đổi `page` hay `per_page` không làm thay đổi trạng thái kích hoạt của nút này. Khi nhấn nút này, tất cả các bộ lọc tìm kiếm được reset về giá trị mặc định ban đầu và nút quay lại trạng thái Disabled.
- **UI-006**: URL State Synchronization: Để giữ thanh địa chỉ sạch gọn, các tham số lọc và phân trang có giá trị trùng với mặc định (ví dụ: `page=1`, `per_page=10`, `search=""`, v.v.) sẽ không được hiển thị trên URL query string. Chỉ đồng bộ các tham số có giá trị khác mặc định lên URL.
- **UI-007**: Nút "Thêm khách hàng" (Add Customer Button) luôn hiển thị ở góc trên bên phải màn hình danh sách, cùng hàng với khu vực bộ lọc tìm kiếm và luôn ở trạng thái Active. Khi nhấn nút này, hệ thống sẽ mở Modal `CustomerFormModal` ở chế độ Tạo mới (Create Mode) thay vì chuyển trang.

---

## 10. NOTIFICATIONS

- Toast thông báo tạo mới / cập nhật khách hàng thành công.

---

## 11. API ENDPOINT INVENTORY

| Method | Endpoint | Guard | Description | Related Flow |
|--------|----------|-------|-------------|--------------|
| `GET` | `/api/customers` | `auth:sanctum` | Danh sách khách hàng kèm phân trang và lọc | Flow 2 |
| `GET` | `/api/customers/{id}` | `auth:sanctum` | Chi tiết một khách hàng | Flow 3 |
| `POST` | `/api/customers` | `auth:sanctum` | Tạo mới khách hàng, sinh Mã BN tự động | Flow 1 |
| `PATCH` | `/api/customers/{id}` | `auth:sanctum` | Cập nhật khách hàng | Flow 1 |
| `DELETE` | `/api/customers/{id}` | `auth:sanctum` | Soft delete khách hàng | – |

---

## 12. IMPLEMENTATION TASKS

### Phase 1: Database & Backend Foundation
1. Tạo migration bổ sung bảng `provinces` và `wards`, thêm các cột địa chỉ, mã BN, điện thoại phụ, cờ chỉnh sửa tay vào bảng `customers`.
2. Tạo các Model `Province` và `Ward`.
3. Viết Seeder cơ bản cho một số Tỉnh/Thành phố và Phường/Xã mẫu ở Việt Nam.
4. Cập nhật Model `Customer`: định nghĩa relations với `Province`, `Ward`, dynamic accessor `age`, và Model Event `creating` sinh mã `BNxxxxxx`.
5. Tạo dữ liệu migration gán mã BN hợp lệ cho các bản ghi khách hàng cũ đã có sẵn trong DB.

### Phase 2: API & Master Data Registration
1. Cập nhật `MasterDataService` để đăng ký các resource `provinces` và `wards` hỗ trợ query lọc theo `province_id`.
2. Cập nhật DTOs (`StoreCustomerData`, `UpdateCustomerData`, `IndexCustomerData`) và Requests validation (`StoreCustomerRequest`, `UpdateCustomerRequest`, `IndexCustomerRequest`).
3. Cập nhật `CustomerService` và `CustomerController` để xử lý dữ liệu mới trong CRUD.
4. Viết các test case trong `CustomerStoreTest` và `CustomerUpdateTest`.

### Phase 3: Frontend Integration
1. Cập nhật Zod validation schema và types định nghĩa khách hàng.
2. Xây dựng hook truy xuất Master Data cho Tỉnh/Thành phố và Phường/Xã.
3. Thiết kế lại Form nhập liệu bệnh nhân (vị trí hiển thị các trường, logic tự động tính tuổi từ ngày sinh, reset phường xã khi đổi tỉnh thành, tự động ghép địa chỉ).
4. Thiết kế giao diện danh sách S1 và trang chi tiết S4 với cấu trúc 2 cột cùng các Tab.
5. Kiểm thử E2E (Playwright) và Unit test (Vitest) cho tính năng.

---

## 13. DRAFT COVERAGE MATRIX

| Draft Section | Draft Item | Requirement Section | Status |
|---------------|-----------|---------------------|--------|
| `01-tao-thong-tin.md` | Mã BN: Auto Generate format `BNxxxxxx` | BR `customer-unique-code`, Flow 1 | ✅ Covered |
| `01-tao-thong-tin.md` | Năm sinh & tính tuổi tự động | BR `customer-age-calculation`, Flow 1 | ✅ Covered |
| `01-tao-thong-tin.md` | Địa chỉ theo Tỉnh/Thành, Phường/Xã | BR `customer-address-auto-generation`, Flow 1, 7 | ✅ Covered |
| `01-tao-thong-tin.md` | Trạng thái khách hàng | Giữ nguyên ACTIVE/INACTIVE theo phản hồi | ✅ Covered |
| `02-danh-sach.md` | Page=1, per_page=10, bộ lọc danh sách | Flow 2, 9.2, 9.3 | ✅ Covered |
| `03-chi-tiet.md` | Chi tiết, Nút Sửa, tab Lịch sử/Liệu trình/Hóa đơn | Flow 3, 9.2, 9.3 | ✅ Covered |
