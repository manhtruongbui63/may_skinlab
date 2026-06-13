<?php

declare(strict_types=1);

namespace App\Http\Requests\Appointment;

use App\Enums\CustomerStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Request validation for appointment creation.
 */
class StoreAppointmentRequest extends FormRequest
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
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'customer_id' => [
                'required',
                'integer',
                'min:1',
                Rule::exists('customers', 'id')
                    ->whereNull('deleted_at')
                    ->where('status', CustomerStatusEnum::ACTIVE->value),
            ],
            'appointment_date' => [
                'required',
                'date',
                'date_format:Y-m-d',
            ],
            'appointment_time' => [
                'required',
                'string',
                'date_format:H:i',
                'regex:/^\d{2}:(00|30)$/',
            ],
            'note' => [
                'nullable',
                'string',
                'max:' . config('validate.max_length.note'),
            ],
        ];
    }

    /**
     * Get custom display names for validation attributes.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'customer_id' => trans('attributes.customer'),
            'appointment_date' => trans('attributes.appointment_date'),
            'appointment_time' => trans('attributes.appointment_time'),
            'note' => trans('attributes.note'),
        ];
    }

    /**
     * Get custom error messages for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'appointment_time.regex' => trans('validation.custom.appointment_time.slot'),
            'customer_id.exists' => trans('validation.custom.customer_id.active'),
        ];
    }
}
