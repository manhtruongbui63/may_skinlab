"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, Home } from "lucide-react";
import { navigationService } from "@/shared/services/navigation.service";
import { cn } from "@/shared/lib/utils";
import { defaultLocale } from "@/shared/config/i18n";
import { usePathname, Link } from "@/i18n/routing";

interface BreadcrumbProps {
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ className }) => {
  const pathname = usePathname();
  const t = useTranslations();
  const params = useParams();
  const locale = (params?.locale as string) || defaultLocale;

  void locale; 

  const breadcrumbs = useMemo(
    () => navigationService.getBreadcrumbs(pathname, t),
    [pathname, t]
  );

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-2 text-sm text-muted-foreground", className)}>
      <Link
        href="/"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((crumb, index) => {
        const itemPath = crumb.path;
          
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
            {crumb.isLast ? (
              <span className="font-semibold text-foreground truncate max-w-[200px]">
                {crumb.label}
              </span>
            ) : (
              <Link
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                href={(itemPath || "#") as any}
                className="hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
