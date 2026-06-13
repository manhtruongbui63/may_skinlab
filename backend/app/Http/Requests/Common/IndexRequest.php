<?php

namespace App\Http\Requests\Common;

use Illuminate\Foundation\Http\FormRequest;

class IndexRequest extends FormRequest
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
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:' . config('validate.pagination.max_per_page', 100),
            ],
            'orders' => ['nullable', 'array'],
            'orders.*.key' => ['required_with:orders', 'string'],
            'orders.*.dir' => ['required_with:orders', 'string', 'in:asc,desc,ASC,DESC'],
            'filters' => ['nullable', 'array'],
            'filters.*.key' => ['required_with:filters', 'string'],
            'filters.*.data' => ['nullable'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'search' => trans('attributes.search'),
            'page' => trans('attributes.page'),
            'per_page' => trans('attributes.per_page'),
            'orders' => trans('attributes.orders'),
            'filters' => trans('attributes.filters'),
        ];
    }
}
