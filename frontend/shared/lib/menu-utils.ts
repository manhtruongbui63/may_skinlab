import { MenuItem, BreadcrumbItem } from "@/shared/types/menu";
import { IPermissionChecker } from "@/shared/types/identity";

/**
 * Checks if a menu item is authorized for the current user.
 */
export const isMenuItemAuthorized = (
  item: MenuItem,
  checker: IPermissionChecker
): boolean => {
  // If no permission and no roles required, it's public
  if (!item.permission && (!item.roles || item.roles.length === 0)) {
    return true;
  }

  // Check roles first if specified
  if (item.roles && item.roles.length > 0) {
    if (!checker.hasAnyRole(item.roles)) {
      return false;
    }
  }

  // Check permissions
  if (item.permission) {
    if (Array.isArray(item.permission)) {
      const strategy = item.permissionMatch || "any";
      if (strategy === "all") {
        return checker.hasAllPermissions(item.permission);
      } else {
        return checker.hasAnyPermission(item.permission);
      }
    } else {
      return checker.can(item.permission);
    }
  }

  return true;
};

/**
 * Recursively filters menu items based on permissions.
 */
export const filterMenuByPermissions = (
  items: MenuItem[],
  checker: IPermissionChecker
): MenuItem[] => {
  return items
    .filter((item) => isMenuItemAuthorized(item, checker))
    .map((item) => {
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuByPermissions(item.children, checker);
        return { ...item, children: filteredChildren };
      }
      return item;
    })
    .filter((item) => {
      // Hide item if it has no path AND no visible children (it's an empty group)
      if (!item.path && (!item.children || item.children.length === 0)) {
        return false;
      }
      return true;
    });
};

/**
 * Returns true when `pathname` matches `itemPath`, respecting path segment
 * boundaries so that "/user" does NOT match "/users" or "/user-settings".
 *
 * - exact: only an identical path matches.
 * - non-exact: an identical path OR a true sub-path ("/user" matches
 *   "/user/profile") matches. An empty/undefined itemPath never matches.
 */
export const isPathActive = (
  pathname: string,
  itemPath: string | undefined,
  exact?: boolean
): boolean => {
  if (!itemPath) return false;
  if (exact) return pathname === itemPath;
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
};

/**
 * Generates breadcrumbs from the menu configuration based on the current pathname.
 */
export const generateBreadcrumbs = (
  items: MenuItem[],
  pathname: string,
  t: (key: string) => string
): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [];

  const findPath = (menuItems: MenuItem[], currentPath: string): boolean => {
    for (const item of menuItems) {
      // Descend into children FIRST so the deepest matching leaf wins. A parent
      // like "/users" non-exactly matches "/users/edit", so checking the parent
      // before its children would short-circuit and drop the "Edit" crumb.
      if (item.children) {
        if (findPath(item.children, currentPath)) {
          breadcrumbs.unshift({ label: t(item.label), path: item.path });
          return true;
        }
      }

      // No deeper match: use this item if it matches, respecting segment boundaries.
      if (item.path && isPathActive(pathname, item.path, item.exact)) {
        breadcrumbs.push({ label: t(item.label), path: item.path });
        return true;
      }
    }
    return false;
  };

  findPath(items, pathname);
  
  if (breadcrumbs.length > 0) {
    breadcrumbs[breadcrumbs.length - 1].isLast = true;
  }
  
  return breadcrumbs;
};
