<?php

namespace App\Policies;

use App\Models\Image;
use App\Models\User;

class ImagePolicy extends BasePolicy
{
    /**
     * Determine whether the user can upload images.
     *
     * Only authenticated users can upload images.
     * Admin can upload unlimited images.
     * Regular users have daily upload limits enforced at service level.
     */
    public function upload(User $user): bool
    {
        // All authenticated users can upload images
        // Additional limits (daily quota, storage) enforced in service layer
        return true;
    }

    /**
     * Determine whether the user can view the image.
     */
    public function view(User $user, Image $image): bool
    {
        // Admin can view all images
        if ($this->isAdmin($user)) {
            return true;
        }

        // Users can view their own images
        return (int) $image->imageable_id === (int) $user->id
            && $image->imageable_type === User::class;
    }

    /**
     * Determine whether the user can delete the image.
     */
    public function delete(User $user, Image $image): bool
    {
        // Admin can delete any image
        if ($this->isAdmin($user)) {
            return true;
        }

        // Users can delete their own images
        return (int) $image->imageable_id === (int) $user->id
            && $image->imageable_type === User::class;
    }

    /**
     * Determine whether the user can view any images.
     */
    public function viewAny(User $user): bool
    {
        return $this->isAdmin($user);
    }
}
