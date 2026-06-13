# Layout Patterns

Use this reference when implementing full screens or complex sections with `@bks/ds-system-sdk`.

## Screen Types

| Screen | Structure | Notes |
| --- | --- | --- |
| Form | Header, constrained form, grouped fields, footer actions | Keep field width readable; use `Field className="gap-1"`. |
| CRUD list | Header, toolbar, table/list, pagination, empty/error state | Toolbar actions predictable; avoid scattered filters. See `filter-toolbar-layout.md` for filter bar responsive layout. |
| Detail | Summary header, main content, side metadata on desktop | Mobile stacks metadata below summary. |
| Settings | Section title/description, grouped controls, save action | Use restrained cards only for meaningful groups. |
| Dashboard | Page header, KPI row, chart/table sections | Prioritize scan order; avoid decorative cards. |
| Upload/import | Header, upload field, selected list/status, validation/error area | Upload primitive owns dropzone and rows; consumer owns server flow. |
| Modal/sheet flow | Title, short description, focused content, footer actions | Do not duplicate page-level nav inside overlay. |

## Form Pattern

```tsx
<section className="max-w-xl space-y-6">
  <header className="space-y-1">
    <h1 className="typo-heading-2 text-foreground">Billing profile</h1>
    <p className="typo-body text-muted-foreground">
      Used for invoices and tax documents.
    </p>
  </header>

  <div className="space-y-4">
    <Field className="gap-1">
      <FieldLabel className="text-muted-foreground" htmlFor="company-name">
        Company name
      </FieldLabel>
      <FieldContent>
        <Input id="company-name" />
      </FieldContent>
    </Field>
  </div>

  <div className="flex justify-end gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Save changes</Button>
  </div>
</section>
```

## Form Spacing Map

Form spacing follows the **8pt grid** and **Gestalt proximity** — related elements sit closer.

### Visual structure

```
Form container (max-w-xl)
├── [Page header]           space-y-1   ← title ↔ description
│         ↕ space-y-6
├── [Form section]          space-y-4   ← fields in same topic
│   ├── Field               gap-1       ← label ↔ input
│   └── Field
│         ↕ space-y-6         ← section break
└── [Footer actions]        gap-2
```

### Spacing reference

| Position | Class | px |
| --- | --- | --- |
| Page title ↔ description | `space-y-1` | 4px |
| Page header ↔ first section | `space-y-6` | 24px |
| Field ↔ field (same section) | `space-y-4` | 16px |
| `FieldLabel` ↔ `FieldContent` | `gap-1` on `Field` | 4px |
| Section ↔ section | `space-y-6` | 24px |
| Cancel ↔ Submit | `gap-2` | 8px |

See `wireframe-rules.md` for relationship → spacing when converting mockups.

## CRUD List Pattern

Filter bars (date range, selects, search) must follow `filter-toolbar-layout.md` — inline toolbar on `md+`, compact grid or collapsible panel on mobile; do not render list filters as a full-width vertical form.

Use this order:

1. Header: title, description, primary action.
2. Toolbar: search, filters, secondary actions (extract to `*-filters-toolbar.tsx` when non-trivial).
3. Data surface: table or item list (extract to `*-table.tsx`).
4. Footer: pagination or load-more — only when data loaded and `total > 0`; hide on error.
5. Empty/error state replacing data surface inside `CardContent`, not floating elsewhere.

```tsx
<section className="space-y-6">
  <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="space-y-1">
      <h1 className="typo-heading-2 text-foreground">Customers</h1>
      <p className="typo-body text-muted-foreground">
        Manage customer records and billing status.
      </p>
    </div>
    <Button>Add customer</Button>
  </header>

  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <Input className="sm:max-w-xs" placeholder="Search customers" />
    <div className="flex gap-2">
      <Button variant="outline">Filter</Button>
      <Button variant="outline">Export</Button>
    </div>
  </div>

  <Card className="overflow-hidden border-border p-0 gap-0">
    <div className="border-b border-border px-4 py-3 md:px-6 md:py-4">
      {/* Filter toolbar — see filter-toolbar-layout.md */}
    </div>
    <CardContent className="p-0">
      <div className="custom-scrollbar overflow-x-auto">{/* Table/List */}</div>
    </CardContent>
    <footer className="border-t border-border px-4 py-4 md:px-6">
      {/* Pagination */}
    </footer>
  </Card>
</section>
```

