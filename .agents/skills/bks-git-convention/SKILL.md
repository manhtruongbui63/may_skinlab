---
name: bks-git-convention
description: Use this skill whenever you are about to create a git branch, write a commit message, or open/describe a Pull Request (Merge Request) for this project. Defines the mandatory naming standard for branches, Conventional Commit messages, and PR titles/descriptions, and how each one links back to the external Excel task number (001, 002, 003...) and its docs/draft/{id}-{slug}.md file. Covers three scenarios: new feature, bug fix, and hotfix. Use this as the FINAL step after analysis/design/code/test, before pushing to git.
---

# BKS Git Convention (Branch · Commit · Pull Request)

Goal: every change must be **traceable** from the external Excel task (`001`, `002`...) → draft → code → commit → PR, so that `git log` and PR history stay readable and searchable later.

> [!IMPORTANT]
> **The traceability key is the Task ID** — the 3-digit task number from the external Excel sheet (e.g. `001`, `002`, `015`).
> The same Task ID MUST appear consistently in: the branch name, the commit footer, and the PR title.
> The matching draft file lives at `docs/draft/{id}-{slug}.md` (e.g. `docs/draft/001-auth.md`).

## 1. When to use this skill

After analysis / design / code / test are complete (using the domain skills `bks-be-*`, `bks-fe-*`, `bks-requirement-*`...), and **before**:
1. Creating a new branch for the task.
2. Writing a commit message.
3. Opening a PR/MR or writing its title + description.

## 2. Pick the change type (choose one)

Choose the **type** based on the nature of the work. This vocabulary is shared across branch, commit, and PR.

| Type | When to use | Branch from | Merge into |
|---|---|---|---|
| `feat` | New feature or feature extension | `master` | `master` |
| `fix` | Fix a bug already on `master` (non-urgent) | `master` | `master` |
| `hotfix` | **Urgent** fix for a bug affecting production | `master` (or production tag) | `master` (+ cherry-pick if a release branch exists) |
| `refactor` | Restructure code without changing behavior | `master` | `master` |
| `test` | Add/update tests only | `master` | `master` |
| `docs` | Documentation only (`docs/`, README, skills) | `master` | `master` |
| `chore` | Config, dependencies, build, CI/CD, misc | `master` | `master` |
| `perf` | Performance optimization | `master` | `master` |

> [!NOTE]
> `feat`, `fix`, `hotfix` are the three primary flows required. `refactor/test/docs/chore/perf` are for supporting work not tied to an Excel task.

## 3. Branch naming standard

```
<type>/<task-id>-<slug>
```

- `<type>`: from the table in section 2.
- `<task-id>`: the **3-digit** Excel task number (`001`). **Required** for `feat`/`fix`/`hotfix` tied to a task.
- `<slug>`: short description, `kebab-case`, English, ≤ 5 words, no accents, no special characters.

**Valid examples:**
```
feat/001-auth
feat/015-user-export-csv
fix/002-role-permission-denied
hotfix/008-login-500-error
```

**When there is NO Excel task** (CI, chore, internal refactor, docs) — drop the task-id:
```
chore/ci-bcmath-extension
refactor/file-service-cleanup
docs/git-convention
```

> [!WARNING]
> - Do not use vague branch names: ❌ `feat/refactor`, ❌ `fix/bug`, ❌ `update`, ❌ a person's name.
> - One branch = one task. Do not bundle multiple Excel tasks into a single branch.
> - Always create the branch from an up-to-date `master` (`git pull` before branching).

## 4. Commit message standard (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 4.1 Subject line — required
- `<type>`: from the table in section 2. For a hotfix use `fix` in the commit (see 6.3); only the branch/PR carries the word `hotfix`.
- `<scope>`: affected area, one word, `kebab-case`. E.g. `auth`, `user`, `master-data`, `upload`, `role`, `i18n`, `logging`, `ci`. May be omitted if the scope is unclear.
- `<subject>`: short description in the **imperative mood**, English, **no** leading capital, **no** trailing period, ≤ 72 characters.

✅ `feat(auth): add password reset via email`
✅ `fix(role): require auth for member read-only endpoints`
❌ `feat(auth): Added password reset.` (past tense, capitalized, trailing period)
❌ `update code` (no type, no content)

### 4.2 Body — recommended (required for feat/fix/hotfix)
- Explain **WHAT** and **WHY**, not a line-by-line replay of the code.
- Wrap at ~72 characters. Separate from the subject with one blank line.

