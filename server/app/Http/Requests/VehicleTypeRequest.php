<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VehicleTypeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $id = $this->route('vehicle_type') ? $this->route('vehicle_type')->id : null;

        return [
            'vehicle_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('vehicle_types', 'vehicle_name')->ignore($id)->whereNull('deleted_at'),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive'])],
        ];
    }
}
