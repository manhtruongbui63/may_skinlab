<?php

namespace App\Helpers;

use Illuminate\Support\Str;

class StringHelper
{
    /**
     * Slug
     *
     * @param string $str
     * @return string
     */
    public static function slug(string $str): string
    {
        return Str::slug($str);
    }

    /**
     * Trim string space
     *
     * @param string $str
     * @return string
     */
    public static function trimSpace(string $str): string
    {
        if (!$str) {
            return '';
        }

        return trim(preg_replace('!\s+!', ' ', $str));
    }

    /**
     * Unique Code
     *
     * @param int $limit
     * @return string
     */
    public static function uniqueCode(int $limit = 6): string
    {
        return substr(base_convert(sha1(uniqid(mt_rand())), 16, 36), 0, $limit);
    }
}
