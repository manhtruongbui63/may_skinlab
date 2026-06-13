# Business Logic Documentation Standards

Apply to any feature involving complex database rules, enum-driven workflows, or non-trivial data relationships.

---

## Mandatory Requirement

**EVERY** feature with significant database-level business logic (e.g., complex Enum states, cascading rules) MUST have a corresponding documentation file in `docs/logic/{module}/{feature}.md`.

Additionally:
- `docs/logic/{module}/index.md` MUST exist and include the feature entry
- Every `BR-*` in the logic doc MUST resolve in `docs/system/br-registry.md`

---

## Mandatory Logic Doc Format

### 1. YAML Frontmatter

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
  - path/to/migration.php
  - path/to/Model.php
  - path/to/Enum.php
---
```

### 2. Sections

| Section | Content |
|---------|---------|
| **OVERVIEW** | Summary of the data entity and its role |
| **CONTEXT** | Why this structure exists |
| **ENTITIES** | List of entities involved. **DO NOT list field details** — only mention entity names and business context. For field/type details → Model Docblocks. For enum values → Enum class |
| **FLOW** | Step-by-step lifecycle of the data (e.g., status transitions) |
| **RULES** | Declarative business rules (IF/THEN/ALWAYS/NEVER). Use official IDs (`BR-{MODULE}-XXX` or global `BR-GXXX`). Every `BR-*` MUST be registered in `docs/system/br-registry.md` |
| **EDGE_CASES** | Specific scenarios that deviate from standard behavior (e.g., constraint violations, cascading deletes) |
| **EXAMPLES** | Practical data examples |

---

## Lifecycle & Maintenance (MANDATORY)

> [!IMPORTANT]
> **Logic Documentation is part of the "Definition of Done".** NEVER leave a session without ensuring the Logic Doc matches the final implementation.

| Phase | Action |
|-------|--------|
| **Implementation** | Reference the task requirements in code comments |
| **Post-implementation** | Create the business logic doc in `docs/logic/{module}/{feature}.md` AFTER the code is finalized to ensure it accurately reflects the "as-built" system |
| **Module index sync** | Update `docs/logic/{module}/index.md` and keep root `docs/logic/index.md` links valid |
| **BR traceability** | Register new rules in `docs/system/br-registry.md` before using them in docs |
| **Maintenance** | Update the logic doc IMMEDIATELY and **bump its version (minor/major)** following the `bks-doc-logic-standard` if requirements or implementation change in future sessions |

---

## Related

- [Implementation Workflow](06-implementation-workflow.md) - Complete workflow with logic doc step
