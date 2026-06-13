---
title: "Forgot / Reset Password — Quên & Đặt Lại Mật Khẩu"
description: "Luồng đặt lại mật khẩu qua email cho user chưa đăng nhập: yêu cầu link reset (token hết hạn 60 phút, single-use, chống dò email), đặt mật khẩu mới, thu hồi toàn bộ phiên đăng nhập cũ. Bao gồm 2 màn frontend."
status: pending_implementation
date: 2026-06-05
version: 1.0
changelog:
  - version: 1.0
    date: 2026-06-05
    summary: "Initial requirement specification (phân tích từ draft low-density 03-forgot-password)."
---

## 2. OVERVIEW

Bổ sung luồng **đặt lại mật khẩu (password reset)** cho user **chưa đăng nhập** (guest). Hiện hệ thống chỉ có `change-password` (yêu cầu đã đăng nhập + biết mật khẩu cũ) — không có đường khôi phục khi user **quên** mật khẩu.

Scope đầy đủ của thay đổi:

1. **2 endpoint guest mới** trong module Auth: `POST /auth/forgot-password` (phát hành token + gửi email) và `POST /auth/reset-password` (xác thực token + đổi mật khẩu).
2. **Token-based reset**: tái dùng bảng `password_reset_tokens` có sẵn (migration mặc định), lưu **token đã hash**, TTL 60 phút, single-use.
3. **Email thông báo** qua queued Notification (`ResetPasswordNotification`) — link trỏ về màn frontend.
4. **Bảo mật**: chống dò email (response đồng nhất), rate-limit theo IP + cooldown theo email, thu hồi toàn bộ Sanctum token sau khi reset thành công.
5. **2 màn frontend**: màn yêu cầu reset (nhập email) và màn đặt mật khẩu mới (đọc `token`+`email` từ URL).

> [!NOTE]
> Draft gốc là **low-density** (chỉ nêu mục tiêu). Toàn bộ token strategy, TTL, chống dò email, rate-limit, thu hồi session, và breakdown frontend là **`[AI-SUGGESTED]`** — cần duyệt ở Phase V trong chạy thật.

---

## 3. CONTEXT

- **Modules**: Auth (`Api\AuthController`, `Api\AuthService`).
- **Features**: Forgot password (request reset link) + Reset password (set new password).
- **Guards**: `guest` cho cả 2 endpoint (user chưa đăng nhập). Sau reset, **mọi token Sanctum (`api`) của user bị thu hồi**.
- **Third-parties**: Mailer (`config/mail.php`, default driver `log` ở môi trường dev). Không có third-party API ngoài.
- **Hạ tầng tái dùng**:
  - Bảng `password_reset_tokens` — **đã tồn tại** (migration `0001_01_01_000000_create_users_table.php`). KHÔNG tạo migration mới.
  - Trait `Notifiable` trên `App\Models\User` — sẵn sàng gửi Notification.
  - Queue `database` (default) cho việc gửi mail bất đồng bộ.
  - Limiter `auth` (10 req/phút/IP) đã đăng ký trong `AppServiceProvider`.

---

## 4. OUT OF SCOPE

- **Email verification / xác minh email khi đăng ký** — luồng riêng, không thuộc requirement này (dù cùng dùng `Notifiable`).
- **Đổi mật khẩu khi đã đăng nhập** — đã có ở `change-password`, không thay đổi.
- **OTP / SMS / 2FA** — chỉ làm reset qua email link.
- **"Magic link" đăng nhập không mật khẩu** — ngoài phạm vi.
- **Lịch sử mật khẩu / chặn tái sử dụng mật khẩu cũ** — không yêu cầu.
- **Khóa tài khoản sau N lần thử** — rate-limit đã đủ cho scope này.

---

## 5. BUSINESS RULES

> Tất cả là rule mới → dùng `PROPOSED_BR:{slug}` (chưa có trong `docs/system/br-registry.md`, chỉ có `BR-G001`, `BR-G002`).

