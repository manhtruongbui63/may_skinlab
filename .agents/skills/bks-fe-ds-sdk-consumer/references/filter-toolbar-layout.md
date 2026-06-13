# Filter Toolbar Layout

Use this reference when building **CRUD list filter bars** (search + date range + selects) with `@bks/ds-system-sdk`. Read `layout-patterns.md` first for overall CRUD page structure.

## When This Applies

| Context | Use filter toolbar rules | Use form `Field` rules instead |
| --- | --- | --- |
| List/table page: filter before data | Yes | No |
| Create/edit/settings form | No | Yes |
| Modal with 1–2 filters only | Compact toolbar or inline row | Rarely full form stack |
| 5+ independent filters, no cascade | Yes (patterns below) | No |

**Intent:** filters are **operational tools** — scannable in one glance, same row height, minimal vertical footprint. They are not data-entry forms.

## Toolbar vs Form (Critical)

| | Filter toolbar | Form field |
| --- | --- | --- |
| Visible label above control | Avoid; use `sr-only` / `aria-label` | Yes (`FieldLabel`) |
| `Field` wrapper | Do not stack 5+ `Field` blocks with visible labels | Required per input |
| Control width | Equal grid columns; `w-full min-w-0` in cells | Often full width in column |
| Vertical rhythm | Planned CSS grid rows | `space-y-4` field stack |
| `SelectTrigger` | `size="default"` (or omit), `w-full min-w-0`, `truncate` on value | `w-full` acceptable |
| Clear filters `Button` | Omit `size` (`default`, `h-8`) — same height as peers | N/A |

**Anti-pattern:** five filters as `Field` + visible `FieldLabel` → vertical form, not toolbar.

**Anti-pattern:** `flex flex-wrap` with mixed `min-w-*` → orphan control on row 2. Use **CSS grid**.

**Anti-pattern:** search in one row, selects in another with dividers — use **one unified grid** inside the toolbar band.

**Anti-pattern:** `lg:flex lg:justify-between` with search `max-w-[280px]` — search shrinks when reset appears.

**Anti-pattern:** `h-9` / `size="sm"` on clear button while search/selects use default `h-8`.

## Choose a Layout Strategy

| Toolbar | Strategy | When |
| --- | --- | --- |
| Search + 2 selects (no date) | **A — Compact** (6-col grid) | Users, simple CRM lists |
| Search + 3–4 selects (no date) | **A — Unified responsive grid** | Default for most list pages |
| Search + date + 4+ selects | **B — Dense A1 / A2 / B** | Audit logs, heavy filter bars |
| Many filters on phone | **C — Sheet / popover** (optional) | >4 selects, tight mobile UX |

Prefer **one responsive grid container** at all breakpoints. Separate DOM trees per breakpoint (`md:hidden`, `hidden lg:grid`) only when product explicitly requires it.

### Critical rules (all strategies)

- **No visible filter title** in compact toolbars (`Lọc theo:` wastes width). Use `role="search"` + `aria-label` on the grid.
- **Modest column count** so controls wrap cleanly instead of cramming one row.
- **Conditional reset only:** show the clear-filters `Button` when `hasActiveFilters`; **do not** render a hidden placeholder cell in the grid. A spacer (`col-span-2 h-8` with `aria-hidden`) reserves a grid row and leaves a visible empty band below the controls on mobile/tablet when no filters are active. A small layout shift when reset appears is acceptable.

**Anti-pattern:** hidden reset spacer in a responsive grid → phantom second row (see Strategy A — Compact).

---

## Strategy A — Unified Responsive Grid (default)

`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3`

Example: Search + DatePicker + 4 Selects + Clear (7 controls):

| Control | col-span |
| --- | --- |
| Search (`InputGroup`) | `col-span-2` (all breakpoints) |
| DatePicker | `col-span-2 md:col-span-1 lg:col-span-1` |
| Each select | `col-span-1` |
| Clear (when active) | `col-span-2 md:col-span-1 lg:col-span-1` |

