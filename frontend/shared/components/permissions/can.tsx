import { usePermission } from '@/shared/hooks/use-permission'
import React from 'react'

export type CanProps = {
  permission?: string
  resourceOwnerId?: string // Added for resource-level permission
  permissions?: string[]
  matchAll?: boolean
  role?: string
  roles?: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const Can = ({
  permission,
  resourceOwnerId,
  permissions,
  matchAll = false,
  role,
  roles,
  children,
  fallback = null
}: CanProps) => {
  const { can, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } =
    usePermission()

  let isAllowed = false

  if (permission) {
    isAllowed = can(permission, resourceOwnerId)
  } else if (permissions && permissions.length > 0) {
    isAllowed = matchAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions)
  } else if (role) {
    isAllowed = hasRole(role)
  } else if (roles && roles.length > 0) {
    isAllowed = hasAnyRole(roles)
  }

  return isAllowed ? <>{children}</> : <>{fallback}</>
}

// Alias for PermissionGuard
export const PermissionGuard = Can
