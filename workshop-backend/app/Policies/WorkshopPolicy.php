<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\User;
use App\Models\Workshop;

class WorkshopPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole(Role::Manager, Role::Staff);
    }

    public function view(User $user, Workshop $workshop): bool
    {
        return $user->hasRole(Role::Manager, Role::Staff);
    }

    public function create(User $user): bool
    {
        return $user->isManager();
    }

    public function update(User $user, Workshop $workshop): bool
    {
        return $user->isManager();
    }
}
