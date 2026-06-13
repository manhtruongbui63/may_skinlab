---
name: bks-be-testing-standard
description: Comprehensive backend testing standards for Laravel (PHPUnit). Covers Feature Tests, Unit Tests, Performance Testing (N+1 queries, response time), Security Testing (SQL injection, IDOR, XSS, rate limiting), Integration Testing, Concurrency (optimistic locking, race conditions), API Contract Testing, Data Integrity (migrations, soft delete, audit trail), and Edge Cases. Use this skill whenever writing tests, ensuring code coverage, validating API responses, testing database operations, implementing security checks, or handling concurrent operations in Laravel applications. Also use this skill when updating existing tests after logic changes — it supports both full test creation and partial update workflows.
---

# Laravel Backend Testing Standards

This skill writes the **objective, comprehensive acceptance test suite** — it covers every case derived from the **requirement**, not from the implementation. It supports two execution modes: **Full Workflow** (writing tests from scratch) and **Partial Update** (updating existing tests after logic changes).

> [!CAUTION]
> **TWO ABSOLUTE RULES for this skill — they define its entire purpose:**
>
> 1. **REQUIREMENT-FIRST (objectivity)**: Design test cases from the **requirement / spec** (task file, `docs/requirements/`, `docs/logic/`, `docs/system/br-registry.md`, API doc). Read the source code ONLY to locate symbols (field names, routes, enum cases) — NEVER to decide what the *correct* behaviour is. A test derived from the code merely confirms "the code does what the code does" and catches nothing.
> 2. **NO-FIX / REPORT-ONLY**: After running tests you **ONLY report pass/fail** — you **MUST NOT** modify application code OR test code to make a failing test pass. A failing test is a signal that EITHER the code is wrong OR the test is wrong; **the user decides** which, then fixes it themselves (re-running the relevant code skill). Your job ends at an honest pass/fail report.
>
> This is the opposite of a smoke test. A *smoke test* (written inside the code skills `bks-be-api-standard` / `command` / `job` / `master-data` right after coding) verifies the freshly-written code runs and **is fixed immediately on failure**. This skill is the later, independent acceptance pass and **never auto-fixes**. See "Smoke Test vs Acceptance Test" below.

> [!IMPORTANT]
> Every significant piece of code should have at least one corresponding test. If a full Feature Test is too complex, fall back to Unit Testing each key Service method.

---

## Smoke Test vs Acceptance Test (mandatory boundary)

This skill writes the **Acceptance Test** — NOT a smoke test — and it **never auto-fixes**.

| | Smoke Test (in the code skills) | Acceptance Test (**this skill**) |
|---|---|---|
| Written by | `bks-be-api-standard` / `command` / `job` / `master-data`, right after coding | `bks-be-testing-standard` |
| Purpose | Confirm the code **runs** | Verify it **meets the requirement**, full coverage |
| Design source | Happy path of the just-written code | **The requirement input** (task / requirement / BR / logic doc); read the code only to look up symbol names |
| On FAIL | **Fix the code immediately** (just-written code → a failure means the code is buggy) | **NEVER fix** — only report pass/fail, then STOP; the user decides whether the code or the test is wrong |
| File | `{...}SmokeTest.php` | `{...}Test.php` (replaces the smoke test once the full suite exists — delete the matching `*SmokeTest.php`) |

---

## Step 0: Determine Execution Mode

Before starting any work, determine which workflow to follow:

```
Do tests already exist for this feature?
├── NO  → Full Workflow (Steps 1–7)
└── YES → Has the application logic changed and tests need updating?
          ├── YES → Partial Update Workflow (see "Partial Update Workflow" section below)
          └── NO  → Clarify the task with the user
```

If the user explicitly says they want to write tests from scratch, always use the Full Workflow regardless of whether tests exist.

---

## Full Workflow

### Step 1: Decide Test Type

