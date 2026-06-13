import type { MetadataRoute } from "next";
import { locales } from "@/shared/config/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const publicPages = [""];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  publicPages.forEach((pagePath) => {
    // For each page, create entries for all locales
    locales.forEach((locale) => {
      const url = `${baseUrl}/${locale}${pagePath}`;
      
      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: pagePath === "" ? 1 : 0.8,
        // Optional: include alternates for each page
        // Note: next-intl/navigation handles these via metadata, 
        // but adding them here is good for search engines.
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}${pagePath}`])
          ),
        },
      });
    });
  });

  return sitemapEntries;
}
