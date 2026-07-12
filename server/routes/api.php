<?php

use App\Http\Controllers\API\v1\AuthenticationController;
use App\Http\Controllers\API\v1\ActivityLogController;
use App\Http\Controllers\API\v1\UserController;
use App\Http\Controllers\API\v1\ViolationCategoryController;
use App\Http\Controllers\API\v1\OperatorScheduleController;
use Illuminate\Support\Facades\Route;

Route::post('auth/login', [AuthenticationController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('user/auth/me', [AuthenticationController::class, 'me']);
    Route::post('auth/logout', [AuthenticationController::class, 'logout']);

    // Admin Only
    Route::middleware('role:admin')->group(function () {
        Route::get('users/stats', [UserController::class, 'stats']);
        Route::apiResource('users', UserController::class);
        Route::post('users/{id}/restore', [UserController::class, 'restore']);

        // Activity Logs (Accounting)
        Route::get('activity-logs', [ActivityLogController::class, 'index']);

        // Violation Categories
        Route::apiResource('violation-categories', ViolationCategoryController::class);
        Route::post('violation-categories/{id}/restore', [ViolationCategoryController::class, 'restore']);

        // Operator Schedules
        Route::get('operator-schedules/employees', [OperatorScheduleController::class, 'employees']);
        Route::get('operator-schedules', [OperatorScheduleController::class, 'index']);
        Route::post('operator-schedules', [OperatorScheduleController::class, 'store']);
        Route::put('operator-schedules/{id}', [OperatorScheduleController::class, 'update']);
    });
});
