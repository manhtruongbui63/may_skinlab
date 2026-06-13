"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocale } from "@/i18n/locale-actions";
import { locales, localeLabels } from "@/shared/config/i18n";
import { Button } from "@/shared/components/ui/button";

export function LocaleSwitcher() {
  const active = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function change(locale: string) {
    if (locale === active || isPending) return;
    startTransition(async () => {
      // Persist the locale in a cookie, then re-render server content with it.
      await setLocale(locale);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/50">
      {locales.map((locale) => (
        <Button
          key={locale}
          type="button"
          onClick={() => change(locale)}
          disabled={isPending}
          variant={active === locale ? "secondary" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs font-bold uppercase"
          title={localeLabels[locale]}
        >
          {locale}
        </Button>
      ))}
    </div>
  );
}
