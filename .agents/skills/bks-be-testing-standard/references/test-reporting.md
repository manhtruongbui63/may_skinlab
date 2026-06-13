# 📊 Test Reporting

This reference documents the mandatory format for test reports. Reports are written to `docs/testing/{feature_name}.md` (kebab-case, e.g., `docs/testing/company-management.md`).

> [!IMPORTANT]
> The test report file MUST be written entirely in **Vietnamese**.

> [!CAUTION]
> **This report is REPORT-ONLY.** Tests written by this skill are never fixed — a test is `pass` or `fail`, full stop. There is no "fixed" state, no `Đã khắc phục thành pass`, no `Các bước giải quyết`. Fixing is the user's decision (they re-run the relevant code skill). Your report is the honest final record of code-vs-requirement agreement.

## When to Create/Update the Report

- **Full Workflow**: Create the report file header in Step 5, then for each test file: run it once and record the real result (`pass`/`fail`) for every method in Step 6c. There is **no fix phase** — what you record is final.
- **Partial Update Workflow**: Update the existing report file in Step P4 — modify entries for tests re-aligned to the new requirement, add new entries, record regressions as `fail`, but never delete existing fail history.

## Report Purpose

The report is the **objective verdict** on whether the code meets the requirement. A `fail` is not a problem to be hidden by fixing — it is the report's most valuable output, telling the user exactly where code and spec disagree so they can decide what to change. A report showing only `pass` for everything — especially right after the agent "fixed" things — is the failure mode this format exists to prevent.

## Report Structure

The report file MUST follow this exact structure:

```markdown
# Báo cáo Test: [Tên Feature]

## 1. Thông tin chung
- **Ngày test**: YYYY-MM-DD
- **Môi trường**: Local / Testing

## 2. Chi tiết kết quả chạy test

### [Tên file Test] (e.g., `tests/Feature/Api/Company/CompanyStoreTest.php`)

#### Test Case 1: `test_user_can_create_company_successfully`
- **Nội dung test**: `test_user_can_create_company_successfully` - Kiểm tra việc người dùng đã đăng nhập với đầy đủ quyền có thể tạo mới công ty thành công với payload hợp lệ và dữ liệu được lưu chính xác trong database.
- **Kết quả**: `pass`

#### Test Case 2: `test_guest_cannot_create_company`
- **Nội dung test**: `test_guest_cannot_create_company` - Kiểm tra việc khách (chưa đăng nhập) sẽ bị từ chối truy cập (mã lỗi 401) khi cố gắng tạo mới công ty.
- **Kết quả**: `fail`
- **Nguyên nhân**: Yêu cầu (BR-AUTH) quy định endpoint phải trả 401 cho khách, nhưng test nhận được 201 — route tạo công ty đang thiếu middleware `auth:sanctum`. Code và yêu cầu mâu thuẫn; KHÔNG tự sửa, để người dùng quyết định.
```

> [!NOTE]
> In the example above, `fail` is recorded and **left as-is**. The test skill does NOT touch the route. The user reads the report, re-runs `bks-be-api-standard` to add the middleware (if they conclude the code is wrong), then re-runs the suite.

## Result Classification Rules

Every test case MUST use one of these two result formats — there is **no "fixed" format** because this skill does not fix:

| Situation | Format | Required Fields |
|---|---|---|
| Test passed | `pass` | `Nội dung test`, `Kết quả` |
| Test failed | `fail` | `Nội dung test`, `Kết quả`, `Nguyên nhân` |

> [!CAUTION]
> A `fail` is recorded and left as `fail`. You MUST NOT edit application code, test code, or config to turn it into a pass. The formats `fail (Đã khắc phục thành pass)`, `Các bước giải quyết`, and `Lưu ý sửa lỗi` are **forbidden** — they describe a fix that must never happen in this skill.

## Additional Result Formats for Partial Updates

When updating existing tests after a **requirement** change (Partial Update Workflow), use these additional formats:

| Situation | Format |
|---|---|
| Test re-aligned to the new requirement, now passes | `pass (Đã cập nhật logic)` |
| Code does not meet the new requirement, or a previously-passing test broke | `fail` (append `(Regression)` if it was passing before) with `Nguyên nhân` — NOT fixed |
| New test case added during update | Same as normal (`pass` or `fail`) |

## Common Mistakes — Do NOT Do These

These are real mistakes observed in practice. The report format exists for a reason — stakeholders need to see what went wrong and how it was resolved.

