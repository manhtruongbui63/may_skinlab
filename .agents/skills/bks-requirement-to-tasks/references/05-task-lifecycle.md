# Task Lifecycle Management

This document defines status transitions, modification protocols, and the escalation process for task management.

---

## Status Transitions

Tasks follow this lifecycle: `pending` → `in_progress` → `completed`.

### Starting a Task

1. Update task file YAML frontmatter: `status: in_progress`
2. Update index file table: `🔄 In Progress`
3. Begin implementation following the applicable workflow and skill.

### Completing a Task

1. Update task file YAML frontmatter: `status: completed`
2. Update index file table: `✅ Completed`
3. Update Progress Summary counts in index file.
4. **For IMPLEMENTATION tasks fulfilling COORDINATION task delegations**: Open the COORDINATION task file and update the status in its Delegation Map to `✅ Completed`.

### Checklist Items

Mark individual checklist items as `[x]` when completed during implementation.

---

## Modifying Tasks After Creation

If a task needs modification after initial generation:

1. Add a new `changelog` entry in the task's YAML frontmatter with version bump and summary.
2. Update the affected sections in the task body.

### Version Bump Rules

| Change Type | Version Bump | Example |
|---|---|---|
| Clarifications, additional details, fixing typos | **Minor** | `1.0` → `1.1` |
| Scope change, new requirements added, dependencies changed | **Major** | `1.x` → `2.0` |

**Changelog Entry Format:**
```yaml
changelog:
  - version: 1.1
    date: "2026-04-15"
    summary: Added validation rule for email uniqueness.
  - version: 1.0
    date: "2026-04-01"
    summary: Initial task specification.
```

---

## Requirement Changes

When the source requirement document is updated (version bump):

1. Re-run the **Coverage Verification** from Section 10.
2. Identify which tasks are affected by the requirement change.
3. Update affected tasks with new changelog entries.
4. If new tasks are needed, add them to the index file and create the task files.
5. Re-validate dependency integrity.

---

## Escalation Protocol

When an AI agent encounters a **blocker** during task implementation (missing information, contradiction between requirement and codebase, ambiguous logic), it MUST follow this protocol instead of making silent assumptions:

### Steps

1. **STOP implementation** of the blocked section immediately.
2. **Document the blocker** clearly with:
   - **What**: The exact issue encountered.
   - **Where**: Reference to the specific requirement section (e.g., "Flow #3, Step 4") or task section.
   - **Why it blocks**: What decision cannot be made without clarification.
   - **Proposed solution**: The AI's best-guess resolution with reasoning.
   - **Alternatives**: Other possible approaches if the proposal is rejected.
3. **Continue with non-blocked work**: Complete all other parts of the task that are not affected by the blocker.
4. **Report blockers at completion**: When presenting the task result, list ALL blockers prominently at the top with their proposed solutions.
5. **Never silently assume**: If a business rule is ambiguous, do NOT pick an interpretation without flagging it. Mark assumptions with `[ASSUMPTION]` tags in the code/comments so they can be reviewed.
6. **Post-Resolution Updates**: Once the user provides a decision or clarifies the ambiguous rule, you MUST update the task file's `Requirements` section with the new logic and add an entry to the `changelog` before continuing. Do not leave the resolved decision only in the chat history.

### Blocker Report Format

```markdown
#### Blocker #{n}: [Title]
- **Task**: Task {NN}, Section {X}
- **Requirement reference**: {`BR-*` / `PROPOSED_BR:{slug}` / Flow #N / Data Model section}
- **Issue**: [description of the conflict or missing information]
- **Proposed solution**: [concrete proposal]
- **Alternatives**: [other options]
- **Impact**: [what happens if this is not resolved]
```

---

## Interactive Refinement

After generating the initial task set:

1. **Present the Task Index** to the user for review.
2. **Highlight decisions made**: task boundaries, grouping choices, phase assignments, task types, and effort estimates.
3. **Ask for feedback** on:
   - Task granularity (too big? too small?)
   - Phase assignment (correct priorities?)
   - Task types (should COORDINATION tasks be merged into IMPLEMENTATION tasks?)
   - Effort estimates (accurate?)
   - Missing tasks or over-scoped tasks.
4. **Iterate** based on feedback (maximum 2 refinement rounds).
5. After approval, generate the final task files.

---

## Language & Portability Rules

- **Language Consistency**: Match the language used in the source requirement document.
- **Technical Names**: Always use English for technical names (class names, file paths, method names, DB columns) regardless of documentation language.
- **No Absolute Paths**: NEVER use absolute file paths in task files. Always use relative paths from the document's location.
- **Relative Links**: Use relative markdown links to reference requirement and parent task files.
