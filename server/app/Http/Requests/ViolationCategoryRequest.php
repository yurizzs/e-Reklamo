<?php

namespace App\Http\Requests;

use App\Models\ViolationCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ViolationCategoryRequest extends FormRequest
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
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $violationCategory = $this->route('violation_category');

        return [
            'category_name' => ['required', 'string', 'max:255', Rule::unique('violation_categories', 'category_name')->ignore($violationCategory?->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'penalty_amount' => ['required', 'string', 'max:255'],
        ];
    }
}
