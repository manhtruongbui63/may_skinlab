# Master Data API

Fetch lookup resources (categories, types, statuses) cho Frontend.

---

## 1. Get Master Data

Lấy danh sách static data theo loại resource.

| | |
|---|---|
| **Endpoint** | `GET /api/master-data` |
| **Auth** | ✗ Unauthenticated |

### Query Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `resources` | array | | Mảng liên hợp (associative array) với key là tên resource cần lấy và value là JSON string tham số cấu hình (ví dụ: `{}` cho mặc định, hoặc `{"search":"alice","page":1,"per_page":10}`). Bỏ trống -> trả về mảng rỗng `[]` |

### Request Example
```
GET /api/master-data?resources[user_statuses]={}&resources[users]={}
```

### Response `200`
```json
{
  "success": true,
  "message": "",
  "errors": null,
  "data": {
    "user_statuses": [
      { "id": 0, "name": "Inactive" },
      { "id": 1, "name": "Active" }
    ],
    "users": [
      { "id": 1, "name": "Alice" },
      { "id": 2, "name": "Bob" }
    ]
  }
}
```

### Available Resources

| Resource | Driver | Mô tả | Định dạng |
|---|---|---|---|
| `user_statuses` | Enum | Trạng thái người dùng | Array `[{id, name}]` |
| `date_formats` | Config | Định dạng ngày FE/DB | Object `{key: value}` |
| `genders` | ConfigTrans | Giới tính | Array `[{id, name}]` |
| `customer_genders` | Enum | Giới tính khách hàng | Array `[{id, name}]` |
| `customer_sources` | Enum | Nguồn khách hàng | Array `[{id, name}]` |
| `customer_statuses` | Enum | Trạng thái khách hàng | Array `[{id, name}]` |
| `users` | Eloquent | Danh sách user | Array `[{id, name}]` |
| `active_users` | Eloquent | User đang active | Array `[{id, name, email}]` |
| `users_paginated` | Custom | User có phân trang + search | Pagination `Object {data, total, ...}` |
| `countries` | Config | Danh sách quốc gia | Object `{code: name}` |
| `provinces` | Eloquent | Danh sách tỉnh/thành phố | Array `[{id, name}]` |
| `wards` | Custom | Danh sách phường/xã theo tỉnh | Array `[{id, province_id, name}]` |
| `clinic_rooms` | Eloquent | Danh sách phòng khám active | Array `[{id, name, code}]` |
| `services` | Eloquent | Danh sách dịch vụ active | Array `[{id, name, code, price}]` |
| `service_packages` | Eloquent | Danh sách gói dịch vụ active | Array `[{id, name, code, price}]` |

#### 1.1 User Statuses
Resource `user_statuses` trả về trạng thái từ enum `UserStatus`.
- **Driver**: Enum
- **Input Example**: `GET /api/master-data?resources[user_statuses]={}`
- **Response**:
```json
{
  "user_statuses": [
    { "id": 0, "name": "Inactive" },
    { "id": 1, "name": "Active" }
  ]
}
```

#### 1.2 Date Formats
Resource `date_formats` trả về cấu hình định dạng ngày từ `config('common.date_format')`.
- **Driver**: Config
- **Input Example**: `GET /api/master-data?resources[date_formats]={}`
- **Response**:
```json
{
  "date_formats": {
    "fe_date_format": "Y-m-d",
    "fe_datetime_format": "Y-m-d H:i:s"
  }
}
```

#### 1.3 Genders
Resource `genders` trả về danh sách giới tính có dịch qua `trans()`.
- **Driver**: ConfigTrans
- **Input Example**: `GET /api/master-data?resources[genders]={}`
- **Response**:
```json
{
  "genders": [
    { "id": 1, "name": "Male" },
    { "id": 2, "name": "Female" },
    { "id": 3, "name": "Other" }
  ]
}
```

#### 1.4 Customer Genders
Resource `customer_genders` trả về giới tính từ enum `GenderEnum`.
- **Driver**: Enum
- **Input Example**: `GET /api/master-data?resources[customer_genders]={}`
- **Response**:
```json
{
  "customer_genders": [
    { "id": 1, "name": "Nam" },
    { "id": 2, "name": "Nữ" },
    { "id": 3, "name": "Khác" }
  ]
}
```

#### 1.5 Customer Sources
Resource `customer_sources` trả về nguồn khách hàng từ enum `CustomerSourceEnum`.
- **Driver**: Enum
- **Input Example**: `GET /api/master-data?resources[customer_sources]={}`
- **Response**:
```json
{
  "customer_sources": [
    { "id": 1, "name": "Facebook" },
    { "id": 2, "name": "Google" },
    { "id": 3, "name": "Website" },
    { "id": 4, "name": "Referral" },
    { "id": 5, "name": "Walk-in" }
  ]
}
```

