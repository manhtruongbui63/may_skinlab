# Traceability & Integrity Verification

Before considering the requirement "Finalized", perform this sanity check.

## BR-to-Flow Coverage

- [ ] **Every Business Rule (`BR-*`)** is resolved in `docs/system/br-registry.md` OR marked as `PROPOSED_BR:{slug}` in requirement/task stage.
- [ ] **No `PROPOSED_BR:{slug}` remains** in final logic docs (`docs/logic/`).
- [ ] **Every Processing Flow step** (where logic is applied) references at least one `BR-*` or `PROPOSED_BR:{slug}`.

### Business Rule Registration Workflow

```
Draft/Requirement Phase          Implementation Phase
--------------------          --------------------
PROPOSED_BR:new-rule    →     BR-USER-001 (registered)
     (temporary)                  (permanent)
```

**Requirement/Task artifacts**: Can use `PROPOSED_BR:{slug}`
**Logic docs (`docs/logic/`)**: MUST use official `BR-*` IDs only

## Localization Coverage

- [ ] **Every user-facing message/label** in the flows has a corresponding **Localization Key** in the DATA MODEL or UI/UX sections.

### Localization Key Patterns

```markdown
# Enums
`enums.{enum_name}.{snake_case_value}`
Example: `enums.payment_status.pending`

# Validation Messages
`validation.{field}.{rule}`
Example: `validation.email.required`

# Success/Error Messages
`messages.{feature}.{action}_{result}`
Example: `messages.auth.register_success`
```

## Concurrency Audit

- [ ] **Every flow involving data modification** has been assessed for **Race Conditions**.
- [ ] **"Concurrency Handling" sub-section** is present if risks exist.

### When to Include Concurrency Handling

| Scenario | Risk Level | Required Handling |
|----------|------------|-------------------|
| Financial transactions | **HIGH** | `lockForUpdate()` + atomic locks |
| State transitions (e.g., pending → paid) | **HIGH** | Optimistic locking or DB-level locks |
| Counter increments | **MEDIUM** | Atomic operations or locks |
| Simple reads | **LOW** | None needed |

### Concurrency Handling Template

```markdown
**Concurrency Handling:**
- **Mechanism**: [DB lock / Cache lock / Optimistic locking / None]
- **Lock Key**: `[lock-name-{id}]` (if applicable)
- **Race Condition Mitigation**: [Description of how concurrent requests are handled]
```

## Cross-Reference Verification

For split requirements (multiple documents):

- [ ] **Sibling Documents** section lists all related requirement files.
- [ ] **Shared entities** are defined consistently across all documents.
- [ ] **Source of truth** designated for each shared entity.
- [ ] **Cross-Reference Matrix** maps entities to owning documents.

### Cross-Reference Matrix Template

```markdown
| Shared Entity | Owner Document | Referenced By |
|---------------|----------------|---------------|
| `users` table | phase1-registration.md | phase2-payment.md |
| `PaymentStatus` enum | phase2-payment.md | phase1-registration.md |
| `BR-USER-001` | br-registry.md | Both documents |
```

## Traceability Chain

Ensure complete traceability from requirement to implementation:

```
Draft Requirement
      ↓
Formal Requirement (docs/requirements/)
      ↓
Business Rules (docs/system/br-registry.md)
      ↓
Logic Documentation (docs/logic/)
      ↓
Implementation Code
```

**Verification Questions:**
1. Can you trace every feature back to its draft origin?
2. Can you trace every Business Rule to its implementation?
3. Can you trace every flow step to a rule or requirement?
4. Is every localization key used somewhere in the UI?
