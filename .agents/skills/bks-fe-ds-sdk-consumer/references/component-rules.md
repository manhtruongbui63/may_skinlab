# Component Rules

Use this reference when building or reviewing UI with `@bks/ds-system-sdk` components.

## Imports

Prefer SDK components before custom controls:

```tsx
import { Button, Input, Card, CardContent } from "@bks/ds-system-sdk"
```

Subpath imports are also valid:

```tsx
import { Button } from "@bks/ds-system-sdk/button"
import { Input } from "@bks/ds-system-sdk/input"
```

Do not copy SDK source components into the consumer app.

## Component Size

SDK components that support `size` should use **`default`** in consumer apps unless a spec requires otherwise.

| Rule | Detail |
| --- | --- |
| Default | Omit `size` or pass `size="default"` |
| Same group | All controls in one toolbar, form row, or button group share the same `size` |
| Avoid | Using `size="sm"` by habit on filters, tables, or page chrome |
| Exceptions | `sm` / `xs` only for explicitly dense UI; `lg` for hero/emphasis; `icon` / `icon-sm` for icon-only buttons |

Common sized primitives:

- `Button` — `size="default"` for primary actions; `size="icon"` only for icon-only triggers with `aria-label`
- `SelectTrigger` — `size="default"` in filter bars and forms
- `InputGroup`, `DatePicker` — `size="default"`; match `InputGroup` size to adjacent `SelectTrigger`
- `Badge` — `size="default"` in tables and headers; `size="sm"` only when row density requires it (see `status-badge-rules.md`)
- `Calendar` inside popovers — `size="default"` unless space-constrained

```tsx
<Button variant="default">Save</Button>

<Select>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
</Select>

<DatePicker mode="range" />
```

## Color And Tokens

Use semantic classes:

- `bg-background`
- `text-foreground`
- `text-muted-foreground`
- `border-border`
- `bg-primary`
- `text-primary-foreground`
- `bg-muted`
- `text-destructive`
- `text-success`
- `text-warning`
- `text-info`

Avoid hardcoded hex colors in app UI. Use hardcoded colors only for exceptional assets such as illustrations or brand images.

## Buttons

Use SDK `Button` props before custom classes:

```tsx
<Button variant="default" tone="default" size="default">
  Save
</Button>

<Button variant="outline" tone="destructive">
  Delete
</Button>

<Button loading={isSaving}>
  Save changes
</Button>
```

Use tones for semantic intent:

- `default`
- `success`
- `warning`
- `info`
- `destructive`

Use variants for visual hierarchy:

- `default`
- `secondary`
- `outline`
- `ghost`
- `link`

## Card

Use default `Card` padding for **contained panels** (forms, settings groups, stat tiles).

When `Card` wraps a **CRUD table/list** (toolbar + table + pagination in one shell), strip root padding and gap:

```tsx
<Card className="overflow-hidden border-border p-0 gap-0">
  {/* toolbar band: px-4 py-3 md:px-6, border-b */}
  <CardContent className="p-0">{/* table */}</CardContent>
  {/* footer band: px-4 py-4 md:px-6, border-t */}
</Card>
```

- **`p-0 gap-0`** on `Card` — required for table shells; padding lives on toolbar/footer bands.
- **`overflow-hidden`** — clips table/header backgrounds to card radius.
- **`border-border`** — semantic border token; match other list cards.

See `layout-patterns.md` → **Table card shell**.

## Forms

Every interactive field needs an accessible label. Use `Field` composition for labeled inputs so label-to-control spacing is consistent. Helper and error text should use typography and semantic color separately.

```tsx
<Field className="gap-1">
  <FieldLabel className="text-muted-foreground" htmlFor="workspace-name">
    Workspace name
  </FieldLabel>
  <FieldContent>
    <Input
      id="workspace-name"
      value={name}
      onChange={(event) => setName(event.target.value)}
      aria-invalid={hasError || undefined}
      aria-describedby="workspace-name-message"
    />
    {hasError ? (
      <FieldError id="workspace-name-message">
        Workspace name is required.
      </FieldError>
    ) : (
      <FieldDescription id="workspace-name-message">
        Visible to members.
      </FieldDescription>
    )}
  </FieldContent>
</Field>
```

Do not uppercase `FieldLabel` by default. Input labels use `text-muted-foreground` by default.

### Password Fields

The SDK `Input` component does not have a built-in password visibility toggle. Implement it manually using a relative wrapper, local boolean state to switch the input `type` between `"password"` and `"text"`, and an absolute-positioned button with `Eye` / `EyeOff` from `lucide-react`:

