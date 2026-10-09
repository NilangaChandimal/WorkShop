<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', User::class);

        $users = User::query()
            ->when($request->string('search')->toString(), function ($q, string $search) {
                $q->where(fn ($inner) => $inner->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
            })
            ->when($request->string('role')->toString(), fn ($q, string $role) => $q->where('role', $role))
            ->orderBy('name')
            ->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request): UserResource
    {
        Gate::authorize('create', User::class);

        $user = User::create($request->validated());

        return new UserResource($user);
    }

    public function show(User $user): UserResource
    {
        Gate::authorize('view', $user);

        return new UserResource($user);
    }

    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        Gate::authorize('update', $user);

        $data = $request->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        }

        DB::transaction(function () use ($user, $data) {
            $user->update($data);

            // Revoke sessions when access level changes so the new role applies immediately.
            if ($user->wasChanged(['role', 'is_active', 'password'])) {
                $user->tokens()->delete();
            }
        });

        return new UserResource($user->refresh());
    }
}
