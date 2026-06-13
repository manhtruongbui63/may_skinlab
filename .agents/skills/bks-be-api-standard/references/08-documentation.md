# Reference 08: Documentation Standards

> **Scope**: API documentation (`docs/api/`) and Business Logic documentation (`docs/logic/`).

---

## 1. API Documentation Standards

**Purpose**: Manual API documentation in `docs/api/modules/` for every API endpoint. Primary reference for Frontend developers.

### 1.1 File Organization

API documentation is organized as **flat files** in `docs/api/modules/`, one file per domain:

```
docs/api/modules/
╌══ auth.md               # Google SSO + Token management + Logout
╌══ profile.md            # Profile CRUD + Avatar upload + Change password
╌══ master-data.md        # Lookup resources
╙══ internal-webhook.md   # Server-to-server (NOT for FE)
```

### 1.2 When to Create vs Update

- **New file**: Only when introducing an entirely new domain (e.g., `notifications.md`).
- **Update existing**: Append new endpoints to the relevant existing file.
- **Naming**: Use kebab-case, named after the domain/feature group.

### 1.3 Mandatory Format Per Endpoint

```markdown
## N. Endpoint Name

Short description.

| | |
|---|---|
| **Endpoint** | `METHOD /api/path` |
| **Auth** | ✓ Bearer Token / ✗ Not required |

### Query Parameters / Request Body

| Parameter | Type | Required | Description |
|---|---|---|---|
| `field` | type | ✓ | Description |

### Response `200`
```json
{
    "success": true,
    "message": "Success",
    "errors": null,
    "data": {
        "id": 1,
        "name": "Example Item",
        "status": "active",
        "users": [
            { "id": 10, "name": "John Doe", "email": "john.doe@example.com" }
        ],
        "created_at": "2026-01-01 10:00:00"
    }
}
```

### Error `4xx`
```json
{
    "success": false,
    "message": "The given data was invalid.",
    "errors": {
        "field_name": [
            "This field is required."
        ]
    },
    "data": null
}
```
```

### 1.4 Documentation Rules

1. **Vietnamese**: API docs are in Vietnamese (for FE developers).
2. **Response format**: Always include full standard wrapper (`success`, `message`, `errors`, `data`).
3. **Error responses**: Document all possible error codes (401, 403, 404, 422).
4. **No backend logic**: Only request/response details. Backend logic belongs in `docs/logic/`.
5. **Consistent headers**: Use table format for Endpoint/Auth, Params, and Response.
6. **Concrete Examples**: ALWAYS provide complete and realistic data examples in JSON responses.

### 1.5 Lifecycle & Maintenance

> [!IMPORTANT]
> **Documentation is part of the "Definition of Done".**

- **Post-implementation**: Create/update API docs IMMEDIATELY AFTER code is finalized and tests pass.
- **Maintenance**: Update when endpoint signature, response shape, or error codes change.
- **Sync**: Run `php artisan scramble:export` to update `api.json` if the project uses automated exports.

---

## 2. Business Logic Documentation Standards

**Purpose**: Document complex business rules, multi-step workflows, or non-trivial calculations in `docs/logic/`.

### 2.1 Mandatory Requirement

EVERY feature with significant business logic MUST have a corresponding documentation file in `docs/logic/{module}/{feature}.md`.

Additionally:
- Ensure `docs/logic/{module}/index.md` exists
- Add/update the feature entry in that module index file
- Ensure all `BR-*` referenced resolve in `docs/system/br-registry.md`

### 2.2 Mandatory Logic Doc Format

#### YAML Frontmatter

```yaml
---
module: [module_name]
title: [Short descriptive title]
description: [One-sentence summary]
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
  - path/to/Resource.php
  - path/to/Request.php
  - path/to/Model.php
---
```

#### Required Sections

| Section | Purpose |
|---|---|
| **OVERVIEW** | Summary of the feature, technical implementation, RBAC, key capabilities |
| **CONTEXT** | High-level description of what this logic represents |
| **ENTITIES** | List of entities involved (names only, no field details) |
| **FLOW** | Step-by-step execution sequence |
| **RULES** | Declarative business rules (IF/THEN/ALWAYS/NEVER) with `BR-{MODULE}-XXX` IDs |
| **EDGE_CASES** | Scenarios that deviate from standard flow |
| **EXAMPLES** | Practical examples showing input vs output/state changes |

### 2.3 Lifecycle & Maintenance

> [!IMPORTANT]
> **Logic Documentation is part of the "Definition of Done".**

- **Implementation**: Reference the task requirements in code comments.
- **Post-implementation**: Create the business logic doc AFTER the code is finalized.
- **Module index sync**: Update `docs/logic/{module}/index.md`.
- **BR traceability**: Register new Business Rules in `docs/system/br-registry.md` first.
- **Version bumping**: Update the logic doc version following `bks-doc-logic-standard` if requirements change.