```tsx
<div
  className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"
  role="search"
  aria-label={t('filters.ariaLabel')}
>
  <div className="col-span-2 md:col-span-2 lg:col-span-2">
    <InputGroup className="w-full bg-background">
      <InputGroupAddon>
        <SearchIcon className="size-4 text-muted-foreground" aria-hidden />
      </InputGroupAddon>
      <InputGroupInput placeholder={t('searchPlaceholder')} aria-label={t('searchPlaceholder')} />
    </InputGroup>
  </div>

  <Select className="w-full min-w-0">
    <SelectTrigger className="w-full! min-w-0" aria-label={t('filters.status')}>
      <SelectValue className="truncate">{selectedStatusLabel}</SelectValue>
    </SelectTrigger>
    <SelectContent className="custom-scrollbar">{/* items */}</SelectContent>
  </Select>

  {hasActiveFilters ? (
    <Button variant="outline" className="col-span-2 w-full justify-center md:col-span-1 lg:col-span-1">
      {t('filters.reset')}
    </Button>
  ) : null}
</div>
```

For **search + 2 selects only**, use Strategy A — Compact below instead of this 4-column grid.

### Control height alignment

SDK toolbar controls at `size="default"` → **`h-8`**:

| Control | Height |
| --- | --- |
| `InputGroup` | `h-8` |
| `SelectTrigger` | `h-8` |
| `Button` | `h-8` |

Omit `size` on clear button. Do not add `h-9` / `h-7` utilities.

---

## Strategy A — Compact (search + 2 selects)

Use when the toolbar has **only search + two selects** (no date range). A 4-column desktop grid makes each control too wide (~50% for search, ~25% per select). Prefer a **6-column grid** with **max-width caps** on `lg+`.

### Grid

`grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6`

| Control | col-span | Width cap (lg+) |
| --- | --- | --- |
| Search (`InputGroup`) | `col-span-2` | `lg:max-w-sm` on input group |
| Each select | `col-span-1` | `lg:max-w-[11rem]` on wrapper |
| Clear (when active) | `col-span-2 md:col-span-1 lg:col-span-1` | `lg:max-w-[9rem]` |

### Layout by breakpoint

| Breakpoint | Rows (no reset) | Rows (with reset) |
| --- | --- | --- |
| `< md` (2 col) | search → status + kyc | + reset full width |
| `md` (4 col) | search(2) + status(1) + kyc(1) one row | reset wraps to row 2 |
| `lg+` (6 col) | search(2) + status(1) + kyc(1) one row | + reset(1) same or next row |

Place `col-span` on **wrapper `div`s**, not on `Select` root, so grid placement is reliable.

### Reset button — no spacer

```tsx
{hasActiveFilters ? (
  <Button
    type="button"
    variant="outline"
    className="col-span-2 w-full justify-center md:col-span-1 lg:col-span-1 lg:max-w-[9rem]"
    onClick={handleReset}
  >
    {t('filters.reset')}
  </Button>
) : null}
```

Do **not** add an `else` branch with an empty `div` spacer — it creates a blank row when filters are at default.

### Debounced search

Keep filter state in the hook; debounce in the toolbar with local draft state (~300ms) so typing does not refetch on every keystroke:

```tsx
const [searchDraft, setSearchDraft] = useState(filters.search ?? '')

useEffect(() => {
  const timer = window.setTimeout(() => {
    const normalized = searchDraft.trim()
    const current = filters.search?.trim() ?? ''
    if (normalized !== current) {
      onChange({ search: normalized || undefined })
    }
  }, 300)
  return () => window.clearTimeout(timer)
}, [searchDraft, filters.search, onChange])
```

Clear `searchDraft` in the reset handler alongside `onChange({ search: undefined, … })`.

### Full example (compact)

