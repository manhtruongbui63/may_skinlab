<?php

declare(strict_types=1);

namespace App\Enums;

use App\Traits\Enums\HasEnumStaticMethods;

enum GenderEnum: int
{
    use HasEnumStaticMethods;

    case MALE = 1;
    case FEMALE = 2;
    case OTHER = 3;

    public function label(): string
    {
        return match ($this) {
            self::MALE => trans('enums.gender.male'),
            self::FEMALE => trans('enums.gender.female'),
            self::OTHER => trans('enums.gender.other'),
        };
    }
}
