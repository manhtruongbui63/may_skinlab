import {
  MANAGED_THEME_KEYS,
  PREVIEW_THEME_DARK_SEMANTICS,
  PREVIEW_THEME_DEFAULTS,
  THEME_PREVIEW_SCOPE_ATTR,
  type ManagedThemeKey,
  type ThemeOverrideVars,
} from "./design-system/theme-tokens"

export const DS_THEME_SCOPE_ATTR = THEME_PREVIEW_SCOPE_ATTR
export const DS_THEME_KEYS = MANAGED_THEME_KEYS
export const DS_THEME_DEFAULTS = PREVIEW_THEME_DEFAULTS
export const DS_DARK_THEME_DEFAULTS = PREVIEW_THEME_DARK_SEMANTICS

export type DsThemeKey = ManagedThemeKey
export type DsThemeOverrideVars = ThemeOverrideVars
