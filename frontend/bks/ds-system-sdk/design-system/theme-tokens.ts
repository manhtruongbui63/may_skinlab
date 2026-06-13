/**
 * Defaults mirror light `:root` trong `src/index.css`.
 *
 * Preview Theme Studio: inline vars áp lên phần tử có `THEME_PREVIEW_SCOPE_ATTR`.
 * Sang dự án khác: dán exported `:root { … }` hoặc bọc UI trong `[data-theme-scope]`.
 */
export const THEME_PREVIEW_SCOPE_ATTR = 'data-theme-scope' as const

export const MANAGED_THEME_KEYS = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--destructive',
  '--destructive-foreground',
  '--success',
  '--success-foreground',
  '--warning',
  '--warning-foreground',
  '--info',
  '--info-foreground',
  '--border',
  '--input',
  '--ring',
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--sidebar',
  '--sidebar-foreground',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--sidebar-accent',
  '--sidebar-accent-foreground',
  '--sidebar-border',
  '--sidebar-ring',
  '--text',
  '--text-h',
  '--bg',
  '--code-bg',
  '--shell-accent',
  '--shell-accent-bg',
  '--shell-accent-border',
  '--social-bg',
  '--shadow',
  '--sans',
  '--heading',
  '--mono',
  '--radius',
  '--ds-main-padding',
  '--ds-font-base',
  '--ds-font-family',
  '--ds-letter-spacing',
] as const

export type ManagedThemeKey = (typeof MANAGED_THEME_KEYS)[number]

/** Overrides keyed like `--radius`; used by design-system preview + Theme Sheet portal. */
export type ThemeOverrideVars = Record<string, string>

/**
 * Inline declarations applied on the Theme preview shell `[data-theme-scope]` and on Theme Sheet popup (portal),
 * so controls inside the drawer resolve the same `--radius`, colors, etc.
 * On the Design System route, the same record is also applied to `document.documentElement` so portaled UI (Dialog, Select, …) inherits `--heading` / `--sans` / color tokens.
 */
export function previewCssVarsRecord(
  overrides: ThemeOverrideVars
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of MANAGED_THEME_KEYS) {
    const raw = overrides[key]?.trim()
    if (raw) out[key] = raw
  }
  out['font-family'] = 'var(--sans)'
  out['letter-spacing'] = 'var(--ds-letter-spacing)'
  return out
}

/** Giá trị hiệu dụng của `--ds-font-base` (để set root `rem` trên trang Design System). */
export function resolvedDsFontBase(overrides: ThemeOverrideVars): string {
  const raw = overrides['--ds-font-base']?.trim()
  return raw || PREVIEW_THEME_DEFAULTS['--ds-font-base']
}

export function previewCssTextFromOverrides(
  overrides: ThemeOverrideVars
): string {
  const rec = previewCssVarsRecord(overrides)
  return Object.entries(rec)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ')
}

