<?php

namespace App\Helpers;

use Illuminate\Http\Request;

class RequestHelper
{
    public static function isApi(Request $request): bool
    {
        return $request->is('api/*');
    }
}
