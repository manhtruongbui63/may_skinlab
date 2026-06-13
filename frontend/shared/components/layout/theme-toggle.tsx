"use client";

import { Button } from "@bks/ds-system-sdk";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/shared/components/providers/theme-provider";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("Common");
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label={t("toggleTheme")} disabled>
        <Sun className="size-4" aria-hidden />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? t("switchToLight") : t("switchToDark")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </Button>
  );
}
