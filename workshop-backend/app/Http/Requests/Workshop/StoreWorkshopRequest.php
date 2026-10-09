<?php

namespace App\Http\Requests\Workshop;

use App\Enums\WorkshopStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWorkshopRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'location' => ['nullable', 'string', 'max:255'],
            'starts_at' => ['required', 'date', 'after:now'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'capacity' => ['required', 'integer', 'min:1', 'max:1000'],
            'status' => ['sometimes', Rule::enum(WorkshopStatus::class)],
        ];
    }

    public function messages(): array
    {
        return [
            'starts_at.after' => 'The workshop must start in the future.',
            'ends_at.after' => 'The end time must be after the start time.',
            'capacity.min' => 'A workshop must have at least 1 seat.',
        ];
    }
}