| BR | Rule | Referenced in | Enforced in (BE) | Enforced in (FE) |
|----|------|---------------|------------------|------------------|
| `PROPOSED_BR:reset-token-hashed-at-rest` | Token reset KHÔNG lưu plaintext; chỉ lưu `hash('sha256', token)`. So khớp bằng hash khi reset. | Flow 1, Flow 2 | `AuthService::sendResetLink/resetPassword` | — |
| `PROPOSED_BR:reset-token-ttl-60m` | Token hết hạn sau **60 phút** kể từ `created_at`. Quá hạn → từ chối. | Flow 2 | `AuthService::resetPassword` | — (FE chỉ hiển thị lỗi) |
| `PROPOSED_BR:reset-token-single-use` | Token bị **xóa ngay** sau khi reset thành công; không dùng lại được. | Flow 2 | `AuthService::resetPassword` | — |
| `PROPOSED_BR:reset-one-active-token-per-email` | Mỗi email chỉ giữ **1 token active**; request mới ghi đè token cũ. | Flow 1 | `AuthService::sendResetLink` | — |
| `PROPOSED_BR:reset-email-no-enumeration` | Response `forgot-password` **đồng nhất** dù email có tồn tại hay không (chống dò tài khoản). | Flow 1 | `AuthService::sendResetLink` + `AuthController` | Toast/thông báo giống nhau |
| `PROPOSED_BR:reset-revoke-all-sessions` | Reset thành công → **thu hồi toàn bộ `personal_access_tokens`** của user (đăng xuất mọi thiết bị). | Flow 2 | `AuthService::resetPassword` | Redirect về login |
| `PROPOSED_BR:reset-password-policy` | Mật khẩu mới: tối thiểu 8 ký tự, có `password_confirmation` khớp. | Flow 2 | `ResetPasswordRequest` | Zod `useAuthSchemas` |
| `PROPOSED_BR:reset-rate-limit` | `forgot-password`: ≤ 10 req/phút/IP (`throttle:auth`) **và** cooldown 60s/email. | Flow 1 | Route `throttle:auth` + cooldown check | — |
| `PROPOSED_BR:reset-new-password-must-differ` `[AI-SUGGESTED]` | Mật khẩu mới phải khác mật khẩu hiện tại. | Flow 2 | `ResetPasswordRequest`/`AuthService` | Zod (best-effort) |

---

## 6. REQUIREMENT ANALYSIS

### 6.1 Token Strategy
- Sinh token ngẫu nhiên (`Str::random(64)`) ở dạng plaintext → nhúng vào link gửi mail.
- Lưu vào `password_reset_tokens.token` dưới dạng `hash('sha256', $plain)` (`PROPOSED_BR:reset-token-hashed-at-rest`). Lý do dùng sha256 thay vì `Hash::make`: token đã có entropy cao (64 ký tự ngẫu nhiên), cần so khớp deterministic nhanh khi reset, không cần bcrypt salt.
- `password_reset_tokens` dùng `email` làm khóa → mỗi email tối đa 1 record. Request mới → `updateOrInsert` ghi đè (`PROPOSED_BR:reset-one-active-token-per-email`), reset luôn `created_at`.
- Hết hạn tính theo `created_at + 60 phút` (`PROPOSED_BR:reset-token-ttl-60m`). Không thêm cột `expires_at` — tính runtime để giữ nguyên schema mặc định.

### 6.2 Chống dò email (enumeration)
- `forgot-password` luôn trả HTTP 200 + message `auth.reset.link_sent` bất kể email có trong `users` hay không (`PROPOSED_BR:reset-email-no-enumeration`).
- Nếu email không tồn tại: không sinh token, không gửi mail, nhưng response y hệt.
- Việc gửi mail là queued → thời gian phản hồi đồng nhất (không lộ tín hiệu timing).

### 6.3 Bảo mật phiên sau khi reset
- Đổi mật khẩu thành công → xóa toàn bộ `personal_access_tokens` của user (`$user->tokens()->delete()`) (`PROPOSED_BR:reset-revoke-all-sessions`). User phải đăng nhập lại bằng mật khẩu mới ở mọi thiết bị.

