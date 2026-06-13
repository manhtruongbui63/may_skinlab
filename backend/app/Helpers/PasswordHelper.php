<?php

namespace App\Helpers;

class PasswordHelper
{
    /**
     * Make password
     *
     * @param int $length
     * @param int $repeat
     * @return string
     */
    public static function make(int $length = 8, int $repeat = 4): string
    {
        $pool1 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $pool2 = '0123456789';
        $pool3 = '!@#$%^&*()';
        $pool4 = 'abcdefghijklmnopqrstuvwxyz';

        $length1 = floor($length / 4);
        $length2 = $length1;
        $length3 = $length1;
        $length4 = $length - ($length1 + $length2 + $length3);

        $pass = substr(str_shuffle(str_repeat($pool1, $repeat)), 0, $length1)
            . substr(str_shuffle(str_repeat($pool2, $repeat)), 0, $length2)
            . substr(str_shuffle(str_repeat($pool3, $repeat)), 0, $length3)
            . substr(str_shuffle(str_repeat($pool4, $repeat)), 0, $length4);

        return str_shuffle($pass);
    }
}
