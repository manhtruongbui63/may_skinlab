<?php

namespace App\Factories;

use App\Services\Api\AppointmentService;
use App\Services\Api\AuthService;
use App\Services\Api\CustomerService;
use App\Services\Api\LogService;
use App\Services\Api\MasterDataService;
use App\Services\Api\UserService;
use App\Services\Api\UserTableService;
use App\Services\Api\VisitService;
use Illuminate\Contracts\Container\Container;
use Illuminate\Contracts\Foundation\Application;

class ApiFactory
{
    /**
     * Register API Services
     *
     * @param Application|Container $app
     * @return void
     */
    public static function register($app): void
    {
        $app->scoped(AuthService::class, function ($app) {
            return new AuthService();
        });

        $app->scoped(MasterDataService::class, function ($app) {
            return new MasterDataService();
        });

        $app->scoped(UserService::class, function ($app) {
            return new UserService();
        });

        $app->scoped(CustomerService::class, function ($app) {
            return new CustomerService();
        });

        $app->scoped(AppointmentService::class, function ($app) {
            return new AppointmentService();
        });

        $app->scoped(LogService::class, function ($app) {
            return new LogService();
        });

        $app->scoped(VisitService::class, function ($app) {
            return new VisitService();
        });

        $app->bind(UserTableService::class, function ($app) {
            return new UserTableService();
        });
    }

    /**
     * Get Master Data Service
     *
     * @return MasterDataService
     */
    public static function getMasterDataService()
    {
        return app(MasterDataService::class);
    }

    /**
     * Get Auth Service
     *
     * @return AuthService
     */
    public static function getAuthService()
    {
        return app(AuthService::class);
    }

    /**
     * Get User Service
     *
     * @return UserService
     */
    public static function getUserService()
    {
        return app(UserService::class);
    }

    /**
     * Get User Table Service
     *
     * @return UserTableService
     */
    public static function getUserTableService()
    {
        return app(UserTableService::class);
    }

    /**
     * Get Log Service
     *
     * @return LogService
     */
    public static function getLogService()
    {
        return app(LogService::class);
    }

    /**
     * Get Customer Service
     *
     * @return CustomerService
     */
    public static function getCustomerService(): CustomerService
    {
        return app(CustomerService::class);
    }

    /**
     * Get Appointment Service
     *
     * @return AppointmentService
     */
    public static function getAppointmentService(): AppointmentService
    {
        return app(AppointmentService::class);
    }

    /**
     * Get Visit Service
     *
     * @return VisitService
     */
    public static function getVisitService(): VisitService
    {
        return app(VisitService::class);
    }
}
