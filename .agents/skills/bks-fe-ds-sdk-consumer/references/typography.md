# Typography

Use this reference when adding or reviewing visible text in a consumer app that uses `@bks/ds-system-sdk`.

## Core Rule

`.typo-*` utilities control typography only:

- font size
- line height
- letter spacing
- font weight
- font family

Color stays separate through semantic token classes:

- `text-foreground`
- `text-muted-foreground`
- `text-success`
- `text-warning`
- `text-info`
- `text-destructive`

Input labels should use `text-muted-foreground` by default.

## Role Map

| Utility | Use for | Common color |
| --- | --- | --- |
| `typo-display` | Hero or very large marketing display text | `text-foreground` |
| `typo-heading-1` | Page title | `text-foreground` |
| `typo-heading-2` | Major section title | `text-foreground` |
| `typo-heading-3` | Subsection title | `text-foreground` |
| `typo-title` | Card, dialog, alert, panel, or block title | `text-foreground` |
| `typo-body` | Paragraphs, prose, page descriptions | `text-foreground` or `text-muted-foreground` |
| `typo-ui` | Button text, trigger text, tabs, menu items, compact table cells | component-controlled color |
| `typo-label-md` | Field labels, group labels, object labels | `text-muted-foreground` for input labels |
| `typo-label-sm` | Compact labels and small group headings | `text-muted-foreground` for input labels |
| `typo-caption` | Helper text, metadata, timestamps, compact errors | `text-muted-foreground` or semantic tone |
| `typo-code` | Inline code, token values, commands | `text-foreground` |
| `typo-code-sm` | Paths, token names, mono captions | `text-muted-foreground` |

## Examples

Page header:

```tsx
<header className="space-y-2">
  <h1 className="typo-heading-1 text-foreground">Settings</h1>
  <p className="typo-body text-muted-foreground">
    Manage workspace defaults and access.
  </p>
</header>
```

Form field:

```tsx
<div className="space-y-1">
  <label className="typo-label-md text-muted-foreground" htmlFor="email">
    Email
  </label>
  <Input id="email" type="email" aria-invalid={hasError || undefined} />
  {hasError ? (
    <p className="typo-caption text-destructive" role="alert">
      Enter a valid email address.
    </p>
  ) : (
    <p className="typo-caption text-muted-foreground">
      Used for billing notifications.
    </p>
  )}
</div>
```

Status text:

```tsx
<p className="typo-caption text-success" role="status">
  Saved.
</p>
```

## Exclusive Role Rule

Each element must have at most **one** `.typo-*` class. Never stack two roles on the same element — cascade order is unpredictable.

Adjust a single property with Tailwind utilities alongside one role:

```tsx
<h2 className="typo-title font-semibold uppercase tracking-tight">...</h2>

// ❌ NEVER
<h2 className="typo-title typo-heading-3">...</h2>
```

## SDK Components with Baked-in Typography

Do **not** add another `typo-*` to these components' `className`:

| Component | Baked-in role |
| --- | --- |
| `DialogTitle`, `SheetTitle`, `DrawerTitle`, `PopoverTitle`, `AlertTitle`, `ItemTitle`, `EmptyTitle`, `AccordionTrigger` | `typo-title` |
| `DialogDescription`, `SheetDescription`, `DrawerDescription`, `AlertDescription`, `ItemDescription`, `EmptyDescription`, `AccordionContent`, `CollapsibleContent`, `CommandEmpty` | `typo-body` |
| `CollapsibleTrigger`, `Button`, `CommandInput`, `CommandItem`, `BreadcrumbList` | `typo-ui` |
| `Badge` | `typo-label-sm` |
| `Label` | `typo-label-md` |
| `FieldError` | `typo-caption` |

Only add color, layout, or single-property overrides:

```tsx
<DialogTitle className="uppercase tracking-tight text-foreground">Title</DialogTitle>
```

Do not stack `typo-body` / `text-sm` / `text-xs` on top of typo roles — use the role alone for size.

## Anti-Patterns

Do not stack two typo roles on the same element:

```tsx
<h2 className="typo-title typo-heading-3">Title</h2>
```

Do not bundle color into typography:

```tsx
<p className="typo-error">Invalid email.</p>
```

Use separate type and color:

```tsx
<p className="typo-caption text-destructive" role="alert">
  Invalid email.
</p>
```

Do not use heading roles for field labels:

```tsx
<label className="typo-heading-3">Email</label>
```

Use label roles:

```tsx
<label className="typo-label-md text-muted-foreground" htmlFor="email">
  Email
</label>
```

Do not use label roles for button text only to get medium weight. Use the SDK `Button`, which already owns its control typography.
