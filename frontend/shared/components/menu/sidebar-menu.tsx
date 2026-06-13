"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { MenuItem } from "@/shared/types/menu";
import { usePermission } from "@/shared/hooks/use-permission";
import { navigationService } from "@/shared/services/navigation.service";
import { isPathActive } from "@/shared/lib/menu-utils";
import { cn } from "@/shared/lib/utils";
import { defaultLocale } from "@/shared/config/i18n";
import { usePathname, Link } from "@/i18n/routing";

interface SidebarMenuProps {
  items?: MenuItem[];
  className?: string;
  isCollapsed?: boolean;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  items,
  className,
  isCollapsed = false,
}) => {
  const t = useTranslations();
  const checker = usePermission();
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || defaultLocale;

  const filteredMenu = useMemo(() => {
    return navigationService.getAuthorizedMenu(checker, items);
  }, [items, checker]);

  return (
    <nav className={cn("flex flex-col space-y-1 px-2 py-4", className)}>
      {filteredMenu.map((item) => (
        <SidebarMenuItem
          key={item.id}
          item={item}
          pathname={pathname}
          locale={locale}
          isCollapsed={isCollapsed}
          t={t}
        />
      ))}
    </nav>
  );
};

interface SidebarMenuItemProps {
  item: MenuItem;
  pathname: string;
  locale: string;
  isCollapsed: boolean;
  t: (key: string) => string;
  depth?: number;
}

const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
  item,
  pathname,
  locale,
  isCollapsed,
  t,
  depth = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  
  // Check if active: exact or sub-path, respecting path segment boundaries.
  // ("/" is treated as exact so it does not match every route.)
  const isActive = useMemo(() => {
    if (item.path === "/") return pathname === "/";
    return isPathActive(pathname, item.path, item.exact);
  }, [item.path, item.exact, pathname]);

  // Check if any child is active to auto-expand
  const isChildActive = useMemo(() => {
    if (!hasChildren) return false;
    const checkChildren = (children: MenuItem[]): boolean => {
      return children.some((child) => {
        if (!child.path) return child.children ? checkChildren(child.children) : false;
        if (child.path === "/") return pathname === "/";
        if (isPathActive(pathname, child.path, child.exact)) return true;
        if (child.children) return checkChildren(child.children);
        return false;
      });
    };
    return checkChildren(item.children!);
  }, [hasChildren, item.children, pathname]);

  // Load/Save state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`menu-group-${item.id}`);
    if (savedState === "open" || isChildActive) {
      setTimeout(() => setIsOpen(true), 0);
    }
  }, [item.id, isChildActive]);

  const toggleOpen = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      const newState = !isOpen;
      setIsOpen(newState);
      localStorage.setItem(`menu-group-${item.id}`, newState ? "open" : "closed");
    }
  };

  const Icon = item.icon;
  const isSubmenu = depth > 0;

  const content = (
    <div
      className={cn(
        "group flex items-center rounded-lg px-3 transition-all duration-200 select-none",
        isSubmenu
          ? cn(
              "py-1.5 text-[13.5px] font-normal leading-5",
              isActive
                ? "text-blue-700 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/10 font-medium"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 hover:text-slate-900 dark:hover:text-slate-200"
            )
          : cn(
              "py-2 text-[14.5px] font-medium leading-6",
              isActive
                ? "bg-blue-50 dark:bg-[#1e293b] text-blue-700 dark:text-blue-400 shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/30 hover:text-slate-900 dark:hover:text-slate-200"
            )
      )}
    >
      {Icon && !isSubmenu && (
        <Icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            isActive
              ? "text-blue-700 dark:text-blue-400"
              : "text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200",
            !isCollapsed && "mr-3"
          )}
        />
      )}
      {!isCollapsed && (
        <span className="flex-1 truncate">{t(item.label)}</span>
      )}
      {!isCollapsed && hasChildren && (
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 transition-transform duration-200 ml-auto",
            isOpen ? "transform rotate-0" : "transform -rotate-90"
          )}
        />
      )}
      {!isCollapsed && item.badge && (
        <span className="ml-2 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400">
          {item.badge}
        </span>
      )}
    </div>
  );

  // Localize path
  const itemPath = item.path;

  return (
    <div className="flex flex-col">
      {itemPath ? (
        <Link 
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          href={itemPath as any} 
          onClick={toggleOpen}
        >
          {content}
        </Link>
      ) : (
        <div className="cursor-pointer" onClick={toggleOpen}>
          {content}
        </div>
      )}

      {!isCollapsed && hasChildren && isOpen && (
        <div className="mt-1 flex flex-col space-y-1 ml-[22px] pl-[18px] border-l border-slate-200/80 dark:border-slate-800/80">
          {item.children!.map((child) => (
            <SidebarMenuItem
              key={child.id}
              item={child}
              pathname={pathname}
              locale={locale}
              isCollapsed={isCollapsed}
              t={t}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
