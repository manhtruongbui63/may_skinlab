# Validation i18n Locale Contract (next-intl)

i18n uses **next-intl**. Messages live in `messages/vi.json`, `messages/en.json`, `messages/ja.json`
(config under `i18n/`). Access them with `useTranslations` (client) / `getTranslations` (server).
ICU-style named interpolation: `{field}`, `{min}`, `{max}` — **not** `{{_field_}}`.

## Key separation

- **`action.*` = shared action buttons:** generic actions used across the app — `save`, `cancel`,
  `edit`, `delete`, `create`, `search`.
- **`validation.*` = shared error templates only:** reusable message templates. Current keys:
  - `required` → `"{field} là bắt buộc"`
  - `email` → `"{field} phải là email hợp lệ"`
  - `minLength` → `"{field} phải có ít nhất {min} ký tự"`
  - `maxLength` → `"{field} không được vượt quá {max} ký tự"`
  Do **not** put feature-specific labels here.
- **`<Namespace>.*` = feature-specific keys:** scoped under the feature's namespace.
  - **`<Namespace>.fields.*`** — human-readable field names for `{field}` interpolation.
  - **`<Namespace>.title` / `.description`** — page/dialog copy.
  - **`<Namespace>.errors.*` / `.messages.*`** — feature-specific messages.

**Interpolation example** (in the schema, with `const t = useTranslations()`):

```ts
z.string()
  .min(1, t('validation.required', { field: t('Feature.fields.name') }))
  .max(255, t('validation.maxLength', { field: t('Feature.fields.name'), max: 255 }))
```

A feature may also declare its own messages directly under its namespace (see
`ChangePassword.errors.*` used by `change-password-dialog.tsx`).

## Rules

- **i18n is MANDATORY:** hardcoded strings in UI components are forbidden.
- **Perfect synchronization:** every key MUST exist in **all three** catalogs (`vi.json`, `en.json`,
  `ja.json`). No missing translations.
- **Zero redundancy:** check shared roots (`action.*`, `validation.*`) BEFORE adding feature keys; if
  a concept exists in a shared root, reuse it with interpolation.
- **Feature isolation:** new feature keys MUST be scoped under their namespace (e.g. `Feature.fields.name`).
- **No unused keys:** remove keys when the corresponding code is removed/refactored.
- **Add a new `validation.*` template** only when no existing template fits the sentence shape.

## Reference implementation

- `features/auth/components/change-password-dialog.tsx` — inline Zod schema with
  `t('ChangePassword.errors.*')` messages via `useTranslations('ChangePassword')`.
- `messages/{vi,en,ja}.json` — `validation` / `action` shared roots; per-feature namespaces
  (`ChangePassword`, `Login`, …).
