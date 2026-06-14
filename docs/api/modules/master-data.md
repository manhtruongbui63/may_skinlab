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
| `users` | Eloquent | Danh sách user | Array `[{id, name}]` |
| `active_users` | Eloquent | User đang active | Array `[{id, name, email}]` |
| `users_paginated` | Custom | User có phân trang + search | Pagination `Object {data, total, ...}` |
| `countries` | Config | Danh sách quốc gia | Object `{code: name}` |
| `provinces` | Eloquent | Danh sách tỉnh/thành phố | Array `[{id, name}]` |
| `wards` | Custom | Danh sách phường/xã theo tỉnh | Array `[{id, province_id, name}]` |

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

#### 1.4 Users
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

#### 1.5 Active Users
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

#### 1.6 Users Paginated
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

#### 1.7 Countries
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

#### 1.8 Provinces
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

#### 1.9 Wards
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
