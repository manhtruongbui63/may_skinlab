<?php

declare(strict_types=1);

namespace App\Http\Requests\Appointment;

use App\Enums\AppointmentStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Request validation for appointment update.
 */
class UpdateAppointmentRequest extends FormRequest
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
            'appointment_date' => [
                'sometimes',
                'nullable',
                'date',
                'date_format:Y-m-d',
            ],
            'appointment_time' => [
                'sometimes',
                'nullable',
                'string',
                'date_format:H:i',
                'regex:/^\d{2}:(00|30)$/',
            ],
            'status' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::enum(AppointmentStatusEnum::class),
            ],
            'note' => [
                'sometimes',
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
            'appointment_date' => trans('attributes.appointment_date'),
            'appointment_time' => trans('attributes.appointment_time'),
            'status' => trans('attributes.status'),
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
        ];
    }
}
