<?php

namespace App\Helpers;

use Illuminate\Contracts\Translation\Translator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HttpHelper
{
    /**
     * Get method
     *
     * @param $url
     * @param array $params
     * @param array $headers
     * @return array|Translator|string|null
     */
    public static function get($url, array $params = [], array $headers = []): array|string|Translator|null
    {
        $response = Http::withoutVerifying()
            ->withHeaders($headers)
            ->get($url, $params);
        if ($response->successful()) {
            return json_decode($response->body(), true);
        }

        return null;
    }

    /**
     * Post method
     *
     * @param $url
     * @param array $params
     * @param array $headers
     * @return mixed|null
     */
    public static function post($url, array $params = [], array $headers = []): mixed
    {
        $response = Http::withoutVerifying()
            ->withHeaders($headers)
            ->post($url, $params);
        if ($response->successful()) {
            return json_decode($response->body(), true);
        }

        return null;
    }

    /**
     * Post method
     *
     * @param $url
     * @param array $params
     * @param array $headers
     * @return mixed|null
     */
    public static function postAsForm($url, array $params = [], array $headers = []): mixed
    {
        $response = Http::withoutVerifying()
            ->withHeaders($headers)
            ->asForm()
            ->post($url, $params);
        if ($response->successful()) {
            return json_decode($response->body(), true);
        }

        Log::info('[Http postAsForm]', [json_decode($response->body(), true)]);

        return null;
    }
}
