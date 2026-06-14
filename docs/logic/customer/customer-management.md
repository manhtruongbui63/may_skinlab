---
module: customer
title: Customer Management — Quản Lý Khách Hàng
description: Luồng CRUD khách hàng với validation, policy, và tính toán công nợ.
type: workflow
priority: high
version: "1.1.0"
changelog:
  - version: "1.1.0"
    date: "2026-06-14"
    summary: "Register official BR-CUST codes and document location structures."
  - version: "1.0.0"
    date: "2026-06-11"
    summary: "Initial customer management flow doc."
related_files:
  - backend/app/Http/Controllers/Api/CustomerController.php
  - backend/app/Services/Api/CustomerService.php
  - backend/app/DTOs/Api/Customer/IndexCustomerData.php
  - backend/app/DTOs/Api/Customer/StoreCustomerData.php
  - backend/app/DTOs/Api/Customer/UpdateCustomerData.php
  - backend/app/Http/Requests/Customer/IndexCustomerRequest.php
  - backend/app/Http/Requests/Customer/StoreCustomerRequest.php
  - backend/app/Http/Requests/Customer/UpdateCustomerRequest.php
  - backend/app/Http/Resources/Customer/CustomerResource.php
  - backend/app/Policies/CustomerPolicy.php
  - backend/app/Models/Customer.php
  - backend/app/Factories/ApiFactory.php
  - backend/routes/api.php
---

## OVERVIEW

API Customer quản lý toàn bộ vòng đời khách hàng: tạo mới, xem danh sách có filter, xem chi tiết, cập nhật, và xóa mềm.

| Component | File |
|---|---|
| Route | `routes/api.php` |
| Controller | `Api/CustomerController.php` |
| Service | `Api/CustomerService.php` |
| DTOs | `Customer/IndexCustomerData.php`, `StoreCustomerData.php`, `UpdateCustomerData.php` |
| FormRequests | `Customer/IndexCustomerRequest.php`, `StoreCustomerRequest.php`, `UpdateCustomerRequest.php` |
| Resource | `Customer/CustomerResource.php` |
| Policy | `CustomerPolicy.php` |

## RBAC

- `viewAny`: Bác sĩ và staff đã đăng nhập có thể xem danh sách khách hàng.
- `view`: Bác sĩ và staff đã đăng nhập có thể xem chi tiết khách hàng.
- `create`: Bác sĩ và staff đã đăng nhập có thể tạo khách hàng mới.
- `update`: Bác sĩ và staff đã đăng nhập có thể cập nhật khách hàng.
- `delete`: Bác sĩ và staff đã đăng nhập có thể xóa khách hàng.

## CONTEXT

Yêu cầu auth middleware (`auth:sanctum`). Sử dụng Repository pattern qua `ApiFactory` để resolve service. API trả về enums ở dạng object `{value, label}`.

## ENTITIES

Customer → Lưu trữ thông tin cá nhân khách hàng.
- `code`: Mã bệnh nhân, tự động sinh theo mẫu `BNxxxxxx` tăng dần liên tiếp (ví dụ: `BN000001`, `BN000002`). (**BR-CUST-001**)
- `status`: CustomerStatusEnum (0: Inactive, 1: Active).
- `gender`: GenderEnum (1: Nam, 2: Nữ, 3: Khác).
- `source`: CustomerSourceEnum (1: Facebook, 2: Google, 3: Website, 4: Referral, 5: Walk-in).
- `phone_secondary`: Số điện thoại phụ.
- `house_number`: Số nhà.
- `province_id`: ID của Tỉnh/Thành phố.
- `ward_id`: ID của Phường/Xã (Phải thuộc về `province_id`).
- `address`: Địa chỉ đầy đủ (Ghép tự động hoặc tự do). (**BR-CUST-004**)
- `is_address_manually_edited`: Cờ đánh dấu có tự sửa tay địa chỉ hay không.
- `avatar_path`: Đường dẫn ảnh đại diện.
- `outstanding_amount`: Computed field - tổng công nợ từ các hóa đơn chưa thanh toán.
- `age`: Computed field - tuổi của bệnh nhân (Năm hiện tại - năm sinh từ `birth_date`). (**BR-CUST-003**)

