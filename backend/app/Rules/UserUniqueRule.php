<?php

namespace App\Rules;

use Closure;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;

class UserUniqueRule implements ValidationRule
{
    /**
     * @var $userId
     */
    protected $userId;

    /**
     * @var $messageKey
     */
    protected $messageKey;

    /**
     * Create a new rule instance.
     *
     * @param null $userId
     * @param null $messageKey
     */
    public function __construct($userId = null, $messageKey = null)
    {
        $this->userId = $userId;
        $this->messageKey = $messageKey;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $q = User::query()->where($attribute, $value);
        if ($this->userId) {
            $q->where('id', '<>', $this->userId);
        }

        $count = $q->count();
        if ($count) {
            $fail($this->messageKey ? trans($this->messageKey) : trans('validation.unique'));
        }
    }
}
