<?php

namespace App\Enums;

use App\Traits\Enums\HasEnumStaticMethods;

enum UserStatus: int
{
    use HasEnumStaticMethods;

    case INACTIVE = 0;
    case ACTIVE = 1;

    public function label(): string
    {
        return match ($this) {
            self::INACTIVE => trans('enums.user_status.inactive'),
            self::ACTIVE => trans('enums.user_status.active'),
        };
    }
}
