<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Workshop */
class WorkshopResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'title' => $this->title,
            'instructor' => $this->instructor,
            'description' => $this->description,
            'location' => $this->location,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'capacity' => $this->capacity,
            'status' => $this->status->value,
            'active_registrations_count' => $this->active_registrations_count,
            'available_seats' => $this->available_seats,
            'is_full' => $this->is_full,
            'is_open_for_booking' => $this->isOpenForBooking(),
            'created_by' => new UserResource($this->whenLoaded('creator')),
            'updated_by' => new UserResource($this->whenLoaded('updater')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