export const PREVIEW_THEME_DEFAULTS: Record<ManagedThemeKey, string> = {
  '--background': 'oklch(1 0 0)',
  '--foreground': 'oklch(0.145 0 0)',
  '--card': 'oklch(1 0 0)',
  '--card-foreground': 'oklch(0.145 0 0)',
  '--popover': 'oklch(1 0 0)',
  '--popover-foreground': 'oklch(0.145 0 0)',
  '--primary': 'oklch(0.205 0 0)',
  '--primary-foreground': 'oklch(0.985 0 0)',
  '--secondary': 'oklch(0.97 0 0)',
  '--secondary-foreground': 'oklch(0.205 0 0)',
  '--muted': 'oklch(0.97 0 0)',
  '--muted-foreground': 'oklch(0.556 0 0)',
  '--accent': 'oklch(0.97 0 0)',
  '--accent-foreground': 'oklch(0.205 0 0)',
  '--destructive': 'oklch(0.577 0.245 27.325)',
  '--destructive-foreground': 'oklch(0.985 0 0)',
  '--success': 'oklch(0.5 0.21 158)',
  '--success-foreground': 'oklch(0.99 0.02 158)',
  '--warning': 'oklch(0.77 0.27 88)',
  '--warning-foreground': 'oklch(0.18 0.1 62)',
  '--info': 'oklch(0.52 0.22 256)',
  '--info-foreground': 'oklch(0.99 0.02 256)',
  '--border': 'oklch(0.922 0 0)',
  '--input': 'oklch(0.922 0 0)',
  '--ring': 'oklch(0.708 0 0)',
  '--chart-1': 'oklch(0.87 0 0)',
  '--chart-2': 'oklch(0.556 0 0)',
  '--chart-3': 'oklch(0.439 0 0)',
  '--chart-4': 'oklch(0.371 0 0)',
  '--chart-5': 'oklch(0.269 0 0)',
  '--sidebar': 'oklch(0.985 0 0)',
  '--sidebar-foreground': 'oklch(0.145 0 0)',
  '--sidebar-primary': 'oklch(0.205 0 0)',
  '--sidebar-primary-foreground': 'oklch(0.985 0 0)',
  '--sidebar-accent': 'oklch(0.97 0 0)',
  '--sidebar-accent-foreground': 'oklch(0.205 0 0)',
  '--sidebar-border': 'oklch(0.922 0 0)',
  '--sidebar-ring': 'oklch(0.708 0 0)',
  '--text': '#6b6375',
  '--text-h': '#08060d',
  '--bg': '#fff',
  '--code-bg': '#f4f3ec',
  '--shell-accent': 'oklch(0.97 0 0)',
  '--shell-accent-bg': 'rgba(170, 59, 255, 0.1)',
  '--shell-accent-border': 'rgba(170, 59, 255, 0.5)',
  '--social-bg': 'rgba(244, 243, 236, 0.5)',
  '--shadow':
    'rgba(0, 0, 0, 0.1) 0 10px 15px -3px, rgba(0, 0, 0, 0.05) 0 4px 6px -2px',
  '--sans':
    "'Geist', ui-sans-serif, system-ui, sans-serif",
  '--heading':
    "'Geist', ui-sans-serif, system-ui, sans-serif",
  '--mono':
    "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  '--radius': '0.625rem',
  '--ds-main-padding': '1.5rem',
  '--ds-font-base': '16px',
  '--ds-font-family':
    "'Geist', ui-sans-serif, system-ui, sans-serif",
  '--ds-letter-spacing': 'normal',
}

/**
 * Giá trị đang có của biến trên `document.documentElement` (`.dark`, prefers-color-scheme,
 * và overrides Theme Studio trên html).
 * SSR hoặc biến trống: fallback `PREVIEW_THEME_DEFAULTS`.
 */
export function getResolvedRootCssVariable(
  key: ManagedThemeKey,
  /** Invalidate callers’ memoization when `next-themes` switches light/dark. */
  _resolvedThemeHint?: string | undefined,
): string {
  void _resolvedThemeHint
  if (typeof document === 'undefined') {
    return PREVIEW_THEME_DEFAULTS[key] ?? ''
  }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(key)
    .trim()
  return raw || PREVIEW_THEME_DEFAULTS[key] || ''
}

/** Mirror `.dark { … }` in `src/index.css` — dùng nhãn “mặc định gốc” khi có override Theme Studio. */
export const PREVIEW_THEME_DARK_SEMANTICS: Partial<
  Record<ManagedThemeKey, string>
