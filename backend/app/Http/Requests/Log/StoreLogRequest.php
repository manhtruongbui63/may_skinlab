<?php

namespace App\Http\Requests\Log;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Psr\Log\LogLevel;

class StoreLogRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * The endpoint is intentionally public: client errors must be captured
     * even when no user is authenticated (e.g. on the login screen).
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * The PSR-3 log levels a client is allowed to emit.
     *
     * @return array<int, string>
     */
    public static function allowedLevels(): array
    {
        return [
            LogLevel::DEBUG,
            LogLevel::INFO,
            LogLevel::NOTICE,
            LogLevel::WARNING,
            LogLevel::ERROR,
            LogLevel::CRITICAL,
            LogLevel::ALERT,
            LogLevel::EMERGENCY,
        ];
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'logs' => ['required', 'array', 'min:1', 'max:' . config('validate.log.max_batch')],
            'logs.*.level' => ['required', 'string', Rule::in(self::allowedLevels())],
            'logs.*.message' => ['required', 'string', 'max:' . config('validate.log.max_message')],
            'logs.*.context' => ['nullable', 'array'],
            'logs.*.timestamp' => ['nullable', 'string', 'max:40'],
        ];
    }
}
