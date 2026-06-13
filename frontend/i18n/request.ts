import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';
import {locales, defaultLocale, Locale, LOCALE_COOKIE} from '@/shared/config/i18n';

// Locale is stored in a cookie (no /<locale> URL prefix). The cookie is
// written by the `setLocale` server action; here we read it per request and
// fall back to the default when it is absent or invalid.
export default getRequestConfig(async () => {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = locales.includes(stored as Locale)
    ? (stored as Locale)
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
