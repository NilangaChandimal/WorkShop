<?php

namespace App\Http\Requests\Registration;

use Illuminate\Foundation\Http\FormRequest;

class StoreRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'attendee_name' => ['required', 'string', 'max:255'],
            'attendee_email' => ['required', 'string', 'email', 'max:255'],
            'attendee_phone' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+\-\s()]+$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'attendee_name.required' => 'Please enter the attendee\'s name.',
            'attendee_email.required' => 'Please enter the attendee\'s email address.',
            'attendee_email.email' => 'Please enter a valid email address.',
            'attendee_phone.regex' => 'The phone number may only contain digits, spaces, +, - and brackets.',
        ];
    }
}
