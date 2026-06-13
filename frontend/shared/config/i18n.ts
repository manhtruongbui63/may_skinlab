export const locales = ["en", "vi", "ja"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";

/** Cookie that stores the active locale (no /<locale> URL prefix is used). */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
  ja: "日本語",
};
