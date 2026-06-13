# Best Practices

Guidelines for creating high-quality requirement specifications.

## Portability & Customization

- **Language**: Adopt the project's documentation language. The AI MUST match the language used in the draft document.
- **Standard Names**: Always propose technical names in English (Snake Case for DB, CamelCase for Classes) even if the description is in another language.
- **Filename Mapping**: Ensure the output filename in `docs/requirements/` matches the naming convention of the draft (e.g., including the target implementation date).

## Core Principles

### Blueprint Mentality

Every requirement document should be a developer's first document—they should be able to start coding without further clarification on logic.

### Role Accuracy

NEVER assume a role manages an entity without verifying the existing controller/guard structure via codebase search (Check `routes/` and `Controllers/`).

### Snapshotting

Always consider if certain data should be snapshotted (copied) to preserve history.

### No Silent Omissions

If the draft mentions a detail (column, rule, flow), it MUST appear in the requirement. If the AI decides to exclude something, it must explicitly state why in the DRAFT COVERAGE MATRIX.

## Low-Density Draft Handling

When a draft is vague (just goals, no schema), the AI must proactively propose:

- Full database schema with tables and columns
- All enum definitions with values and transitions
- Complete processing flows with state changes
- API endpoint inventory
- Background jobs and scheduled tasks

Present all proposals in "Suggested" status during Phase V for user approval.

### Low-Density Draft Example

> Draft: *"I want users to be able to subscribe to monthly plans and pay with credit card."*

**Expected AI output for this draft:**

- **Proposed tables**: `plans` (name, price, interval, features), `subscriptions` (user_id, plan_id, status, started_at, expires_at, canceled_at), `payments` (subscription_id, amount, method, status, paid_at)
- **Proposed enums**: `SubscriptionStatus` (active, canceled, expired, past_due), `PaymentStatus` (pending, paid, failed, refunded) — each with full transition tables
- **Proposed flows**: Subscribe to plan, Cancel subscription, Renew subscription, Handle failed payment, Process refund
- **Proposed jobs**: Check expired subscriptions (daily), Retry failed payments (hourly), Send renewal reminders (3 days before expiry)
- **Proposed API endpoints**: `POST /subscribe`, `POST /cancel`, `GET /my-subscription`, `POST /webhook/stripe`

All items marked as **[AI-SUGGESTED]** and presented for user approval in Phase V.

## High-Density Draft Handling

When a draft contains detailed specifications:

1. **Preserve ALL details**: No omissions allowed.
2. **Flag issues as suggestions**: If something seems wrong, propose "Suggested Modifications" requiring user approval.
3. **Distinguish sources**: Clearly separate stakeholder-defined columns (mandatory) from AI-proposed columns (suggested).
4. **Use Draft Coverage Matrix**: Map every draft section to requirement sections to ensure nothing is silently dropped.

## Gap Resolution Strategy

When presenting gaps to stakeholders:

1. **Lead with recommendation**: Always propose Option A as the "AI Recommended" solution based on industry best practices.
2. **Present trade-offs**: Show pros/cons for each option.
3. **Set loop limit**: Maximum 2 refinement rounds; unresolved items become "Open Questions".
4. **Document decisions**: Every gap resolution must be recorded in the final requirement.

## Technical Design Principles

### Enum Design

- Always use integer-backed Enums (starting from 1)
- Implement `label()` method for frontend display
- Define localization keys for all values
- Document state transitions with triggers

### API Design

- Return both integer `value` and localized `label` for enums
- Use DTOs for all service method inputs (never raw arrays)
- Document guards, permissions, and error scenarios

### Database Design

- Every table MUST have `id` as primary key (including pivot tables)
- Use `tinyInteger` for enums with <= 127 cases
- Consider `lockForUpdate()` for financial/race-condition prone operations
- Document snapshot/copy logic explicitly

### Concurrency Handling

For flows involving data modification:
- Assess race condition risks
- Use `lockForUpdate()` or atomic locks where needed
- Include "Concurrency Handling" sub-section in flows with risks
