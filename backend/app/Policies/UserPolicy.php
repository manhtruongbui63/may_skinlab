<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy extends BasePolicy
{
    /**
     * Determine whether the user can view any models.
     *
     * Admin: View all users
     * Member: Only view users within the same team/scope (if any)
     */
    public function viewAny(User $user): bool
    {
        // Admin has permission to view all
        if ($this->isAdmin($user)) {
            return true;
        }

        // Member can view limited list
        return $this->hasRole($user, 'member');
    }

    /**
     * Determine whether the user can view the model.
     *
     * Admin: View all
     * Member: View own only
     * Others: 403
     */
    public function view(User $user, User $model): bool
    {
        // Admin can view all
        if ($this->isAdmin($user)) {
            return true;
        }

        // Member can only view their own profile
        return $user->id === $model->id;
    }

    /**
     * Determine whether the user can create models.
     *
     * Only Admin can create new users
     */
    public function create(User $user): bool
    {
        return $this->isAdmin($user);
    }

    /**
     * Determine whether the user can update the model.
     *
     * Admin: Edit all
     * Member: Edit own only
     */
    public function update(User $user, User $model): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->id === $model->id;
    }

    /**
     * Determine whether the user can delete the model.
     *
     * Only Admin can delete users
     * Cannot delete self
     */
    public function delete(User $user, User $model): bool
    {
        if (!$this->isAdmin($user)) {
            return false;
        }

        // Admin cannot delete themselves
        return $user->id !== $model->id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, User $model): bool
    {
        return $this->isAdmin($user);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, User $model): bool
    {
        return $this->isAdmin($user);
    }

    /**
     * Determine whether the user can change role of the model.
     *
     * Only Admin can change roles
     * Cannot change own role
     */
    public function changeRole(User $user, User $model): bool
    {
        if (!$this->isAdmin($user)) {
            return false;
        }

        return $user->id !== $model->id;
    }

    /**
     * Determine whether the user can export user data.
     *
     * Only Admin can export
     */
    public function export(User $user): bool
    {
        return $this->isAdmin($user);
    }

    /**
     * Determine whether the user can bulk delete users.
     */
    public function bulkDelete(User $user): bool
    {
        return $this->isAdmin($user);
    }
}
