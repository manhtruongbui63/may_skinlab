# Logic Documentation

Detailed business logic, workflows, and rules documentation.

> **Chi tiết schema (fields, types)** → đọc **Model Docblocks** (`backend/app/Models/`).
>
> **Chi tiết enum cases** → đọc **Enum class** (`backend/app/Enums/`).
>
> File này chỉ index các logic docs — mỗi file mô tả FLOW, RULES, và EDGE_CASES của feature.
>
> **Quy tắc BR**: Mọi `BR-*` trong `docs/logic/` phải tồn tại trong [docs/system/br-registry.md](../system/br-registry.md). Nếu rule mới chưa đăng ký, dùng `PROPOSED_BR:{slug}` tạm thời.

---

## Auth Module (`auth/`)

| File | Feature | Priority |
|---|---|---|
| [index.md](auth/index.md) | Module BR Index | high |
| [login-flow.md](auth/login-flow.md) | Login Flow — Xác Thực Người Dùng | high |
| [register-flow.md](auth/register-flow.md) | Register Flow — Tạo Tài Khoản Mới | high |
| [logout-flow.md](auth/logout-flow.md) | Logout Flow — Thu Hồi Token | high |
| [profile-update.md](auth/profile-update.md) | Update Profile — Cập Nhật Thông Tin | medium |
| [change-password.md](auth/change-password.md) | Change Password — Đổi Mật Khẩu | medium |

---

## User Module (`user/`)

| File | Feature | Priority |
|---|---|---|
| [index.md](user/index.md) | Module BR Index | high |
| [user-listing.md](user/user-listing.md) | User Listing — Danh Sách Người Dùng | high |
| [master-data.md](user/master-data.md) | Master Data — Dữ Liệu Tham Chiếu | low |

---

## Customer Module (`customer/`)

| File | Feature | Priority |
|---|---|---|
| [index.md](customer/index.md) | Module BR Index | high |
| [customer-management.md](customer/customer-management.md) | Customer CRUD — Quản Lý Khách Hàng | high |

---

## Appointment Module (`appointment/`)

| File | Feature | Priority |
|---|---|---|
| [index.md](appointment/index.md) | Module BR Index | high |
| [appointment-management.md](appointment/appointment-management.md) | Appointment CRUD — Quản Lý Lịch Hẹn | high |

---

## Visit Module (`visit/`)

| File | Feature | Priority |
|---|---|---|
| [visit-management.md](visit/visit-management.md) | Visit CRUD — Quản Lý Lượt Khám | high |


