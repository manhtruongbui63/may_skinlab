export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";

  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("dark", resolveTheme(theme) === "dark");
}

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }

  return "system";
}

export function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage failures
  }
}

/** Inline script for root layout — runs before paint to avoid theme flash. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

type ThemeListener = () => void;

const themeListeners = new Set<ThemeListener>();

let cachedTheme: Theme =
  typeof window !== "undefined" ? readStoredTheme() : "system";

function notifyThemeListeners(): void {
  themeListeners.forEach((listener) => listener());
}

function subscribeTheme(listener: ThemeListener): () => void {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

function getThemeSnapshot(): Theme {
  return cachedTheme;
}

function getServerThemeSnapshot(): Theme {
  return "system";
}

export function setStoredTheme(theme: Theme): void {
  cachedTheme = theme;
  persistTheme(theme);
  applyTheme(theme);
  notifyThemeListeners();
}

export function syncSystemTheme(): void {
  if (cachedTheme !== "system") return;

  applyTheme("system");
  notifyThemeListeners();
}

export const themeStore = {
  subscribe: subscribeTheme,
  getSnapshot: getThemeSnapshot,
  getServerSnapshot: getServerThemeSnapshot,
  setTheme: setStoredTheme,
  syncSystemTheme,
};
