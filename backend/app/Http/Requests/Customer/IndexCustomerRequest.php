<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use App\Enums\CustomerSourceEnum;
use App\Enums\CustomerStatusEnum;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Request validation for customer list endpoint.
 */
class IndexCustomerRequest extends FormRequest
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
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'province_id' => ['nullable', 'integer', 'exists:provinces,id'],
            'source' => ['nullable', 'integer', 'in:' . implode(',', CustomerSourceEnum::values())],
            'status' => ['nullable', 'integer', 'in:' . implode(',', CustomerStatusEnum::values())],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
