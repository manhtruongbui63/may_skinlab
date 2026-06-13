---
title: "RBAC Role-Based Authorization — Phân Quyền Theo Vai Trò"
description: "Thêm hệ thống RBAC sử dụng Spatie Laravel Permission với 2 role Admin và Member. Admin có toàn quyền, Member chỉ xem một số thông tin (chi tiết theo tính năng)."
status: pending_implementation
date: 2026-05-12
version: 1.0
changelog:
  - version: 1.0
    date: 2026-05-12
    summary: "Initial requirement specification."
---

## 2. OVERVIEW

Thêm hệ thống phân quyền RBAC (Role-Based Access Control) cho ứng dụng sử dụng package **Spatie Laravel Permission**. Hệ thống ban đầu hỗ trợ 2 role:

- **Admin** — Toàn quyền truy cập hệ thống
- **Member** — Chỉ xem được một số thông tin (chi tiết permission sẽ được định nghĩa khi làm từng tính năng cụ thể)

Scope bao gồm: cài đặt package, tạo enum `UserRole`, cập nhật User model, tạo seeder cho roles, gán role mặc định khi đăng ký, expose role qua API response, và đăng ký master data resource.

---

## 3. CONTEXT

- **Modules**: Auth (đăng ký + login), User (profile, listing)
- **Features**: RBAC — role assignment, role exposure qua API, master data
- **Guards**: `api` (Sanctum) — giữ nguyên guard hiện tại
- **Third-parties**: `spatie/laravel-permission` (package mới)

---

## 4. OUT OF SCOPE

- **Chi tiết permission cho từng endpoint** — Sẽ làm khi implement từng tính năng cụ thể
- **Admin panel / user management UI** — Chưa yêu cầu trong phase này
- **Role switching / impersonation** — Không cần thiết lúc này
- **Middleware cho từng route cụ thể** — Áp dụng theo từng feature khi cần
- **Custom permission matrix** — Chỉ dùng role-level, chưa cần permission-level

---

## 5. BUSINESS RULES

- **PROPOSED_BR:default-member-role**: Mọi user đăng ký mới mặc định nhận role `member`. Referenced in: Flow 1.
- **PROPOSED_BR:admin-full-access**: Role `admin` có toàn quyền truy cập hệ thống. Referenced in: Flow 2.
- **PROPOSED_BR:member-read-only**: Role `member` chỉ có quyền xem một số thông tin (chi tiết theo feature). Referenced in: Flow 2.
- **PROPOSED_BR:role-api-exposure**: API `GET /auth/me` phải trả về thông tin role của user đang đăng nhập. Referenced in: Flow 3.
- **PROPOSED_BR:role-master-data**: Role list phải có sẵn qua Master Data API để frontend sử dụng cho dropdown. Referenced in: Flow 4.

---

## 6. REQUIREMENT ANALYSIS

### 6.1. Role Storage Strategy

Spatie Laravel Permission sử dụng bảng riêng (`roles`, `model_has_roles`) để quản lý role. User model sử dụng trait `HasRoles` để tương tác. **Không thêm cột `role` vào bảng `users`** — role được quản lý hoàn toàn qua Spatie's pivot table.

### 6.2. UserRole Enum

Tạo enum `UserRole` (backed `string`) cho type safety và master data generation. Enum này KHÔNG dùng cast trực tiếp trên User model — nó dùng cho:
1. Type safety trong code (IDE completion, static analysis)
2. Master Data API response (driver enum)
3. Seeder configuration

### 6.3. Default Role Assignment

Khi user đăng ký mới qua `POST /auth/register`, system tự động gán role `member` thông qua Spatie's `assignRole()` method.

### 6.4. First Admin

Admin đầu tiên được tạo qua database seeder (`RoleSeeder`) với credentials được cấu hình sẵn.

---

## 7. DATA MODEL UPDATES

### 7.1. Spatie Permission Tables (tự động tạo bởi package migration)

#### Table: `roles`

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| id | bigint | 20 | NO | YES | — | ADDED | Primary key | Auto-increment |
| name | string | 255 | NO | YES | — | ADDED | Tên role (admin, member) | Unique per guard |
| guard_name | string | 255 | NO | NO | — | ADDED | Guard name | `api` |
| created_at | timestamp | — | YES | NO | NULL | ADDED | Thời gian tạo | — |
| updated_at | timestamp | — | YES | NO | NULL | ADDED | Thời gian cập nhật | — |

