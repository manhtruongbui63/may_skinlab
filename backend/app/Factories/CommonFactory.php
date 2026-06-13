<?php

namespace App\Factories;

use App\Services\Common\FileService;
use Illuminate\Contracts\Container\Container;
use Illuminate\Contracts\Foundation\Application;

class CommonFactory
{
    /**
     * Register Common Service
     *
     * @param Application|Container $app
     * @return void
     */
    public static function register($app): void
    {
        $app->scoped(FileService::class, function ($app) {
            return new FileService();
        });
    }

    /**
     * Get File Service
     *
     * @return FileService
     */
    public static function getFileService()
    {
        return app(FileService::class);
    }
}
