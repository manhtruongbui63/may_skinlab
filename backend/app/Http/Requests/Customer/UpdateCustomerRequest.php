<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use App\Enums\CustomerSourceEnum;
use App\Enums\CustomerStatusEnum;
use App\Enums\GenderEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Request validation for customer update.
 */
class UpdateCustomerRequest extends FormRequest
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
        $customer = $this->route('customer');
        $customerId = $customer instanceof \App\Models\Customer ? $customer->id : $customer;

        return [
            'full_name' => ['sometimes', 'string', 'max:255'],
            'phone' => [
                'sometimes',
                'string',
                'max:50',
                'regex:/^\+?[0-9]{7,15}$/',
                Rule::unique('customers', 'phone')->ignore($customerId),
            ],
            'phone_secondary' => ['nullable', 'string', 'max:50', 'regex:/^\+?[0-9]{7,15}$/'],
            'birth_date' => ['sometimes', 'date_format:Y-m-d', 'before_or_equal:today'],
            'gender' => ['sometimes', 'integer', 'in:' . implode(',', GenderEnum::values())],
            'house_number' => ['nullable', 'string', 'max:255'],
            'province_id' => ['nullable', 'integer', 'exists:provinces,id'],
            'ward_id' => ['nullable', 'integer', 'exists:wards,id'],
            'address' => ['nullable', 'string', 'max:255'],
            'is_address_manually_edited' => ['nullable', 'boolean'],
            'avatar_path' => ['nullable', 'string', 'max:255'],
            'source' => ['nullable', 'integer', 'in:' . implode(',', CustomerSourceEnum::values())],
            'status' => ['sometimes', 'integer', 'in:' . implode(',', CustomerStatusEnum::values())],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function ($validator) {
            $provinceId = $this->province_id ?? ($this->route('customer') instanceof \App\Models\Customer ? $this->route('customer')->province_id : null);
            $wardId = $this->ward_id;

            if ($wardId && $provinceId) {
                $exists = \Illuminate\Support\Facades\DB::table('wards')
                    ->where('id', $wardId)
                    ->where('province_id', $provinceId)
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
