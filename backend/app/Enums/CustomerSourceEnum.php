<?php

declare(strict_types=1);

namespace App\Enums;

use App\Traits\Enums\HasEnumStaticMethods;

enum CustomerSourceEnum: int
{
    use HasEnumStaticMethods;

    case FACEBOOK = 1;
    case GOOGLE = 2;
    case WEBSITE = 3;
    case REFERRAL = 4;
    case OTHER = 5;

    public function label(): string
    {
        return match ($this) {
            self::FACEBOOK => trans('enums.customer_source.facebook'),
            self::GOOGLE => trans('enums.customer_source.google'),
            self::WEBSITE => trans('enums.customer_source.website'),
            self::REFERRAL => trans('enums.customer_source.referral'),
            self::OTHER => trans('enums.customer_source.other'),
        };
    }
}