### 6.4 Rate limiting
- Route-level: `throttle:auth` (10/phút/IP) — tái dùng limiter có sẵn.
- App-level cooldown: nếu `password_reset_tokens.created_at` của email đó < 60s trước → vẫn trả message thành công (chống enumeration) nhưng **không** gửi mail lại (`PROPOSED_BR:reset-rate-limit`).

### 6.5 Transition Strategy
- **EXTEND** module Auth: thêm 2 method vào `AuthService` + 2 action vào `AuthController` + 2 FormRequest + 1 Notification. Không sửa luồng `change-password`/`login`/`register` hiện có.

---

## 7. DATA MODEL UPDATES

### 7.1 Table: `password_reset_tokens` (KEPT — tái dùng nguyên trạng)

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| email | string | 255 | NO | YES (PK) | — | KEPT | Email user yêu cầu reset | Khóa chính của bảng mặc định Laravel |
| token | string | 255 | NO | NO | — | KEPT | **Hash sha256** của token plaintext | `PROPOSED_BR:reset-token-hashed-at-rest` |
| created_at | timestamp | — | YES | NO | NULL | KEPT | Mốc phát hành token | Dùng tính TTL 60' & cooldown 60s |

> [!IMPORTANT]
> Bảng này **đã có sẵn** (migration `0001_01_01_000000`). KHÔNG tạo migration mới. Bảng mặc định Laravel dùng `email` làm PK (không có cột `id`) — đây là ngoại lệ hợp lệ của "Primary Key Mandate" vì là bảng hạ tầng do framework định nghĩa, không phải domain table mới.

### 7.2 Table: `users` (KEPT — không đổi cấu trúc)

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| id | bigint | 20 | NO | YES | — | KEPT | Primary key | — |
| email | string | 255 | NO | YES | — | KEPT | Dùng để tra cứu user khi reset | — |
| password | string | 255 | NO | NO | — | KEPT | Bị ghi đè khi reset | Cast `hashed` |

### 7.3 Table: `personal_access_tokens` (KEPT — bị xóa hàng loạt khi reset)

| Column | Type | Length | Null | Unique | Default | Action | Description | Notes |
|--------|------|--------|------|--------|---------|--------|-------------|-------|
| id | bigint | 20 | NO | YES | — | KEPT | Primary key | — |
| tokenable_id | bigint | 20 | NO | NO | — | KEPT | FK → users.id | Bị `DELETE` khi reset (`PROPOSED_BR:reset-revoke-all-sessions`) |

### 7.4 Enums
**Không có enum mới.** Luồng này không có state machine — token chỉ tồn tại/hết hạn (tính runtime), không lưu cột trạng thái.

---

## 8. PROCESSING FLOWS

### Flow 1: Yêu cầu link đặt lại mật khẩu (`POST /auth/forgot-password`)

1. Guest gửi `POST /auth/forgot-password` với `{ email }`. (`PROPOSED_BR:reset-rate-limit`)
2. `ForgotPasswordRequest` validate `email` (required, email format). **Không** validate `exists:users` (chống enumeration).
3. `AuthController::forgotPassword()` gọi `AuthService::sendResetLink(ForgotPasswordData $dto)`.
4. Service tra `User::where('email', $dto->email)->first()`.
   - Nếu **không có user** → kết thúc im lặng, sang bước 8 (trả message thành công). (`PROPOSED_BR:reset-email-no-enumeration`)
5. Cooldown check: nếu token hiện tại của email có `created_at > now()-60s` → bỏ qua gửi mail, sang bước 8. (`PROPOSED_BR:reset-rate-limit`)
6. Sinh token: `$plain = Str::random(64)`; `updateOrInsert(['email'], ['token' => hash('sha256',$plain), 'created_at' => now()])`. (`PROPOSED_BR:reset-token-hashed-at-rest`, `PROPOSED_BR:reset-one-active-token-per-email`)
   **State Changes:**
   - `password_reset_tokens.email` = `{email}` (upsert)
   - `password_reset_tokens.token` = `sha256({plain})`
   - `password_reset_tokens.created_at` = `now()`
