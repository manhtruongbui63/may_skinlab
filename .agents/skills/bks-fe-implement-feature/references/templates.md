# Plan Templates

Copy-paste these blocks into your implementation plan. Choose the appropriate depth based on the complexity tier.

---

## Questions template (Round 1)

```
## Requirements — Round 1

### Must-answer
1. Q:
   A:
2. Q:
   A:
3. Q:
   A:

### Should-answer
4. Q:
   A:
5. Q:
   A:
6. Q:
   A:
```

If any must-answer is unanswered after Round 1 → ask max 3 follow-up questions in Round 2.
If still unanswered → assume and label "Assumed".

---

## Screen blueprint

```
Screen: <screen name>
Route:  app/(main)/<feature>/page.tsx | app/(main)/<feature>/[id]/page.tsx | "dialog"
Delivery: App Router page (in shared shell) | Dialog (from @bks/ds-system-sdk)

Component map:
- Page: page.tsx (+ "use client" component) inside shared shell
- Table: SDK table primitives + column definitions
- Empty state: Empty + EmptyHeader + EmptyTitle + EmptyMedia
- Filters: Input, Select, Button(variant="outline"); URL-synced via next/navigation
- Pagination: SDK pagination component (ListResponse<T> payload)
- Row actions: Button(variant="ghost") | DropdownMenu
- Delete confirm: AlertDialog
- Form fields: Field → FieldLabel + FieldContent + FieldError
- Toast: sonner (toast.success / toast.error) — never on 422
```

Remove rows that don't apply to the screen. Add feature-specific rows as needed.

---

## Requirements capture — Standard/Complex

```
## Requirements capture

### Flow & complexity
- Tier: Simple | Standard | Complex
- Flow: A | B | C | D
- Data mode: http (always) | + MSW mock when API unready

### Screens
| Screen | Route (page.tsx / dialog) | Delivery | Notes |
|---|---|---|---|
| | | | |

### API contract
| Action | Method | Endpoint | Status |
|---|---|---|---|
| List | GET | | agreed / TBD |
| Create | POST | | agreed / TBD |
| Update | PUT | | agreed / TBD |
| Delete | DELETE | | agreed / TBD |

- Pagination default: page=1, per_page=15
- Sort default: created_at desc
- Validation error shape: { errors: { field: string[] } }

### Validation strategy
- next-intl (MANDATORY) — shared `validation.*` / `action.*` + `<Namespace>.fields.*`
- Keys to add (vi/en/ja): (list here)

### Form fields (if any)
| Field | Label | Control | Required | Default | Constraints | API key |
|---|---|---|---|---|---|---|
| | | | | | | |

### Table columns (if any)
| Header | Property | Sortable | Format | Align |
|---|---|---|---|---|
| | | | | |

### Q&A summary
| # | Question | Answer |
|---|---|---|
| 1 | | |
| 2 | | |

### Assumptions
- Assumed: …

### Out of scope
- …

### Acceptance criteria
Screen: …
- Given …, when …, then …
- Given …, when …, then …
- Given …, when …, then …
```

---

## Requirements capture — Simple (abbreviated)

```
## Requirements capture

- Tier: Simple
- Flow: A | B | C | D
- Data mode: http (+ MSW mock if API unready)
- Screen: <name> — route: <page.tsx path / dialog> — delivery: <page / dialog>
- API: <endpoint> (<agreed/TBD>)
- Validation: next-intl (MANDATORY)
- Key decisions: …
- Assumptions: …
- Out of scope: …

Acceptance:
- Given …, when …, then …
- Given …, when …, then …
```

---

## Test plan (add before Step 5)

```
## Test plan
- Create → success → expected navigation → row visible in list
- Edit → success → values persisted after refresh
- Delete → confirm dialog → success → row removed
- Empty state and loading state render correctly
- Responsive checks: 320 / 768 / 1280
- Deep-link refresh: direct URL works
```