#### 1.6 Customer Statuses
Resource `customer_statuses` trả về trạng thái khách hàng từ enum `CustomerStatusEnum`.
- **Driver**: Enum
- **Input Example**: `GET /api/master-data?resources[customer_statuses]={}`
- **Response**:
```json
{
  "customer_statuses": [
    { "id": 0, "name": "Inactive" },
    { "id": 1, "name": "Active" }
  ]
}
```

#### 1.7 Users
Resource `users` trả về danh sách user đơn giản.
- **Driver**: Eloquent
- **Select**: `[id, name]`
- **Order**: `name ASC`
- **Input Example**: `GET /api/master-data?resources[users]={}`
- **Response**:
```json
{
  "users": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ]
}
```

#### 1.8 Active Users
Resource `active_users` trả về user có `status = ACTIVE`, sắp xếp theo tên.
- **Driver**: Eloquent
- **Select**: `[id, name, email]`
- **Where**: `status = 1`
- **Order**: `name ASC`
- **Input Example**: `GET /api/master-data?resources[active_users]={}`
- **Response**:
```json
{
  "active_users": [
    { "id": 1, "name": "Alice", "email": "alice@example.com" }
  ]
}
```

#### 1.9 Users Paginated
Resource `users_paginated` trả về user có phân trang và hỗ trợ tìm kiếm.
- **Driver**: Custom
- **Input Example**: `GET /api/master-data?resources[users_paginated]={"search":"alice","page":1,"per_page":10}`
- **Response**:
```json
{
  "users_paginated": {
    "data": [
      { "id": 1, "name": "Alice", "email": "alice@example.com", "status": 1 }
    ],
    "per_page": 10,
    "total_page": 1,
    "current_page": 1,
    "total": 1
  }
}
```

#### 1.10 Countries
Resource `countries` trả về danh sách quốc gia từ config.
- **Driver**: Config
- **Input Example**: `GET /api/master-data?resources[countries]={}`
- **Response**:
```json
{
  "countries": {
    "vn": "Vietnam",
    "us": "United States",
    "jp": "Japan",
    "kr": "South Korea",
    "sg": "Singapore"
  }
}
```

#### 1.11 Provinces
Resource `provinces` trả về danh sách tỉnh/thành phố của Việt Nam.
- **Driver**: Eloquent
- **Select**: `[id, name]`
- **Order**: `name ASC`
- **Input Example**: `GET /api/master-data?resources[provinces]={}`
- **Response**:
```json
{
  "provinces": [
    { "id": 1, "name": "Thành phố Hà Nội" },
    { "id": 2, "name": "Thành phố Hồ Chí Minh" }
  ]
}
```

#### 1.12 Wards
Resource `wards` trả về danh sách phường/xã của Việt Nam. Có thể lọc theo `province_id`.
- **Driver**: Custom
- **Select**: `[id, province_id, name]`
- **Order**: `name ASC`
- **Input Example (không lọc)**: `GET /api/master-data?resources[wards]={}`
- **Input Example (lọc theo province_id = 1)**: `GET /api/master-data?resources[wards]={"province_id":1}`
- **Response**:
```json
{
  "wards": [
    { "id": 1, "province_id": 1, "name": "Phường Dịch Vọng" },
    { "id": 2, "province_id": 1, "name": "Phường Dịch Vọng Hậu" }
  ]
}
```

#### 1.13 Clinic Rooms
Resource `clinic_rooms` trả về danh sách phòng khám đang active (`is_active = true`).
- **Driver**: Eloquent
- **Select**: `[id, name, code]`
- **Where**: `is_active = true`
- **Order**: `name ASC`
- **Input Example**: `GET /api/master-data?resources[clinic_rooms]={}`
- **Response**:
```json
{
  "clinic_rooms": [
    { "id": 1, "name": "Phòng Da Liễu", "code": "P01" },
    { "id": 2, "name": "Phòng Tư Vấn", "code": "P02" }
  ]
}
```

#### 1.14 Services
Resource `services` trả về danh sách dịch vụ khám đang active (`is_active = true`).
- **Driver**: Eloquent
- **Select**: `[id, name, code, price]`
- **Where**: `is_active = true`
- **Order**: `name ASC`
- **Input Example**: `GET /api/master-data?resources[services]={}`
- **Response**:
```json
{
  "services": [
    { "id": 1, "name": "Khám Da Cơ Bản", "code": "SVC01", "price": "150000.00" },
    { "id": 2, "name": "Laser CO2", "code": "SVC03", "price": "1500000.00" }
  ]
}
```

#### 1.15 Service Packages
Resource `service_packages` trả về danh sách gói dịch vụ đang active (`is_active = true`).
- **Driver**: Eloquent
- **Select**: `[id, name, code, price]`
- **Where**: `is_active = true`
- **Order**: `name ASC`
- **Input Example**: `GET /api/master-data?resources[service_packages]={}`
- **Response**:
```json
{
  "service_packages": [
    { "id": 1, "name": "Gói Cơ Bản", "code": "PKG01", "price": "500000.00" },
    { "id": 2, "name": "Gói Nâng Cao", "code": "PKG02", "price": "1200000.00" }
  ]
}
```
