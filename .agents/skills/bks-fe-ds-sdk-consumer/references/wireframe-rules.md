# Wireframe Rules

Use this reference when a wireframe, mockup, screenshot, or design image is provided alongside a coding request.

## TL;DR — One Rule to Remember

> **From a wireframe, take only: layout structure, information hierarchy, component intent, and data shape.**
> **Never take: colors, spacing/pixels, or font sizes/weights.**

| ✅ Take from wireframe | ❌ Ignore from wireframe |
|---|---|
| Layout structure (columns, section order) | Colors → use semantic tokens |
| Information hierarchy (primary/secondary/actions) | Spacing/pixels → use 8pt grid relationship level |
| Component intent → map to SDK component | Font size/weight → use `typo-*` roles |
| Data shape (fields, labels, content) | — |

## Core Problem: Visual Anchoring

AI models tend to prioritize visual signals from images over text instructions. When a wireframe is present, there is a risk of:

- Copying hardcoded colors from the wireframe instead of using semantic tokens
- Mapping pixel spacing values to Tailwind classes instead of using skill conventions
- Copying raw font sizes instead of using `typo-*` roles
- Building raw HTML shapes instead of mapping to SDK components
- Only implementing the visible (happy path) state and skipping error, empty, and loading states

Always consciously override visual anchoring by following the rules below.

---

## What to USE from a Wireframe

Use wireframes only to understand:

- **Layout structure** — column count, section order, which element is where
- **Information hierarchy** — what is the primary content, secondary content, actions
- **Component intent** — which SDK component matches each visual shape (see `component-detection-rules.md`)
- **Data shape** — what fields, labels, and content appear on screen

---

## What to IGNORE from a Wireframe

Never copy these directly from the wireframe:

### Colors
Wireframes typically use generic grays, blacks, and whites. Always replace with semantic tokens:

| Wireframe visual | Use instead |
|---|---|
| White / light gray background | `bg-background` or `bg-muted` |
| Dark gray / black text | `text-foreground` |
| Medium gray text | `text-muted-foreground` |
| Blue highlight / brand color | `text-primary` / `bg-primary` |
| Red error indicator | `text-destructive` / `border-destructive` |
| Green success indicator | `text-success` |
| Gray border line | `border-border` |
| Gray button | `variant="secondary"` or `variant="outline"` |
| Blue/solid button | `variant="default"` |

Do not output hardcoded hex values (`#e5e7eb`, `#111827`) or Tailwind color names (`gray-100`, `zinc-800`) from wireframe pixel colors.

### Spacing — Redesign, Don't Copy

**Never measure pixels from a wireframe and map them to Tailwind.** Wireframe spacing is often inconsistent, placeholder, or tool-default.

Instead:
1. Read the **relationship level** between two elements from the wireframe (how closely related are they?)
2. Map that relationship to the skill spacing convention below

This approach is grounded in the **8pt grid system** (Google Material Design, Apple HIG, Atlassian, IBM Carbon) and the **Gestalt proximity principle** (closer = more related).

#### Relationship → Spacing Map

| Relationship level | Example | `gap` / `space-y` | `padding` |
|---|---|---|---|
| **Micro** — icon to label, badge to text | Icon + button label | `gap-1` (4px) | — |
| **Inline** — label to its own input | `FieldLabel` → `Input` | `gap-1` (4px) | — |
| **Tight** — input to its helper/error text | `Input` → `FieldError` | `gap-1` (4px) | — |
| **Control group** — adjacent buttons, chips in one row | Button group, filter bar | `gap-2` (8px) | — |
| **Field siblings** — fields within the same logical form section | Name + Email fields | `gap-4` (16px) | — |
| **Section internal** — card content, form section body | Items inside a `CardContent` | `gap-4` (16px) | `p-4` (16px) |
| **Section break** — between two distinct sections on the same page | Personal info → Address section | `gap-6` (24px) | — |
| **Card / panel padding** — breathing room inside a contained surface | `CardContent`, dialog body, sheet body | — | `p-4` (16px) – `p-6` (24px) |
| **Major block** — between page-level zones | Header → main content → footer | `gap-8` (32px) | — |
| **Page margin** — outer page breathing room | Page left/right padding | — | `px-6` / `px-8` |