```tsx
<div className="border-b border-border px-4 py-3 md:px-6 md:py-4">
  <div
    className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6"
    role="search"
    aria-label={t('filters.ariaLabel')}
  >
    <div className="col-span-2 md:col-span-2 lg:col-span-2">
      <InputGroup className="w-full max-w-none bg-background lg:max-w-sm">
        <InputGroupAddon>
          <Search className="size-4 text-muted-foreground" aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
        />
      </InputGroup>
    </div>

    <div className="col-span-1 lg:max-w-[11rem]">
      <ToolbarSelect /* status */ />
    </div>

    <div className="col-span-1 lg:max-w-[11rem]">
      <ToolbarSelect /* kyc */ />
    </div>

    {hasActiveFilters ? (
      <Button variant="outline" className="col-span-2 w-full justify-center md:col-span-1 lg:col-span-1 lg:max-w-[9rem]">
        {t('filters.reset')}
      </Button>
    ) : null}
  </div>
</div>
```

Naming convention: `features/<feature>/components/<feature>-filters-toolbar.tsx` (no list feature exists in the repo yet).

---

## Strategy B — Dense Toolbar (date + 4+ selects)

| Viewport | Pattern | Layout |
| --- | --- | --- |
| `< md` | **B** | 2-col grid; date `col-span-2`; selects 2×2 |
| `md` – `lg` | **A2** | Row 1: label + date; row 2: `grid-cols-2` selects |
| `lg+` | **A1** | One grid row: label \| date \| 4 equal select columns |

### Pattern B — Mobile (`< md`)

```tsx
<div className="grid grid-cols-2 gap-2 md:hidden">
  <div className="col-span-2">
    <DateRangePicker className="w-full min-w-0" />
  </div>
  <ToolbarSelect triggerClassName="w-full min-w-0" />
  {/* ×3 more */}
</div>
```

### Pattern A2 — Tablet (`md`, below `lg`)

```tsx
<div className="hidden flex-col gap-2 md:flex lg:hidden">
  <div className="flex min-w-0 items-center gap-2">
    <DateRangePicker className="min-w-0 flex-1" />
  </div>
  <div className="grid grid-cols-2 gap-2">
    {/* four ToolbarSelect, w-full min-w-0 */}
  </div>
</div>
```

### Pattern A1 — Desktop (`lg+`)

```tsx
<div
  className="hidden lg:grid lg:grid-cols-[auto_minmax(13rem,1.25fr)_repeat(4,minmax(0,1fr))] lg:items-center lg:gap-2"
  role="search"
  aria-label={t('filters.ariaLabel')}
>
  <DateRangePicker className="w-full min-w-0" />
  <ToolbarSelect triggerClassName="w-full min-w-0" />
  {/* ×3 more */}
</div>
```

Naming convention: `features/<feature>/components/<feature>-filters.tsx` (illustrative — not an existing file).

### Pattern C — Collapsible (optional)

Search + `Button variant="outline"` (“Filters”) + badge; filters in `Sheet` / `Popover` with `Field` labels OK inside panel.

---

## Composing SDK Controls

### Search

- Inside unified grid: `w-full`; **debounce ~300ms** in toolbar (local draft) or hook before calling `setFilters`.
- Prefer `InputGroup` + icon addon — see `component-detection-rules.md`.
- Compact toolbars: cap search width on desktop (`lg:max-w-sm`) so it does not stretch across half the viewport.

### Select filters

- `SelectContent className="custom-scrollbar"`.
- **Grid stretch (critical):** SDK `Select` root is `inline-flex w-fit`. Set `className="w-full min-w-0"` on **both** `Select` and `SelectTrigger` (`w-full! min-w-0`).
- **Label display:** pass resolved label as `SelectValue` children until menu opens — raw `value` (e.g. `all`) may show otherwise.
- **Truncate:** `SelectValue className="truncate"`.
- No visible `FieldLabel`; use `aria-label` on trigger.

