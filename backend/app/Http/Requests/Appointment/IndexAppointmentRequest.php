<?php

declare(strict_types=1);

namespace App\Http\Requests\Appointment;

use App\Enums\AppointmentStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Request validation for listing appointments.
 */
class IndexAppointmentRequest extends FormRequest
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
            'date' => ['nullable', 'date', 'date_format:Y-m-d'],
            'status' => ['nullable', 'integer', Rule::enum(AppointmentStatusEnum::class)],
            'search' => ['nullable', 'string', 'max:' . config('validate.max_length.string')],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:' . config('validate.pagination.max_per_page')],
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
            'date' => trans('attributes.appointment_date'),
            'status' => trans('attributes.status'),
            'search' => trans('attributes.search'),
            'page' => trans('attributes.page'),
            'per_page' => trans('attributes.per_page'),
        ];
    }
}
