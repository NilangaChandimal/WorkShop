<?php

namespace App\Models;

use App\Enums\RegistrationStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

#[Fillable([
    'workshop_id',
    'attendee_name',
    'attendee_email',
    'attendee_phone',
    'status',
    'registered_by',
    'cancelled_by',
    'cancelled_at',
])]
class Registration extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'status' => RegistrationStatus::class,
            'cancelled_at' => 'datetime',
        ];
    }

    public function workshop(): BelongsTo
    {
        return $this->belongsTo(Workshop::class);
    }

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function isActive(): bool
    {
        return $this->status === RegistrationStatus::Active;
    }

    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('status', RegistrationStatus::Active);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    #[Scope]
    protected function filter(Builder $query, array $filters): void
    {
        $query
            ->when($filters['workshop_id'] ?? null, fn (Builder $q, $id) => $q->where('workshop_id', $id))
            ->when($filters['status'] ?? null, fn (Builder $q, string $status) => $q->where('status', $status))
            ->when($filters['search'] ?? null, function (Builder $q, string $search) {
                $q->where(function (Builder $inner) use ($search) {
                    $inner->where('attendee_name', 'like', "%{$search}%")
                        ->orWhere('attendee_email', 'like', "%{$search}%");
                });
            })
            ->when($filters['date_from'] ?? null, fn (Builder $q, string $from) => $q->where('created_at', '>=', Carbon::parse($from)->startOfDay()))
            ->when($filters['date_to'] ?? null, fn (Builder $q, string $to) => $q->where('created_at', '<=', Carbon::parse($to)->endOfDay()));
    }
}
