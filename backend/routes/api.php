<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\LogController;
use App\Http\Controllers\Api\MasterDataController;
use App\Http\Controllers\Api\UploadImageController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VisitController;
use Illuminate\Support\Facades\Route;

// Client (frontend) log ingest. Public so errors are captured even before
// login; its own 'log' limiter absorbs batches while still bounding abuse.
Route::post('/logs', [LogController::class, 'store'])
    ->middleware('throttle:log')
    ->name('logs.store');

// Baseline per-IP throttle for every API endpoint (see the 'api' limiter).
Route::middleware('throttle:api')->group(function () {
    Route::get('/master-data', [MasterDataController::class, 'show'])->name('masterData');
    Route::post('/upload-image', [UploadImageController::class, 'upload'])->name('uploadImage');
    Route::get('/users', [UserController::class, 'index'])->name('users.index');

    // Public customer search for reception (no auth required)
    Route::get('/customers/search', [CustomerController::class, 'search'])->name('customers.search');

    Route::group(['as' => 'auth.', 'prefix' => 'auth'], function () {
        // Stricter throttle for credential-sensitive endpoints (see the 'auth'
        // limiter) to curb brute force, registration spam and enumeration.
        Route::middleware('throttle:auth')->group(function () {
            Route::post('/register', [AuthController::class, 'register'])->name('register');
            Route::post('/login', [AuthController::class, 'login'])->name('login');
            Route::post('/change-password', [AuthController::class, 'changePassword'])->name('changePassword');
            Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('forgotPassword');
            Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('resetPassword');
        });

        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('/me', [AuthController::class, 'me'])->name('me');
        Route::post('/profile', [AuthController::class, 'updateProfile'])->name('updateProfile');
    });

    // Customer routes - requires authentication
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
        Route::post('/customers', [CustomerController::class, 'store'])->name('customers.store');
        Route::get('/customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
        Route::patch('/customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
        Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
        Route::get('/customers/{customer}/visits', [CustomerController::class, 'visits'])->name('customers.visits');
        Route::get('/customers/{customer}/treatment-plans', [CustomerController::class, 'treatmentPlans'])->name('customers.treatment-plans');
        Route::get('/customers/{customer}/invoices', [CustomerController::class, 'invoices'])->name('customers.invoices');

        // Appointment routes
        Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments.index');
        Route::post('/appointments', [AppointmentController::class, 'store'])->name('appointments.store');
        Route::get('/appointments/{appointment}', [AppointmentController::class, 'show'])->name('appointments.show');
        Route::put('/appointments/{appointment}', [AppointmentController::class, 'update'])->name('appointments.update');
        Route::patch('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel'])->name('appointments.cancel');
        Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy'])->name('appointments.destroy');

        // Visit routes
        Route::get('/visits', [VisitController::class, 'index'])->name('visits.index');
        Route::post('/visits', [VisitController::class, 'store'])->name('visits.store');
        Route::put('/visits/{id}', [VisitController::class, 'update'])->name('visits.update');
        Route::post('/visits/from-appointment', [VisitController::class, 'storeFromAppointment'])
            ->name('visits.store-from-appointment');
        Route::patch('/visits/{id}/cancel', [VisitController::class, 'cancel'])->name('visits.cancel');
        Route::delete('/visits/{id}', [VisitController::class, 'destroy'])->name('visits.destroy');
    });
});