```
Is the feature an HTTP endpoint?
├── YES → Can you test the full request cycle end-to-end?
│         ├── YES → Feature Test
│         └── NO  → Feature Test for HTTP layer + Unit Tests for Service methods
└── NO  → Is it Service logic, calculations, or background jobs?
          └── YES → Unit Test
```

**Fallback Rule**: When Feature Tests are impractical (3rd-party APIs, OAuth, complex flows), write Unit Tests covering each key Service method. Every branch, happy path, and unhappy path should be tested.

---

### Step 2: Read the Required Reference Files

Based on the test type decided in Step 1, you **MUST** read the corresponding reference file before writing any test code. These files contain structure templates, mandatory techniques, and concrete examples that are essential.

**Always read first:**
1. Read `references/test-reporting.md` — Contains the **mandatory report format** and template. You need to understand this format BEFORE writing tests so you can track results correctly as you work.

**For Feature Tests (HTTP endpoints):**
1. Read `references/feature-tests.md` — Contains the structure template, test design techniques (EP, BVA, Validation Matrix, Decision Table, State Transition), mandatory assertions, and negative case requirements.

**For Unit Tests (Service logic):**
1. Read `references/unit-tests.md` — Contains the structure template, mocking rules, and when-to-use guidance.

**Additionally, read these reference files when the corresponding area is relevant to your test:**

| When this applies | Read this file |
|---|---|
| Endpoints with database queries or large datasets | `references/performance-testing.md` |
| Endpoints with user input or multi-tenant data | `references/security-testing.md` |
| Features with side effects (events, notifications, transactions) | `references/integration-concurrency.md` |
| API response contracts, soft delete, migrations, edge cases | `references/contract-integrity-edge.md` |

> [!IMPORTANT]
> Do NOT proceed to writing tests without reading the relevant reference files. The techniques documented there (especially EP, BVA, and the Validation Matrix for Feature Tests) are mandatory — not optional.

---

### Step 3: Analyze the Requirement (primary), then the Code (reference only)

> [!CAUTION]
> **Design the expected behaviour from the REQUIREMENT, not from the code.** If you read `rules()` and write a test that asserts exactly those rules, you have tested nothing — the test will pass by construction and will never catch a code-vs-spec mismatch. The requirement is the oracle; the code is the thing under test.

**3a. Read the requirement sources FIRST (these define the expected behaviour):**

1. **Task file** (`docs/tasks/...`) and **requirement spec** (`docs/requirements/...`) — the acceptance criteria.
2. **Logic Doc** (`docs/logic/{module}/...`) — the `FLOW` and `RULES` the feature must obey.
3. **BR Registry** (`docs/system/br-registry.md`) — every `BR-*` rule the feature is bound to.
4. **API Doc** (`docs/api/modules/...`) — the documented request contract and response shape.

From these, write down the expected inputs, outputs, validation limits, authorization rules, and edge cases **before** opening any PHP file. If a requirement source is missing or ambiguous, **report that gap** instead of inferring the answer from the code.

**3b. Read the code ONLY to locate symbols, never to decide correctness:**

- `FormRequest`, `Service`/`Controller`, `Policy`, `Model` — use these to find exact field names, route URIs, enum cases, and table/column names so your assertions reference real symbols.
- If the code contradicts the requirement (e.g., `max:50` in code but the spec says `40`), **write the test to the requirement** and let it fail — that failure is exactly the objective signal this skill exists to produce. Do NOT "correct" the test to match the code.

---

### Step 4: Design Test Cases Using Required Techniques

For Feature Tests, you MUST apply these techniques from `references/feature-tests.md`. The reason these techniques matter is that they systematically eliminate gaps — without EP you might over-test valid inputs, without BVA you'll miss off-by-one errors, and without the Validation Matrix you'll forget to test nullable vs required fields.

#### Validation Matrix (Mandatory for every FormRequest)
Read each field's validation rules, then **group test cases by rule type** — not by field. This means one test function per rule type that validates all fields sharing that rule, rather than one test function per field per rule. This reduces redundancy while maintaining full coverage.

