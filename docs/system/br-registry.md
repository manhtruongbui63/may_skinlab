# BR Registry

Nguồn chuẩn duy nhất cho mã Business Rule (BR) toàn hệ thống.

---

## Quy ước mã

- `BR-GXXX` = Rule cấp hệ thống (global, áp dụng đa module).
- `BR-{MODULE}-XXX` = Rule cấp module (ví dụ: `BR-AUTH-001`, `BR-NOTIF-001`).
- `PROPOSED_BR:{slug}` = Rule mới đang đề xuất, chưa được cấp mã chính thức.

> [!IMPORTANT]
> Không dùng lại mã BR cho ngữ nghĩa khác.

---

## Registry

| Rule ID | Scope | Module | Title | Status | Source File | Notes |
|---|---|---|---|---|---|---|
| BR-G001 | global | system-auth | Pre-provisioned Login Only | active | docs/system/business-rules.md | Chỉ user tồn tại sẵn mới đăng nhập được |
| BR-G002 | global | system-log | System Activity Audit Trail | active | docs/system/business-rules.md | Tất cả domain Model phải dùng `LogsActivity` trait. Loại trừ trường nhạy cảm (`password`, `remember_token`). Xem Pattern A/B. |
| BR-AUTH-001 | module | auth | Reset token hashed at rest | active | docs/logic/auth/reset-password.md | Token reset lưu `sha256`, không plaintext; so khớp `hash_equals` (was `PROPOSED_BR:reset-token-hashed-at-rest`) |
| BR-AUTH-002 | module | auth | Reset token TTL 60m | active | docs/logic/auth/reset-password.md | Token hết hạn 60 phút kể từ `created_at` (was `PROPOSED_BR:reset-token-ttl-60m`) |
| BR-AUTH-003 | module | auth | Reset token single-use | active | docs/logic/auth/reset-password.md | Token bị xóa ngay sau khi reset thành công (was `PROPOSED_BR:reset-token-single-use`) |
| BR-AUTH-004 | module | auth | One active reset token per email | active | docs/logic/auth/reset-password.md | Mỗi email giữ 1 token; request mới ghi đè (was `PROPOSED_BR:reset-one-active-token-per-email`) |
| BR-AUTH-005 | module | auth | Reset email no-enumeration | removed | docs/logic/auth/reset-password.md | **Đã gỡ theo quyết định sản phẩm**: `forgot-password` nay validate `exists:users` và trả 422 `auth.reset.email_not_found` khi email chưa đăng ký (đánh đổi: lộ email đã đăng ký để UX rõ hơn) |
| BR-AUTH-006 | module | auth | Reset revokes all sessions | active | docs/logic/auth/reset-password.md | Reset thành công → thu hồi toàn bộ `personal_access_tokens` (was `PROPOSED_BR:reset-revoke-all-sessions`) |
| BR-AUTH-007 | module | auth | Reset password policy | active | docs/logic/auth/reset-password.md | Mật khẩu mới ≥ 8 ký tự + `password_confirmation` khớp (was `PROPOSED_BR:reset-password-policy`) |
| BR-AUTH-008 | module | auth | Reset rate-limit + cooldown | active | docs/logic/auth/reset-password.md | `forgot-password` ≤ 10/phút/IP + cooldown 60s/email (was `PROPOSED_BR:reset-rate-limit`) |
| BR-AUTH-009 | module | auth | Reset new password must differ | active | docs/logic/auth/reset-password.md | Mật khẩu mới phải khác mật khẩu hiện tại (was `PROPOSED_BR:reset-new-password-must-differ`) |
| BR-APPT-001 | module | appointment | Double-booking Check | active | docs/logic/appointment/appointment-management.md | Mỗi slot 30 phút chỉ được phép có một lịch hẹn đang hoạt động (status: BOOKED, CONFIRMED, CHECKED_IN). |
| BR-APPT-002 | module | appointment | Active Customer Validation | active | docs/logic/appointment/appointment-management.md | Chỉ cho phép tạo lịch hẹn đối với khách hàng đang ở trạng thái ACTIVE. |
| BR-APPT-003 | module | appointment | State Machine Transitions | active | docs/logic/appointment/appointment-management.md | Chuyển đổi trạng thái của lịch hẹn phải tuân thủ ma trận chuyển đổi hợp lệ. |
| BR-APPT-004 | module | appointment | Auto Complete on Visit Creation | active | docs/logic/appointment/appointment-management.md | Khi một Visit được tạo thành công gắn với lịch hẹn, trạng thái lịch hẹn tự động chuyển sang COMPLETED. |
| BR-APPT-005 | module | appointment | Soft Delete Preservation | active | docs/logic/appointment/appointment-management.md | Lịch hẹn khi xóa chỉ được phép soft-delete để lưu lại lịch sử cho hệ thống. |


---

## Quy trình thêm rule mới

1. Tạo `PROPOSED_BR:{slug}` trong requirement/task/logic doc.
2. Review với owner nghiệp vụ.
3. Cấp mã chính thức trong file này.
4. Thay toàn bộ `PROPOSED_BR` tham chiếu thành `BR-*` đã cấp.
