<?php

namespace App\Helpers;

class NumberHelper
{
    /**
     * Format money
     *
     * @param $money
     * @return string
     */
    public static function formatMoney($money): string
    {
        $money = floatval($money);
        $formatMoney = number_format($money, 2, '.', ',');
        $formatMoney = rtrim(rtrim($formatMoney, '0'), '.');

        return '￥' . $formatMoney;
    }

    /**
     * Generate Numeric OTP
     *
     * @param $length
     * @return string|null
     */
    public static function generateNumericOTP($length): ?string
    {
        $result = null;
        for ($i = 1; $i <= $length; $i++) {
            $result .= mt_rand(0, 9);
        }

        return $result;
    }
}
