// Locale lives in a cookie, not the URL, so there is no i18n-aware routing.
// These are plain re-exports of Next.js' navigation primitives, kept here so
// existing `@/i18n/routing` imports keep working after the migration.
export {default as Link} from 'next/link';
export {usePathname, useRouter, redirect} from 'next/navigation';
