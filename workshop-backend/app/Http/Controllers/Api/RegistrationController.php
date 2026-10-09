<?php

namespace App\Http\Controllers\Api;

use App\Enums\RegistrationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Registration\StoreRegistrationRequest;
use App\Http\Resources\RegistrationResource;
use App\Models\Registration;
use App\Models\Workshop;
use App\Services\RegistrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class RegistrationController extends Controller
{
    public function __construct(private readonly RegistrationService $registrations)
    {
    }

    /**
     * Registration history. Optional filters: workshop_id, status, search, date_from, date_to.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Registration::class);

        $filters = $request->validate([
            'workshop_id' => ['nullable', 'integer', 'exists:workshops,id'],
            'status' => ['nullable', Rule::enum(RegistrationStatus::class)],
            'search' => ['nullable', 'string', 'max:255'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $registrations = Registration::query()
            ->with(['workshop', 'registeredBy', 'cancelledBy'])
            ->filter($filters)
            ->latest()
            ->latest('id')
            ->paginate($filters['per_page'] ?? 20)
            ->withQueryString();

        return RegistrationResource::collection($registrations);
    }

    public function store(StoreRegistrationRequest $request, Workshop $workshop): JsonResponse
    {
        Gate::authorize('create', Registration::class);

        $registration = $this->registrations->register($workshop, $request->validated(), $request->user());

        return (new RegistrationResource($registration))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function cancel(Request $request, Registration $registration): RegistrationResource
    {
        Gate::authorize('cancel', $registration);

        return new RegistrationResource(
            $this->registrations->cancel($registration, $request->user())
        );
    }
}
