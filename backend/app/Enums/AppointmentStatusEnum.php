<?php

declare(strict_types=1);

namespace App\Enums;

use App\Traits\Enums\HasEnumStaticMethods;

enum AppointmentStatusEnum: int
{
    use HasEnumStaticMethods;

    case BOOKED = 1;
    case CONFIRMED = 2;
    case CHECKED_IN = 3;
    case COMPLETED = 4;
    case CANCELLED = 5;
    case NO_SHOW = 6;
    case OVERDUE = 7;

    public function label(): string
    {
        return match ($this) {
            self::BOOKED => trans('enums.appointment_status.booked'),
            self::CONFIRMED => trans('enums.appointment_status.confirmed'),
            self::CHECKED_IN => trans('enums.appointment_status.checked_in'),
            self::COMPLETED => trans('enums.appointment_status.completed'),
            self::CANCELLED => trans('enums.appointment_status.cancelled'),
            self::NO_SHOW => trans('enums.appointment_status.no_show'),
            self::OVERDUE => trans('enums.appointment_status.overdue'),
        };
    }
}
