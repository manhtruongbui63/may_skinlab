# Business Logic Documentation Standards

Apply to any command involving business rules, complex data mutations, or bulk processing to ensure logic is documented in a structured, AI-readable format.

---

## Mandatory Requirement

**EVERY** Artisan Command with significant business logic MUST have a corresponding documentation file in `docs/logic/{module}/{feature_command}.md`.

Additionally:
- `docs/logic/{module}/index.md` MUST exist and include the command logic doc entry
- Every `BR-*` referenced by the command logic doc MUST resolve in `docs/system/br-registry.md`

---

## Mandatory Logic Doc Format

### 1. YAML Frontmatter

Used to categorize and prioritize the logic:

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
  - path/to/Command.php
  - path/to/BackgroundService.php
  - path/to/Model.php
---
```

### 2. OVERVIEW

A summary of the command: what it does, its technical implementation (Background Service), and key capabilities.

### 3. CONTEXT

A high-level description of what this command represents and its purpose in the system.

### 4. ENTITIES

List of entities involved in this logic. **DO NOT list field details** — only mention entity names and business context (enum transitions, special states). For field/type details → read Model Docblocks. For enum values → read Enum class.

### 5. FLOW

A step-by-step numbered list describing the execution sequence. Mention specific events like "Transaction starts", "Checkpoint saved", etc.

### 6. RULES

A list of declarative business rules (IF/THEN/ALWAYS/NEVER). This section captures the core constraints and conditional behaviors.
- Use official IDs (`BR-{MODULE}-XXX` or global `BR-GXXX`)
- Every `BR-*` MUST be registered in `docs/system/br-registry.md`

### 7. EDGE_CASES

Specific scenarios that might deviate from the standard flow (e.g., partial failures, timeout handling).

### 8. EXAMPLES

Practical examples showing input vs. expected output/state changes.

---

## Lifecycle & Maintenance (MANDATORY)

> [!IMPORTANT]
> **Logic Documentation is part of the "Definition of Done".** NEVER leave a session without ensuring the Logic Doc matches the final "as-built" code.

| Phase | Action |
|-------|--------|
| **Implementation** | Reference the task requirements in code comments |
| **Post-implementation** | Create the business logic doc in `docs/logic/{module}/{feature_command}.md` AFTER the code is finalized and verified |
| **Module index sync** | Update `docs/logic/{module}/index.md` and keep root `docs/logic/index.md` links valid |
| **BR traceability** | Register new rules in `docs/system/br-registry.md` before referencing them in logic docs |
| **Maintenance** | Update the logic doc IMMEDIATELY and **bump its version (minor/major)** following the `bks-doc-logic-standard` if requirements or implementation change in future sessions |

---

## Related

- [Implementation Workflow](07-implementation-workflow.md) - Step-by-step command creation process
