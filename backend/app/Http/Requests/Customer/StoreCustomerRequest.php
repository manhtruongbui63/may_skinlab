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
            'phone_secondary' => ['nullable', 'string', 'max:50', 'regex:/^\+?[0-9]{7,15}$/'],
            'birth_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'gender' => ['required', 'integer', 'in:' . implode(',', GenderEnum::values())],
            'house_number' => ['nullable', 'string', 'max:255'],
            'province_id' => ['nullable', 'integer', 'exists:provinces,id'],
            'ward_id' => ['nullable', 'integer', 'exists:wards,id'],
            'address' => ['nullable', 'string', 'max:255'],
            'is_address_manually_edited' => ['nullable', 'boolean'],
            'avatar_path' => ['nullable', 'string', 'max:255'],
            'source' => ['nullable', 'integer', 'in:' . implode(',', CustomerSourceEnum::values())],
            'status' => ['required', 'integer', 'in:' . implode(',', CustomerStatusEnum::values())],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($this->ward_id && $this->province_id) {
                $exists = \Illuminate\Support\Facades\DB::table('wards')
                    ->where('id', $this->ward_id)
                    ->where('province_id', $this->province_id)
                    ->exists();

                if (!$exists) {
                    $validator->errors()->add('ward_id', trans('validation.ward_not_in_province'));
                }
            }
        });
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