### Table card shell

When a `Card` wraps a CRUD **table or list** (filter toolbar + table + pagination in one surface), reset the card’s default padding and gap so bands align edge-to-edge.

SDK `Card` defaults to `py-4` and `gap-4`. Without overrides, filter/table/footer get extra inset and spacing between bands.

```tsx
<Card className="overflow-hidden border-border p-0 gap-0">
  <div className="border-b border-border px-4 py-3 md:px-6 md:py-4">
    {/* Filter toolbar */}
  </div>
  <CardContent className="p-0">
    <div className="custom-scrollbar overflow-x-auto">
      <Table>{/* … */}</Table>
    </div>
  </CardContent>
  <footer className="flex flex-col gap-4 border-t border-border px-4 py-4 md:px-6 sm:flex-row sm:items-center sm:justify-between">
    {/* Summary + pagination */}
  </footer>
</Card>
```

| Element | Classes |
| --- | --- |
| `Card` (table shell) | `overflow-hidden border-border p-0 gap-0` |
| Toolbar band | `border-b border-border px-4 py-3 md:px-6 md:py-4` |
| `CardContent` (table only) | `p-0` |
| Table scroll wrapper | `custom-scrollbar overflow-x-auto` |
| Pagination footer | `border-t border-border px-4 py-4 md:px-6` |

Do **not** rely on default `Card` padding when the interior is a full-bleed table — it creates double gutters and misaligned filter/table edges.

Use default `Card` padding only for contained panels (forms, settings groups, stat tiles) — not table shells.

### Table data states (loading, empty, error)

All states render **inside** `CardContent className="p-0"` — replace the table surface, do not float messages outside the card.

| State | Pattern |
| --- | --- |
| **Loading** | Skeleton rows in `TableBody`; row count = `pagination.perPage` (stable height, less CLS) |
| **Empty** | Centered `typo-body` + `typo-caption` copy, or `Empty` component — no fake table rows |
| **Error** | Centered message + retry `Button`; hide pagination footer until data loads successfully |

```tsx
<CardContent className="p-0">
  {error ? (
    <div className="space-y-4 px-4 py-12 text-center md:px-6">
      <p className="typo-body text-muted-foreground">{error}</p>
      <Button variant="outline" onClick={() => void refetch()}>
        {t('retry')}
      </Button>
    </div>
  ) : (
    <UsersTable data={data} isLoading={isLoading} perPage={pagination.perPage} />
  )}
</CardContent>

{!error && pagination.total > 0 ? (
  <footer className="border-t border-border px-4 py-4 md:px-6">{/* pagination */}</footer>
) : null}
```

### Recommended file split (CRUD list)

Keep the page orchestrator thin; extract bands by responsibility:

| File | Owns |
| --- | --- |
| `*-page-content.tsx` | Page header, `Card` shell, pagination footer, dialogs |
| `*-filters-toolbar.tsx` | Unified/compact grid, debounced search, `ToolbarSelect`, conditional reset |
| `*-table.tsx` | Table headers, rows, skeletons, empty state, row actions |
| `*-badges.tsx` (optional) | Status/KYC badge mapping for table cells |

Naming convention: `features/<feature>/components/` (`<feature>-page-content.tsx`, `<feature>-filters-toolbar.tsx`, `<feature>-table.tsx`, `<feature>-badges.tsx`). No list feature is built in this repo yet — these are target file names, not existing files.

### Table row patterns

- **User/actor column:** `Avatar` + `AvatarImage` (when URL exists) + `AvatarFallback` (initials) — not raw `<img>`.
- **Status column:** semantic `Badge` variants — see `status-badge-rules.md`; extract repeated mappings to a small badge component.
- **Actions column:** `Button variant="ghost" size="icon"` with i18n `aria-label`s.
- **Scroll:** wrap `Table` in `custom-scrollbar overflow-x-auto`.

Naming convention: `features/<feature>/components/<feature>-page-content.tsx`, `<feature>-table.tsx`.

## Upload Pattern

Use image components for image-first workflows. Use file components for generic attachments.

