import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Locale lives in a cookie, not the URL, so sensitive routes are at the
      // path root (e.g. "/admin", "/users") — NOT under a "/<locale>/" segment.
      // A "/*/admin/" pattern would never match them and leave them crawlable.
      disallow: [
        "/_next/",
        "/api/",
        "/admin/",
        "/users/",
        "/roles/",
        "/settings/",
        "/forbidden",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