> = {
  '--background': 'oklch(0.145 0 0)',
  '--foreground': 'oklch(0.985 0 0)',
  '--card': 'oklch(0.205 0 0)',
  '--card-foreground': 'oklch(0.985 0 0)',
  '--popover': 'oklch(0.205 0 0)',
  '--popover-foreground': 'oklch(0.985 0 0)',
  '--primary': 'oklch(0.922 0 0)',
  '--primary-foreground': 'oklch(0.205 0 0)',
  '--secondary': 'oklch(0.269 0 0)',
  '--secondary-foreground': 'oklch(0.985 0 0)',
  '--muted': 'oklch(0.269 0 0)',
  '--muted-foreground': 'oklch(0.708 0 0)',
  '--accent': 'oklch(0.269 0 0)',
  '--accent-foreground': 'oklch(0.985 0 0)',
  '--destructive': 'oklch(0.704 0.191 22.216)',
  '--destructive-foreground': 'oklch(0.985 0 0)',
  '--success': 'oklch(0.66 0.19 158)',
  '--success-foreground': 'oklch(0.99 0.02 158)',
  '--warning': 'oklch(0.8 0.23 89)',
  '--warning-foreground': 'oklch(0.17 0.11 58)',
  '--info': 'oklch(0.64 0.2 256)',
  '--info-foreground': 'oklch(0.99 0.02 256)',
  '--border': 'oklch(1 0 0 / 10%)',
  '--input': 'oklch(1 0 0 / 15%)',
  '--ring': 'oklch(0.556 0 0)',
  '--chart-1': 'oklch(0.87 0 0)',
  '--chart-2': 'oklch(0.556 0 0)',
  '--chart-3': 'oklch(0.439 0 0)',
  '--chart-4': 'oklch(0.371 0 0)',
  '--chart-5': 'oklch(0.269 0 0)',
  '--sidebar': 'oklch(0.205 0 0)',
  '--sidebar-foreground': 'oklch(0.985 0 0)',
  '--sidebar-primary': 'oklch(0.488 0.243 264.376)',
  '--sidebar-primary-foreground': 'oklch(0.985 0 0)',
  '--sidebar-accent': 'oklch(0.269 0 0)',
  '--sidebar-accent-foreground': 'oklch(0.985 0 0)',
  '--sidebar-border': 'oklch(1 0 0 / 10%)',
  '--sidebar-ring': 'oklch(0.556 0 0)',
  '--text': '#9ca3af',
  '--text-h': '#f3f4f6',
  '--bg': '#16171d',
  '--code-bg': '#1f2028',
  '--shell-accent': '#c084fc',
  '--shell-accent-bg': 'rgba(192, 132, 252, 0.15)',
  '--shell-accent-border': 'rgba(192, 132, 252, 0.5)',
  '--social-bg': 'rgba(47, 48, 58, 0.5)',
}

/** Baseline Theme Sheet / inspector khi user có override (không đọc được “trước override” từ DOM). */
export function previewCanonicalBaseline(
  key: ManagedThemeKey,
  resolvedTheme: string | undefined,
): string {
  if (resolvedTheme === 'dark') {
    const d = PREVIEW_THEME_DARK_SEMANTICS[key]
    if (d) return d
  }
  return PREVIEW_THEME_DEFAULTS[key] ?? ''
}

export type TypographyFontOption = { label: string; value: string }

/** ~10 fonts per stack; load faces via Google Fonts in index.html. */
export const TYPOGRAPHY_FONT_OPTIONS_BY_TOKEN: Record<
  Extract<ManagedThemeKey, '--sans' | '--heading' | '--mono'>,
  readonly TypographyFontOption[]
