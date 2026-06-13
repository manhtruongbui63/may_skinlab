<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;

/**
 * Policy for Customer model.
 */
class CustomerPolicy
{
    /**
     * Determine whether the user can view any customers.
     *
     * @param User $user
     * @return bool
     */
    public function viewAny(User $user): bool
    {
        // Any authenticated user can view customers
        return true;
    }

    /**
     * Determine whether the user can view the customer.
     *
     * @param User $user
     * @param Customer $customer
     * @return bool
     */
    public function view(User $user, Customer $customer): bool
    {
        // Any authenticated user can view a customer
        return true;
    }

    /**
     * Determine whether the user can create customers.
     *
     * @param User $user
     * @return bool
     */
    public function create(User $user): bool
    {
        // Any authenticated user can create customers
        return true;
    }

    /**
     * Determine whether the user can update the customer.
     *
     * @param User $user
     * @param Customer $customer
     * @return bool
     */
    public function update(User $user, Customer $customer): bool
    {
        // Any authenticated user can update customers
        return true;
    }

    /**
     * Determine whether the user can delete the customer.
     *
     * @param User $user
     * @param Customer $customer
     * @return bool
     */
    public function delete(User $user, Customer $customer): bool
    {
        // Any authenticated user can delete customers
        return true;
    }
}