### ❌ Mistake 1: Summarizing instead of listing each test case
```markdown
### 2.1 ContactIndexTest
- **Trạng thái**: **100% PASSED** (6/6 tests)
```
This tells the reader nothing. Were there failures during testing? What was tested?

### ✅ Correct: List every test case individually
```markdown
### 1. `tests/Feature/Api/Contact/ContactIndexTest.php` (Danh sách Người liên hệ)

#### Test Case 1: `test_user_unauthenticated_cannot_list_contacts`
- **Nội dung test**: Khách chưa đăng nhập không thể xem danh sách người liên hệ (Trả về 401).
- **Kết quả**: `pass`

#### Test Case 2: `test_user_with_scope_related_can_view_owned_contacts`
- **Nội dung test**: Người dùng có scope RELATED chỉ xem được contacts do mình tạo.
- **Kết quả**: `fail`
- **Nguyên nhân**: Yêu cầu là user scope RELATED chỉ thấy contact của mình, nhưng response trả về rỗng. Đối chiếu spec: có thể test setup chưa gán `created_by`, HOẶC scope query của code sai. KHÔNG tự sửa — ghi nhận để người dùng quyết định.
```

### ❌ Mistake 2: Fixing code/test to turn a `fail` into a `pass`
The single biggest violation. This skill is report-only: when a test fails you record it and stop. Editing the route, the service, the assertion, or the factory to make it green destroys the objective signal and steals the user's decision. If you catch yourself doing it, revert and restore the `fail`.

### ❌ Mistake 3: Using custom formats
Do NOT use "Lần chạy 1" / "Lần chạy 2", "PASSED"/"FAILED", or any format other than the template. The format is: `#### Test Case N:` → `Nội dung test` → `Kết quả` → (if fail) `Nguyên nhân`.

### ❌ Mistake 4: Using bullet-point lists with arrow format
```markdown
### 2. ContactStoreTest.php (Tạo mới Contact)
- **Tổng số test cases**: 14
- **Đạt**: 14
- **Không đạt**: 0

#### Chi tiết test cases:
- `test_guest_cannot_store_contact`: Kiểm tra... -> **Pass**
- `test_user_without_permission`: Kiểm tra... -> **Pass**
```
This format loses all structure. Each test method MUST have its own `#### Test Case N:` heading with `Nội dung test` and `Kết quả` on separate lines. Summary counts like `Tổng số test cases` and `Đạt` are never acceptable.

### ❌ Mistake 5: Any "fixed" label — `Lưu ý sửa lỗi`, `Đã khắc phục thành pass`, `Các bước giải quyết`
```markdown
#### Test Case 1: `test_guest_cannot_list_contacts`
- **Nội dung test**: Kiểm tra...
- **Kết quả**: `fail` (Đã khắc phục thành `pass`)
- **Các bước giải quyết**: ...
```
All of these labels imply you fixed something — which is forbidden in this skill. There is no "fixed" state. The ONLY correct way to document a failing test is plain `fail` + `Nguyên nhân`:
```markdown
#### Test Case 1: `test_guest_cannot_list_contacts`
- **Nội dung test**: Kiểm tra...
- **Kết quả**: `fail`
- **Nguyên nhân**: AutoLoginMiddleware tự đăng nhập user ID = 1 nên guest vẫn truy cập được — trái với yêu cầu trả 401. Báo cáo và để người dùng quyết định.
```

## Format Validation Checklist

Before considering the report complete, verify:
- [ ] Every test method has its own `#### Test Case N:` entry — NO summarization like "100% PASSED (6/6)"
- [ ] Every entry has `Nội dung test` with a description in Vietnamese
- [ ] Every entry has `Kết quả` that is exactly `pass` or `fail` (no "fixed"/`Đã khắc phục` variants)
- [ ] Every `fail` entry has `Nguyên nhân` documented (PHPUnit signal + diễn giải theo yêu cầu)
- [ ] No "fixed" artifacts anywhere — no `Đã khắc phục thành pass`, no `Các bước giải quyết`, no `Lưu ý sửa lỗi` (nothing was fixed)
- [ ] No application/test code was edited to flip a `fail` into a `pass`
- [ ] No summary counts like `Tổng số test cases` or `Đạt` — every test case must be listed individually
- [ ] Test cases are grouped under their `### [N].` header with file path
- [ ] The report is entirely in Vietnamese