7. `$user->notify(new ResetPasswordNotification($plain))` — queued; link = `{FRONTEND_URL}/reset-password?token={plain}&email={urlencoded email}`.
8. Trả `200 { message: 'auth.reset.link_sent' }` — đồng nhất mọi nhánh.

**Concurrency Handling:**
- **Mechanism**: `updateOrInsert` theo PK `email` là atomic ở DB → 2 request đồng thời cho cùng email không tạo 2 dòng.
- **Atomic Lock**: không cần lock thêm; cooldown 60s đã hạn chế spam.

**Acceptance Criteria (Happy Path):**
- [ ] Email tồn tại → có 1 dòng `password_reset_tokens` với token đã hash + mail vào queue.
- [ ] Email không tồn tại → response giống hệt, không có dòng token, không có mail.
- [ ] Gọi lại trong 60s → không gửi mail thứ 2.

**Error Cases:**
| Error Condition | System Behavior | State Changes |
|-----------------|-----------------|---------------|
| Email sai format | `ForgotPasswordRequest` reject 422 | No change |
| Vượt `throttle:auth` | 429 Too Many Requests | No change |
| Email không tồn tại | Trả 200 message như thành công (no enumeration) | No change |
| Queue/mail lỗi khi worker chạy | Job retry theo cấu hình queue; user không thấy lỗi đồng bộ | No change (DB token vẫn còn) |

---

### Flow 2: Đặt lại mật khẩu (`POST /auth/reset-password`)

1. Guest mở link → FE màn Reset password → submit `{ email, token, password, password_confirmation }`.
2. `ResetPasswordRequest` validate: `email` (required, email), `token` (required), `password` (required, min:8, confirmed). (`PROPOSED_BR:reset-password-policy`)
3. `AuthService::resetPassword(ResetPasswordData $dto)`:
   a. Lấy dòng `password_reset_tokens` theo `email`. Không có → throw `InputException('auth.reset.invalid_token')`.
   b. So khớp `hash_equals($row->token, hash('sha256', $dto->token))`. Sai → throw `InputException('auth.reset.invalid_token')`. (`PROPOSED_BR:reset-token-hashed-at-rest`)
   c. Kiểm tra TTL: `created_at + 60m < now()` → throw `InputException('auth.reset.expired_token')` và xóa dòng token. (`PROPOSED_BR:reset-token-ttl-60m`)
   d. Tra `User::where('email')->first()`. Không có → throw `InputException('auth.reset.invalid_token')` (đồng nhất, không lộ).
   e. (`[AI-SUGGESTED]`) Nếu `Hash::check($dto->password, $user->password)` → throw `InputException('auth.reset.same_password')`. (`PROPOSED_BR:reset-new-password-must-differ`)
4. Cập nhật mật khẩu (trong DB transaction):
   **State Changes:**
   - `users.password` = `Hash::make({password})` (cast `hashed`)
5. Thu hồi mọi phiên: `$user->tokens()->delete()`. (`PROPOSED_BR:reset-revoke-all-sessions`)
   **State Changes:**
   - `personal_access_tokens` = DELETE WHERE `tokenable_id = {user.id}`
6. Xóa token reset: `DELETE FROM password_reset_tokens WHERE email = {email}`. (`PROPOSED_BR:reset-token-single-use`)
   **State Changes:**
   - `password_reset_tokens` = DELETE row `{email}`
7. (`[AI-SUGGESTED]`) Gửi `PasswordChangedNotification` thông báo mật khẩu đã đổi (cảnh báo bảo mật).
8. Trả `200 { message: 'auth.reset.success' }`.

**Concurrency Handling:**
- **Mechanism**: bọc bước 3a–6 trong `DB::transaction` + `lockForUpdate()` trên dòng token để 2 request reset đồng thời không cùng tiêu thụ 1 token.
- **Atomic Lock**: token single-use đảm bảo lần thứ 2 không tìm thấy dòng → invalid.

