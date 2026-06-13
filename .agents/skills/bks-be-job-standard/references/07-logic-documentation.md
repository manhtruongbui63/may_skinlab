# Business Logic Documentation Standards

**When to Use**: Apply to any background job involving business rules, complex data mutations, or long-running processing to ensure logic is documented in a structured, AI-readable format.

---

## 1. Mandatory Requirement

EVERY background Job with significant business logic MUST have a corresponding documentation file in `docs/logic/{module}/{JobName}.md`.

Additionally:
- `docs/logic/{module}/index.md` MUST exist and include the job logic doc entry.
- Every `BR-*` used by job logic docs MUST resolve in `docs/system/br-registry.md`.

---

## 2. Mandatory Logic Doc Format

Every logic documentation file MUST follow this exact structure:

### YAML Frontmatter

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
  - path/to/Job.php
  - path/to/BackgroundService.php
  - path/to/Model.php
---
```

### OVERVIEW

A summary of the job: what it does, its technical implementation (Background Service), and key capabilities.

### CONTEXT

A high-level description of what this job represents and its purpose in the system.

### ENTITIES

List of entities involved in this logic. **DO NOT list field details** — only mention entity names and business context (enum transitions, special states). For field/type details → read Model Docblocks. For enum values → read Enum class.

### FLOW

A step-by-step numbered list describing the execution sequence. Mention specific events like "Transaction starts", "Job retried", etc.

### RULES

A list of declarative business rules (IF/THEN/ALWAYS/NEVER). This section captures the core constraints and conditional behaviors.
- Use official IDs (`BR-{MODULE}-XXX` or global `BR-GXXX`).
- Every `BR-*` MUST be registered in `docs/system/br-registry.md`.

### EDGE_CASES

Specific scenarios that might deviate from the standard flow (e.g., permanent failure, memory limit issues).

### EXAMPLES

Practical examples showing input vs. expected output/state changes.

---

## 3. Lifecycle & Maintenance (MANDATORY)

> [!IMPORTANT]
> **Logic Documentation is part of the "Definition of Done".** NEVER leave a session without ensuring the Logic Doc matches the final "as-built" implementation.

- **Implementation**: Reference the task requirements in code comments.
- **Post-implementation**: Create the business logic doc in `docs/logic/{module}/` AFTER the code is finalized to ensure it accurately reflects the "as-built" system.
- **Module index sync**: Update `docs/logic/{module}/index.md` and keep root `docs/logic/index.md` links valid.
- **BR traceability**: Register new rules in `docs/system/br-registry.md` before referencing them in logic docs.
- **Maintenance**: Update the logic doc IMMEDIATELY and **bump its version (minor/major)** following the `bks-doc-logic-standard` if requirements or implementation change in future sessions.
