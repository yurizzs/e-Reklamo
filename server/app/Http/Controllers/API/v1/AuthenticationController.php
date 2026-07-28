<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Employee;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use App\Models\ActivityLog;

class AuthenticationController extends Controller
{
    use ApiResponse;

    private function recordActivity(?int $userId, string $activity): void
    {
        try {
            ActivityLog::create([
                'user_id' => $userId,
                'activity' => $activity,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Unable to record activity log.', [
                'user_id' => $userId,
                'activity' => $activity,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'device_name' => ['sometimes', 'string', 'max:255'], // Mobile only
        ]);

        $maxAttempts = 5;
        $decaySeconds = 30;
        $username = Str::lower((string) $request->input('username'));
        $password = (string) $request->input('password');
        $throttleKey = 'login|' . (string) $request->ip() . '|' . $username;

        if (RateLimiter::tooManyAttempts($throttleKey, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            ActivityLog::create([
                'user_id' => null,
                'activity' => 'login throttled (username: ' . $username . ', ip: ' . (string) $request->ip() . ')',
            ]);
            return $this->error(
                "Too many login attempts. Try again in {$seconds} seconds.",
                429,
                ['retry_after' => $seconds]
            );
        }

        // Search in Employee table first (for Admin/Operator/Officer), then User table (for Citizens)
        $account = Employee::where('username', $username)->first();
        if (!$account) {
            $account = User::where('username', $username)->first();
        }

        if (!$account || !Hash::check($password, $account->password)) {
            RateLimiter::hit($throttleKey, $decaySeconds);
            ActivityLog::create([
                'user_id' => null,
                'activity' => 'failed login (username: ' . $username . ', ip: ' . (string) $request->ip() . ')',
            ]);
            return $this->error('Invalid username or password.', 401);
        }

        RateLimiter::clear($throttleKey);

        if ($request->filled('device_name')) {
            // Revoke existing tokens for this device name
            $account->tokens()->where('name', $request->device_name)->delete();
            $token = $account->createToken($request->device_name)->plainTextToken;
            
            $this->recordActivity($account->id, 'login (token: ' . $request->device_name . ')');
            
            return $this->success(
                'Logged in successfully.',
                [
                    'user' => new UserResource($account),
                    'token' => $token,
                ],
                200
            );
        }

        // Web SPA session login
        Auth::guard('web')->login($account);
        $request->session()->regenerate();

        $this->recordActivity($account->id, 'login (session)');

        return $this->success(
            'Logged in successfully.',
            ['user' => new UserResource($account)],
            200
        );
    }

    /**
     * Return the currently authenticated user/employee.
     */
    public function me(Request $request): JsonResponse
    {
        return $this->success(
            'Authenticated user retrieved.',
            ['user' => new UserResource($request->user())],
            200
        );
    }

    /**
     * Log out the current user/employee.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user?->currentAccessToken() && method_exists($user->currentAccessToken(), 'delete')) {
            $this->recordActivity($user->id, 'logout (token)');
            $user->currentAccessToken()->delete();
            return $this->success('Logged out successfully.', null, 200);
        }

        if ($user) {
            $this->recordActivity($user->id, 'logout (session)');
        }
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return $this->success('Logged out successfully.', null, 200);
    }
}