**Acceptance Criteria (Happy Path):**
- [ ] Token hợp lệ + chưa hết hạn → `users.password` đổi, dòng token bị xóa, mọi `personal_access_tokens` của user bị xóa.
- [ ] Dùng lại token đã reset → `auth.reset.invalid_token`.
- [ ] Token quá 60 phút → `auth.reset.expired_token`.

**Error Cases:**
| Error Condition | System Behavior | State Changes |
|-----------------|-----------------|---------------|
| Token không tồn tại / sai | Throw `auth.reset.invalid_token` (422) | No change |
| Token hết hạn | Throw `auth.reset.expired_token` (422) + xóa dòng token | `password_reset_tokens` DELETE |
| Mật khẩu < 8 / không confirmed | `ResetPasswordRequest` reject 422 | No change |
| Mật khẩu mới trùng cũ | Throw `auth.reset.same_password` (422) | No change |
| 2 request reset đồng thời | Request sau không thấy token → invalid (nhờ lock) | Chỉ 1 lần đổi |
| Vượt `throttle:auth` | 429 | No change |

---

## 9. UI/UX & FRONTEND IMPLICATIONS (Next.js App Router)

### 9.1 FE Scope Classification
- **Complexity tier**: Standard.
- **Flow type**: A (form only) × 2 màn độc lập.
- **Data mode**: `http+mock` (mock trước bằng MSW, sau nối API thật).

### 9.2 Screen & Route Inventory

| # | Screen / Dialog | Route (App Router) | Flow | Renders | Primary API | Notes |
|---|-----------------|--------------------|------|---------|-------------|-------|
| S1 | Forgot password (nhập email) | `app/(auth)/forgot-password/page.tsx` | A | Form 1 field + submit | `POST /api/v1/auth/forgot-password` | Link từ màn Login; sau submit hiện success state |
| S2 | Reset password (đặt mật khẩu mới) | `app/(auth)/reset-password/page.tsx` | A | Form password + confirm | `POST /api/v1/auth/reset-password` | Đọc `token`,`email` từ `searchParams`; thiếu param → invalid state |

### 9.3 Component Tree

```markdown
S1 — Forgot password (`features/auth/`)
- ForgotPasswordPage (container)        → owns useForgotPassword hook
  - ForgotPasswordForm (presentational) → email input + submit (RHF + Zod)
  - ResetLinkSentNotice (presentational)→ success state sau khi gửi

S2 — Reset password (`features/auth/`)
- ResetPasswordPage (container)         → đọc searchParams, owns useResetPassword hook
  - ResetPasswordForm (presentational)  → password + password_confirmation
  - InvalidLinkNotice (presentational)  → khi thiếu/invalid token param
```

### 9.4 Data Layer

| Hook | Repository method | API endpoint | Returns | Used by |
|------|-------------------|--------------|---------|---------|
| `useForgotPassword()` | `AuthRepository.forgotPassword` | `POST /api/v1/auth/forgot-password` | `{ message }` | S1 |
| `useResetPassword()` | `AuthRepository.resetPassword` | `POST /api/v1/auth/reset-password` | `{ message }` | S2 |

> Theo pattern `bks-fe-api-integration`: repository `extends BaseRepository`, validate response bằng Zod, map lỗi 422 qua `mapBackendErrors`.

### 9.5 Forms & Zod Schemas

| Form | Field | Type | Client Rule | Error Key |
|------|-------|------|-------------|-----------|
| Forgot (S1) | `email` | string | required, email | `auth.errors.email_invalid` |
| Reset (S2) | `password` | string | required, min 8 | `auth.errors.password_min` |
| Reset (S2) | `password_confirmation` | string | required, khớp `password` | `auth.errors.password_mismatch` |
| Reset (S2) | `token` | string (hidden) | required (từ URL) | `auth.errors.token_required` |
| Reset (S2) | `email` | string (hidden) | required (từ URL) | — |

### 9.6 UI States