For example, if `name` and `email` both have the `required` rule, write ONE test `test_store_fails_when_required_fields_are_missing` that sends a payload without both fields and asserts both appear in the validation errors — NOT two separate tests for each field.

Design test cases for these rule categories:
- **Required Rule**: One test that omits ALL required fields at once and asserts each one appears in the validation error response
- **Nullable Rule**: One test that sends `null` for each nullable field (can combine into one test if they share the same nullable behavior)
- **Data Type Rules** (`integer`, `boolean`, `array`, `string`): One test per type constraint that sends wrong-type values for all fields sharing that type
- **Format Rules** (`email`, `url`, `regex`): One test per format rule that sends incorrectly formatted values for all fields sharing that format
- **Business Rules** (`unique`, `exists`): One test per business rule — e.g., one test for all `unique` violations, one test for all `exists` violations
- **Enum Rules**: One test that sends an invalid enum value for all enum fields at once
- **Conditional Rules** (`required_if`, `required_with`, `required_unless`): One test per conditional rule group, testing both condition-met and condition-not-met scenarios
- **BVA/Max Length Rules**: One test that sends max+1 values for all fields sharing the same max length constraint. Group fields by same max length boundary where practical.

> [!IMPORTANT]
> The key principle is: **same rule = same test function**. The only exception is when a field requires a unique test setup (e.g., `unique` rule needs pre-seeded data, `exists` rule needs a foreign key) that cannot be combined with other fields' setup in a single request. In that case, create a separate test for that field's specific setup need, but still avoid creating separate tests for fields that CAN be tested together.

#### Equivalence Partitioning (EP)
Pick **one representative value** for each valid and invalid partition to reduce test case count without losing coverage.

#### Boundary Value Analysis (BVA)
Test `min-1`, `min`, `min+1` and `max-1`, `max`, `max+1` for every field with numeric or length constraints.

#### Decision Table (for complex business logic)
Map all input conditions to resulting actions. Test every combination of True/False.

#### State Transition (for status workflows)
Verify valid transitions (Happy Path) and explicitly test INVALID transitions (Negative Path).

> [!TIP]
> See `references/feature-tests.md` for concrete examples of each technique with sample code.

---

### Step 5: Create the Report File

Before writing any tests, create the report file at `docs/testing/{feature_name}.md` with the header. This ensures the report exists before you start tracking results.

```markdown
# Báo cáo Test: [Tên Feature]

## 1. Thông tin chung
- **Ngày test**: YYYY-MM-DD
- **Môi trường**: Local / Testing

## 2. Chi tiết kết quả chạy test
```

---

### Step 6: Write, Run, and Report Per File (REPORT-ONLY — NO FIX)

This is the most critical step. You process **one test file at a time**: write it, run it, and record the result exactly as it happened. 

> [!CAUTION]
> **You MUST NOT fix anything in this step.** If a test fails, you do **NOT** edit the application code, and you do **NOT** edit the test to make it pass. You record the failure with its cause and move on. A failure is the deliverable's most valuable output — it tells the user that code and spec disagree. Silently fixing it destroys that signal and biases the suite toward green.

```
For each test file:
  1. Write the test file (assertions derived from the REQUIREMENT — Step 3a)
  2. Run it: php artisan test --filter={TestClassName}
  3. Append results to the report: pass/fail per test method, with cause for each fail
  4. Move to the next test file — DO NOT fix failures
```

> [!IMPORTANT]
> **Do NOT write all test files first and then run them.** When you batch-write many files before running, context grows too long and intermediate results get lost. Write → run → report one file, then the next.

> [!CAUTION]
> **When and how to stop.** If a test fails because the *test itself* is clearly malformed (typo in a route, wrong factory column) you may notice it, but you STILL do not silently patch-and-continue — because the line between "my test is wrong" and "the code is wrong" is exactly the judgement reserved for the user. Record every failure honestly and hand the report back. The user runs the relevant code skill to fix code or test and re-runs the suite.

#### 6a. Write One Test File

