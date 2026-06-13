import type { IIdentity, IPermissionChecker } from "../types/identity";

const BKS_SUPER_ADMIN_ROLE = "admin";

/**
 * Creates a permission checker instance for a given identity.
 * This can be used on both client and server.
 */
export const createPermissionChecker = (identity: IIdentity | null): IPermissionChecker => {
  const isAdmin = (): boolean => {
    if (!identity) return false;
    return !!(identity.role === BKS_SUPER_ADMIN_ROLE || (identity.roles && identity.roles.includes(BKS_SUPER_ADMIN_ROLE)));
  };

  const hasRole = (role: string): boolean => {
    if (!identity) return false;
    if (isAdmin()) return true;
    return !!(identity.role === role || (identity.roles && identity.roles.includes(role)));
  };

  const can = (permission: string, resourceOwnerId?: string) => {
    if (!identity) return false;
    
    // Admin always has permission
    if (isAdmin()) return true;

    // Check basic permission
    const hasBasePermission = identity.permissions && identity.permissions.includes(permission);
    if (!hasBasePermission) return false;

    // If resource ownership is required. Use an explicit `undefined` check so a
    // falsy-but-present owner id (e.g. "" from a not-yet-loaded field) still
    // enforces ownership and denies — never silently grants on base permission.
    if (resourceOwnerId !== undefined) {
      return identity.id === resourceOwnerId;
    }

    return true;
  };

  const hasAnyPermission = (permissions: string[]) => {
    if (!identity) return false;
    if (isAdmin()) return true;
    return permissions.some((p) => identity.permissions && identity.permissions.includes(p));
  };

  const hasAllPermissions = (permissions: string[]) => {
    if (!identity) return false;
    if (isAdmin()) return true;
    // An empty required-permissions list must DENY for a non-admin, not pass via
    // the vacuous truth of Array.every(). This keeps it consistent with
    // hasAnyPermission([]) (which returns false) and avoids a default-allow hole.
    if (permissions.length === 0) return false;
    return permissions.every((p) => !!identity.permissions && identity.permissions.includes(p));
  };

  const hasAnyRole = (roles: string[]) => {
    if (!identity) return false;
    if (isAdmin()) return true;
    return roles.some((r) => identity.role === r || (identity.roles && identity.roles.includes(r)));
  };

  return { 
    isAdmin, 
    hasRole, 
    can, 
    hasAnyPermission, 
    hasAllPermissions, 
    hasAnyRole, 
    identity
  };
};

/**
 * Server-side helper to get permissions for the current user.
 * Call this in Server Components or Server Actions.
 * Note: The actual user fetching should be provided by the caller or injected to keep this utility generic.
 */
export const createServerPermissionChecker = async (fetchIdentity: () => Promise<IIdentity | null>): Promise<IPermissionChecker> => {
  try {
    const identity = await fetchIdentity();
    return createPermissionChecker(identity);
  } catch (error) {
    console.error("Failed to fetch identity for server-side permission check:", error);
    return createPermissionChecker(null);
  }
};