| Screen | Loading | Empty | Error | Permission-denied | Success feedback |
|--------|---------|-------|-------|-------------------|------------------|
| S1 | submit spinner | — | field error + toast `mapBackendErrors` | N/A (guest) | Chuyển sang `ResetLinkSentNotice` + toast `auth.toasts.reset_link_sent` |
| S2 | submit spinner | `InvalidLinkNotice` khi thiếu token/email | field error / `auth.reset.expired_token` banner | N/A (guest) | Toast `auth.toasts.reset_success` + redirect `/login` |

### 9.7 Presentation & UX Behavior (UI-*)
- **UI-001**: S1 sau submit thành công ẩn form, hiện `ResetLinkSentNotice` (không điều hướng) để tránh lộ email tồn tại. Used by: S1.
- **UI-002**: S2 nếu `searchParams` thiếu `token` hoặc `email` → render `InvalidLinkNotice` ngay, không render form. Used by: S2.
- **UI-003**: S2 reset thành công → toast rồi `router.push('/login')` sau ~1.5s. Used by: S2.
- **UI-004**: Nút submit disable trong lúc request pending để chặn double-submit. Used by: S1, S2.

### 9.8 Navigation, Global State & i18n
- **Navigation**: Login → link "Quên mật khẩu?" → S1. Email link → S2 → sau thành công → `/login`.
- **Global state**: Không cần — guest flow, state cục bộ trong hook. Không đụng auth store.
- **i18n keys** (namespace `messages/{locale}/auth.json`):
  - `auth.reset.link_sent`, `auth.reset.success`, `auth.reset.invalid_token`, `auth.reset.expired_token`, `auth.reset.same_password`
  - `auth.errors.email_invalid`, `auth.errors.password_min`, `auth.errors.password_mismatch`, `auth.errors.token_required`
  - `auth.toasts.reset_link_sent`, `auth.toasts.reset_success`
  - `auth.forgot.title`, `auth.forgot.submit`, `auth.reset.title`, `auth.reset.submit`, `auth.reset.invalid_link_notice`

---

## 10. NOTIFICATIONS

| Trigger Event | Channel | Template/Subject | Variables | Recipient |
|---------------|---------|------------------|-----------|-----------|
| `forgot-password` thành công (email tồn tại) | Email (queued) | `ResetPasswordNotification` — "Đặt lại mật khẩu" | `{reset_url}`, `{expires_minutes:60}`, `{user_name}` | User |
| `reset-password` thành công `[AI-SUGGESTED]` | Email (queued) | `PasswordChangedNotification` — "Mật khẩu đã được thay đổi" | `{user_name}`, `{changed_at}`, `{support_contact}` | User |

> `ResetPasswordNotification implements ShouldQueue`, gửi qua `Notifiable` trait. Link build từ `config('app.frontend_url')`.

---

## 11. API ENDPOINT INVENTORY

| Method | Endpoint | Guard | Description | Related Flow |
|--------|----------|-------|-------------|--------------|
| POST | `/api/auth/forgot-password` | guest (`throttle:auth`) | Gửi link reset về email | Flow 1 |
| POST | `/api/auth/reset-password` | guest (`throttle:auth`) | Xác thực token + đặt mật khẩu mới | Flow 2 |

---

## 12. IMPLEMENTATION TASKS

### Phase 1: Foundation (BE)
1. Thêm 2 route guest `forgot-password`, `reset-password` vào nhóm `throttle:auth` trong `routes/api.php`.
2. Tạo DTO `App\DTOs\Api\Auth\ForgotPasswordData` và `ResetPasswordData` (`final readonly`).
3. Tạo `ForgotPasswordRequest`, `ResetPasswordRequest` (`app/Http/Requests/Auth/` — mirror sibling `ChangePasswordRequest`).
4. Thêm `config('app.frontend_url')` nếu chưa có (đọc từ `env('FRONTEND_URL')`).

### Phase 2a: Notifications/Jobs
5. Tạo `App\Notifications\ResetPasswordNotification implements ShouldQueue`.
6. (`[AI-SUGGESTED]`) Tạo `PasswordChangedNotification implements ShouldQueue`.