```tsx
<Field className="gap-1">
  <FieldLabel className="text-muted-foreground" htmlFor="documents">
    Documents
  </FieldLabel>
  <FieldContent>
    <InputUploadFiles
      id="documents"
      accept=".pdf,.doc,.docx,image/*"
      maxFiles={5}
      maxSize={5 * 1024 * 1024}
      aria-invalid={Boolean(error) || undefined}
      onValueChange={setFiles}
      onFileReject={(file, reason) => {
        setError(
          reason === "size"
            ? `${file.name} is too large.`
            : `${file.name} was rejected.`
        )
      }}
    />
    {error ? (
      <p className="typo-caption text-destructive" role="alert">
        {error}
      </p>
    ) : (
      <p className="typo-caption text-muted-foreground">
        Max 5 files, up to 5 MB each.
      </p>
    )}
  </FieldContent>
</Field>
```

## Detail Pattern

Desktop can show two levels of hierarchy. Mobile should stack.

```tsx
<section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
  <div className="space-y-6">
    <header className="space-y-1">
      <h1 className="typo-heading-2 text-foreground">Order #1024</h1>
      <p className="typo-body text-muted-foreground">Created May 19, 2026.</p>
    </header>
    {/* Main content */}
  </div>
  <aside className="space-y-4">{/* Metadata/actions */}</aside>
</section>
```

## Dialog / Modal

Use SDK `Dialog` with `showCloseButton` on `DialogContent`. Keep header, body, and footer as distinct bands.

| Area | Rules |
| --- | --- |
| Header | `DialogHeader` + `DialogTitle` + `DialogDescription`; icon/badge row optional; title uses `typo-heading-3 pr-8 text-foreground`; `gap-3 px-6 py-5 text-left` |
| Body | Optional. Form fields in `px-6 py-4`; scroll with `min-h-0 flex-1` + `custom-scrollbar` when long |
| Footer | `DialogFooter` + `DialogClose` + actions; default button sizes; margin reset when `DialogContent` uses `p-0` (see below) |

### `DialogFooter` built-in styles

SDK `DialogFooter` already ships with:

`border-t bg-muted/50 rounded-b-xl p-4 … -mx-4 -mb-4`

For full-bleed modals (`p-0` on `DialogContent`), **only override margins and padding** — do not duplicate `border-t` / `bg-muted/50`:

```tsx
<DialogFooter className="m-0 -mx-0 -mb-0 shrink-0 flex-row justify-end gap-2 px-6 py-4">
  <DialogClose render={<Button variant="outline">Cancel</Button>} />
  <Button tone="destructive">Confirm</Button>
</DialogFooter>
```

### Form dialog (header + body + footer)

When a body band exists (e.g. textarea, inputs), separate header from body with **`border-b border-border`** on `DialogHeader`.

```tsx
<DialogContent showCloseButton className="flex max-h-[min(90vh,44rem)] w-[min(calc(100vw-2rem),28rem)] flex-col gap-0 overflow-hidden p-0">
  <DialogHeader className="gap-3 border-b border-border px-6 py-5 text-left">
    <div className="flex size-10 items-center justify-center rounded-full border border-border bg-muted">
      <Lock className="size-5 text-destructive" aria-hidden />
    </div>
    <DialogTitle className="typo-heading-3 mt-2 pr-8 text-foreground">Title</DialogTitle>
    <DialogDescription className="text-muted-foreground">Description</DialogDescription>
  </DialogHeader>

  <form className="flex min-h-0 flex-1 flex-col">
    <div className="px-6 py-4">{/* Field + Textarea */}</div>
    <DialogFooter className="m-0 -mx-0 -mb-0 shrink-0 flex-row justify-end gap-2 px-6 py-4">
      {/* actions */}
    </DialogFooter>
  </form>
</DialogContent>
```

- Mount form body with `{open && …}` so fields reset when the dialog closes.
- `Field className="gap-1"`, `FieldLabel className="text-muted-foreground"`.
- Destructive submit: `tone="destructive"` + `loading` on `Button`.

### Confirm-only dialog (header + footer, no body)

Use for unlock, delete confirm, or any action with **title + description only** — no fields between header and footer.

**Critical:** do **not** put `border-b` on `DialogHeader`. The footer’s built-in `border-t` is the only separator. If both borders are present with no body in between, the divider looks unnaturally thick (double line).

