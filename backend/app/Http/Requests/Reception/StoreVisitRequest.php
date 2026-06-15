<?php

declare(strict_types=1);

namespace App\Http\Requests\Reception;

use App\Enums\RegistrationTypeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Request validation for creating a new Visit.
 */
class StoreVisitRequest extends FormRequest
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
            'registration_type' => [
                'required',
                'integer',
                Rule::in([RegistrationTypeEnum::WALK_IN->value, RegistrationTypeEnum::SCHEDULED->value]),
            ],
            'appointment_date' => [
                'nullable',
                'date',
            ],
            'is_priority' => [
                'sometimes',
                'boolean',
            ],
            'clinic_room_id' => [
                'nullable',
                'integer',
                'exists:clinic_rooms,id',
            ],
            'service_ids' => [
                'nullable',
                'array',
                'min:1',
            ],
            'service_ids.*' => [
                'integer',
                'exists:services,id',
            ],
            'service_package_ids' => [
                'nullable',
                'array',
            ],
            'service_package_ids.*' => [
                'integer',
                'exists:service_packages,id',
            ],
            'reason' => [
                'nullable',
                'string',
                'max:500',
            ],
            'customer_id' => [
                'nullable',
                'integer',
                'exists:customers,id',
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
            $registrationType = (int) ($data['registration_type'] ?? 0);

            // WALK_IN (1): clinic_room_id is required
            if ($registrationType === RegistrationTypeEnum::WALK_IN->value) {

                // clinic_room_id is required
                if (empty($data['clinic_room_id'])) {
                    $validator->errors()->add(
                        'clinic_room_id',
                        trans('reception.errors.room_required'),
                    );
                } else {
                    // Validate room is_active
                    $room = \App\Models\ClinicRoom::find($data['clinic_room_id']);
                    if ($room && !$room->is_active) {
                        $validator->errors()->add(
                            'clinic_room_id',
                            trans('reception.errors.room_invalid'),
                        );
                    }
                }

                // service_ids is required
                if (empty($data['service_ids']) || !is_array($data['service_ids']) || count($data['service_ids']) === 0) {
                    $validator->errors()->add(
                        'service_ids',
                        trans('reception.errors.service_required'),
                    );
                }
            }

            // SCHEDULED (2): appointment_date is required
            if ($registrationType === RegistrationTypeEnum::SCHEDULED->value) {
                if (empty($data['appointment_date'])) {
                    $validator->errors()->add(
                        'appointment_date',
                        trans('reception.errors.date_required_for_scheduled'),
                    );
                } else {
                    try {
                        $apptDate = \Illuminate\Support\Carbon::parse($data['appointment_date']);
                        if (!$apptDate->isAfter(today())) {
                            $validator->errors()->add(
                                'appointment_date',
                                trans('reception.errors.date_must_be_future'),
                            );
                        }
                    } catch (\Exception) {
                        $validator->errors()->add(
                            'appointment_date',
                            trans('validation.date'),
                        );
                    }
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
            'registration_type' => trans('reception.attributes.registration_type'),
            'appointment_date' => trans('reception.attributes.appointment_date'),
            'is_priority' => trans('reception.attributes.is_priority'),
            'clinic_room_id' => trans('reception.attributes.clinic_room'),
            'service_ids' => trans('reception.attributes.services'),
            'service_package_ids' => trans('reception.attributes.service_packages'),
            'reason' => trans('reception.attributes.reason'),
            'customer_id' => trans('reception.attributes.customer'),
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
            'registration_type.in' => trans('reception.errors.registration_type_invalid'),
            'appointment_date.after' => trans('reception.errors.date_must_be_future'),
            'clinic_room_id.exists' => trans('reception.errors.room_invalid'),
            'service_ids.min' => trans('reception.errors.service_required'),
            'service_ids.*.exists' => trans('reception.errors.service_invalid'),
            'reason.max' => trans('reception.errors.reason_too_long'),
        ];
    }
}