### Phase 2b: API logic
7. Thêm `AuthService::sendResetLink(ForgotPasswordData)` — sinh/hash token, cooldown, `updateOrInsert`, `notify`.
8. Thêm `AuthService::resetPassword(ResetPasswordData)` — verify hash/TTL, transaction + lock, đổi pass, revoke tokens, xóa token, notify.
9. Thêm `AuthController::forgotPassword()` + `resetPassword()` (delegate sang service, trả message đồng nhất).
10. Thêm localization keys `auth.reset.*` (BE messages) cho exception/response.

### Phase 3a–3d: Frontend
11. (3a Data) `AuthRepository.forgotPassword/resetPassword` + Zod response schema + MSW mock.
12. (3b Hooks) `useForgotPassword`, `useResetPassword` (+ `mapBackendErrors`).
13. (3c Screens) S1 `ForgotPasswordPage` + `ForgotPasswordForm` + `ResetLinkSentNotice`.
14. (3c Screens) S2 `ResetPasswordPage` + `ResetPasswordForm` + `InvalidLinkNotice`.
15. (3d i18n) thêm namespace keys ở §9.8 cho mọi locale; link "Quên mật khẩu?" ở màn Login.

### Phase 4: Quality
16. Feature test BE: gửi link (email tồn tại/không), cooldown, token hết hạn, token sai, single-use, revoke sessions, same-password.
17. Security test: no-enumeration (so response/timing), rate-limit 429.
18. FE test: Vitest cho 2 form + invalid-link state; Playwright flow forgot→reset→login.
19. Cập nhật `docs/logic/auth/` (thêm `reset-password.md`) và đăng ký các `PROPOSED_BR:*` thành `BR-AUTH-*` chính thức trong `docs/system/br-registry.md`.

---

## 13. DRAFT COVERAGE MATRIX

| Draft Section | Draft Item | Requirement Section | Status |
|---------------|-----------|---------------------|--------|
| "Quên mật khẩu" | Chức năng reset qua email | OVERVIEW, Flow 1+2 | ✅ Covered |
| "Nhập email, hệ thống gửi link reset về mail" | Forgot endpoint + email | Flow 1, §9 (S1), §10 (notification) | ✅ Covered |
| "Bấm vào link thì nhập mật khẩu mới" | Reset endpoint + màn set password | Flow 2, §9 (S2) | ✅ Covered |
| "Làm cả backend và màn hình frontend" | BE + FE scope | §11, §12, §9 | ✅ Covered |
| *(Silent)* Token storage & hết hạn | Token hash + TTL 60' | §6.1, BR reset-token-* | ✅ Covered (AI proposed) |
| *(Silent)* Email không tồn tại | Chống enumeration | §6.2, `PROPOSED_BR:reset-email-no-enumeration` | ✅ Covered (AI proposed) |
| *(Silent)* Chống spam | Rate-limit + cooldown | §6.4, `PROPOSED_BR:reset-rate-limit` | ✅ Covered (AI proposed) |
| *(Silent)* Session sau reset | Revoke all tokens | §6.3, `PROPOSED_BR:reset-revoke-all-sessions` | ✅ Covered (AI proposed) |
| *(Silent)* Concurrency | Transaction + lock token | Flow 2 Concurrency | ✅ Covered (AI proposed) |

---

## 14. OPEN QUESTIONS (Phase V — chờ duyệt)

1. **TTL 60 phút** có phù hợp policy bảo mật của team không? (cân nhắc 15–30' nếu yêu cầu chặt hơn).
2. **`PasswordChangedNotification`** (thông báo "mật khẩu đã đổi") — có gửi không hay bỏ để giảm email?
3. **`reset-new-password-must-differ`** — có bắt buộc khác mật khẩu cũ không? (tốn 1 query `Hash::check`).
4. **`FRONTEND_URL`** — xác nhận route FE là `/reset-password` (khớp §9.2 S2).
