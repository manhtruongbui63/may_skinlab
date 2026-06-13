<?php

namespace App\Services\Base;

use App\Models\User;

abstract class Service
{
    /**
     * @var null|User
     */
    protected $user = null;

    /**
     * @var string
     */
    protected string $guard;

    /**
     * @param User|null $user
     * @return $this
     */
    public function withUser($user)
    {
        $this->user = $user;

        return $this;
    }

    /**
     * @return User|null
     */
    public function getUser(): User|null
    {
        return $this->user;
    }

    /**
     * Set the guard to be used during authentication.
     *
     * @param string $guard
     * @return $this
     */
    public function withGuard(string $guard): static
    {
        $this->guard = $guard;

        return $this;
    }

    /**
     * Get the guard to be used during authentication.
     *
     * @return string
     */
    protected function getGuard(): string
    {
        return $this->guard ?? config('auth.defaults.guard');
    }
}
