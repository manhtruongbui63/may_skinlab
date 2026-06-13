<?php

namespace App\Policies;

use App\Models\User;

abstract class BasePolicy
{
    /**
     * Check if user has specific role.
     */
    protected function hasRole(User $user, string $role): bool
    {
        return $user->hasRole($role);
    }

    /**
     * Check if user has any of the given roles.
     *
     * @param array<string> $roles
     */
    protected function hasAnyRole(User $user, array $roles): bool
    {
        return $user->hasAnyRole($roles);
    }

    /**
     * Check if user has specific permission.
     */
    protected function hasPermission(User $user, string $permission): bool
    {
        return $user->hasDirectPermission($permission);
    }

    /**
     * Check if user has any of the given permissions.
     *
     * @param array<string> $permissions
     */
    protected function hasAnyPermission(User $user, array $permissions): bool
    {
        return $user->hasAnyDirectPermission($permissions);
    }

    /**
     * Check if user is admin.
     */
    protected function isAdmin(User $user): bool
    {
        return $this->hasRole($user, 'admin');
    }
}