#### Table: `permissions`

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| id | bigint | 20 | NO | YES | — | ADDED | Primary key | Auto-increment |
| name | string | 255 | NO | YES | — | ADDED | Tên permission | Unique per guard |
| guard_name | string | 255 | NO | NO | — | ADDED | Guard name | `api` |
| created_at | timestamp | — | YES | NO | NULL | ADDED | Thời gian tạo | — |
| updated_at | timestamp | — | YES | NO | NULL | ADDED | Thời gian cập nhật | — |

#### Table: `role_has_permissions`

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| permission_id | bigint | 20 | NO | YES | — | ADDED | FK → permissions.id | Composite PK with role_id |
| role_id | bigint | 20 | NO | YES | — | ADDED | FK → roles.id | Composite PK with permission_id |

#### Table: `model_has_roles`

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| role_id | bigint | 20 | NO | NO | — | ADDED | FK → roles.id | Composite PK with model_type, model_id |
| model_type | string | 255 | NO | NO | — | ADDED | Morph class name | `App\Models\User` |
| model_id | bigint | 20 | NO | NO | — | ADDED | Morph entity ID | FK logic đến User |

#### Table: `model_has_permissions`

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| permission_id | bigint | 20 | NO | NO | — | ADDED | FK → permissions.id | Composite PK with model_type, model_id |
| model_type | string | 255 | NO | NO | — | ADDED | Morph class name | `App\Models\User` |
| model_id | bigint | 20 | NO | NO | — | ADDED | Morph entity ID | FK logic đến User |

### 7.2. Existing Table: `users`

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| id | bigint | 20 | NO | YES | — | KEPT | Primary key | — |
| name | string | 255 | NO | NO | — | KEPT | Tên user | — |
| email | string | 255 | NO | YES | — | KEPT | Email user | — |
| password | string | 255 | NO | NO | — | KEPT | Mật khẩu (hashed) | — |
| status | tinyInteger | — | NO | NO | 0 | KEPT | Trạng thái user | Cast: `UserStatus` |
| created_at | timestamp | — | YES | NO | NULL | KEPT | Thời gian tạo | — |
| updated_at | timestamp | — | YES | NO | NULL | KEPT | Thời gian cập nhật | — |

> **Không có thay đổi cấu trúc bảng `users`** — Role được quản lý qua Spatie's `model_has_roles` pivot table.

### 7.3. Enum: `UserRole`

| Value (string) | Name | Description | Localization Key |
|---|---|---|---|
| `admin` | ADMIN | Toàn quyền hệ thống | `enums.user_role.admin` |
| `member` | MEMBER | Quyền xem hạn chế | `enums.user_role.member` |

**Database Type**: Không áp dụng — role stored trong Spatie's `roles` table (string `name` column).

**Transitions**: Không có state transition — Role là static assignment. Chỉ thay đổi qua admin action (sẽ làm khi có tính năng user management).

**Transition Triggers**:
| From | To | Trigger |
|---|---|---|
| — | `member` | User registration (PROPOSED_BR:default-member-role) |
| — | `admin` | Database seeder / Admin action (future) |
| `member` | `admin` | Admin action (future) |
| `admin` | `member` | Admin action (future) |

**API Structure**: API response trả về `{ "id": "admin", "name": "Admin" }` qua Master Data endpoint.

---

## 8. PROCESSING FLOWS

### Flow 1: User Registration — Gán Role Mặc Định

1. User gửi `POST /auth/register` với `name`, `email`, `password`. (PROPOSED_BR:default-member-role)
2. `RegisterRequest` validate input (name, email unique, password).
3. `AuthService::register()` tạo User record với `status = UserStatus::ACTIVE`.
   **State Changes:**
   - `users.name` = `{name}`
   - `users.email` = `{email}` (lowercased)
   - `users.password` = `Hash::make({password})`
   - `users.status` = `UserStatus::ACTIVE`
4. `AuthService::register()` gán role `member` cho user mới.
   **State Changes:**
   - `model_has_roles` = INSERT `{role_id: member_role_id, model_type: User, model_id: new_user_id}`
5. Return user object (không bao gồm role ở response register — role lấy qua `/auth/me`).

**Concurrency Handling:**
- **Mechanism**: Không cần lock — mỗi registration tạo user mới, không có race condition.
- **Email uniqueness**: Đảm bảo qua DB unique constraint + RegisterRequest validation.

