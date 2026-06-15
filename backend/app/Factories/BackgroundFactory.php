<?php

namespace App\Factories;

use App\Services\Background\MarkOverdueAppointmentsService;
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
        // Services are resolved via app() container
    }

    /*
    |--------------------------------------------------------------------------
    | Explicit Getters
    |--------------------------------------------------------------------------
    | Add static methods for each Background Service to provide type safety
    | and clear visibility of available services.
    */

    /**
     * Get the MarkOverdueAppointments background service.
     */
    public static function getMarkOverdueAppointmentsBackgroundService(): MarkOverdueAppointmentsService
    {
        return app(MarkOverdueAppointmentsService::class);
    }
}
