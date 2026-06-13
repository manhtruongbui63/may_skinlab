---
name: bks-doc-logic-standard
description: Standards for writing structured, AI-readable business logic documentation using YAML frontmatter and specific Markdown sections.
---

# Business Logic Documentation Standards

This skill defines the mandatory format for documenting complex business logic, workflows, and rules within the project. This format is designed to be highly structured and easily readable by both human developers and AI agents.

## File Location

Logic documentation is organized by module in `docs/logic/{module}/` (e.g., `docs/logic/sso-auth-hub/google-sso.md`).

Mandatory navigation structure:
- Each module folder MUST have `docs/logic/{module}/index.md` to summarize module business rules and list feature docs.
- Root `docs/logic/index.md` MUST link to all module indexes.
- Feature docs MUST be listed in the corresponding module `index.md`.

## Mandatory Format

Every logic documentation file MUST follow this structure:

### 1. YAML Frontmatter
Used to categorize and prioritize the logic.

```yaml
---
module: [module_name]
title: [Short descriptive title]
description: [One-sentence summary of the document's purpose]
type: business_rule | workflow | calculation | guide
priority: high | medium | low
version: "1.0.0"
changelog:
  - version: "1.0.0"
    date: "YYYY-MM-DD"
    summary: "Initial task specification."
related_files:
  - path/to/Controller.php
  - path/to/Service.php
  - path/to/Model.php
---
```

### 2. OVERVIEW
A summary of the feature: what it does, its technical implementation (Controller, Service, Model), RBAC, and key capabilities. This section consolidates the feature overview into the logic doc.

### 3. CONTEXT
A high-level description of what this logic represents and its purpose in the system.

### 4. ENTITIES
List of entities involved in this logic. **DO NOT list field details** — only mention entity names and important business context (e.g., enum transitions, special states).

**Example format:**
```markdown
## ENTITIES
User → only active users can log in (UserStatus::ACTIVE).
PasswordResetToken → hashed token, expires after 60 minutes.
```

> **Note**: For field/type/cast details → read Model Docblocks (`app/Models/{Model}.php`). For enum values → read Enum class (`app/Enums/{Enum}.php`).

### 5. FLOW
A step-by-step numbered list describing the execution sequence of the logic. Mention specific events like "Transaction starts", "Validation happens", etc.

### 6. RULES
A list of declarative business rules (IF/THEN/ALWAYS/NEVER). This section captures the core constraints and conditional behaviors.

### 7. EDGE_CASES
Specific scenarios that might deviate from the standard flow and how they are handled (e.g., missing data, calculation failures).

### 8. EXAMPLES
Practical examples showing input vs. expected output/state changes.

---

## Best Practices

1. **Be Explicit**: Use clear, concise language. Avoid ambiguity.
2. **Technical Details**: Mention specific implementation details if critical, such as "manual transaction pattern" or "bulk insert".
3. **Consistency**: Use entity and field names exactly as they appear in the database schema or code.
4. **Maintenance**: Update these files whenever business requirements or implementation details change.
5. **Module Index Sync (MANDATORY)**:
   - Update `docs/logic/{module}/index.md` whenever adding/updating/removing feature docs.
   - Ensure links in root `docs/logic/index.md` remain valid.
6. **BR Traceability (MANDATORY)**:
   - Every `BR-*` in logic docs MUST exist in `docs/system/br-registry.md`.
   - Use official IDs only (`BR-{MODULE}-XXX` or global `BR-GXXX`).
   - `PROPOSED_BR:{slug}` is allowed only in requirement/task stage and MUST NOT appear in finalized `docs/logic/`.

## Versioning Rules (MANDATORY) {#versioning-rules}

Logic documentation follows a simplified Semantic Versioning ruleset to ensure developers and AI agents can track significant changes:

1. **Bump Minor (1.0 → 1.1)**:
    - Adding further detail or clarification to existing logic/rules.
    - Slighting adjusting a flow that does not significantly change the outcome.
    - Adding edge cases or examples.
    - Fixing typos or formatting in the documentation.
2. **Bump Major (1.x → 2.0)**:
    - Altering a core business rule (e.g., changing a price calculation or a state transition).
    - Adding or removing major steps in a flow.
    - Changing related entities or critical data structures.
    - Any change that would require code modification to stay in sync with the doc.

**Changelog Entry**: Every version bump MUST have a corresponding entry in the `changelog` field in the frontmatter, containing the version, date, and a concise summary of "what" changed.
