# Design System Rules (Step 2 reference)

These rules are non-negotiable during implementation. Apply without asking the user.

For the **deviation policy** (when you must legitimately break a rule), see SKILL.md → Step 5.

---

## UI/UX Authority — `bks-ds-sdk-consumer`

**ALL UI/UX decisions are delegated to the `bks-ds-sdk-consumer` skill.**

Before writing ANY UI code in a feature, read the following references from `bks-ds-sdk-consumer`:

| Reference                          | Read when                                                     |
| ---------------------------------- | ------------------------------------------------------------- |
| `references/setup.md`             | First time importing SDK or CSS                               |
| `references/typography.md`        | Adding or reviewing visible text                              |
| `references/component-rules.md`   | Using any SDK UI component                                    |
| `references/layout-patterns.md`   | Composing pages, forms, CRUD, detail, dashboard, settings     |
| `references/filter-toolbar-layout.md` | Building CRUD list filter bars                            |
| `references/pagination-layout.md` | Table/list pagination footer                              |
| `references/status-badge-rules.md`| Using Badge / status labels                                   |
| `references/component-detection-rules.md` | Converting HTML/mockups to SDK components            |
| `references/wireframe-rules.md`   | Wireframe/mockup → SDK (ignore pixels/colors)               |

### What `bks-ds-sdk-consumer` governs (do NOT duplicate here):

- **Component selection** — which SDK component for each UI intent
- **Component size** — `default` unless spec says otherwise
- **Layout composition** — screen type identification, hierarchy, cards vs bands, gap tokens
- **Typography** — `.typo-*` utilities, role map, color separation
- **Form field composition** — `Field` + `FieldLabel` + `FieldContent` + `FieldError` + `FieldDescription`
- **Spacing** — `gap-1` to `gap-8` scale
- **Scroll containers** — `custom-scrollbar` on every overflow
- **Upload components** — single vs multi, consumer vs SDK responsibilities
- **Badge/status** — variant from meaning, consistency per page
- **Filter toolbar** — toolbar layout, responsive patterns
- **Component detection** — mapping raw HTML to SDK components

### What this file still governs (logic-side rules):

- SDK import paths (quick reference below)
- Layout shell selection (which shell for which flow)
- Dialog form structure (STRICT — scroll/footer rules)
- Styling prohibitions in feature code
- Validation & i18n strategy
- Toast policy
- Date/time formatting
- Loading / error / empty state patterns
- Responsive verification breakpoints
- Reusable utility function rules

---

## SDK Imports (quick reference)

```tsx
import { 
  Button, Input, Card, CardContent,
  Field, FieldLabel, FieldContent, FieldError, FieldDescription,
} from "@bks/ds-system-sdk"
```

Subpath imports also valid:

```tsx
import { Button } from "@bks/ds-system-sdk/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@bks/ds-system-sdk/dialog"
```

**Do not** copy SDK source components into the consumer app.

---

## Pages & dialog forms

- **List / detail page** → a Next.js App Router `page.tsx` under a route group
  (`app/(main)/<feature>/...`), composed inside the shared shell (`shared/components/layout/app-shell.tsx`).
- **Create / edit (default)** → `Dialog` + `DialogContent` from `@bks/ds-system-sdk`.
- **Routed full-page form** → only when explicitly requested or when too large for a dialog.

There are **no** `LayoutPage` / `LayoutFormPage` / `FormDialogContent` components in this codebase.

### Dialog form standards (STRICT)

- **Scrolling:** the form body **MUST** be a scrollable container (`custom-scrollbar` + `overflow-y-auto`,
  with a height cap such as `max-h-[…]`) regardless of content length.
- **Footer:** all action buttons **MUST** sit inside `DialogFooter`, **outside** the scroll area, so
  actions stay visible.
- **Conditional mount:** render the form with `{open && <FeatureForm … />}` so it remounts on open/close.

### Standard Dialog pattern (see `features/auth/components/change-password-dialog.tsx`)

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button } from "@bks/ds-system-sdk"
import { useTranslations } from "next-intl"

const t = useTranslations("Feature")
const tAction = useTranslations("action")

<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="flex max-h-[min(90vh,44rem)] w-[min(calc(100vw-2rem),28rem)] flex-col gap-0 overflow-hidden p-0">
    <DialogHeader className="gap-2 border-b border-border px-6 py-5 text-left">
      <DialogTitle className="typo-heading-3">{t("title")}</DialogTitle>
    </DialogHeader>

    {open && (
      <form className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Scrollable body */}
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6 space-y-4">
          {/* fields */}
        </div>

        <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{tAction("cancel")}</Button>
          <Button type="submit" loading={isSubmitting}>{tAction("save")}</Button>
        </DialogFooter>
      </form>
    )}
  </DialogContent>
