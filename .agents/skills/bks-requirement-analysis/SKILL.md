---
name: bks-requirement-analysis
description: A generalized methodology for transforming raw/vague draft requirements into structured, technical specifications ready for implementation.
---

# Requirement Analysis Methodology

This skill turns an initial requirement draft into a finalized, implementation-ready technical specification. It defines a standard directory structure, a six-phase analysis workflow, and a mandatory output document structure. SKILL.md is the orchestration layer — each phase and output section points to a reference file (`references/`) that holds the full templates and detail. Read the relevant reference when you reach that step rather than working from memory.

## 1. Standard Directory Structure

This methodology assumes a two-stage documentation process:

| Directory | Purpose | Usage |
|---|---|---|
| `docs/logic/` | **System Intelligence**: the single source of truth for existing business logic, workflows, and technical patterns. | **Analysis Tool** |
| `docs/system/br-registry.md` | **BR Registry**: the single source of truth for Business Rule IDs and semantics. | **Rule Lookup** |
| `docs/draft/` | Raw, initial requirements, brain dumps, or rough ideas from stakeholders. | **Source** |
| `docs/requirements/` | Formal, analyzed, structured specifications ready for technical design. | **Output** |

> [!CAUTION]
> **Logic Lookup Rule**: ALWAYS use `docs/logic/` to understand the current system. Do NOT read `docs/draft/`, `docs/requirements/`, or `docs/tasks/` for project logic unless the user explicitly asks for a specific file — those folders are implementation history, while `docs/logic/` is actively maintained system intelligence.

> [!TIP]
> When copying this skill to a new project, create these directories or update the paths above to match the project.

## 2. Objective

Transform "what the user wants" (Draft) into "what the system must do" (Requirement Specification) by closing logical gaps and defining technical implications.

> [!IMPORTANT]
> **Analysis, not Summarization**: The goal is NOT to summarize the draft — it is to **analyze** it: find what is missing, define what is silent, and build a technical blueprint ready for implementation. A document that merely restates the draft is a failure of this skill.

## 3. Analysis Workflow

Six phases move a draft to a finalized requirement. **Full detail per phase: [references/01-analysis-phases.md](./references/01-analysis-phases.md).**

- **Phase I — Content Absorption**: Read the draft fully; identify stakeholders, entities, and the definition of "success". Assess **draft density**: high-density (detailed schema/flows) → preserve every detail, no omissions; low-density (just goals) → proactively propose concrete schema, enums, flows, and endpoints.

- **Phase II — Legacy Logic, Module & Scope Audit**: Before designing anything, learn the current system. Identify the owning module (search `routes/`, `app/Http/Controllers/`); audit existing Enums, `TableService`, and Policies to reuse; identify guards; resolve every referenced `BR-*` against `docs/system/br-registry.md`; decide replace-vs-extend. **Use ONLY `docs/logic/` for existing logic** — never `docs/draft|requirements|tasks`.

- **Phase III — Logical Gap Detection**: Hunt the "silences" — where the draft is technically vague. Scan these categories: internal contradictions, state lifecycle, internal flags, unhappy paths, localization, validation/constraints, time-based logic, concurrency/race conditions, snapshots, notifications, permissions, pagination/performance, idempotency, data migration/defaults, audit/logging, master-data lookups, and labels-vs-storage (recommend integer-backed Enums). Full descriptions + examples are in the gap-detection table of [references/01-analysis-phases.md](./references/01-analysis-phases.md).

- **Phase IV — Technical Mapping**: Map business concepts to technical components — persistence, authorization, logic placement, integrations, background jobs, notifications, performance, and UI/UX. **Detail: [references/02-technical-mapping.md](./references/02-technical-mapping.md)** (service placement, DTOs, the Factory/Observer rules, and the **Master Data vs dedicated API** routing decision); **performance: [references/07-performance-analysis.md](./references/07-performance-analysis.md)**. Classify the FE scope here (complexity tier + flow type); the exhaustive FE breakdown lives in document **§9**.

- **Phase V — Interactive Refinement**: For every gap, propose the most logical default with trade-offs using the Gap Report table (lead with the AI-recommended option). Limit to **2 refinement rounds**; after that, unresolved items become **Open Questions** in the final document and you proceed to Phase VI.

- **Phase VI — Document Finalization**: Produce a **stand-alone blueprint** in `docs/requirements/` — complete enough that the draft could be deleted. If the scope is large (>3 modules OR >10 flows OR >~4000 words), split by module/phase and add a **Cross-Reference Matrix** so shared entities (tables, enums, rules) are owned by exactly one document.

## 4. Output: Requirement Document Structure

Every `docs/requirements/` document MUST contain these sections, in order. **Full templates + examples (column tables, enum/transition tables, flow + error-case formats, the §9 FE breakdown): [references/03-document-structure.md](./references/03-document-structure.md).**

