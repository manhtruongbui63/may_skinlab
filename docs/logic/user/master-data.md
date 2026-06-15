---
module: user
title: Master Data — Dữ Liệu Tham Chiếu
description: Luồng lấy master data resources theo cấu hình driver động.
type: workflow
priority: low
version: "1.2.0"
changelog:
  - version: "1.2.0"
    date: "2026-06-15"
    summary: "Thêm 3 reception master data resources: clinic_rooms, services, service_packages."
  - version: "1.1.0"
    date: "2026-05-11"
    summary: "Thêm 7 sample resources để demo đầy đủ các driver cho FE."
  - version: "1.0.0"
    date: "2026-05-06"
    summary: "Initial master data flow doc."
related_files:
  - backend/app/Http/Controllers/User/MasterDataController.php
  - backend/app/Services/User/MasterDataService.php
  - backend/app/Services/Base/MasterDataService.php
  - backend/routes/api.php
---

## OVERVIEW

API `GET /master-data` trả về danh sách resources theo cấu hình driver (config, config_trans, enum, eloquent, custom).

| Component | File |
|---|---|
| Route | `routes/api.php` |
| Controller | `MasterDataController::show()` |
| Service | `MasterDataService` → `BaseMasterDataService` |

## CONTEXT

`@unauthenticated` — không yêu cầu đăng nhập.

## AVAILABLE RESOURCES

| Resource | Driver | Mô tả | Ví dụ FE |
|---|---|---|---|
| `user_statuses` | Enum | Trạng thái user từ `UserStatus` enum | Dropdown status |
| `date_formats` | Config | Các định dạng ngày từ `config('common.date_format')` | — |
| `genders` | ConfigTrans | Giới tính có dịch (`master.genders` + `master.gender`) | Dropdown giới tính |
| `users` | Eloquent | Danh sách user `{id, name}` | Dropdown chọn user |
| `active_users` | Eloquent | User đang active, có `where` filter | Dropdown chỉ active |
| `users_paginated` | Custom | User có phân trang + tìm kiếm | Select search + load more |
| `countries` | Config | Danh sách quốc gia từ `config('common.countries')` | Dropdown quốc gia |
| `provinces` | Eloquent | Danh sách tỉnh/thành phố | Dropdown tỉnh/thành |
| `wards` | Custom | Danh sách phường/xã theo tỉnh | Dropdown phường/xã |
| `clinic_rooms` | Eloquent | Danh sách phòng khám active | Dropdown chọn phòng |
| `services` | Eloquent | Danh sách dịch vụ active | Dropdown dịch vụ |
| `service_packages` | Eloquent | Danh sách gói dịch vụ active | Dropdown gói khám |

## ENTITIES

Không có entity cố định — resources được định nghĩa qua `$availableResources`.

## FLOW

1. **Request** — `GET /master-data?resources[resourceName]=paramsJSON`
2. **Validation** — Kiểm tra `resources` là array, nếu không trả `[]`.
3. **Filter Available** — `withResources()` chỉ giữ lại resource có trong `$availableResources`.
4. **Load Data** — `load()` dispatch đến driver tương ứng:
   - `config` → `config(target)`
   - `config_trans` → `config(target)` + trans
   - `eloquent` → Eloquent query (hỗ trợ `select`, `where`, `order`)
   - `enum` → `EnumClass::options()`
   - `custom` → gọi method tùy chỉnh (hỗ trợ paginate + search)
5. **Auth Gate** — Nếu resource có `auth` array, kiểm tra `$user->is{RoleName}()`.
6. **Return** — Trả object `{ resourceName: data }`.

## RULES

- ONLY trả resource có trong `$availableResources`.
- Nếu resource có `auth` và user không đủ quyền → trả `null`.

## EDGE_CASES

- `$availableResources` rỗng → trả object rỗng `{}`.
- `resources` không phải array → trả `[]`.

## EXAMPLES

**Input:** `GET /master-data?resources[user_status]=%7B%7D`

**Output:**
```json
{
  "status": 200,
  "data": {
    "user_status": [
      { "id": 0, "name": "Inactive" },
      { "id": 1, "name": "Active" }
    ]
  }
}
```
