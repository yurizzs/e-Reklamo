<?php

use App\Http\Controllers\API\v1\AuthenticationController;
use App\Http\Controllers\API\v1\ActivityLogController;
use App\Http\Controllers\API\v1\ComplaintController;
use App\Http\Controllers\API\v1\UserController;
use App\Http\Controllers\API\v1\ViolationCategoryController;
use App\Http\Controllers\API\v1\OperatorScheduleController;
use App\Http\Controllers\API\v1\ChatController;
use Illuminate\Support\Facades\Route;

// Public Auth Endpoints
Route::post('auth/login', [AuthenticationController::class, 'login']);
Route::post('auth/register', [AuthenticationController::class, 'register']);

// Public / Mobile Accessible Chat Endpoints
Route::get('chat/conversations', [ChatController::class, 'conversations']);
Route::get('chat/conversations/{id}/messages', [ChatController::class, 'messages']);
Route::post('chat/messages', [ChatController::class, 'sendMessage']);

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('user/auth/me', [AuthenticationController::class, 'me']);
    Route::post('auth/logout', [AuthenticationController::class, 'logout']);

    // Accessible to all authenticated users (Citizen, Operator, Admin)
    Route::get('complaints/options', [ComplaintController::class, 'options']);
    Route::get('complaints/check-violation', [ComplaintController::class, 'checkViolation']);
    Route::post('complaints', [ComplaintController::class, 'store']);
    Route::get('complaints/{id}', [ComplaintController::class, 'show']);

    // Admin, Operator & Staff Access
    Route::middleware('role:admin,operator,staff')->group(function () {
        Route::get('complaints/analytics', [ComplaintController::class, 'analytics']);
        Route::get('complaints', [ComplaintController::class, 'index']);
        Route::patch('complaints/{id}/status', [ComplaintController::class, 'updateStatus']);

        // Schedules View Access
        Route::get('operator-schedules/employees', [OperatorScheduleController::class, 'employees']);
        Route::get('operator-schedules', [OperatorScheduleController::class, 'index']);
    });

    // Admin Only
    Route::middleware('role:admin')->group(function () {
        // User & Employee Management (Saves Admin & Operator to employees table)
        Route::get('users/stats', [UserController::class, 'stats']);
        Route::apiResource('users', UserController::class);
        Route::post('users/{id}/restore', [UserController::class, 'restore']);

        Route::get('employees/stats', [UserController::class, 'stats']);
        Route::apiResource('employees', UserController::class);
        Route::post('employees/{id}/restore', [UserController::class, 'restore']);

        // Activity Logs (Accounting)
        Route::get('activity-logs', [ActivityLogController::class, 'index']);

        // Violation Categories
        Route::apiResource('violation-categories', ViolationCategoryController::class);
        Route::post('violation-categories/{id}/restore', [ViolationCategoryController::class, 'restore']);

        // Operator Schedules Management (Create/Update)
        Route::post('operator-schedules', [OperatorScheduleController::class, 'store']);
        Route::put('operator-schedules/{id}', [OperatorScheduleController::class, 'update']);
    });
});