**Acceptance Criteria (Happy Path):**
- [ ] User mới được tạo thành công với status ACTIVE
- [ ] User mới có role `member` trong bảng `model_has_roles`
- [ ] Registration response không thay đổi so với hiện tại

**Error Cases:**
| Error Condition | System Behavior | State Changes |
|---|---|---|
| Email đã tồn tại | RegisterRequest reject 422 | No change |
| Role `member` chưa seed | `assignRole()` throw `RoleNotFoundException` → 500 | User created nhưng không có role |

---

### Flow 2: Role-Based Access Control (Sử Dụng Middleware)

1. User gửi request đến protected route.
2. Sanctum middleware xác thực token.
3. Spatie `role` middleware kiểm tra user có role phù hợp không. (PROPOSED_BR:admin-full-access, PROPOSED_BR:member-read-only)
4. Nếu user có role `admin` → cho phép tất cả.
5. Nếu user có role `member` → chỉ cho phép các route không yêu cầu role admin.

> **Note**: Middleware cụ thể cho từng route sẽ được cấu hình khi implement từng feature. Trong phase này, **không thay đổi route protection** — chỉ setup infrastructure.

**Acceptance Criteria:**
- [ ] Spatie `role` middleware đã được đăng ký và sẵn sàng sử dụng
- [ ] `HasRoles` trait hoạt động đúng trên User model

**Error Cases:**
| Error Condition | System Behavior | State Changes |
|---|---|---|
| User không có role | Middleware return 403 Forbidden | No change |
| User có role sai | Middleware return 403 Forbidden | No change |
| Token invalid/expired | Sanctum return 401 Unauthorized | No change |

---

### Flow 3: Lấy Thông Tin User Kèm Role (GET /auth/me)

1. User gửi `GET /auth/me` với Bearer token.
2. Sanctum xác thực user. (PROPOSED_BR:role-api-exposure)
3. `MeResource` transform user data.
4. `MeResource` lấy role từ Spatie: `$user->getRoleNames()->first()`.
5. Return response bao gồm role.

   **Response Structure:**
   ```json
   {
     "name": "Alice",
     "email": "alice@example.com",
     "role": "member"
   }
   ```

**State Changes:** Không có — read-only operation.

**Acceptance Criteria (Happy Path):**
- [ ] Response `GET /auth/me` bao gồm field `role` với giá trị `"admin"` hoặc `"member"`
- [ ] User không có role → `role` field = `null`

**Error Cases:**
| Error Condition | System Behavior | State Changes |
|---|---|---|
| Token missing/invalid | Sanctum return 401 | No change |
| User not found | Return 404 | No change |

---

### Flow 4: Master Data — Role List

1. Frontend gửi `GET /master-data?resources[user_roles]={}`. (PROPOSED_BR:role-master-data)
2. `MasterDataService` load resource `user_roles` qua enum driver.
3. `UserRole::options()` generate danh sách roles.
4. Return response.

   **Response Structure:**
   ```json
   {
     "user_roles": [
       { "id": "admin", "name": "Admin" },
       { "id": "member", "name": "Member" }
     ]
   }
   ```

**State Changes:** Không có — read-only operation.

**Acceptance Criteria (Happy Path):**
- [ ] `GET /master-data?resources[user_roles]={}` trả về danh sách 2 roles
- [ ] Mỗi role có `id` (value string) và `name` (localized label)

**Error Cases:**
| Error Condition | System Behavior | State Changes |
|---|---|---|
| Resource không có trong available | Return `null` cho resource đó | No change |
| Enum class không tồn tại | Throw exception → 500 | No change |

---

### Flow 5: Database Seeding — Tạo Roles Và Admin Đầu Tiên

1. Chạy `php artisan db:seed --class=RoleSeeder`.
2. Tạo 2 roles trong bảng `roles`: `admin` (guard: `api`), `member` (guard: `api`).
   **State Changes:**
   - `roles` = INSERT `{name: "admin", guard_name: "api"}`
   - `roles` = INSERT `{name: "member", guard_name: "api"}`
3. (Optional) Tạo admin user và gán role `admin`.
   **State Changes:**
   - `users` = INSERT `{name: "Admin", email: ..., password: ..., status: ACTIVE}`
   - `model_has_roles` = INSERT `{role_id: admin_role_id, model_type: User, model_id: admin_user_id}`

