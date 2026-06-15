<?php

declare(strict_types=1);

namespace App\Http\Requests\Reception;

use App\Enums\VisitStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Request validation for listing Visits with filters.
 */
class IndexVisitRequest extends FormRequest
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
            'from' => [
                'nullable',
                'date',
                'date_format:Y-m-d',
            ],
            'to' => [
                'nullable',
                'date',
                'date_format:Y-m-d',
                'after_or_equal:from',
            ],
            'status' => [
                'nullable',
                'integer',
                Rule::enum(VisitStatusEnum::class),
            ],
            'per_page' => [
                'nullable',
                'integer',
                'between:1,100',
            ],
            'page' => [
                'nullable',
                'integer',
                'min:1',
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
            $from = $this->input('from');
            $to = $this->input('to') ?? $from;

            // Skip if both are empty (defaults will apply)
            if (empty($from) && empty($this->input('to'))) {
                return;
            }

            if ($from && $to) {
                $fromDate = Carbon::parse($from);
                $toDate = Carbon::parse($to);

                // Same month check
                if ($fromDate->format('Y-m') !== $toDate->format('Y-m')) {
                    $validator->errors()->add('from', trans('reception.errors.date_range_same_month'));
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
            'from' => trans('reception.attributes.from_date'),
            'to' => trans('reception.attributes.to_date'),
            'status' => trans('reception.attributes.status'),
            'per_page' => trans('reception.attributes.per_page'),
            'page' => trans('reception.attributes.page'),
        ];
    }
}