Create a single test file following the conventions below.

**File Organization:**
```text
tests/Feature/
├── Api/                          # API Feature Tests (directly under feature folders, e.g. Api/Auth, Api/Company)
├── Console/                      # Artisan Console Commands integration tests
└── Jobs/                         # Queue background job dispatch integration tests

tests/Unit/
├── Services/                     # Centralized tests for complex service business logic
├── Jobs/                         # Background job execution handler unit tests
├── Rules/                        # Custom Validation Rules tests
└── Helpers/                      # Static Helper utility tests
```

Examples:
- `tests/Feature/Api/Company/CompanyStoreTest.php`
- `tests/Feature/Api/Auth/UserLoginTest.php`
- `tests/Feature/Console/SendRemindersCommandTest.php`
- `tests/Feature/Jobs/ProcessInvoiceJobDispatchTest.php`
- `tests/Unit/Services/AuthServiceTest.php`
- `tests/Unit/Jobs/ProcessInvoiceJobTest.php`
- `tests/Unit/Rules/PasswordRuleTest.php`

**Core Principles:**
- **Framework**: PHPUnit (built into Laravel 13)
- **Isolation**: Every test is independent — use `RefreshDatabase` trait
- **Database**: SQLite `:memory:` for speed (pre-configured in `phpunit.xml`)
- **Pattern**: Follow **AAA** — Arrange → Act → Assert
- **Factories**: Use Model Factories for test data, never hardcode
- **Type Safety**: Assert against constants or Enum values, not raw integers
- **File Isolation**: Each endpoint/action MUST have its own separate test file

**Naming Conventions:**

| Context | Convention | Example |
|---|---|---|
| Feature test class | `{Resource}{Action}Test` | `CompanyStoreTest` |
| Feature method | `test_{subject}_can_{action}_{condition}` | `test_user_can_update_profile_successfully` |
| Unit test class | `{Feature}Test` | `AuthServiceTest` |
| Unit method | `test_{method}_{condition}_returns_{result}` | `test_create_when_email_exists_throws_exception` |

**Mandatory Assertions for Feature Tests:**
1. **HTTP Status Code**: `assertStatus(200 | 201 | 204 | 400 | 401 | 403 | 404 | 422)`
2. **Response Structure**: `assertJsonStructure` or `assertJsonPath` on key fields
3. **Database State** (for mutations): `assertDatabaseHas()` or `assertDatabaseMissing()`
4. **Activity Log** (BR-G002 — for create/update/delete endpoints): Assert an activity record was created
   ```php
   $this->assertDatabaseHas('activity_log', [
       'subject_type' => Company::class,
       'subject_id'   => $company->id,
       'description'  => 'updated',
       'causer_id'    => $user->id,
   ]);
   ```
5. **Side Effects** (if applicable): Jobs dispatched, Mails sent, Events fired

**Mandatory Negative/Error Cases** — every Feature Test file MUST also cover:
- **Unauthenticated** (`401`): Call without `actingAs`
- **Forbidden** (`403`): Call with a user that lacks permission
- **Validation Error** (`422`): Send invalid/missing fields grouped by rule type (see Validation Matrix in Step 4)
- **Not Found** (`404`): Reference a non-existent resource
- **Business Rule Violation** (`400`): Trigger a known business constraint failure

#### 6b. First Run

```bash
php artisan test --filter={TestClassName}
```

#### 6c. Report Results — Exactly As They Are (this is the FINAL state; there is no fix pass)

**Immediately after the run**, append results to `docs/testing/{feature_name}.md` for **every test method**, recording their actual state — pass or fail. This is the definitive report: a `fail` recorded here **stays `fail`** because this skill does not fix anything. Use this EXACT format for every single test method — no summarization, no shortcuts:

```markdown
### [N]. `[đường dẫn file test]` ([Mô tả nhóm])

#### Test Case 1: `test_method_that_passed`
- **Nội dung test**: Mô tả ngắn gọn kiểm tra điều gì.
- **Kết quả**: `pass`

#### Test Case 2: `test_method_that_failed`
- **Nội dung test**: Mô tả ngắn gọn kiểm tra điều gì.
- **Kết quả**: `fail`
- **Nguyên nhân**: [Mô tả lỗi thực tế từ output của PHPUnit — error message, expected vs actual, exception thrown]
```

> [!CAUTION]
> **Do NOT fix — only report.** Record `fail` exactly as it happened and leave it. This is an objective acceptance test: a `fail` means the code and the requirement disagree — that is precisely the value of the report. If you edit code (or the test) to make it pass, you have decided "who is right" on the user's behalf and destroyed that signal. Fixing is done by the **user** (by re-running the relevant code skill), not by this test skill.

> [!CAUTION]
> **FORBIDDEN FORMATS** — These are real mistakes from past reports. If your output matches ANY of these patterns, it is WRONG:
>
> **❌ Summary counts instead of per-case entries:**
> ```
> ### 2. ContactStoreTest.php
> - **Tổng số test cases**: 14
> - **Đạt**: 14
> - **Không đạt**: 0
> ```
>
> **❌ Bullet-point list with arrow format:**
> ```
> - `test_guest_cannot_store_contact`: Kiểm tra... -> **Pass**
> - `test_user_without_permission`: Kiểm tra... -> **Pass**
> ```
>
> **❌ Any "fixed" label — `Đã khắc phục thành pass`, `Lưu ý sửa lỗi`, `Các bước giải quyết`:**
> These belong to the OLD fix-loop and are now FORBIDDEN. This skill does not fix anything, so a test is only ever `pass` or `fail`. If you find yourself writing a "how I fixed it" line, STOP — you were not supposed to fix it. Revert your code/test edit, restore the honest `fail`, and hand the report to the user.
>
> **❌ Other forbidden patterns:**
> - Summarizing as "100% PASSED (6/6 tests)"
> - Skipping test cases that passed — ALL methods must be listed
> - Grouping as "Lần chạy 1" / "Lần chạy 2"
> - Using `#### Chi tiết test cases:` as a section header
>
> **✅ The ONLY acceptable format is:**
> ```
> #### Test Case N: `test_method_name`
> - **Nội dung test**: [mô tả]
> - **Kết quả**: `pass` hoặc `fail`
> ```
> Every single test method must have its own `#### Test Case N:` entry. No exceptions, no shortcuts, no matter how many tests there are.

#### 6d. Do NOT Fix — Record the Cause and Move On

There is **no fix sub-step**. For every `fail`, the only action is to document its root cause clearly enough that the user can decide whether the *code* or the *test* is wrong:

- **Nguyên nhân**: copy the actual PHPUnit signal — the assertion that failed, expected vs actual, or the exception/stack frame. Add one line of interpretation tied to the requirement, e.g. *"BR-U014 yêu cầu `max:40` nhưng API trả 200 với 50 ký tự → code và spec mâu thuẫn."*

```markdown
#### Test Case 2: `test_method_that_failed`
- **Nội dung test**: Mô tả ngắn gọn kiểm tra điều gì.
- **Kết quả**: `fail`
- **Nguyên nhân**: [PHPUnit output thực tế — expected vs actual / exception] + diễn giải theo yêu cầu.
```

Then go to the next test method/file. **Never** edit application code, test code, config, or assertions to turn a `fail` into a `pass`.

#### 6e. Validate and Repeat for Next Test File

**Before moving to the next file**, perform this mandatory self-check on the report section you just wrote:

1. **Re-read** the section you appended to the report file
2. **Verify** each of these conditions:
   - Every test method has its own `#### Test Case N:` heading (not a bullet point, not a summary)
   - Every entry has `- **Nội dung test**:` and `- **Kết quả**:` lines
   - Every `fail` is recorded as plain `fail` with `Nguyên nhân` — there are NO "fixed" labels (`Đã khắc phục thành pass`, `Các bước giải quyết`, `Lưu ý sửa lỗi`), because nothing was fixed
   - You did NOT edit any application or test code to flip a `fail` into a `pass`
   - There are no summary lines like `Tổng số test cases: N` or `Đạt: N`