```tsx
<DialogContent showCloseButton className="flex … flex-col gap-0 overflow-hidden p-0">
  {/* No border-b — confirm-only */}
  <DialogHeader className="gap-3 px-6 py-5 text-left">
    <div className="flex size-10 items-center justify-center rounded-full border border-border bg-muted">
      <Unlock className="size-5 text-success" aria-hidden />
    </div>
    <DialogTitle className="typo-heading-3 mt-2 pr-8 text-foreground">Unlock account</DialogTitle>
    <DialogDescription className="text-muted-foreground">…</DialogDescription>
  </DialogHeader>

  <DialogFooter className="m-0 -mx-0 -mb-0 shrink-0 flex-row justify-end gap-2 px-6 py-4">
    <DialogClose render={<Button variant="outline">Cancel</Button>} />
    <Button tone="success">Confirm unlock</Button>
  </DialogFooter>
</DialogContent>
```

| Pattern | Header `border-b` | Footer separator |
| --- | --- | --- |
| Form dialog (has body) | Yes | Footer `border-t` (SDK default) |
| Confirm-only (no body) | **No** | Footer `border-t` only |

Prefer `AlertDialog` for centered destructive confirms when product does not need the full-bleed icon header — otherwise `Dialog` with the rules above.

### Rich description text (next-intl)

When bolding a name inside `DialogDescription`, use **`t.rich` with XML tags** in the message — not a function for `{name}`:

```json
"description": "Lock account of <bold>{name}</bold>?"
```

```tsx
t.rich('lock.description', {
  name: userName,
  bold: (chunks) => <strong className="font-medium text-foreground">{chunks}</strong>,
})
```

Plain `t('…', { name })` or `name: () => <strong>…</strong>` in `t.rich` will break or throw.

### Detail / before–after dialog (reference)

For large comparison modals (audit, JSON diff):

| Area | Rules |
| --- | --- |
| Body | `min-h-0 flex-1` scroll region; split columns with `grid md:grid-cols-2`; each column scrolls vertically (`overflow-y-auto` + `custom-scrollbar`) |
| JSON | `pre` with `overflow-x-auto` + `whitespace-pre` inside panel — not full-dialog horizontal scroll |
| Empty side | Centered dashed panel with `typo-body text-muted-foreground` — same min-height as JSON side |
| Panel title | Two lines: short label (`Before` / `After`) + `typo-caption` hint — avoid long `uppercase tracking-wider` strings |

```tsx
<DialogContent showCloseButton className="flex max-h-[min(90vh,44rem)] flex-col gap-0 overflow-hidden p-0">
  <DialogHeader className="gap-3 border-b border-border px-6 py-5 text-left">{/* badge, title, description */}</DialogHeader>
  <div className="grid min-h-0 flex-1 md:grid-cols-2">{/* equal columns */}</div>
  <DialogFooter className="m-0 -mx-0 -mb-0 shrink-0 flex-row justify-end gap-2 px-6 py-4">
    <DialogClose render={<Button variant="outline">Close</Button>} />
  </DialogFooter>
</DialogContent>
```

## Responsive Rules

- Mobile: one column, stacked actions, full-width controls only when needed.
- `sm`: allow toolbar rows and compact action groups.
- `md`/`lg`: introduce sidebars, summary/detail, and multi-column grids.
- Avoid hiding critical actions on mobile.
- Prefer CSS grid/flex and Tailwind breakpoints over JS-driven layout.

## Scroll Containers

Every explicit scroll container must include `custom-scrollbar`.

Apply it to custom containers with:

- `overflow-auto`
- `overflow-y-auto`
- `overflow-x-auto`
- `overflow-scroll`
- scrollable table/list/panel regions
- scrollable modal/sheet content areas

```tsx
<div className="custom-scrollbar max-h-80 overflow-y-auto">
  {/* long content */}
</div>
```

Do not add `custom-scrollbar` to non-scroll containers or the whole page by default. Use it where the component/layout creates a scrollable region.

## Spacing Audit

Before finishing, scan layout classes:

- Parent containers should use `space-y-*` or `gap-*`.
- Field labels should remain `gap-1`.
- Repeated items should use same padding and row height.
- CRUD table cards: `Card` root `p-0 gap-0`; band padding on toolbar/footer only (`px-4 md:px-6`).
- Buttons in one group should share size and variant hierarchy.
- Error/helper text should sit close to the control it explains.
- Any explicit scroll region should include `custom-scrollbar`.