### 4.3 Footer — required for tasks tracked in Excel
Used for traceability and metadata. One item per line:

```
Task: 001
Refs: docs/draft/001-auth.md
```

Supported footers:
- `Task: 001` — **required** when an Excel task exists. Enables `git log --grep "Task: 001"`.
- `Refs:` — path to the related draft/requirement/task.
- `BREAKING CHANGE: <description>` — when backward compatibility breaks (API, schema, contract).
- `Severity: critical` — hotfix only (see 6.3).

> [!WARNING]
> Do NOT add a `Co-Authored-By:` trailer or any AI/tool attribution to commit messages.

### 4.4 Full commit example
```
feat(auth): add password reset via email

Users who forget their password have no self-service recovery and must
ask an admin. Add a reset-request flow over email with a token that
expires after 60 minutes.

Task: 001
Refs: docs/draft/001-auth.md
```

> [!NOTE]
> Split work into small logical commits (e.g. migration → model → service → API → test) instead of one giant commit. Each commit should build/test independently when possible. All commits of the same task share the same `Task: <id>` footer.

## 5. Pull Request / Merge Request standard

### 5.1 PR title
Mirror the main commit and attach the Task ID clearly so it is visible on the tracking board:

```
<type>(<scope>): <subject> (#<task-id>)
```

**Examples:**
```
feat(auth): add password reset via email (#001)
fix(role): require auth for member endpoints (#002)
hotfix(auth): fix login 500 on null locale (#008)
```

> [!NOTE]
> Here `(#001)` is the **Excel Task ID**, not a GitHub/GitLab issue. Keep this format consistent across the project so filtering and search work correctly.

### 5.2 PR description — use the template
See the full template at [references/pr-template.md](references/pr-template.md). Structure:

```markdown
## Task
- Excel Task: #001
- Draft/Spec: docs/draft/001-auth.md

## Goal (Why)
<Problem / need, 1–3 lines>

## Key Changes (What)
- <change 1>
- <change 2>

## Change Type
- [ ] feat  [ ] fix  [ ] hotfix  [ ] refactor  [ ] chore  [ ] docs

## Testing (How verified)
- <which tests ran / results, command, or screenshot>

## Impact & Risk
- Breaking change? Migration? New environment variables?

## Checklist
- [ ] Linked the correct Excel Task ID
- [ ] Commits follow Conventional Commits
- [ ] Tests pass (unit/feature/e2e as applicable)
- [ ] Updated docs/logic if business logic changed
```

## 6. Three standard scenarios

### 6.1 New feature (feat)
1. Branch: `git checkout master && git pull && git checkout -b feat/001-auth`
2. Commit in steps, each `feat(...)`/`test(...)` with footer `Task: 001`.
3. PR title: `feat(auth): <subject> (#001)`, description per template.

### 6.2 Regular bug fix (fix)
1. Branch from `master`: `fix/002-role-permission-denied`.
2. Commit `fix(role): ...`, body stating the **root cause** and the fix. Footer `Task: 002`.
3. PR title: `fix(role): <subject> (#002)`.

### 6.3 Hotfix (urgent, production currently broken)
1. Branch from `master` (or the running production tag): `hotfix/008-login-500-error`.
2. If no Excel task exists yet: quickly create `docs/draft/008-login-500-error.md` recording the situation so it can be traced later.
3. Commit uses type `fix` + a severity footer:
   ```
   fix(auth): handle null locale to stop login 500

   An empty locale cookie made the middleware throw, blocking all logins.
   Fall back to the default locale when the cookie is missing or invalid.

   Task: 008
   Severity: critical
   Refs: docs/draft/008-login-500-error.md
   ```
4. PR title: `hotfix(auth): <subject> (#008)`. Apply the priority label and request a fast review.
5. After merge: if a separate release branch exists, cherry-pick; add a regression test in the next commit/PR if the hotfix skipped tests due to urgency.

## 7. Quick checklist before pushing

- [ ] Branch matches `<type>/<task-id>-<slug>`, created from an up-to-date `master`.
- [ ] Each commit follows `<type>(<scope>): <subject>` (imperative, ≤72, no trailing period).
- [ ] Task commits carry `Task: <id>` in the footer.
- [ ] Body explains WHAT + WHY (for feat/fix/hotfix).
- [ ] PR title `<type>(<scope>): <subject> (#<task-id>)`.
- [ ] PR description fills the full template (Task, goal, changes, testing, risk, checklist).
- [ ] Hotfix has `Severity: critical` and a regression-test plan.