## FLOW

### 1. List Customers (GET /api/customers)

1. **Auth Check** — Middleware `auth:sanctum` đảm bảo user đã đăng nhập.
2. **Validation** — `IndexCustomerRequest` validate query params:
   - `search`: string, max 100, tìm kiếm theo tên hoặc số điện thoại.
   - `gender`: optional, in [1,2,3].
   - `source`: optional, in [1,2,3,4,5].
   - `status`: optional, in [0,1].
   - `per_page`: optional, min 1, max 100, default 10.
3. **DTO Conversion** — `IndexCustomerData::from()` tạo DTO từ validated data.
4. **Service Layer** — `CustomerService::list()`:
   - Build query với eager load `province` và `ward`.
   - Apply search filter (LIKE %%) cho `full_name` và `phone`.
   - Apply exact filters cho `gender`, `source`, `status`.
   - Return `LengthAwarePaginator`.
5. **Response** — `CustomerResource::collection()` wrap data với meta pagination.

### 2. Show Customer (GET /api/customers/{id})

1. **Auth Check** — Middleware `auth:sanctum`.
2. **Policy Check** — `CustomerPolicy::view()` cho phép nếu user đã đăng nhập.
3. **Route Model Binding** — Laravel tự động resolve `Customer` từ ID.
4. **Service Layer** — `CustomerService::getDetail()` trả về Customer với eager load `province` và `ward`.
5. **Response** — `CustomerResource` transform data, bao gồm `outstanding_amount` computed.

### 3. Create Customer (POST /api/customers)

1. **Auth Check** — Middleware `auth:sanctum`.
2. **Policy Check** — `CustomerPolicy::create()` cho phép nếu user đã đăng nhập.
3. **Validation** — `StoreCustomerRequest` validate:
   - `full_name`: required, string, max 255.
   - `phone`: required, string, max 50, regex `/^\+?[0-9]{7,15}$/`, unique trong `customers` table (**BR-CUST-002**).
   - `phone_secondary`: optional, string, max 50, regex `/^\+?[0-9]{7,15}$/`.
   - `birth_date`: required, date format Y-m-d.
   - `gender`: required, in [1,2,3].
   - `house_number`: optional, string, max 255.
   - `province_id`: optional, exists in `provinces`.
   - `ward_id`: optional, exists in `wards` (Phải thuộc về `province_id`).
   - `address`: optional, string, max 255.
   - `is_address_manually_edited`: optional, boolean.
   - `avatar_path`: optional, string, max 255.
   - `source`: optional, in [1,2,3,4,5].
   - `status`: required, in [0,1].
4. **DTO Conversion** — `StoreCustomerData::from()` tạo DTO.
5. **Service Layer** — `CustomerService::create()`:
   - Giải quyết tự động ghép địa chỉ (**BR-CUST-004**): Nếu `is_address_manually_edited = false` và được truyền Số nhà, Tỉnh/Thành, Phường/Xã, địa chỉ sẽ tự động được ghép theo mẫu `[Số nhà], [Tên Phường/Xã], [Tên Tỉnh/Thành phố]`. Nếu cờ bằng `true`, giữ nguyên giá trị `address` người dùng nhập tay.
   - Trình khởi tạo Model `boot` tự động sinh mã sequential `code` theo mẫu `BNxxxxxx` không trùng lặp (**BR-CUST-001**).
   - Create new Customer record.
   - Return created Customer.
6. **Response** — `CustomerResource` với HTTP 201.

### 4. Update Customer (PATCH /api/customers/{id})

1. **Auth Check** — Middleware `auth:sanctum`.
2. **Policy Check** — `CustomerPolicy::update()` cho phép nếu user đã đăng nhập.
3. **Validation** — `UpdateCustomerRequest` validate (các field là `sometimes`):
   - `phone`: nếu có, phải unique (bỏ qua record hiện tại) (**BR-CUST-002**).
   - `ward_id`: nếu có và có thay đổi liên quan đến địa lý, phải thuộc về `province_id`.
