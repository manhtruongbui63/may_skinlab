# Analysis Phases

Detailed breakdown of the 6 phases for requirement analysis.

## Phase I: Content Absorption

- Read the source file from `docs/draft/` completely to understand the core business value.
- Identify primary stakeholders (Who uses this?), main entities (What data is stored?), and the definition of "Success".
- **Draft Density Assessment**: Evaluate the draft's level of detail:
  - **High-density** (detailed schema, step-by-step flows): Preserve ALL details; no omissions allowed.
  - **Low-density** (vague descriptions, just goals): AI must proactively propose concrete technical designs.
  - This assessment determines how much the AI "invents" vs "preserves" in later phases.

## Phase II: Legacy Logic, Module & Scope Audit

Before defining new requirements, understand the current system architecture:

- **Module Identification**: Identify which existing module (e.g., User, Common) this feature belongs to. Search `routes/` and `app/Http/Controllers/` to confirm.
- **Audit Existing Code/Docs**: Search for existing Controllers, Services, and business logic documents (`docs/logic/`) related to the feature.
  > [!IMPORTANT]
  > **Logic Source Rule**: Use ONLY `docs/logic/` as the document source of truth for existing logic. Do NOT read `docs/draft`, `docs/requirements`, or `docs/tasks` during this audit as they may contain outdated or implementation-specific history.

- **Audit Core Infrastructure**:
  - **Enums**: Check `app/Enums/` for existing states/types that should be reused.
  - **TableService**: Check for existing list endpoints using `TableService` to ensure consistent filtering/sorting patterns.
  - **Policies**: Check `app/Policies/` for existing authorization rules that should be extended.

- **Authorization & Guards**: Identify which guard (e.g., `api` (User), `web`) and which policies/permissions govern the entities.
- **Identify Conflicts**: Determine where the new draft contradicts or replaces current behavior.
- **BR Registry Audit**: Resolve all referenced `BR-*` against `docs/system/br-registry.md`.
  - If a new business rule is needed but not yet registered, label it as `PROPOSED_BR:{slug}` **only in requirement/task artifacts**.
  - Before implementation updates `docs/logic/`, convert every `PROPOSED_BR:{slug}` into an official `BR-*` ID registered in `docs/system/br-registry.md`.
  - Do NOT use `PROPOSED_BR` in final logic documentation.

- **Dependency Check**: Ensure new changes don't break existing modules or data structures.
- **Transition Strategy**: Explicitly define if the requirement replaces old logic or extends it.

## Phase III: Logical Gap Detection

Scan the draft for common omissions that lead to bugs or delays. Focus on "Silences"—parts where the draft is technically vague:

| Gap Category | Description | Example |
|--------------|-------------|---------|
| **Internal Contradictions** | Scan for conflicting statements within the draft | Section A says "free plan needs no payment" but Section B says "all plans require payment" |
| **State Infinity** | Does every entity have a clear lifecycle? | If payment is "Pending", how does it move to "Success" or "Failed"? |
| **Internal Logic Flags** | Flags developers need but stakeholders didn't mention | `is_current`, `retry_at`, `is_old_debt` |
| **The "Unhappy" Path** | What happens when things go wrong? | Network timeout, invalid input, insufficient funds |
| **Localization Silences** | Missing translation keys | Success/error messages, status labels, UI text |
| **Validation & Constraints** | Hidden rules | "Must be divisible by X", "Minimum amount is Y" |
| **Time-based Logic** | Automatic logic over time | Expiration, scheduled charging, reminders |
| **Concurrency & Race Conditions** | Two users doing the same thing | Financial data or strict state transitions need `lockForUpdate()` |
| **Data Integrity & Snapshots** | Copy data at a point in time | Copying Plan prices to UserPlan |
| **Notifications & Communications** | State change triggers | Email, push notification, in-app message |
| **Permissions** | Data visibility | Can one user see another's data? |
| **Pagination & Performance** | Large datasets | Need pagination, caching, or indexing |
| **Idempotency** | Safe to repeat action? | Webhook delivered twice, user clicks submit twice |
| **Data Migration & Defaults** | Existing records | What happens when new mandatory field is added? |
| **Audit & Logging** | Sensitive actions | Immutable activity trace (who did what, when) |
| **Master Data Gaps** | Reusable FE lookup lists for selects/dropdowns (search/exclusion/selected); batch a screen's lookups into ONE Master Data call. Picker → Master Data; managing/mutating the entity or `JsonResource` output → dedicated API (see [02-technical-mapping.md](02-technical-mapping.md) → Master Data vs Dedicated API). | Statuses, department tree, roles |
| **Labels vs. Storage** | Business vs storage values | Recommend integer-backed Enums even if draft uses strings |

> [!TIP]
> Refer to `bks-be-api-standard` for localization patterns and `bks-be-database-standard` Section 3 for Enum patterns.

## Phase IV: Technical Mapping

Map business concepts to technical components using project standards. See: [02-technical-mapping.md](02-technical-mapping.md)

## Phase V: Interactive Refinement & Logic Suggestion

This phase is the most critical for moving from a vague draft to a production-ready technical specification.

- **Proactive Gap Assessment**: Do not just wait for instructions. Actively identify silences in the draft.
- **Recommend the "Most Logical" Path**: For every identified gap, propose at least one concrete logical solution based on industry best practices (e.g., Stripe's 3D Secure flows, idempotent webhook handlers).
- **Collaborative Discussion**: Present trade-offs and ask for the stakeholder's preference, but always lead with a recommended default.
- **Refinement Loop Limit**: Maximum **2 refinement rounds** are allowed. After 2 rounds, any unresolved disagreements MUST be documented as `Open Questions` in the final requirement document and the process proceeds to Phase VI.

### Mandatory Gap Report Format

When presenting gaps to the user, use this structured table format:

```markdown
#### Gap #{n}: [Title]
- **Draft says**: [quote from draft, or "Silent — not mentioned"]
- **Problem**: [why this is a gap]

| Solution | Description | Impact/Trade-offs |
|---|---|---|
| **[AI Recommended]** Option A | [concrete proposal] | [pros/cons] |
| Option B | [alternative approach] | [pros/cons] |
```

## Phase VI: Document Finalization (Stand-alone Blueprint)

Finalize the requirement document in `docs/requirements/` only after the core logic has been refined and approved.

- **Stand-alone requirement**: The final document MUST be a complete technical blueprint that allows the draft to be deleted. It must contain every detail mentioned in the draft plus the analyzed gaps and technical mappings.
- **Scope Splitting Rule**: If the feature scope is large (>3 affected modules OR >10 distinct processing flows OR the document body exceeds ~4000 words), the AI MUST propose splitting into multiple requirement documents organized by module or phase.

### Cross-Requirement Consistency (when split)

If a feature is split into multiple requirement documents:

1. Add a **Sibling Documents** section at the top of each split document listing ALL related requirement documents with their scope summary.
2. Ensure **shared entities** (tables, enums, business rules) are defined identically across all documents.
3. Designate one document as the **source of truth** for each shared entity.
4. Include a **Cross-Reference Matrix**:

```markdown
| Shared Entity | Owner Document | Referenced By |
|---------------|----------------|---------------|
| `users` table | phase1-registration.md | phase2-payment.md |
| `PaymentStatus` enum | phase2-payment.md | phase1-registration.md |
```
