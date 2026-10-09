<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workshop\StoreWorkshopRequest;
use App\Http\Requests\Workshop\UpdateWorkshopRequest;
use App\Http\Resources\WorkshopResource;
use App\Models\Workshop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class WorkshopController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Workshop::class);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:20'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'has_seats' => ['nullable'],
            'min_seats' => ['nullable', 'integer', 'min:1'],
            'sort' => ['nullable', 'string', 'in:starts_at,-starts_at,title,-title,created_at,-created_at'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $sort = $filters['sort'] ?? 'starts_at';
        $direction = 'asc';
        if (str_starts_with($sort, '-')) {
            $sort = substr($sort, 1);
            $direction = 'desc';
        }

        $workshops = Workshop::query()
            ->withSeatCounts()
            ->filter($filters)
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();

        return WorkshopResource::collection($workshops);
    }

    public function show(Workshop $workshop): WorkshopResource
    {
        Gate::authorize('view', $workshop);

        $workshop->loadCount([
            'registrations as active_registrations_count' => fn ($q) => $q->where('status', 'active'),
        ]);

        return new WorkshopResource($workshop);
    }

    public function store(StoreWorkshopRequest $request): JsonResponse
    {
        Gate::authorize('create', Workshop::class);

        $workshop = Workshop::create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        $workshop->refresh()->loadCount([
            'registrations as active_registrations_count' => fn ($q) => $q->where('status', 'active'),
        ]);

        return (new WorkshopResource($workshop))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateWorkshopRequest $request, Workshop $workshop): WorkshopResource
    {
        Gate::authorize('update', $workshop);

        $data = $request->validated();

        DB::transaction(function () use ($workshop, $data, $request) {
            $locked = Workshop::whereKey($workshop->getKey())->lockForUpdate()->firstOrFail();

            if (isset($data['capacity']) && $data['capacity'] < $locked->active_registrations_count) {
                abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Cannot reduce capacity below the number of active registrations ('.$locked->active_registrations_count.').');
            }

            $locked->update([
                ...$data,
                'updated_by' => $request->user()->id,
            ]);

            $workshop->refresh();
        });

        $workshop->loadCount([
            'registrations as active_registrations_count' => fn ($q) => $q->where('status', 'active'),
        ]);

        return new WorkshopResource($workshop);
    }
}
