<?php

use App\Exceptions\InputException;
use App\Exceptions\NotFoundException;
use App\Helpers\RequestHelper;
use App\Helpers\ResponseHelper;
use App\Http\Middleware\SetLocale;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__ . '/../routes/console.php',
        api: [base_path('routes/api.php')],
        web: [base_path('routes/web.php')],
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->use([HandleCors::class]);

        // Sanctum SPA: requests from configured stateful domains are authenticated
        // via the session cookie (CSRF-protected) instead of a bearer token.
        $middleware->statefulApi();

        // API-only backend: there is no `login` named route. Never let the
        // Authenticate middleware try to redirect guests to one — without an
        // `Accept: application/json` header `redirectTo()` would call
        // route('login') and throw RouteNotFoundException (HTTP 500) instead of
        // a clean 401. Returning null lets the AuthenticationException reach the
        // renderer below, which answers every `api/*` request with a 401 JSON.
        $middleware->redirectGuestsTo(fn () => null);

        // Localize API responses from the request's "Accept-Language" header.
        $middleware->api(append: [SetLocale::class]);

        // The client-log ingest endpoint is hit via navigator.sendBeacon on
        // page unload, which cannot attach the XSRF header; exempt it from CSRF.
        $middleware->validateCsrfTokens(except: ['api/logs']);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if (RequestHelper::isApi($request)) {
                return ResponseHelper::sendResponse(ResponseHelper::STATUS_CODE_NOTFOUND, trans('response.not_found'));
            }
        });
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if (RequestHelper::isApi($request)) {
                return ResponseHelper::sendResponse(ResponseHelper::STATUS_CODE_UNAUTHORIZED, trans('response.unauthenticated'));
            }
        });
        $exceptions->dontReport([InputException::class]);
        $exceptions->render(function (InputException $e, Request $request) {
            if (RequestHelper::isApi($request)) {
                return ResponseHelper::sendResponse(ResponseHelper::STATUS_CODE_BAD_REQUEST, $e->getMessage());
            }
        });
        $exceptions->dontReport([NotFoundException::class]);
        $exceptions->render(function (NotFoundException $e, Request $request) {
            if (RequestHelper::isApi($request)) {
                return ResponseHelper::sendResponse(ResponseHelper::STATUS_CODE_NOTFOUND, $e->getMessage());
            }
        });
        $exceptions->render(function (ValidationException $exception, $request) {
            return ResponseHelper::sendResponse(
                $exception->status,
                trans('response.invalid'),
                null,
                $exception->errors(),
            );
        });
    })->create();
