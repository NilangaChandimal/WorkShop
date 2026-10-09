<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Registration */
class RegistrationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workshop_id' => $this->workshop_id,
            'attendee_name' => $this->attendee_name,
            'attendee_email' => $this->attendee_email,
            'attendee_phone' => $this->attendee_phone,
            'status' => $this->status->value,
            'workshop' => $this->whenLoaded('workshop', fn () => [
                'id' => $this->workshop->id,
                'code' => $this->workshop->code,
                'title' => $this->workshop->title,
                'instructor' => $this->workshop->instructor,
                'starts_at' => $this->workshop->starts_at?->toIso8601String(),
                'location' => $this->workshop->location,
            ]),
            'registered_by' => new UserResource($this->whenLoaded('registeredBy')),
            'cancelled_by' => new UserResource($this->whenLoaded('cancelledBy')),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
