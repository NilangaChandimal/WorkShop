<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Registration;
use App\Models\User;

class RegistrationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole(Role::Manager, Role::Staff);
    }

    public function create(User $user): bool
    {
        return $user->hasRole(Role::Manager, Role::Staff);
    }

    public function cancel(User $user, Registration $registration): bool
    {
        return $user->hasRole(Role::Manager, Role::Staff);
    }
}