> = {
  '--sans': [
    {
      label: 'System',
      value: "system-ui, 'Segoe UI', Roboto, sans-serif",
    },
    {
      label: 'Geist',
      value: "'Geist', ui-sans-serif, system-ui, sans-serif",
    },
    {
      label: 'Reddit Sans',
      value: "'Reddit Sans', ui-sans-serif, system-ui, sans-serif",
    },
    { label: 'Inter', value: "'Inter', ui-sans-serif, system-ui, sans-serif" },
    { label: 'Roboto', value: "'Roboto', ui-sans-serif, sans-serif" },
    {
      label: 'Open Sans',
      value: "'Open Sans', ui-sans-serif, sans-serif",
    },
    { label: 'Lato', value: "'Lato', ui-sans-serif, sans-serif" },
    { label: 'Nunito', value: "'Nunito', ui-sans-serif, sans-serif" },
    {
      label: 'Source Sans 3',
      value: "'Source Sans 3', ui-sans-serif, sans-serif",
    },
    {
      label: 'Work Sans',
      value: "'Work Sans', ui-sans-serif, sans-serif",
    },
    { label: 'DM Sans', value: "'DM Sans', ui-sans-serif, sans-serif" },
  ],
  '--heading': [
    {
      label: 'System',
      value: "ui-serif, Georgia, Cambria, 'Times New Roman', serif",
    },
    {
      label: 'Geist',
      value: "'Geist', ui-sans-serif, system-ui, sans-serif",
    },
    {
      label: 'Reddit Sans',
      value: "'Reddit Sans', ui-sans-serif, system-ui, sans-serif",
    },
    {
      label: 'Open Sans',
      value: "'Open Sans', ui-sans-serif, sans-serif",
    },
    {
      label: 'Merriweather',
      value: "'Merriweather', ui-serif, Georgia, serif",
    },
    { label: 'Lora', value: "'Lora', ui-serif, Georgia, serif" },
    {
      label: 'Playfair Display',
      value: "'Playfair Display', ui-serif, Georgia, serif",
    },
    {
      label: 'Source Serif 4',
      value: "'Source Serif 4', ui-serif, Georgia, serif",
    },
    {
      label: 'Libre Baskerville',
      value: "'Libre Baskerville', ui-serif, Georgia, serif",
    },
    { label: 'PT Serif', value: "'PT Serif', ui-serif, Georgia, serif" },
    {
      label: 'EB Garamond',
      value: "'EB Garamond', ui-serif, Garamond, serif",
    },
    {
      label: 'Georgia',
      value: 'Georgia, Cambria, Times New Roman, serif',
    },
    {
      label: 'Crimson Pro',
      value: "'Crimson Pro', ui-serif, Georgia, serif",
    },
  ],
  '--mono': [
    {
      label: 'System',
      value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    {
      label: 'Geist Mono',
      value: "'Geist Mono', ui-monospace, monospace",
    },
    {
      label: 'JetBrains Mono',
      value: "'JetBrains Mono', ui-monospace, monospace",
    },
    { label: 'Fira Code', value: "'Fira Code', ui-monospace, monospace" },
    {
      label: 'IBM Plex Mono',
      value: "'IBM Plex Mono', ui-monospace, monospace",
    },
    {
      label: 'Source Code Pro',
      value: "'Source Code Pro', ui-monospace, monospace",
    },
    {
      label: 'Roboto Mono',
      value: "'Roboto Mono', ui-monospace, monospace",
    },
    {
      label: 'Ubuntu Mono',
      value: "'Ubuntu Mono', ui-monospace, monospace",
    },
    {
      label: 'Consolas',
      value: 'Consolas, Monaco, Courier New, monospace',
    },
    {
      label: 'Courier',
      value: "'Courier New', Courier, ui-monospace, monospace",
    },
    {
      label: 'Space Mono',
      value: "'Space Mono', ui-monospace, monospace",
    },
  ],
}

/** Nhóm accordion trong tab Colors (giống shadcn/studio theme drawer). */
export const THEME_COLOR_ACCORDIONS = [
  {
    value: 'brand',
    title: 'Brand colors',
    fields: [
      { key: '--primary', label: 'Primary' },
      { key: '--primary-foreground', label: 'Primary foreground' },
      { key: '--secondary', label: 'Secondary' },
      { key: '--secondary-foreground', label: 'Secondary foreground' },
      { key: '--destructive', label: 'Destructive' },
      { key: '--destructive-foreground', label: 'Destructive foreground' },
      { key: '--success', label: 'Success' },
      { key: '--success-foreground', label: 'Success foreground' },
      { key: '--warning', label: 'Warning' },
      { key: '--warning-foreground', label: 'Warning foreground' },
      { key: '--info', label: 'Info' },
      { key: '--info-foreground', label: 'Info foreground' },
      { key: '--accent', label: 'Accent' },
      { key: '--accent-foreground', label: 'Accent foreground' },
    ],
  },
  {
    value: 'base',
    title: 'Base colors',
    fields: [
      { key: '--background', label: 'Background' },
      { key: '--foreground', label: 'Foreground' },
      { key: '--card', label: 'Card' },
      { key: '--card-foreground', label: 'Card foreground' },
      { key: '--muted', label: 'Muted' },
      { key: '--muted-foreground', label: 'Muted foreground' },
      { key: '--border', label: 'Border' },
      { key: '--input', label: 'Input' },
      { key: '--ring', label: 'Ring' },
    ],
  },
  {
    value: 'other',
    title: 'Other colors',
    fields: [
      { key: '--popover', label: 'Popover' },
      { key: '--popover-foreground', label: 'Popover foreground' },
      { key: '--text', label: 'Body text' },
      { key: '--text-h', label: 'Heading text' },
      { key: '--bg', label: 'Page background' },
      { key: '--code-bg', label: 'Code background' },
      { key: '--shell-accent', label: 'Shell accent (marketing)' },
      { key: '--shell-accent-bg', label: 'Shell accent bg' },
      { key: '--shell-accent-border', label: 'Shell accent border' },
      { key: '--social-bg', label: 'Social section bg' },
    ],
  },
  {
    value: 'sidebar',
    title: 'Sidebar colors',
    fields: [
      { key: '--sidebar', label: 'Sidebar bg' },
      { key: '--sidebar-foreground', label: 'Sidebar foreground' },
      { key: '--sidebar-primary', label: 'Sidebar primary' },
      {
        key: '--sidebar-primary-foreground',
        label: 'Sidebar primary foreground',
      },
      { key: '--sidebar-accent', label: 'Sidebar accent' },
      {
        key: '--sidebar-accent-foreground',
        label: 'Sidebar accent foreground',
      },
      { key: '--sidebar-border', label: 'Sidebar border' },
      { key: '--sidebar-ring', label: 'Sidebar ring' },
    ],
  },
  {
    value: 'chart',
    title: 'Chart colors',
    fields: [
      { key: '--chart-1', label: 'Chart 1' },
      { key: '--chart-2', label: 'Chart 2' },
      { key: '--chart-3', label: 'Chart 3' },
      { key: '--chart-4', label: 'Chart 4' },
      { key: '--chart-5', label: 'Chart 5' },
    ],
  },
] as const

export type ThemeColorAccordionField =
  (typeof THEME_COLOR_ACCORDIONS)[number]['fields'][number]

export const ALL_THEME_COLOR_KEYS: ManagedThemeKey[] =
  THEME_COLOR_ACCORDIONS.flatMap((g) => g.fields.map((f) => f.key))

export const THEME_TYPOGRAPHY_FIELDS = [
  {
    key: '--sans',
    label: 'Sans-Serif Font',
    description:
      'Biến `--sans`: font không chân cho đoạn văn, UI và nội dung body của preview.',
  },
  {
    key: '--heading',
    label: 'Heading Font',
    description:
      'Biến `--heading`: font cho tiêu đề và heading (vd. `h1`, `h2` dùng `font-heading`).',
  },
  {
    key: '--mono',
    label: 'Monospace Font',
    description:
      'Biến `--mono`: font đơn cách cho code, snippet và `font-mono`.',
  },
] as const satisfies readonly {
  key: ManagedThemeKey
  label: string
  description: string
}[]

export const THEME_OTHER_FIELDS = [
  { key: '--shadow', label: 'Shadow' },
  { key: '--radius', label: 'Radius' },
  { key: '--ds-main-padding', label: 'Spacing' },
  { key: '--ds-font-base', label: 'Base font size' },
] as const satisfies readonly {
  key: ManagedThemeKey
  label: string
  multiline?: boolean
}[]

export const THEME_DRAWER_PRESETS: Record<
  string,
  { label: string; overrides: Partial<Record<ManagedThemeKey, string>> }
> = {
  default: { label: 'Default', overrides: {} },
  violet: {
    label: 'Violet',
    overrides: {
      '--primary': 'oklch(0.488 0.243 264.376)',
      '--primary-foreground': 'oklch(0.985 0 0)',
      '--ring': 'oklch(0.488 0.243 264.376)',
      '--sidebar-primary': 'oklch(0.488 0.243 264.376)',
      '--sidebar-ring': 'oklch(0.488 0.243 264.376)',
      '--chart-1': 'oklch(0.488 0.243 264.376)',
      '--chart-2': 'oklch(0.558 0.288 302.321)',
      '--chart-3': 'oklch(0.398 0.07 227.392)',
    },
  },
  emerald: {
    label: 'Emerald',
    overrides: {
      '--primary': 'oklch(0.596 0.145 163.225)',
      '--primary-foreground': 'oklch(0.985 0 0)',
      '--ring': 'oklch(0.596 0.145 163.225)',
      '--sidebar-primary': 'oklch(0.596 0.145 163.225)',
      '--sidebar-ring': 'oklch(0.596 0.145 163.225)',
      '--chart-1': 'oklch(0.596 0.145 163.225)',
      '--chart-2': 'oklch(0.527 0.154 150.069)',
      '--chart-3': 'oklch(0.398 0.07 227.392)',
    },
  },
}