> [!IMPORTANT]
> **Heading-number convention.** The YAML Frontmatter is **§1**, so the first `##` body heading is `## 2. OVERVIEW` and the numbering runs §2 (OVERVIEW) → §8 (PROCESSING FLOWS) → **§9 (UI/UX)** → §10 (NOTIFICATIONS) → §11 (API) → §12 (TASKS) → §13 (DRAFT COVERAGE). The FE section MUST land on **§9** to match the `§9.1`–`§9.8` subsection labels in this document and the `§9.2`/`§9.6` references in `bks-requirement-to-tasks`. Do NOT renumber so OVERVIEW becomes §1 — that shifts UI/UX to §8 and breaks those cross-references.

1. **YAML Frontmatter** — title, description, status, date, version, changelog (bump minor for clarifications, major for scope/data-model/flow changes).
2. **OVERVIEW** — the *full* scope of the change, not a restated draft intro.
3. **CONTEXT** — modules, features, guards, third-parties.
4. **OUT OF SCOPE** — what is explicitly excluded, to prevent scope creep.
5. **BUSINESS RULES** — numbered, standalone, testable `BR-*` in **one layer-agnostic registry** (the same rule is referenced by BE and FE), each with an **Enforced in (BE/FE)** note. Use `PROPOSED_BR:{slug}` for not-yet-registered rules. Pure UI/UX behavior is `UI-*` in §9.7, not a `BR-*`.
6. **REQUIREMENT ANALYSIS** — logic breakdown, conditions, and rules.
7. **DATA MODEL UPDATES** — exhaustive per-table column tables (every table, incl. pivots, defines an `id`); integer-backed Enums with full value list, state transitions, triggers, and `label()` localization keys. Preserve stakeholder-defined columns verbatim; flag concerns as "Suggested Modifications".
8. **PROCESSING FLOWS** — step-by-step for **every** scenario; each data-mutating step lists **State Changes** (`table.column` → value); each flow ends with an **Error Cases** table (network, duplicate, invalid state, auth, third-party).
9. **UI/UX & FRONTEND IMPLICATIONS** — the source `bks-requirement-to-tasks` slices into per-screen FE tasks: scope classification, screen & route inventory, component trees, data layer, Zod schemas, UI states, `UI-*` behavior, navigation/i18n.
10. **NOTIFICATIONS** — trigger event / channel / template / variables / recipient.
11. **API ENDPOINT INVENTORY** — method / endpoint / guard / description / related flow.
12. **IMPLEMENTATION TASKS** — phased TODO (1 Foundation → 2a Jobs → 2b API → 3a–3d Frontend → 4 Quality); enumerate FE work per screen × layer using §9.2.
13. **DRAFT COVERAGE MATRIX** *(optional, high-density drafts)* — map every draft item to a requirement section so nothing is silently dropped.

> [!IMPORTANT]
> §9 must be granular enough that no single downstream FE task needs more than ~4 components + 1–2 hooks. A vague §9 forces oversized tasks in `bks-requirement-to-tasks`.

## 5. Key Practices

- **Blueprint mentality** — a developer should be able to start coding from the requirement alone, with no further logic clarification.
- **No silent omissions** — every draft detail (column, rule, flow) appears in the requirement, or its exclusion is justified in the Draft Coverage Matrix.
- **Verify roles/guards** in the codebase (`routes/`, `Controllers/`) — never assume who manages an entity.
- **Snapshot** data that must preserve history (e.g., copying Plan prices into a UserPlan).
- **Low-density drafts** — proactively propose full schema, enums, flows, endpoints, and jobs, marked `[AI-SUGGESTED]` for Phase V approval.
- **Language**: match the draft's documentation language; technical names are always English (snake_case for DB, PascalCase for classes).

Full guidance + low/high-density examples: [references/04-best-practices.md](./references/04-best-practices.md).

## 6. Finalization Gate

Before marking a requirement final, pass both checklists:

- **Implementation-Ready Checklist** — content / logic / flow / auxiliary / **frontend** / stand-alone completeness: [references/05-quality-standards.md](./references/05-quality-standards.md).
- **Traceability & Integrity** — BR-to-flow coverage, localization coverage, concurrency audit, and cross-reference verification for split documents: [references/06-traceability.md](./references/06-traceability.md).

The decisive test: **could a developer build this feature if the `docs/draft/` file were deleted?** The answer must be YES.

## 7. Reference Documentation

| Document | Purpose |
|---|---|
| [01-analysis-phases.md](./references/01-analysis-phases.md) | Full detail of the six analysis phases, including the gap-detection table |
| [02-technical-mapping.md](./references/02-technical-mapping.md) | Phase IV mapping: persistence, service placement, DTOs/Factory/Observer rules, **Master Data vs dedicated API**, integrations, jobs, UI/UX |
| [03-document-structure.md](./references/03-document-structure.md) | Full templates for all 13 requirement-document sections (incl. the §9 FE breakdown) |
| [04-best-practices.md](./references/04-best-practices.md) | Blueprint mentality, low/high-density handling, gap resolution |
| [05-quality-standards.md](./references/05-quality-standards.md) | Implementation-Ready checklist + common failure patterns |
| [06-traceability.md](./references/06-traceability.md) | BR / localization / concurrency traceability + cross-reference matrix |
| [07-performance-analysis.md](./references/07-performance-analysis.md) | Performance analysis during requirements (volume, indexes, caching, SLAs) |