```tsx
function ToolbarSelect({ ariaLabel, value, onValueChange, options, triggerClassName }) {
  const selectedLabel = options.find((o) => o.value === value)?.label
  return (
    <Select className="min-w-0 w-full" value={value} onValueChange={onValueChange}>
      <SelectTrigger className={triggerClassName} aria-label={ariaLabel}>
        <SelectValue className="truncate" placeholder={ariaLabel}>
          {selectedLabel}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="custom-scrollbar">{/* items */}</SelectContent>
    </Select>
  )
}
```

### Date range

- Prefer SDK `DatePicker mode="range"`.
- Toolbar: `w-full min-w-0`; truncate long date strings.

### NativeSelect

- Avoid in primary filter bars when `Select` fits.

## Optional enhancements

- **Active filter chips** below bar when filters ≠ default.
- **Reset** `Button variant="outline"` at grid end; show only when filters are active (no hidden spacer).

## Anti-patterns (filter grid)

| Anti-pattern | Why it fails |
| --- | --- |
| Hidden reset spacer (`div` with `col-span-*` + `aria-hidden`) | Reserves a grid row → blank band below controls when no filters active |
| `flex flex-wrap` + mixed `min-w-*` on filters | Orphan controls wrap unpredictably |
| `lg:grid-cols-4` for search + 2 selects only | Search ~50% width, selects too wide on desktop |
| Spacer “to prevent layout shift” in compact 3-control toolbars | Shift on reset appear is minor; empty row is worse UX |

## Placement in CRUD Layout

Inside the **table card shell** (`Card className="overflow-hidden border-border p-0 gap-0"`):

1. Filter toolbar band — `border-b border-border px-4 py-3 md:px-6 md:py-4`
2. Table — `CardContent className="p-0"` + `custom-scrollbar overflow-x-auto`
3. Pagination footer — `border-t px-4 py-4 md:px-6` — see `pagination-layout.md`

See `layout-patterns.md` → **Table card shell**.

## Breakpoint Cheat Sheet

| Breakpoint | Strategy A (default) | Strategy A — Compact (search + 2 selects) | Strategy B (dense) |
| --- | --- | --- | --- |
| `< md` | 2-col unified grid | 2-col; search `col-span-2` | Pattern B |
| `md` – `lg` | 3-col unified grid | 4-col; one row when 3 controls | Pattern A2 |
| `lg+` | 4-col unified grid | **6-col** + `max-w-*` caps | Pattern A1 |
| Avoid | `flex-wrap` + fixed `sm:w-48` | Hidden reset spacer (empty row) | Accidental orphan wraps |

## Accessibility

- Filter region: `role="search"` + `aria-label`
- Controls without visible labels: `aria-label` or `sr-only`
- Tab order matches visual order

## Review Checklist

- [ ] Table list: `Card className="overflow-hidden border-border p-0 gap-0"` + `CardContent className="p-0"`
- [ ] Toolbar + pagination footer: `px-4 md:px-6`
- [ ] Single unified grid (Strategy A), compact 6-col variant (search + 2 selects), or intentional dense breakpoints (Strategy B)
- [ ] No visible filter title in compact toolbar
- [ ] No orphan wrap row; no split search/filter bands on desktop
- [ ] No hidden reset spacer — conditional reset button only
- [ ] Search debounced (~300ms) when wired to server fetch
- [ ] `Select` + `SelectTrigger` both `w-full min-w-0` in grid cells
- [ ] `SelectValue` shows human label + `truncate`
- [ ] Clear button: default size (`h-8`); **no** placeholder cell when hidden
- [ ] Scrollable menus: `custom-scrollbar`
- [ ] Pagination: separate `PaginationItem` per ellipsis and page number

## Related References

- `layout-patterns.md` — CRUD list + table card shell
- `pagination-layout.md` — footer layout
- `component-rules.md` — `Field` / `Card`
- `component-detection-rules.md` — `InputGroup`, wireframe mapping
- `wireframe-rules.md` — spacing from mockups
