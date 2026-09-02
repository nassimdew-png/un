<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'birth_date' => 'required|date',
            'gender' => 'required|in:male,female',
            'guardian_name' => 'nullable|string|max:255',
            'phone' => 'required|string|max:255',
            'emergency_contact' => 'nullable|string|max:255',
            'kiosk_pin' => 'nullable|string|size:6',
            'anamnesis_data' => 'nullable|array',
        ];
    }
}