4. **DTO Conversion** — `UpdateCustomerData::from()` tạo DTO.
5. **Service Layer** — `CustomerService::update()`:
   - Find customer by ID, throw 404 nếu không tìm thấy.
   - Giải quyết địa chỉ tự động tương tự luồng Create nếu cờ `is_address_manually_edited = false` và có thay đổi địa lý.
   - Update các field được truyền.
   - Return updated Customer.
6. **Response** — `CustomerResource` với HTTP 200.

### 5. Delete Customer (DELETE /api/customers/{id})

1. **Auth Check** — Middleware `auth:sanctum`.
2. **Policy Check** — `CustomerPolicy::delete()` cho phép nếu user đã đăng nhập.
3. **Route Model Binding** — Laravel resolve `Customer`.
4. **Service Layer** — `CustomerService::delete()`:
   - Gọi `$customer->delete()` (soft delete).
5. **Response** — HTTP 204.

## RULES

- ALWAYS validate `phone` là unique khi tạo mới (**BR-CUST-002**).
- ALWAYS bỏ qua unique check cho `phone` của record hiện tại khi update.
- ALWAYS format `gender`, `source`, `status` thành object `{value, label}` trong response.
- ALWAYS trả về `outstanding_amount` trong detail và list (**PROPOSED_BR:outstanding-calculation**).
- ALWAYS dùng soft delete cho delete operation.
- ALWAYS validate `birth_date` format là `Y-m-d` và phải trước ngày hôm nay.
- ALWAYS tự sinh mã sequential `code` dạng `BNxxxxxx` khi tạo khách hàng mới (**BR-CUST-001**).
- ALWAYS tự động ghép địa chỉ `address` dựa trên Số nhà, Xã/Phường, Tỉnh/Thành phố nếu cờ `is_address_manually_edited` là `false` (**BR-CUST-004**).
- ALWAYS validate chéo đảm bảo `ward_id` phải thuộc về `province_id`.
- ALWAYS tính tuổi của khách hàng một cách động bằng công thức `Năm hiện tại - Năm sinh` (**BR-CUST-003**).

## EDGE_CASES

- **Phone trùng lặp**: Trả về 422 với error message "The phone has already been taken."
- **Địa phương không hợp lệ**: Trả về 422 nếu `ward_id` và `province_id` không khớp nhau.
- **Customer không tồn tại**: Trả về 404.
- **Filter không khớp**: Trả về empty collection (total = 0) với pagination meta.
- **Invoice chưa implement**: `outstanding_amount` trả về 0.0 (TODO).

## EXAMPLES

### Input: Create Customer
```json
{
  "full_name": "Nguyễn Văn A",
  "phone": "0987654321",
  "birth_date": "1990-05-15",
  "gender": 1,
  "address": "123 Đường ABC",
  "source": 1,
  "status": 1
}
```

### Output: Customer Detail
```json
{
  "id": 1,
  "full_name": "Nguyễn Văn A",
  "phone": "0987654321",
  "birth_date": "1990-05-15",
  "gender": { "value": 1, "label": "Nam" },
  "address": "123 Đường ABC",
  "source": { "value": 1, "label": "Facebook" },
  "status": { "value": 1, "label": "Active" },
  "outstanding_amount": 0,
  "created_at": "2026-06-11T08:00:00+07:00",
  "updated_at": "2026-06-11T08:00:00+07:00"
}
```

## API Endpoints

| Method | URI | Description | Auth |
|--------|-----|-------------|------|
| `GET` | `/api/customers` | Danh sách khách hàng có phân trang | sanctum |
| `GET` | `/api/customers/{id}` | Chi tiết khách hàng | sanctum |
| `POST` | `/api/customers` | Tạo khách hàng mới | sanctum |
| `PATCH` | `/api/customers/{id}` | Cập nhật khách hàng | sanctum |
| `DELETE` | `/api/customers/{id}` | Xóa mềm khách hàng | sanctum |
