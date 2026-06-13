'use server';

import {cookies} from 'next/headers';
import {locales, defaultLocale, Locale, LOCALE_COOKIE} from '@/shared/config/i18n';

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Persists the chosen locale in a cookie so subsequent requests (RSC and the
 * API client) render in that language. Call from a client component and then
 * `router.refresh()` to re-render server content with the new locale.
 */
export async function setLocale(locale: string): Promise<void> {
  const next: Locale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;

  (await cookies()).set(LOCALE_COOKIE, next, {
    path: '/',
    maxAge: ONE_YEAR,
    sameSite: 'lax'
  });
}
