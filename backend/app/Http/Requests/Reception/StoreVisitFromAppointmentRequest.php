<?php

declare(strict_types=1);

namespace App\Http\Requests\Reception;

use App\Models\ClinicRoom;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Request validation for creating a Visit from an Appointment.
 */
class StoreVisitFromAppointmentRequest extends FormRequest
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
            'appointment_id' => [
                'required',
                'integer',
                'exists:appointments,id',
            ],
            'clinic_room_id' => [
                'nullable',
                'integer',
                'exists:clinic_rooms,id',
            ],
            'is_priority' => [
                'sometimes',
                'boolean',
            ],
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param \Illuminate\Validation\Validator $validator
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $data = $this->all();

            // Validate clinic_room is active if provided
            if (!empty($data['clinic_room_id'])) {
                $room = ClinicRoom::find($data['clinic_room_id']);
                if ($room && !$room->is_active) {
                    $validator->errors()->add(
                        'clinic_room_id',
                        trans('reception.errors.room_invalid'),
                    );
                }
            }
        });
    }

    /**
     * Get custom display names for validation attributes.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'appointment_id' => trans('reception.attributes.appointment'),
            'clinic_room_id' => trans('reception.attributes.clinic_room'),
            'is_priority' => trans('reception.attributes.is_priority'),
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
            'appointment_id.required' => trans('reception.errors.appointment_id_required'),
            'appointment_id.exists' => trans('reception.errors.appointment_not_found'),
            'clinic_room_id.exists' => trans('reception.errors.room_invalid'),
        ];
    }
}
