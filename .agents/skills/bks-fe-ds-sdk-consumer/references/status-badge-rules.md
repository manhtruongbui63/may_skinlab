# Status Badge Rules

Use this reference when converting, styling, or reviewing `Badge` and short status labels in a consumer app using `@bks/ds-system-sdk`.

## Core Rule

Badge `variant` follows semantic meaning. Do not use color only to make UI feel more colorful.

When converting HTML, infer badge variant from visible text even if the source HTML has no color classes. Keep the same status mapped to the same variant across the page.

Current SDK `Badge` API uses `variant`, not a separate `tone` prop:

- `default`
- `secondary`
- `destructive`
- `success`
- `warning`
- `info`
- `outline`
- `ghost`
- `link`

`size` is independent: `sm`, `default`, `lg`.

## When To Use Badge

Use `Badge` for short labels:

- status
- role
- priority
- category
- verification state
- compact count or plan tier

Do not use `Badge` for long prose, helper text, or primary actions.

## Variant Mapping

| Meaning | Variant | Common labels |
| --- | --- | --- |
| Good, valid, completed | `success` | Active, Success, Paid, Approved, Completed, Published, Verified, Passed |
| Needs attention, waiting, not final | `warning` | Pending, Waiting, Review, Draft, Processing, Hold, Attention |
| Bad, failed, risky, blocked | `destructive` | Failed, Error, Rejected, Cancelled, Expired, Overdue, Blocked, High risk |
| Informational or scheduled progress | `info` | New, Scheduled, Queued, In progress, Synced, Invited |
| Neutral, disabled, archived, unknown | `default` or `secondary` | Inactive, Disabled, Archived, Unknown, Internal, Standard |

Vietnamese mapping:

| Meaning | Variant | Common labels |
| --- | --- | --- |
| Good, valid, completed | `success` | Hoạt động, Thành công, Đã thanh toán, Đã duyệt, Hoàn tất, Đã xác minh, Đạt |
| Needs attention, waiting, not final | `warning` | Đang chờ, Chờ xử lý, Chờ duyệt, Bản nháp, Đang xử lý, Tạm giữ, Cần chú ý |
| Bad, failed, risky, blocked | `destructive` | Thất bại, Lỗi, Từ chối, Đã huỷ, Hết hạn, Quá hạn, Bị chặn, Rủi ro cao |
| Informational or scheduled progress | `info` | Mới, Đã lên lịch, Trong hàng đợi, Đang tiến hành, Đã đồng bộ, Đã mời |
| Neutral, disabled, archived, unknown | `default` or `secondary` | Không hoạt động, Đã vô hiệu, Lưu trữ, Không rõ, Nội bộ, Tiêu chuẩn |

## Emphasis Selection

Because semantic status variants already include color treatment, choose emphasis through `size` and context, not through a separate tone prop.

| Context | Recommended Badge |
| --- | --- |
| Primary entity status in header/card | Semantic `variant`, `size="default"` or `lg` |
| Dense table/list status | Semantic `variant`, `size="default"` |
| Secondary metadata status | Semantic `variant`, `size="default"`; `size="sm"` only if row height is critically tight |
| Neutral category/tag/type | `variant="secondary"` or `variant="outline"` |
| Low-emphasis clickable filter/tag | `variant="outline"` or `ghost` if visually quiet |
| Text-like navigation/status link | `variant="link"` only when it acts like a link |

Use `default` for brand/default emphasis, not as a semantic success state. Use `secondary` or `outline` for neutral categories.

## Examples

```tsx
<Badge variant="success">Paid</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Overdue</Badge>
<Badge variant="info">Scheduled</Badge>
<Badge variant="secondary">Archived</Badge>
<Badge variant="outline">Enterprise</Badge>
```

HTML conversion:

```html
<span>Approved</span>
<span>Pending</span>
<span>Rejected</span>
```

```tsx
<Badge variant="success">Approved</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Rejected</Badge>
```

## Consistency Rules

- If `Pending` maps to `warning` once, all `Pending` labels in the same page should use `warning`.
- If a domain has custom semantics, follow the domain mapping over the generic table.
- Do not mix `text-success` status text and `Badge variant="warning"` for the same meaning.
- Prefer `Badge` for status inside tables/lists. Use plain `typo-caption` text only when status is secondary metadata.

## Ambiguous Statuses

Use neutral style or ask for domain mapping when status text is ambiguous:

- Open
- Ready
- Normal
- Manual
- Review needed
- Hold

`Hold` can be `warning` in operations, but `destructive` in risk/compliance contexts. When business meaning changes user decisions, ask instead of guessing.

## Anti-Patterns

Do not hardcode badge colors:

```tsx
<span className="rounded bg-[#0f0] text-[#060]">Paid</span>
```

Use SDK badge variant:

```tsx
<Badge variant="success">Paid</Badge>
```

Do not manually override SDK Badge with heavy solid utilities:

```tsx
// ❌ Heavy solid block — visual noise
<Badge variant="default" className="bg-success text-success-foreground">Hoạt động</Badge>

// ✅ Built-in soft semantic variant
<Badge variant="success">Hoạt động</Badge>
```

Do not use random tones for categories:

```tsx
<Badge variant="destructive">Enterprise</Badge>
```

Use neutral category styling unless the category has semantic urgency:

```tsx
<Badge variant="secondary">Enterprise</Badge>
```
