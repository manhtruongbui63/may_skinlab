# Pagination Layout Rules (CRM/HRM)

Use when building, styling, or reviewing table/list pagination with `@bks/ds-system-sdk`.

See also `layout-patterns.md` → **Table card shell** for card wrapper rules.

## 1. Structure: The 3-Block Layout

On desktop (`lg+`), the pagination footer uses three blocks:

```
[ Left: summary ] <---- flex-1 ----> [ Center: rows per page ] <--- gap-6 ---> [ Right: page nav ]
```

### Left block — summary

- Current range and total (e.g. `1–5 / 15`).
- **Styling:** `typo-body text-muted-foreground` — do not add redundant `text-sm` / `text-xs`.
- **Mobile:** shorten copy if needed; hide unit suffix with `hidden sm:inline`.

### Center block — rows per page

- Format: label + compact `Select` (`w-20` or `w-[64px]`–`w-[72px]`).
- **Styling:** quiet; `size="default"` on trigger.

### Right block — navigation

- `Pagination` + `PaginationContent` (SDK uses `flex-nowrap` — keep ellipsis and page numbers in **separate** `PaginationItem` nodes).
- **Priority:** highest; align right on desktop, center on mobile if stacked.

---

## 2. Interactive Element Rules

### Button sizing

- **Desktop:** `size-8` / `size-9` on page links (SDK pagination defaults).
- **Mobile:** minimum `size-11` (44px) touch target when customizing.
- **Gap:** `gap-1.5 md:gap-2` inside `PaginationContent`.

### States

- **Active page:** `PaginationLink isActive` — do not add shadow/glow.
- **Disabled prev/next:** `pointer-events-none opacity-50` on first/last page.

### Ellipsis + page number (critical)

Never put `PaginationEllipsis` and `PaginationLink` in the **same** `PaginationItem` — the `<li>` is not a flex row and they stack vertically.

```tsx
// ✅ Separate items
{items.map((item, index) =>
  item === 'ellipsis' ? (
    <PaginationItem key={`ellipsis-${index}`}>
      <PaginationEllipsis />
    </PaginationItem>
  ) : (
    <PaginationItem key={item}>
      <PaginationLink isActive={item === page} ...>{item}</PaginationLink>
    </PaginationItem>
  )
)}
```

---

## 3. Responsive Page Numbers (mobile)

Do not show full page ranges on narrow screens (avoid `< 1 2 3 4 5 6 7 8 >`).

Use a dynamic window: current page ± adjacent pages, with ellipses for gaps. Hide outer numbers on mobile with responsive classes when product requires tighter nav.

---

## 4. Card Integration (table shell)

When pagination lives inside a **table card shell** (`Card` with `p-0 gap-0`):

```tsx
<footer className="flex flex-col gap-4 border-t border-border px-4 py-4 md:px-6 sm:flex-row sm:items-center sm:justify-between">
  {/* summary | rows per page | Pagination */}
</footer>
```

- Footer owns **all** horizontal and vertical padding — not the `Card` root.
- Use `border-t border-border` to separate from table.
- Match toolbar horizontal padding: `px-4 md:px-6`.

Do **not** use only `px-4 pt-4` without `py-4` on this footer pattern — the table shell has no default card bottom padding.

---

## 5. Loading and Skeleton Rules

### Skeleton row count

```typescript
Array.from({ length: pagination.perPage })
```

Use `perPage` (or a stable default) so table height does not shift between pages (CLS).

### Lock controls while loading

```tsx
className={isLoading ? 'pointer-events-none opacity-50' : undefined}
```

Apply to prev/next, page links, and rows-per-page `Select` during fetch.

---

## 6. When to show pagination footer

Hide the footer when:

- API returned an **error** (retry UI lives in `CardContent` instead), or
- `total === 0` (empty state replaces the table).

Show footer when `!error && total > 0`.

Naming convention: `features/<feature>/components/<feature>-page-content.tsx` (no list feature exists in the repo yet).
