# Pull Request / Merge Request Template

Copy the block below into the PR description. Remove the `< >` guidance lines.

---

## Task
- Excel Task: #<task-id>            <!-- e.g. #001 -->
- Draft/Spec: docs/draft/<task-id>-<slug>.md
- Requirement/Tasks (if any): docs/requirements/... · docs/tasks/...

## Goal (Why)
<The problem or need being solved, 1–3 lines. Why this change is necessary.>

## Key Changes (What)
- <Change 1 — concise, grouped by capability>
- <Change 2>
- <Change 3>

## Change Type
- [ ] feat — new feature
- [ ] fix — bug fix
- [ ] hotfix — urgent production fix
- [ ] refactor — restructure, behavior unchanged
- [ ] chore / docs / test / perf

## Testing (How verified)
- [ ] Unit/Feature test: <command that ran, e.g. `php artisan test --filter=Auth`>
- [ ] E2E test (if any): <spec that ran>
- [ ] Manual check: <steps / screenshot if UI>
- Result: <pass/fail, number of tests>

## Impact & Risk
- Breaking change: [ ] No  [ ] Yes → <description + migration path>
- Database migration: [ ] No  [ ] Yes
- New environment variables / config: [ ] No  [ ] Yes → <list>
- Affects other modules: <if any>

## Checklist
- [ ] Linked the correct Excel Task ID in the title and description
- [ ] Branch named `<type>/<task-id>-<slug>`
- [ ] Commits follow Conventional Commits with a `Task: <id>` footer
- [ ] Related tests pass
- [ ] Updated `docs/logic/` or `docs/api/` if business logic / API changed
- [ ] (Hotfix) has `Severity: critical` and a regression-test plan

---

## Filled-in example (feature)

```markdown
## Task
- Excel Task: #001
- Draft/Spec: docs/draft/001-auth.md

## Goal (Why)
Users who forget their password have no self-service recovery and currently
rely on an admin to reset it manually.

## Key Changes (What)
- Add POST /auth/forgot-password and /auth/reset-password endpoints
- Send a reset email with a token that expires after 60 minutes
- Add Feature tests for the reset flow

## Change Type
- [x] feat

## Testing (How verified)
- [x] Feature test: `php artisan test --filter=PasswordReset` → 8 passed
- Result: pass

## Impact & Risk
- Breaking change: [x] No
- Database migration: [x] Yes (password_reset_tokens table)
- New environment variables: [x] Yes → MAIL_* must be configured in production

## Checklist
- [x] Linked the correct Excel Task ID
- [x] Branch feat/001-auth
- [x] Conventional Commits + footer Task: 001
- [x] Tests pass
- [x] Updated docs/api/
```
