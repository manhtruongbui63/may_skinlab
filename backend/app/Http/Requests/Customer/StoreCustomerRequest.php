<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use App\Enums\CustomerSourceEnum;
use App\Enums\CustomerStatusEnum;
use App\Enums\GenderEnum;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Request validation for customer creation.
 */
class StoreCustomerRequest extends FormRequest
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
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>|>string>
     */
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => [
                'required',
                'string',
                'max:50',
                'regex:/^\+?[0-9]{7,15}$/',
                'unique:customers,phone',
            ],
            'birth_date' => ['nullable', 'date_format:Y-m-d'],
            'gender' => ['nullable', 'integer', 'in:' . implode(',', GenderEnum::values())],
            'address' => ['nullable', 'string', 'max:1000'],
            'source' => ['nullable', 'integer', 'in:' . implode(',', CustomerSourceEnum::values())],
            'status' => ['nullable', 'integer', 'in:' . implode(',', CustomerStatusEnum::values())],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phone.unique' => trans('validation.custom.phone.unique'),
        ];
    }
}
