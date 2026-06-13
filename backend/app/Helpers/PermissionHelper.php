<?php

namespace App\Helpers;

use Illuminate\Database\Eloquent\Collection;

class PermissionHelper
{
    /**
     * Map roles to include code and localized name.
     *
     * @param Collection $roles
     * @return array
     */
    public static function mapRoles(Collection $roles): array
    {
        return $roles->map(fn ($role) => [
            'code' => $role->name,
            'name' => trans("roles.{$role->name}"),
        ])->toArray();
    }

    /**
     * Map permissions to include code and localized name.
     *
     * @param Collection $permissions
     * @return array
     */
    public static function mapPermissions(Collection $permissions): array
    {
        return $permissions->map(fn ($permission) => [
            'code' => $permission->name,
            'name' => trans("permissions.{$permission->name}"),
        ])->toArray();
    }
}
