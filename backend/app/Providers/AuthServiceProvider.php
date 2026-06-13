<?php

namespace App\Providers;

use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        User::class => UserPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Super Admin - has all permissions
        Gate::before(function (User $user) {
            if ($user->hasRole('admin')) {
                return true;
            }

            return null;
        });

        // Role-based Gates
        Gate::define('role', function (User $user, string $role) {
            return $user->hasRole($role);
        });

        Gate::define('role_or', function (User $user, string ...$roles) {
            return $user->hasAnyRole($roles);
        });

        // Permission-based Gates
        Gate::define('permission', function (User $user, string $permission) {
            return $user->hasDirectPermission($permission);
        });

        Gate::define('permission_or', function (User $user, string ...$permissions) {
            return $user->hasAnyDirectPermission($permissions);
        });
    }
}
