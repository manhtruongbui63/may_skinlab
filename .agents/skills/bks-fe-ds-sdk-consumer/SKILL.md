---
name: bks-fe-ds-sdk-consumer
description: Use when working in a consumer project that installs or uses @bks/ds-system-sdk for UI components, styles, typography utilities, semantic design tokens, or product layouts composed from SDK components. Guides setup, imports, component usage, layout composition, spacing, responsive structure, typography roles, accessibility, and verification without editing the SDK source repo.
---

# BKS DS SDK Consumer

Use this skill when a user asks to install, wire, style with, build UI from, compose layouts with, or review usage of `@bks/ds-system-sdk` in a consumer app.

## ⚠️ MANDATORY: Read ALL References Before Any Work

**Do NOT write code or answer UI questions until you have read every file below.**
Do not skip files or apply "when X" filtering — read all unconditionally when this skill is invoked.

Read in order:

1. `references/setup.md`
2. `references/typography.md`
3. `references/component-rules.md`
4. `references/layout-patterns.md`
5. `references/filter-toolbar-layout.md`
6. `references/pagination-layout.md`
7. `references/status-badge-rules.md`
8. `references/component-detection-rules.md`
9. `references/wireframe-rules.md`

**Only after reading all 9 files**, proceed with the task.

## Workflow

After reading all references above:

1. Prefer SDK exports over custom controls or copied source components.
2. Do not modify the SDK source repo as part of consumer app work.
3. Discover verification scripts from the consumer project's `package.json` before running checks.

## Component Size (Default)

When an SDK component exposes a `size` prop, **use `default`** unless the screen or product spec explicitly needs another size.

- **Do:** omit `size` (rely on component default) or set `size="default"` on `Button`, `SelectTrigger`, `InputGroup`, `DatePicker`, `Badge`, `Calendar`, and other sized primitives.
- **Do not:** default to `size="sm"` or `size="xs"` for “compact toolbars” or tables without an explicit density requirement.
- **Exceptions only:** use `sm` / `xs` / `lg` / `icon` when wireframe, UX spec, or a reference doc in this skill (e.g. dense metadata badge) calls for it — and keep that size consistent within the same control group on one screen.

See `references/component-rules.md` for examples.

## Layout Composition Rules

- Identify screen type before code: form, list, detail, dashboard, settings, upload/import, modal/sheet, or mixed.
- Define hierarchy before picking components: page title, description, primary action, content sections, secondary actions, state area.
- Use full-width page bands or unframed sections for page structure. Use cards for repeated items, contained panels, or modal-like surfaces.
- Do not nest cards inside cards.
- Keep operational tools quiet, scannable, and efficient; avoid marketing-style hero/card-heavy layouts.
- Use `gap-1` for label-to-input distance, `gap-2` for tight control groups, `gap-3`/`gap-4` for field groups/card content, `gap-6` for page sections, and `gap-8` for major page blocks.
- Mobile should stack into one column. Use split panes, side metadata, or multi-column grids only when viewport supports it.
- CRUD list filters belong in a **toolbar**, not a vertical form stack; see `references/filter-toolbar-layout.md` for responsive patterns (inline bar on `md+`, grid or sheet on small screens).
- **Compact filter bar (search + 2 selects):** prefer `lg:grid-cols-6` with capped control widths — see `filter-toolbar-layout.md` → **Strategy A — Compact**.
- **Clear-filters button:** render only when filters are active; **do not** use a hidden grid spacer (causes an empty second row on mobile/tablet).
- **Card wrapping a CRUD table/list:** use `className="overflow-hidden border-border p-0 gap-0"` on `Card` so toolbar, table, and pagination share one flush surface; pad individual bands (toolbar/footer `px-4 md:px-6`, `border-b` / `border-t`) — not the card root. See `references/layout-patterns.md` → **Table card shell**.
- **Confirm-only dialogs** (title + description + actions, no body): omit `border-b` on `DialogHeader`; rely on `DialogFooter`'s built-in `border-t` only. See `layout-patterns.md` → **Confirm-only dialog**.
- Add `custom-scrollbar` to every explicit scroll container (`overflow-auto`, `overflow-y-auto`, `overflow-x-auto`, `overflow-scroll`, scrollable table/list/panel areas).

## Component Detection Rules

- Before converting HTML/mockups, scan the UI intent and map each raw element to the most specific SDK component.
- Do not use `Input` for date fields when `DatePicker` fits the intent.
- Do not render image/name initials manually when `Avatar`, `AvatarImage`, or `AvatarFallback` fits the intent.
- Do not leave native `<select>`/custom dropdowns when `Select`, `NativeSelect`, or `Combobox` fits the interaction.
- Do not use manual absolute positioning/padding hacks (`absolute left-3`, `pl-9`) for inputs with prefix/suffix icons when `InputGroup` fits the layout.
- Do not leave status text as plain spans when `Badge` fits the semantics.
- Prefer specific upload components over raw file inputs.
- Only fall back to plain HTML/custom composition when no SDK component matches or product behavior requires custom logic.
- Preserve `custom-scrollbar` on all scrollable custom containers when converting HTML.

## Form Field Rules

- Keep `Input`, `InputGroup`, `InputNumber`, `InputUploadFile`, `InputUploadFiles`, `InputUploadImage`, and `InputUploadImages` as primitives. Do not add `label`, helper text, or error props to them.
- Compose labeled inputs with `Field`, `FieldLabel`, and `FieldContent`.
- Use `className="gap-1"` on `Field` for the standard label-to-input distance.
- Do not uppercase `FieldLabel` by default.
- For input labels, use `FieldLabel className="text-muted-foreground"` by default.
- For password inputs, the SDK does not provide a built-in visibility toggle. Implement it manually using a relative wrapper around `Input` (toggling between `type="password"` and `type="text"`) and an absolute-positioned button containing `Eye` / `EyeOff` icons.

## Upload Component Rules

- Use `InputUploadImage` for one image; use `InputUploadImages` for many images.
- Use `InputUploadFile` for one generic file; use `InputUploadFiles` for many generic files.
- Do not merge single and multi upload behavior into one consumer wrapper unless product requirements explicitly need it.
- Upload components own dropzone UI, browse trigger, preview/list rows, remove controls, disabled state, and invalid state.
- Consumer code owns labels, helper text, error text, upload transport, server persistence, and validation messages.
- Use `accept`, `maxSize`, and `maxFiles` before custom validation where possible.
- Handle `onFileReject` and render rejection copy outside the component with `typo-caption text-destructive`.
- Existing server files should use metadata (`file: null`, `name`, `size`, `url` or preview URL), not fake `File` objects.
- Generic file upload rows may show image thumbnails for image files and file icons for non-image files.

## Badge And Status Rules

- Choose Badge `variant` from status meaning, not visual preference.
- Keep status-to-variant mapping consistent within the same page or workflow.
- When converting HTML with plain status text and no color, infer semantic variant from text.
- If meaning is ambiguous or domain-specific, use neutral style or ask for mapping when business impact is high.
- **Do not manually override SDK Badge styles with solid utility classes** (e.g. `className="bg-success text-success-foreground"`). Rely on built-in semantic variants (`success`, `warning`, `secondary`) for soft pastel contrast.

## Boundaries

- Do not add new SDK components.
- Do not edit `src/components/ui/*`, `src/sdk/index.ts`, `tsup.sdk.config.ts`, or package exports in this design-system repo.
- Do not publish or version `@bks/ds-system-sdk`.
- If the consumer needs a missing component, tell the user that SDK source work is a separate task.