</Dialog>
```

- Don't modify `shared/components/layout/` unless the task explicitly scopes an app-wide change;
  exception: register the feature nav item in the menu config (`@/shared/types/menu`).

---

## Styling prohibitions in feature code (STRICT — zero tolerance)

**Core principle:** Clean code, single-responsibility components, easy to read and maintain.

- **Tone / variant / size** of an SDK component comes from its props (`variant`, `size`, `loading`,
  …), not from Tailwind overrides. Don't fight the design system with arbitrary utilities.
- `className` for **structural composition** (layout, spacing, sizing, scroll) on SDK components and
  wrappers is used in this codebase (see `change-password-dialog.tsx`) — keep it to layout intent,
  not visual restyling.
- `shadow-*` classes are **FORBIDDEN** in feature code.
- Component selection and the precise styling contract are governed by `bks-ds-sdk-consumer` — follow it.

> For full component rules (size defaults, button rules, form field rules, color tokens),
> see `bks-ds-sdk-consumer` → `references/component-rules.md`.

---

## Validation & i18n

i18n (next-intl) is **MANDATORY** — no inline/hardcoded strings. Use `useTranslations`:

- **Validation:** `t("validation.required", { field: t("<Namespace>.fields.name") })` — named
  interpolation `{field}` / `{min}` / `{max}` (see `validation-i18n.md`).
- List the keys in the plan before writing schemas.

### Copy rules

- Shared `validation.*` error templates + `action.*` shared actions + `<Namespace>.fields.*` for
  field display names. Check shared roots before adding feature keys.
- Add every key to **all three** catalogs: `messages/vi.json`, `en.json`, `ja.json`.

---

## Toasts

- **Service responsibility:** the service layer orchestrates toasts after API calls (not components).
- **Import:** `import { toast } from 'sonner'` — used directly. There is no `shouldShowToast` helper.
- **Source:** prefer the backend `ResponseData.message` (or an `Api` / feature i18n key) over invented strings.
- **Never toast on 422** — those map to inline field errors via `mapBackendErrors`. See `project-patterns.md` → "Toast policy".

---

## Date/time formatting (STRICT)

All date/time values displayed in tables and UI **MUST** use one of these two formats based on context:

| Context                                                          | Format             | Example            |
| ---------------------------------------------------------------- | ------------------ | ------------------ |
| Date only (created date, birth date, expiry date)                | `DD-MM-YYYY`       | `23-04-2026`       |
| Date + time (timestamps, activity logs, last login, audit trail) | `DD-MM-YYYY HH:mm` | `23-04-2026 14:30` |

- **Choose format by semantic context:** If the time component is meaningful for the user's decision-making → use `DD-MM-YYYY HH:mm`. If only the date matters → use `DD-MM-YYYY`.
- Use the typed helpers in `shared/lib/format-date.ts` (`formatDate(date)`) and `format-datetime.ts`
  (`formatDateTime(date)`) — do not write manual date string manipulation.
- Never use raw `toLocaleDateString()` or unformatted ISO strings in the UI.

---

## Responsive

- Mobile-first; verify 320 / 768 / 1280px.
- Tables: `overflow-x-auto`.
- Filters: `grid grid-cols-12 gap-3`.
- Form footer: `flex flex-col-reverse gap-2 sm:flex-row sm:justify-end`.
- Use `min-w-0`, `truncate`, `break-words` as needed.
- `Intl.NumberFormat` for locale-safe number/currency formatting.

> For responsive layout composition patterns (toolbar, mobile stacking, split panes),
> see `bks-ds-sdk-consumer` → `references/layout-patterns.md` and `references/filter-toolbar-layout.md`.

---

## Loading, error, empty states

- **Loading:** Use `Skeleton` from `@bks/ds-system-sdk` for content placeholders. Use a `loading` prop / ellipsis `…` for inline transient states (e.g. submitting button).
- **Error:** Use App Router error boundaries — a route `error.tsx` (and the global `app/error.tsx` / `global-error.tsx`). Show a retry CTA when recoverable. Toasts only for transient mutation errors.
- **Empty:** Use the `Empty` family from `@bks/ds-system-sdk` (`Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`).
- **Optimistic update:** Allowed for list mutations when latency matters; **must** rollback on failure and surface error via toast.

---

## Reusable utility functions

- Any helper function used in **2+ places** MUST be extracted to a util file (`features/<feature>/utils/` or `shared/lib/`).
- Util functions must be **pure functions** — no side effects, no dependencies on React state or hooks.
- Each util file must export **one focused concern** (e.g. `format-date.ts`, `parse-currency.ts`).
- Write clean, typed signatures with JSDoc for public utils; avoid generic names like `helper`, `utils`, `misc`.
