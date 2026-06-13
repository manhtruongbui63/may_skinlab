import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Protected routes (path-based; locale lives in a cookie, not the URL).
 * Currently empty - authentication protection is handled client-side via useAuth hook
 * and PermissionGuard components. Add routes here for edge-level protection
 * if middleware-level auth check becomes necessary.
 * 
 * Example: ["/dashboard", "/settings", "/admin"]
 *
 * NOTE: Sanctum SPA mode uses an HttpOnly session cookie, which the edge can
 * only check for *presence* (not validity) — treat it as a soft hint. The
 * authoritative checks happen server-side (RSC calling /api/auth/me) and
 * client-side (usePermission()/PermissionGuard). RBAC is never decided here.
 */
const PROTECTED_ROUTES: string[] = [];

/** Routes that authenticated users should NOT visit (redirect → dashboard). */
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

// ─── Helpers ───────────────────────────────────────────────────────────────

function hasSessionCookie(request: NextRequest): boolean {
  // Sanctum SPA: presence of the Laravel session cookie (e.g. `*_session`)
  // is a soft signal that a session exists. Validity is verified by the API.
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.endsWith("_session"));
}

// ─── Middleware ─────────────────────────────────────────────────────────────

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = hasSessionCookie(request);

  // 1. Redirect authenticated users away from auth pages (login, register)
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2. Protect routes — authentication only, RBAC is handled client-side
  const isProtected = PROTECTED_ROUTES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Also protect the root path if it requires authentication.
  // Since PROTECTED_ROUTES is empty, the root path '/' is NOT protected by default.
  // If you want '/' to redirect to login when unauthenticated, uncomment below:
  // if (pathname === "/" && !isAuthenticated) {
  //   const loginUrl = new URL("/login", request.url);
  //   loginUrl.searchParams.set("callbackUrl", pathname);
  //   return NextResponse.redirect(loginUrl);
  // }

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