3. **If any violation is found**, fix the report section NOW before continuing

The reason this checkpoint matters is that context drift causes agents to start using shortcuts after the first file. By validating your own output against these rules, you catch format deviations before they propagate to all remaining files.

Only after validation passes, go back to 6a for the next test file.

#### 6f. Final Verification

After all individual test files are done, run the **full test suite** one final time:

```bash
php artisan test --filter={FeaturePrefix}
```

Record any additional failures in the report (plain `fail` + `Nguyên nhân`). **Do NOT fix them.** End the session with a short hand-off summary: total tests, how many `pass`, how many `fail`, and a one-line pointer that fixing is the user's call (re-run the relevant code skill to fix code, or re-run this skill if the *requirement* itself changed).

---

### Step 7: Core Checklist — Mandatory Verification

**STOP here.** Before running the validation script, go through every item below. If any item is not satisfied, go back and fix it before proceeding.

- [ ] Each endpoint/action has its own separate test file in `tests/Feature/Api/{Feature}/` (or `tests/Feature/Console/` or `tests/Feature/Jobs/`)
- [ ] Happy path returns correct HTTP status and JSON structure
- [ ] Unauthenticated returns `401`
- [ ] Forbidden (wrong role/ownership) returns `403`
- [ ] Invalid input returns `422` with validation errors
- [ ] Not Found returns `404`
- [ ] Database writes verified with `assertDatabaseHas()`
- [ ] Validation Matrix applied: all rule types tested, grouped by rule type (not per-field per-function)
- [ ] Test cases derived from the **requirement** (Step 3a), not reverse-engineered from the code
- [ ] Model Factories used exclusively (no hardcoded data)
- [ ] Full test suite was **run and its real result recorded**: `php artisan test --filter={TestClassName}` (pass AND fail both reported — failures were NOT fixed)
- [ ] No application/test code was edited to make a failing test pass (NO-FIX rule honored)
- [ ] Report file at `docs/testing/{feature_name}.md` follows the exact format (every test case has `#### Test Case N` with `Nội dung test` and `Kết quả`)
- [ ] Report is entirely in Vietnamese
- [ ] Hand-off summary given: total / pass / fail counts + reminder that fixes are the user's decision

---

### Step 8: Run Validation Script

```bash
# Validate test structure compliance
php .agents/skills/bks-be-testing-standard/scripts/validate-test-structure.php /path/to/project
```

See `scripts/validate-test-structure.php` for detailed validation rules.

---

## Partial Update Workflow

Use this workflow when **tests already exist** for a feature, but the application logic has changed (bug fix, new field, modified validation rule, refactored business logic) and some tests need updating.

The goal is efficiency: identify what changed, update only the affected tests, and verify no regression.

### Step P1: Identify Changes

Read the changed source files to understand what logic was modified. Focus on:
- **Which files changed?** (Controller, Service, FormRequest, Model, Policy, Migration)
- **What specific logic changed?** (New validation rule, modified business condition, added field, changed status transition)
- **Are there new code paths** that need new test cases?

### Step P2: Impact Analysis

Based on the changes identified in Step P1, determine which existing test files and test methods are affected:

1. **Read the existing test files** for the feature (e.g. in `tests/Feature/Api/{Feature}/` or `tests/Unit/Services/`).
2. **Map each change to affected tests**:
   - Changed validation rule → affects validation test methods in `{Resource}StoreTest.php` or `{Resource}UpdateTest.php`
   - Changed business logic → affects relevant happy path and error case methods
   - New field added → may need new test methods for validation and response structure
   - Changed authorization → affects permission-related test methods
3. **List the affected test files and methods** before making any changes.

### Step P3: Update Tests to the NEW Requirement

