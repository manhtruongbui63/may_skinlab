<?php

declare(strict_types=1);

namespace App\Enums;

use App\Traits\Enums\HasEnumStaticMethods;

enum RegistrationTypeEnum: int
{
    use HasEnumStaticMethods;

    case WALK_IN = 1;
    case SCHEDULED = 2;

    public function label(): string
    {
        return match ($this) {
            self::WALK_IN => trans('enums.registration_type.walk_in'),
            self::SCHEDULED => trans('enums.registration_type.scheduled'),
        };
    }
}
