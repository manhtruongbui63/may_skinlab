# Business Rules

Core logic và constraints quản lý hệ thống.

> Source of truth cho BR IDs: [BR Registry](./br-registry.md)

---

## Authentication

### Password Login/Register

- **BR-G001 (Pre-provisioned Login Only)**: Chỉ user đã tồn tại trong database mới đăng nhập được.
- Email login kiểm tra credential qua `Hash::check()`. Sai → trả 401.
- Rate limiting: 5 attempts / 60 seconds per IP + email.
- Token cấp qua **Laravel Sanctum**

### User Status

- User có `status = UserStatus::ACTIVE` (1) mới đăng nhập thành công.
- User `INACTIVE` vẫn có thể bị reject tại các API khác (profile update).

---

## Audit Trail & Activity Log

### Ghi nhận hoạt động hệ thống

- **BR-G002 (System Activity Audit Trail)**: Tự động ghi lại nhật ký hoạt động thay đổi dữ liệu vào cơ sở dữ liệu. Áp dụng cho **tất cả domain Model** trong hệ thống.

#### Pattern A — Model-level (Auto): CRUD thông thường

Mọi domain Model PHẢI sử dụng trait `LogsActivity` với cấu hình tối thiểu:

```php
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

public function getActivitylogOptions(): LogOptions
{
    return LogOptions::defaults()
        ->logFillable()          // Chỉ log các field trong $fillable
        ->logOnlyDirty()         // Chỉ log khi có thay đổi thực sự
        ->dontLogEmptyChanges(); // Bỏ qua nếu không có gì thay đổi
}
```

Spatie tự động log `create`, `update`, `delete` qua Model Observer — không cần gọi thủ công trong Service.

#### Pattern B — Service-level (Manual): Sensitive/Custom actions

Các hành động **không có model mutation** hoặc cần log thêm context PHẢI gọi `activity()` thủ công trong Service:

```php
activity()
    ->causedBy($this->user)
    ->performedOn($targetModel)
    ->withProperties(['reason' => $dto->reason])
    ->log('permission_changed');
```

Trường hợp phải dùng Pattern B:
- **Login / Logout** — không có model mutation
- **Thay đổi role/permission** — sensitive, cần log rõ `reason`
- **Bulk operations** — Model Observer sẽ fire N lần, cần ghi 1 lần
- **Export / Download** — không có mutation nhưng cần audit
- **Force delete** — cần log trước khi record bị xóa vĩnh viễn

#### Quy tắc bảo mật (MANDATORY)

- **Tuyệt đối không log**: `password`, `remember_token`
- Dùng `->logFillable()` thay vì `->logAll()` để tránh log field nhạy cảm
- Không log `updated_at` riêng lẻ (đã exclude trong `dontLogEmptyChanges`)

---

## Error Responses

| HTTP Code | Ý nghĩa |
|---|---|
| 401 Unauthorized | Token missing, invalid, hoặc expired. |
| 403 Forbidden | User không có permission cho endpoint này. |
| 404 Not Found | Resource ID không tồn tại. |
| 422 Validation Error | JSON chuẩn với field-specific errors. |
