# Toolbar integration

Filter toolbars (`*-filters-toolbar.tsx`) stay **controlled components**. URL sync lives in the hook; toolbar only calls `onChange`.

Target shape: `features/<feature>/components/<feature>-filters-toolbar.tsx` (naming convention — no
list feature exists in the repo yet).

## Search debounce

Keep local `searchDraft` for responsive typing; commit to URL after debounce:

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

**300ms** is the project default (matches existing toolbars).

## Sync draft from URL (Back/Forward / reload)

When `filters.search` changes from URL navigation, update `searchDraft` **only when the search input is not focused** — preserves smooth typing while debounce is in flight.

```tsx
const searchInputRef = useRef<HTMLInputElement>(null)
const [searchDraft, setSearchDraft] = useState(filters.search ?? '')

useEffect(() => {
  if (searchInputRef.current === document.activeElement) return
  setSearchDraft(filters.search ?? '')
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional external sync
}, [filters.search])

<InputGroupInput ref={searchInputRef} value={searchDraft} ... />
```

**Do not** remount the toolbar with `key={filters.search}` (or a composite key including search). That remounts after debounce commits, steals focus, and causes input stutter.

Select filters are controlled directly from `filters` (URL); no local draft needed.

## Select filters

Select changes call `onChange` **immediately** (no debounce). Hook writes URL on same tick.

Map `"all"` select value to `undefined` in filter object — never write `"all"` to URL.

## Reset button (canonical)

**Default for all list filter toolbars** — apply this reset pattern in
`features/<feature>/components/<feature>-filters-toolbar.tsx`.

- Render **only when** `hasActiveFilters` is true (conditional mount — no disabled placeholder).
- DS `Button`: `variant="ghost"`, `tone="destructive"`.
- Icon: `Trash2` from `lucide-react` before label (`size-4`, `aria-hidden`).
- Label: `t('filters.reset')` (feature namespace).
- Grid placement: `col-span-2 w-full justify-center md:col-span-1 lg:col-span-1 lg:max-w-[9rem]`.

```tsx
import { Trash2 } from 'lucide-react'

const handleReset = () => {
  setSearchDraft('')
  onChange({ search: undefined, status: undefined, kyc: undefined })
  // clear every synced filter key for this surface
}

{hasActiveFilters ? (
  <Button
    type="button"
    variant="ghost"
    tone="destructive"
    className="col-span-2 w-full justify-center md:col-span-1 lg:col-span-1 lg:max-w-[9rem]"
    onClick={handleReset}
  >
    <Trash2 className="size-4" aria-hidden />
    {t('filters.reset')}
  </Button>
) : null}
```

Hook clears URL filter keys and resets `page` to 1. Do **not** use `variant="outline"` for reset unless product explicitly overrides.

## What toolbar must NOT do

- Import `useRouter` or `useSearchParams`
- Build query strings
- Call `router.replace` directly

## Page with submit button (legacy)

Remove "Search" submit buttons when adopting URL sync — debounced auto-apply replaces manual submit.

If product requires explicit submit (rare), debounce still applies on submit only; document deviation in plan.

## i18n

Toolbar strings unchanged. URL params are not translated.

## Accessibility

Keep `role="search"` and `aria-label={t('filters.ariaLabel')}` on toolbar container.

Search input `aria-label` uses search placeholder key.
