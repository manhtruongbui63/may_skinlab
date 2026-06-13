# Component Detection Rules

Use this reference before converting HTML/mockups or replacing raw controls with `@bks/ds-system-sdk` components.

## Core Rule

Always map by intent, not by source tag.

HTML like `<input type="text">` may represent a date picker, search field, currency field, OTP, upload trigger, or plain text input. Infer from label, placeholder, name/id, nearby icon, data shape, and surrounding copy.

Before implementing, create a quick mental inventory:

1. What user task is this screen doing?
2. Which fields are dates, numbers, selects, statuses, avatars, uploads, tables, or overlays?
3. Which SDK component is the most specific match?
4. Which raw elements should remain plain HTML because no SDK primitive fits?

## High-Priority Mappings

| Source signal | Prefer SDK component | Avoid |
| --- | --- | --- |
| label/name/id includes `date`, `dob`, `birthday`, `from`, `to`, `start`, `end`, `ngày`, `từ ngày`, `đến ngày` | `DatePicker` | `Input type="text"` or manual calendar |
| date range, start/end date pair, booking period | `DatePicker` range mode if supported by local API | two unrelated text inputs |
| user/customer/member profile image, initials, assignee, author | `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarGroup` | manual rounded div/img |
| short status text: Paid, Pending, Active, Failed, Đã duyệt, Chờ xử lý | `Badge` with semantic `variant` | plain colored span |
| upload file/image, choose file, drag/drop, attachment, gallery | `InputUploadFile`, `InputUploadFiles`, `InputUploadImage`, `InputUploadImages` | raw `<input type="file">` |
| numeric amount, quantity, percentage, count | `InputNumber` when editable | text input |
| OTP, verification code, one-time password | `InputOTP` | many separate inputs |
| input with prefix/suffix icon, text, or action button (e.g. search icon overlay) | `InputGroup` + `InputGroupAddon` + `InputGroupInput` / `InputGroupButton` | `relative` + absolute icon overlays (`absolute left-3`, `pl-9`) |
| fixed short options | `Select` or `NativeSelect` | custom dropdown |
| searchable large options, async options, multi-select chips | `Combobox` | native select or text input |
| boolean on/off setting | `Switch` | checkbox styled as switch |
| accept terms, multi-choice toggles | `Checkbox` | custom square |
| single choice group | `RadioGroup` | custom list |
| long text | `Textarea` | input |
| tabbed sections | `Tabs` | buttons with manual active class |
| data grid/list with columns | `Table` components | div table |
| modal confirmation/form | `Dialog` / `AlertDialog` | custom fixed overlay |
| side panel workflow | `Sheet` / `Drawer` | custom fixed panel |
| menu/actions list | `DropdownMenu`, `ContextMenu`, `Menubar` | custom popover menu |
| lightweight contextual content | `Popover`, `HoverCard`, `Tooltip` | custom absolute card |
| loading placeholder | `Skeleton`, `Spinner` | ad hoc gray div/spinner |
| empty content state | `Empty` | random centered paragraph |
| keyboard shortcut | `Kbd` | styled span |
| scrollable area, long list/table/panel with overflow | SDK component if available, otherwise container with `custom-scrollbar` | raw `overflow-auto` without `custom-scrollbar` |

## Date Detection

Use `DatePicker` when any of these appear:

- `<input type="date">`
- placeholder like `dd/mm/yyyy`, `mm/dd/yyyy`, `yyyy-mm-dd`
- label: Date, Created date, Due date, Birth date, Start date, End date
- Vietnamese label: Ngày, Ngày sinh, Từ ngày, Đến ngày, Ngày tạo, Hạn chót
- calendar icon beside input
- min/max date copy

Use plain `Input` only when the field is not meant to open a calendar, for example free-form text containing dates in prose.

## Avatar Detection

Use Avatar components when any of these appear:

- `<img>` inside user row/card/header
- circular image or initials
- user/customer/member/author/assignee profile
- stacked user images or `+N`

Use `AvatarFallback` for initials. Use `AvatarGroup` and `AvatarGroupCount` for grouped people when available.

## Select Detection

Choose by interaction:

- `NativeSelect`: simple native form select, small option count, browser behavior is fine.
- `Select`: styled controlled option picker, moderate option count.
- `Combobox`: searchable options, async options, large option count, multi-select/chips.

Do not replace a searchable dropdown with plain `Input`.

## Status Detection

Load `status-badge-rules.md` when status labels appear. Convert plain status spans into `Badge` when status is a short semantic label.

Examples:

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Failed</Badge>
<Badge variant="info">Scheduled</Badge>
```

## InputGroup Detection

Use `InputGroup` instead of custom layout when you see:

- Inputs with inside icons (search left, clear right).
- Leading/trailing text (`https://`, `.com`).
- Embedded action buttons inside the input border (Submit, Copy, Apply).
- `relative` wrappers with absolutely positioned icons or manual padding (`pl-9`, `pr-10`).

**Avoid:**

```tsx
<div className="relative">
  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4" aria-hidden />
  <Input className="pl-9" ... />
</div>
```

**Prefer:**

```tsx
<InputGroup className="bg-background">
  <InputGroupAddon>
    <SearchIcon aria-hidden className="text-muted-foreground" />
  </InputGroupAddon>
  <InputGroupInput ... />
</InputGroup>
```

## Conversion Checklist

Before finishing HTML-to-SDK conversion:

- Every date-like field uses `DatePicker` unless intentionally free-form.
- Every user/profile image uses `Avatar` unless it is content media.
- Every status label has a semantic `Badge` or a documented reason to stay text.
- Every option picker uses `Select`, `NativeSelect`, or `Combobox`.
- Every search or prefixed/suffixed input uses `InputGroup` instead of manual absolute positioning.
- Every file input uses upload components.
- Every labeled field uses `Field`, `FieldLabel`, and `FieldContent`.
- Every explicit scroll container includes `custom-scrollbar`.
- No custom button/input/select exists when an SDK primitive fits.

## Ambiguity Rule

If source HTML lacks enough information:

- Prefer the more semantic SDK component when label/placeholder strongly suggests intent.
- Use neutral fallback only when the semantic component could change behavior.
- Ask for clarification if choosing wrong would affect data entry, validation, or business workflow.