#### How to Read Relationship Level from a Wireframe

Do not look at the pixel gap. Instead ask:

- Are these two elements **part of the same form field**? → Micro / Inline / Tight
- Are these two elements **in the same control group** (row of buttons, tag list)? → Control group
- Are these two elements **in the same form section** (same topic, same card)? → Field siblings / Section internal
- Are these two elements **in different sections** (different topic, different card)? → Section break
- Are these two elements **in different page zones** (different parts of the page)? → Major block

#### Redesign Decision

If wireframe spacing clearly violates the table above (e.g., label is 40px from its input, or two sections share only 2px gap), **redesign to the correct relationship level** and note the change:

> *"Wireframe shows 2px between sections — redesigned to `gap-6` per section-break convention."*

Do not silently copy bad spacing.

### Font Sizes and Weights
Do not use `text-sm`, `text-base`, `font-bold`, `font-medium` to match wireframe text visually. Use `typo-*` roles based on content purpose. See `typography.md`.

### Raw HTML Shapes
Do not build `<div>` + `<input>` + `<svg>` structures to reproduce a wireframe shape. First check `component-detection-rules.md` for the matching SDK component.

---

## What to ALWAYS ADD (Not Visible in Wireframes)

Wireframes show the happy path only. Always implement:

| What | Why |
|---|---|
| **Error state** for every form field | `aria-invalid`, `FieldError`, `text-destructive` |
| **Empty state** for every list / table | `Empty` component or empty message |
| **Loading / skeleton** when data is async | `Skeleton` or `Spinner` |
| **Disabled state** for conditional actions | `disabled` prop on `Button`, `Input`, etc. |
| **Responsive behavior** | Wireframe is usually one viewport; stack on mobile |
| **Accessible labels** | `aria-label` for icon-only buttons, `sr-only` for hidden labels |
| **Scroll containers** | `overflow-y-auto custom-scrollbar` on long lists/panels |

---

## Decision Checklist Before Coding from a Wireframe

Before writing any JSX:

- [ ] Identified layout and hierarchy from wireframe ✓
- [ ] Checked `component-detection-rules.md` for each visual shape ✓
- [ ] Confirmed no hardcoded colors will be used ✓
- [ ] Confirmed typo-* roles instead of font-size literals ✓
- [ ] Confirmed spacing from skill conventions, not pixel measurements ✓
- [ ] Planned error, empty, loading, and disabled states ✓
- [ ] Planned responsive layout (not just the wireframe viewport) ✓

---

## Anti-Patterns

```tsx
// ❌ Copying wireframe color
<div className="bg-gray-100 text-gray-900 border-gray-200">...</div>

// ✅ Semantic tokens
<div className="bg-muted text-foreground border-border">...</div>
```

```tsx
// ❌ Pixel spacing from wireframe measurement
<div className="gap-[24px] p-[16px]">...</div>

// ✅ Skill spacing conventions
<div className="gap-6 p-4">...</div>
```

```tsx
// ❌ Font size copied from wireframe
<p className="text-sm font-medium">Label</p>

// ✅ Typo role
<p className="typo-label-md text-muted-foreground">Label</p>
```

```tsx
// ❌ Raw HTML shape to match wireframe visually
<div className="relative">
  <input className="pl-9 border rounded" />
  <CalendarIcon className="absolute left-2 top-2.5 size-4" />
</div>

// ✅ SDK component mapped from visual intent
<DatePicker />
```

```tsx
// ❌ Only happy path (what wireframe shows)
<Table>...</Table>

// ✅ All states
<Table>...</Table>
{isLoading && <Skeleton />}
{isEmpty && <Empty title="No results" />}
{error && <p className="typo-caption text-destructive">{error}</p>}
```
