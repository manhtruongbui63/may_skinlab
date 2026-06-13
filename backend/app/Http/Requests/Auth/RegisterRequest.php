<?php

namespace App\Http\Requests\Auth;

use App\Rules\PasswordRule;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge([
                'email' => strtolower($this->input('email')),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:' . config('validate.max_length.name')],
            'email' => ['required', 'email', 'max:' . config('validate.max_length.email'), 'unique:users,email'],
            'password' => ['required', 'string', 'max:' . config('validate.max_length.password'), new PasswordRule(), 'confirmed'],
        ];
    }
}
