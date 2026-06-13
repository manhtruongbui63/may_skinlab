<?php

namespace App\Factories;

use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\Container\Container;

class BackgroundFactory
{
    /**
     * Register Background Services
     *
     * @param Application|Container $app
     * @return void
     */
    public static function register($app): void
    {
        // Example registration:
        // $app->scoped(\App\Services\Background\ExampleBackgroundService::class, function ($app) {
        //     return new \App\Services\Background\ExampleBackgroundService();
        // });
    }

    /*
    |--------------------------------------------------------------------------
    | Explicit Getters
    |--------------------------------------------------------------------------
    | Add static methods for each Background Service to provide type safety
    | and clear visibility of available services.
    |
    | Example:
    | public static function getExampleService(): ExampleBackgroundService
    | {
    |     return app(ExampleBackgroundService::class);
    | }
    */
}