**Acceptance Criteria (Happy Path):**
- [ ] Bảng `roles` có 2 records: admin, member
- [ ] (Optional) Admin user tồn tại và có role `admin`

**Error Cases:**
| Error Condition | System Behavior | State Changes |
|---|---|---|
| Role đã tồn tại | `firstOrCreate` skip — không duplicate | No change |
| Admin user email đã tồn tại | `firstOrCreate` skip — không duplicate user | No change |

---

## 9. UI/UX & FRONTEND IMPLICATIONS

### 9.1. API Response Changes

**`GET /auth/me`** thêm field `role`:
```typescript
// Trước
{ name: string; email: string }

// Sau
{ name: string; email: string; role: string | null }
```

### 9.2. State Management

- Zustand auth store cần cập nhật type để bao gồm `role` field
- Conditional UI rendering dựa trên `role` value (hide/show admin menu items)

### 9.3. Master Data

- Frontend có thể gọi `GET /master-data?resources[user_roles]={}` để lấy role dropdown
- Dùng cho admin user management (future feature)

### 9.4. Zod Schema

Không cần thay đổi form validation trong phase này — role được gán tự động, không có user input.

---

## 10. NOTIFICATIONS

Không có notification trong scope của requirement này.

---

## 11. API ENDPOINT INVENTORY

| Method | Endpoint | Guard | Description | Thay Đổi | Related Flow |
|--------|----------|-------|-------------|----------|--------------|
| POST | `/api/auth/register` | guest | Đăng ký user mới | **MODIFIED** — thêm assignRole('member') | Flow 1 |
| GET | `/api/auth/me` | api | Lấy thông tin user hiện tại | **MODIFIED** — thêm field `role` | Flow 3 |
| GET | `/api/master-data` | guest | Master data resources | **MODIFIED** — thêm resource `user_roles` | Flow 4 |

---

## 12. IMPLEMENTATION TASKS

### Phase 1: Package & Infrastructure
1. Install `spatie/laravel-permission` qua composer
2. Publish config + migrations của Spatie
3. Tạo `UserRole` enum tại `app/Enums/UserRole.php`
4. Thêm `HasRoles` trait vào User model
5. Tạo `RoleSeeder` để seed `admin` + `member` roles

### Phase 2: Business Logic Integration
6. Cập nhật `AuthService::register()` — gán role `member` cho user mới
7. Cập nhật `MeResource` — thêm field `role`
8. Thêm `user_roles` resource vào `MasterDataService`

### Phase 3: Localization & Documentation
9. Thêm localization keys: `enums.user_role.admin`, `enums.user_role.member`
10. Cập nhật `docs/system/domain-model.md` — thêm UserRole enum
11. Cập nhật `docs/system/architecture.md` — thêm Spatie Permission info
12. Tạo `docs/logic/auth/role-assignment.md` — logic doc cho role assignment

### Phase 4: Testing
13. Viết feature test cho register + role assignment
14. Viết feature test cho MeResource + role field
15. Viết feature test cho master data + user_roles resource

---

## 13. DRAFT COVERAGE MATRIX

| Draft Section | Draft Item | Requirement Section | Status |
|---|---|---|---|
| "Cần thêm RBAC" | RBAC system | OVERVIEW, Section 6 | ✅ Covered |
| "sử dụng laravel permission package" | Spatie package | Section 7.1, Phase 1 Task 1 | ✅ Covered |
| "2 role admin và member" | Admin + Member roles | Section 7.3, Flow 1, Flow 5 | ✅ Covered |
| "Role admin có thể làm mọi thứ" | Admin full access | PROPOSED_BR:admin-full-access, Flow 2 | ✅ Covered |
| "Role member chỉ có thể xem" | Member read-only | PROPOSED_BR:member-read-only, Flow 2 | ✅ Covered |
| *(Silent)* Default role for new users | Member default | PROPOSED_BR:default-member-role, Flow 1 | ✅ Covered (AI proposed) |
| *(Silent)* Role in API response | MeResource update | PROPOSED_BR:role-api-exposure, Flow 3 | ✅ Covered (AI proposed) |
| *(Silent)* Role master data | MasterDataService update | PROPOSED_BR:role-master-data, Flow 4 | ✅ Covered (AI proposed) |
| *(Silent)* First admin creation | Seeder | Flow 5 | ✅ Covered (AI proposed) |
