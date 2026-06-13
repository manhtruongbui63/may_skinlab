<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

/**
 * Localizes each request from the standard "Accept-Language" header.
 *
 * Laravel ships no per-request locale switching out of the box — it only
 * exposes config('app.locale') (static) and App::setLocale() (manual). This
 * middleware implements the conventional approach: pick the best supported
 * locale advertised by the client and apply it, so translated responses
 * (validation, response.php, auth.php, ...) match the caller's UI language.
 */
class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $default = config('app.locale');
        $supported = config('app.supported_locales', [$default]);

        // Put the default first so it is used when the header is absent or
        // advertises no supported locale (Symfony falls back to $supported[0]).
        $ordered = array_values(array_unique(array_merge([$default], $supported)));

        App::setLocale($request->getPreferredLanguage($ordered));

        return $next($request);
    }
}
