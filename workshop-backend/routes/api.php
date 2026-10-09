<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WorkshopController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:10,1')
    ->name('login');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Admin user management
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class)->except(['destroy']);
    });

    // Workshops
    Route::get('/workshops', [WorkshopController::class, 'index']);
    Route::get('/workshops/{id}', [WorkshopController::class, 'show']);
    Route::post('/workshops', [WorkshopController::class, 'store']);
    Route::put('/workshops/{id}', [WorkshopController::class, 'update']);

    // Registrations
    Route::get('/registrations', [RegistrationController::class, 'index']);
    Route::post('/workshops/{id}/registrations', [RegistrationController::class, 'store']);
    Route::patch('/registrations/{id}/cancel', [RegistrationController::class, 'cancel']);
});