```tsx
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@bks/ds-system-sdk";

// Inside component:
const [showPassword, setShowPassword] = useState(false);

<div className="relative">
  <Input
    type={showPassword ? "text" : "password"}
    className="pr-10"
    {...register("password")}
  />
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      setShowPassword(!showPassword);
    }}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    aria-label={showPassword ? "Hide password" : "Show password"}
  >
    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
  </button>
</div>
```

### Form control width in grid layouts

When placing `Select` (or similar) in a multi-column form grid, stretch to full cell width:

```tsx
<Select className="w-full">
  <SelectTrigger className="w-full! min-w-0">
    <SelectValue />
  </SelectTrigger>
</Select>
```

Apply `w-full` to **both** the `Select` root and `SelectTrigger` — trigger-only `w-full` does not expand `inline-flex w-fit` select roots in CSS Grid.

## Upload Components

Pick the upload primitive by payload shape:

| Need | Component | Controlled prop | Notes |
| --- | --- | --- | --- |
| One image | `InputUploadImage` | `value?: string | null` | Best when image preview is the main UI. |
| Many images | `InputUploadImages` | `values?: string[]` | Grid preview for gallery/product photos. |
| One file | `InputUploadFile` | `value?: InputUploadFileItem | null` | Generic file, with selected row below dropzone. |
| Many files | `InputUploadFiles` | `values?: InputUploadFilesItem[]` | Generic file list, one row per file below dropzone. |

Upload components are field primitives. They own dropzone UI, browse trigger, preview/list rows, remove controls, disabled state, and invalid visuals. Consumer code owns label, helper text, error text, upload transport, server persistence, and validation messages.

Use `accept`, `maxSize`, and `maxFiles` for client-side constraints. Handle reject reasons with `onFileReject`:

```tsx
import {
  Field,
  FieldContent,
  FieldLabel,
  InputUploadFiles,
  type InputUploadFilesItem,
} from "@bks/ds-system-sdk"

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
      values={files}
      aria-invalid={Boolean(error) || undefined}
      onValueChange={(items: InputUploadFilesItem[]) => {
        setFiles(items)
        setError("")
      }}
      onFileReject={(file, reason) => {
        setError(
          reason === "max-files"
            ? `Max 5 files. ${file.name} was skipped.`
            : reason === "size"
              ? `${file.name} is larger than 5 MB.`
              : `${file.name} is not an accepted file type.`
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

Existing server files should use metadata, not fake `File` objects:

```tsx
const existingFiles: InputUploadFilesItem[] = [
  {
    file: null,
    name: "contract.pdf",
    size: 842240,
    url: "/files/contract.pdf",
  },
]
```

Generic file components can render thumbnails for image files and file icons for non-image files. Use image-specific components when the uploaded value is specifically media and visual preview is the product expectation.

## Overlays

Use SDK overlay primitives instead of custom z-index shells:

- Dialog for modal decisions and forms.
- Sheet or Drawer for side panels and mobile panels.
- Popover for lightweight contextual content.
- Tooltip for short non-interactive hints.

### Dialog quick rules

- **`DialogContent`:** `showCloseButton`, `p-0 gap-0 overflow-hidden` for full-bleed header/body/footer bands.
- **`DialogFooter`:** SDK already applies `border-t bg-muted/50 rounded-b-xl`. With `p-0` content, reset only `m-0 -mx-0 -mb-0` and set `px-6 py-4` — do not re-add border/background classes.
- **Confirm-only dialog** (header + footer, no body): omit `border-b` on `DialogHeader` to avoid a thick double line with the footer’s `border-t`. See `layout-patterns.md` → **Confirm-only dialog**.
- **Form dialog** (body with fields): keep `border-b border-border` on header.
- **Icon circle in header:** `size-10 rounded-full border border-border bg-muted`; use `text-destructive` / `text-success` — no hardcoded palette (e.g. `emerald-*`).
- **`DialogDescription`:** SDK bakes in `typo-body`; add only `text-muted-foreground`, do not stack another `typo-body`.

## Icons

Use the consumer app's existing icon library when available. Size icons with SDK component conventions and utility classes:

```tsx
<Button size="icon" aria-label="Open settings">
  <SettingsIcon className="size-4" aria-hidden="true" />
</Button>
```

Decorative icons should use `aria-hidden="true"`. Icon-only buttons need an accessible label.

## Verification

Read the consumer project's `package.json` before running checks. Run only scripts that exist.

Common commands:

```bash
pnpm run lint
pnpm run typecheck
pnpm run build
```

If the project has no typecheck script, use its build script as the TypeScript gate when appropriate.
