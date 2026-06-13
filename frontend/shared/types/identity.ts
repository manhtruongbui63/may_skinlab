/**
 * Generic identity interface for permission checking.
 * Decoupled from specific feature user models.
 */
export interface IIdentity {
  id: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
}

/**
 * Interface for the permission checking module.
 */
export interface IPermissionChecker {
  identity: IIdentity | null;
  isAdmin: () => boolean;
  hasRole: (role: string) => boolean;
  can: (permission: string, resourceOwnerId?: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}
