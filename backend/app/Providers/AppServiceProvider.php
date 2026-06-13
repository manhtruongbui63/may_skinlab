<?php

namespace App\Providers;

use App\Factories\BackgroundFactory;
use App\Factories\CommonFactory;
use App\Factories\ApiFactory;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Routing\Route;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Scramble;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        BackgroundFactory::register($this->app);
        CommonFactory::register($this->app);
        ApiFactory::register($this->app);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();

        Scramble::configure()
            ->withDocumentTransformers(function (OpenApi $openApi) {
                $openApi->secure(
                    SecurityScheme::http('bearer'),
                );
            })
            ->routes(function (Route $route) {
                $apiBasePaths = ['api'];
                foreach ($apiBasePaths as $path) {
                    if (Str::startsWith($route->uri, $path)) {
                        return true;
                    }
                }

                return false;
            });
    }

    /**
     * Configure the named API rate limiters.
     *
     * Disabled under the testing environment so feature tests that intentionally
     * hammer endpoints (e.g. the in-app login lockout) are not masked by 429s.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return $this->app->environment('testing')
                ? Limit::none()
                : Limit::perMinute(60)->by($request->ip());
        });

        RateLimiter::for('auth', function (Request $request) {
            return $this->app->environment('testing')
                ? Limit::none()
                : Limit::perMinute(10)->by($request->ip());
        });

        // Frontend log ingest: more permissive than 'api' since the client
        // batches events, but still capped per IP to curb log flooding.
        RateLimiter::for('log', function (Request $request) {
            return $this->app->environment('testing')
                ? Limit::none()
                : Limit::perMinute(120)->by($request->ip());
        });
    }
}
