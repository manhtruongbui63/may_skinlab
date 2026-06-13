<?php

declare(strict_types=1);

namespace App\Enums;

use App\Traits\Enums\HasEnumStaticMethods;

enum CustomerStatusEnum: int
{
    use HasEnumStaticMethods;

    case INACTIVE = 0;
    case ACTIVE = 1;

    public function label(): string
    {
        return match ($this) {
            self::INACTIVE => trans('enums.customer_status.inactive'),
            self::ACTIVE => trans('enums.customer_status.active'),
        };
    }
}
