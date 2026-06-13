# Domain Model

Entity map của hệ thống hiện tại.

> **Chi tiết fields, types, casts** → đọc trực tiếp từ **Model Docblocks** trong `backend/app/Models/`.
>
> **Business rules, validation, flow** → đọc từ `docs/logic/{module}/`.

---

## Module: Authentication (`auth`)

| Entity | Model | Mô tả |
|---|---|---|
| **User** | `App\Models\User` | End user. Đăng ký/đăng nhập bằng email + password. Lưu Sanctum tokens. |
| **Image** | `App\Models\Image` | File ảnh đính kèm. Polymorphic (`imageable`). |

### Relationships

```
User ──┬── Sanctum tokens (via HasApiTokens)
       └── morphMany ── Image (as imageable)
```

---

## Enums (`App\Enums`)

> Chi tiết cases và giá trị → đọc trực tiếp từ Enum class. Mỗi enum đều có `label()` method trả về localized string.

| Enum | Backed | Used By | Mô tả |
|---|---|---|---|
| `UserStatus` | `int` | `User.status` | Trạng thái user: Inactive(0), Active(1). |

---

## Kiến trúc tài liệu — Khi AI cần thông tin gì?

| AI cần biết... | Nơi đọc |
|---|---|
| Entity nào tồn tại? | **File này** (`domain-model.md`) |
| Field cụ thể, type, fillable, casts? | **Model Docblocks** (`app/Models/{Model}.php`) |
| Enum cases, giá trị, label? | **Enum class** (`app/Enums/{Enum}.php`) |
| Business rules, validation, flow? | **Logic docs** (`docs/logic/{module}/`) |
| API endpoint nào, request/response format? | **Scramble** (`/docs/api`) + `docs/api/modules/` |
