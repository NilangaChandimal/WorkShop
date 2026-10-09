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
    Route::middleware('role:admin,manager,staff')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class)->except(['destroy']);
    });

    Route::middleware('role:manager,staff')->group(function () {
        Route::get('/workshops', [WorkshopController::class, 'index']);
        Route::get('/workshops/{workshop}', [WorkshopController::class, 'show']);

        Route::get('/registrations', [RegistrationController::class, 'index']);
        Route::post('/workshops/{workshop}/registrations', [RegistrationController::class, 'store']);
        Route::patch('/registrations/{registration}/cancel', [RegistrationController::class, 'cancel']);
    });

    Route::middleware('role:manager')->group(function () {
        Route::post('/workshops', [WorkshopController::class, 'store']);
        Route::put('/workshops/{workshop}', [WorkshopController::class, 'update']);
    });
});
