# Task Types

This document defines the three mandatory task types and their specific rules.

---

## Type Overview

Every task MUST be classified into one of the following types. The type determines what the task delivers and how it is validated.

| Type | Description | Delivers Code? | Example |
|---|---|---|---|
| **IMPLEMENTATION** | Creates or modifies actual source code. Can be deployed independently. | ✅ Yes | Database migrations, API controllers, frontend pages |
| **COORDINATION** | Aggregates cross-cutting logic across multiple tasks. Does NOT contain unique code — its requirements are **delegated** to other tasks. | ❌ No (delegates) | Bank Transfer flow, Activity Logging |
| **DOCUMENTATION** | Produces documentation only (API docs, logic docs, test plans). | ❌ No | API documentation, Logic documentation |

---

## IMPLEMENTATION Tasks

**Purpose**: Create or modify actual source code that can be deployed independently.

**Rules:**
- MUST declare `type: IMPLEMENTATION` in YAML frontmatter.
- MUST have concrete file paths, class names, and method signatures in Requirements.
- MUST map to exactly **one** execution workflow and **one** skill.
- MUST include DTO creation for every new service method.

**Workflow & Skill Mapping:**

| Category | Workflow | Skill |
|---|---|---|
| Database Infrastructure | `/execute-database-task` | `bks-be-database-standard` |
| API (CRUD, Single, List) | `/execute-api-task` | `bks-be-api-standard` |
| Artisan Commands | `/execute-command-task` | `bks-be-command-standard` |
| Background Jobs | `/execute-job-task` | `bks-be-job-standard` |
| Master Data Registration | `/execute-api-task` | `bks-be-master-data-standard` |
| Frontend Features | (None) | `bks-fe-implement-feature` (+ sisters `bks-fe-api-integration`, `bks-fe-ds-sdk-consumer`, `bks-fe-list-url-state`) |
| Frontend Unit/Integration Tests | (None) | `bks-fe-create-tc-component` |
| Frontend E2E Tests | (None) | `bks-fe-create-tc-flow` |

---

## COORDINATION Tasks

**Purpose**: Aggregate cross-cutting logic that spans multiple implementation tasks. Does NOT implement code directly.

**Rules:**
- MUST declare `type: COORDINATION` in YAML frontmatter.
- MUST include a **Delegation Map** section showing which implementation tasks handle each sub-requirement.
- MUST include **Cross-cutting Business Rules** that apply to all delegated tasks.
- MUST include **Edge Cases** that all delegated tasks must handle.

**Delegation Map Format:**
```markdown
## Delegation Map

| Requirement | Delegated To | Section | Status |
|---|---|---|---|
| {Sub-requirement 1} | Task {NN} | Requirements §{N} | ⏳ Pending |
| {Sub-requirement 2} | Task {NN} | Requirements §{N} | ⏳ Pending |
```

**Cross-cutting Rules Format:**
```markdown
## Requirements

### 1. Cross-cutting Business Rules

These rules MUST be consistently implemented across all delegated tasks:

- **BR-015**: Bank transfer deadline = 3 business days (Mon-Fri, excl. weekends).
- **BR-016**: Authorized users can confirm payment even after deadline expiry.

### 2. Edge Cases (All Delegated Tasks Must Handle)

- User pays after `bank_expired_at` → Manual override allowed.
- User pays wrong amount → record `payment_paid_amount` separately from `payment_amount`.
```

**COORDINATION Dependency Rule:**
When an IMPLEMENTATION task lists a COORDINATION task in its `depends_on`, the implementor MUST:
1. Read the COORDINATION task's **Delegation Map** and **Cross-cutting Business Rules** BEFORE starting implementation.
2. These cross-cutting rules take precedence over any assumptions.
3. The IMPLEMENTATION task file SHOULD include a note in its Dependencies section reminding the implementor to read the COORD task.

---

## DOCUMENTATION Tasks

**Purpose**: Produce documentation only — no code changes.

**Rules:**
- MUST declare `type: DOCUMENTATION` in YAML frontmatter.
- MUST reference which implementation tasks they document.
- Typically created in Phase 4 (Quality & Documentation).

**Examples:**
- API documentation generation
- Logic documentation updates
- Test plan creation
- Architecture decision records (ADRs)

---

## Type Selection Guidelines

### When to use IMPLEMENTATION
- Creating database migrations, models, enums
- Building API endpoints (controllers, services, requests, resources)
- Implementing background jobs and commands
- Developing frontend components and pages
- Writing unit/feature tests

### When to use COORDINATION
- Feature flows that span multiple modules (e.g., Payment flow across User, Plan, Notification modules)
- Cross-cutting concerns (e.g., Activity Logging, Audit Trails)
- Complex state machines with transitions handled by different tasks
- Integration patterns (e.g., Webhook handling across multiple services)

### When to use DOCUMENTATION
- Generating API documentation from code
- Writing or updating logic documentation
- Creating test plans or test specifications
- Writing architecture decision records
- Updating README or deployment guides

---

## Common Anti-patterns

| Anti-pattern | Correct Approach |
|---|---|
| Creating a task that mixes API and Job code | Split into two tasks: Job task (Phase 2a) + API task (Phase 2b) |
| Creating a COORDINATION task without Delegation Map | Add Delegation Map with every sub-requirement delegated |
| Creating an IMPLEMENTATION task without concrete file paths | Add specific file paths, class names, method signatures |
| Creating micro-tasks ("Add one column") | Merge related DB changes into a single Foundation task |
| Creating mega-tasks (>5 endpoints or >2000 words) | Split by functional area or endpoint group |
