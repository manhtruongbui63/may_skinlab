<?php

namespace App\Helpers;

use Carbon\Carbon;

class DateHelper
{
    /**
     * @param $date
     * @return string|null
     */
    public static function dateBirth($date): ?string
    {
        return $date ? Carbon::parse($date)->format(config('common.date_format.fe_date_birth')) : null;
    }

    /**
     * @param $date
     * @return string|null
     */
    public static function formatDate($date): ?string
    {
        return $date ? Carbon::parse($date)->format(config('common.date_format.fe_date_format')) : null;
    }

    /**
     * @param $date
     * @return string|null
     */
    public static function formatMonth($date): ?string
    {
        return $date ? Carbon::parse($date)->format(config('common.date_format.fe_month_format')) : null;
    }

    /**
     * Format datetime
     *
     * @param $time
     * @return string|null
     */
    public static function formatDateTime($time): ?string
    {
        return $time ? Carbon::parse($time)->format(config('common.date_format.fe_datetime_format')) : null;
    }

    /**
     * Format datetime not seconds
     *
     * @param $time
     * @return string|null
     */
    public static function formatDateTimeNotSecond($time): ?string
    {
        return $time ? Carbon::parse($time)->format(config('common.date_format.fe_datetime_format_not_second')) : null;
    }

    /**
     * @param $date
     * @return string|null
     */
    public static function formatHour($date): ?string
    {
        return $date ? Carbon::parse($date)->format(config('common.date_format.fe_hour_format')) : null;
    }

    /**
     * Get day of week
     *
     * @param $date
     * @return string|null
     */
    public static function getDayOfWeek($date): ?string
    {
        if (!$date) {
            return null;
        }

        $carbonDate = Carbon::parse($date);
        $dayOfWeek = $carbonDate->dayOfWeek;

        $daysInJapanese = [
            '日', // Sunday
            '月', // Monday
            '火', // Tuesday
            '水', // Wednesday
            '木', // Thursday
            '金', // Friday
            '土', // Saturday
        ];

        return $daysInJapanese[$dayOfWeek];
    }

    /**
     * Format date jp
     *
     * @param $date
     * @return string|null
     */
    public static function formatDateJp($date): ?string
    {
        if (!$date) {
            return null;
        }
        $dayOfWeek = static::getDayOfWeek($date);
        $date = Carbon::parse($date)->format(config('common.date_format.fe_date_jp'));

        return $date . ' (' . $dayOfWeek . ')';
    }

    /**
     * @param $date
     * @return string|null
     */
    public static function formatDateTimeDB($date): ?string
    {
        if (!$date) {
            return null;
        }

        return Carbon::parse($date)->format(config('common.date_format.db_datetime_format'));
    }
}
