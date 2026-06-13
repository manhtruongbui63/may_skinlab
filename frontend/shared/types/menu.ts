import React from "react";

export type PermissionMatchStrategy = "all" | "any";

export interface MenuItem {
  id: string;
  label: string; // This can be a translation key
  icon?: React.ComponentType<{ className?: string }>;
  path?: string;
  permission?: string | string[];
  permissionMatch?: PermissionMatchStrategy;
  roles?: string[];
  children?: MenuItem[];
  badge?: string | number;
  isExternal?: boolean;
  hideInMenu?: boolean;
  exact?: boolean; // For active state matching
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  isLast?: boolean;
}
