<?php

namespace App\Http\Requests;

use App\Models\Employee;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $employeeId = $this->route('user') ?? $this->route('employee');
        if (is_string($employeeId) && !is_numeric($employeeId)) {
            $employee = Employee::where('slug', $employeeId)->first();
            $employeeId = $employee?->id;
        }

        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'suffix_1name' => ['nullable', 'string', 'max:255'],
            'suffix_name' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],

            'username' => ['required', 'string', 'max:255', Rule::unique('employees', 'username')->ignore($employeeId)],

            'email' => [
                'required',
                'email',
                Rule::unique('employees', 'email')->ignore($employeeId),
            ],
            'phone' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('employees', 'phone')->ignore($employeeId),
            ],
            'role' => [
                'required',
                'string',
                Rule::in(['admin', 'operator', 'officer']),
            ],

            'password' => [
                $this->isMethod('post') ? 'required' : 'nullable',
                'string',
                Password::min(8)->mixedCase()->numbers()->symbols(),
                'confirmed',
            ],

            'password_confirmation' => [
                $this->isMethod('post') ? 'required' : 'nullable',
                'string',
                Password::min(8)->mixedCase()->numbers()->symbols(),
            ],

            'avatar' => ['nullable', 'image', 'max:25000'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.max' => 'The contact number must not exceed 20 characters.',
            'avatar.image' => 'The profile picture must be a valid image file (jpeg, png, bmp, gif, or svg).',
            'avatar.max' => 'The image size is too large. Please upload an avatar smaller than 25MB.',
        ];
    }
}