> [!IMPORTANT]
> In a partial update you change tests **because the requirement changed** — you align them to the new spec, NOT to whatever the new code happens to do. This is the one legitimate case for editing a test; it is still NOT "fixing a test to make it pass". Source the new expected behaviour from the updated task/requirement/logic doc, then:

1. **Read the relevant reference files** if the change touches a new area (e.g., read `references/security-testing.md` if the change adds a new input field).
2. **Modify only the affected test methods** to assert the **new requirement**. Do NOT rewrite entire test files unless the changes are so extensive that it's more efficient.
3. **Add new test methods** if the new requirement introduces new behaviour not yet covered.
4. **Delete test methods** only if the tested behaviour has been removed from the requirement entirely.

### Step P4: Run and Report (NO FIX)

1. **Run the affected test files first** for fast feedback:
   ```bash
   php artisan test --filter={AffectedTestClassName}
   ```

2. **Interpret failures — but do NOT fix them.** A failure now means one of:
   - Your test update does not match the new requirement → re-derive it from the spec (this is allowed: aligning the test to the requirement, per P3).
   - The application code does not satisfy the new requirement → **report it as `fail`** and leave the code untouched.
   - A previously-passing test broke (regression) → **report it as `fail` (Regression)** and leave the code untouched.

   You may only correct a test so that it faithfully expresses the **requirement**. You may NEVER edit application code, nor weaken a test, to turn `fail` into `pass`.

3. **Update the existing report file** at `docs/testing/{feature_name}.md`:
   - For **test updated to the new spec, now passing**: `pass (Đã cập nhật logic)`.
   - For **code not meeting the new spec / regression**: plain `fail` (add `(Regression)` if it was passing before) with `Nguyên nhân`. **No** `Đã khắc phục thành pass`, **no** `Các bước giải quyết` — nothing was fixed.
   - For **new test cases**: Append new entries following the same format.
   - For **removed test cases**: Remove the entry and add a note in section `1. Thông tin chung` explaining what was removed and why.
   - **Do NOT delete existing fail history** from the report — it remains valuable documentation.

4. **Run the full feature test suite** to catch regressions:
   ```bash
   php artisan test --filter={FeaturePrefix}
   ```

5. Record any broken tests as `fail` in the report and hand off to the user — do NOT fix them.

### Step P5: Core Checklist

Go through the **Core Checklist** from Step 7 to verify completeness.

---

## Extended Checklist — Apply When Relevant

The items below are **not required for every test**. Apply them only when the feature involves the corresponding area. Reference the indicated file for detailed guidance.

### Performance (when feature has database queries or large datasets)
- [ ] N+1 queries detected (`assertQueryCountLessThan`) — see `references/performance-testing.md`
- [ ] Response time assertions for critical endpoints

### Security (when feature has user input or multi-tenant data)
- [ ] SQL injection payloads tested (no 500 errors) — see `references/security-testing.md`
- [ ] IDOR attempts return 404/403
- [ ] Mass assignment protection verified
- [ ] XSS payloads escaped in responses

### Integration & Concurrency (when feature has side effects or concurrent access)
- [ ] Cross-service side effects verified (events, notifications) — see `references/integration-concurrency.md`
- [ ] Transaction rollback tested
- [ ] Optimistic locking handles concurrent updates
- [ ] Unique constraints handled gracefully

### Data Integrity & Edge Cases (when feature touches data lifecycle)
- [ ] Response schema validated (no field leakage) — see `references/contract-integrity-edge.md`
- [ ] Soft delete preserves and restores correctly
- [ ] Audit trail captures mutations
- [ ] Boundary values (min/max) handled
- [ ] Unicode and special characters supported
- [ ] Empty collections return consistent structure
- [ ] Timezone and date edge cases covered

### Jobs/Commands (when testing background jobs or artisan commands)
- [ ] Unit Test for `BackgroundService::run()`
- [ ] Happy path with valid DTO
- [ ] Failure/edge case (invalid state, already processed)
- [ ] For Command: `$this->artisan('{signature}')` with valid and invalid input

---