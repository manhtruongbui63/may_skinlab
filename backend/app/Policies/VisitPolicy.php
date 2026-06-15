<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;
use App\Models\Visit;

class VisitPolicy
{
    /**
     * Determine if the user can delete the visit.
     *
     * Only admin and manager roles can delete visits.
     *
     * @param User $user
     * @param Visit $visit
     * @return bool
     */
    public function delete(User $user, Visit $visit): bool
    {
        return $user->hasRole(['admin', 'manager']);
    }
}
