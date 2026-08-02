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

    private function recordActivity($userOrId, string $activity): void
    {
        try {
            $userId = null;
            if ($userOrId instanceof User) {
                $userId = $userOrId->id;
            } elseif (is_numeric($userOrId)) {
                $userId = User::where('id', $userOrId)->exists() ? (int) $userOrId : null;
            }

            ActivityLog::create([
                'user_id' => $userId,
                'activity' => $activity,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Unable to record activity log.', [
                'activity' => $activity,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Register a new citizen account (saved to users table).
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'suffix_1name' => ['nullable', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:6'],
            'device_name' => ['sometimes', 'string', 'max:255'],
        ]);

        $validated['role'] = 'citizen';

        $user = User::create($validated);

        $deviceName = $request->input('device_name', 'Mobile App');
        $token = $user->createToken($deviceName)->plainTextToken;

        $this->recordActivity($user->id, 'register (citizen)');

        return $this->success(
            'Account created successfully.',
            [
                'user' => new UserResource($user),
                'token' => $token,
            ],
            201
        );
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

        $deviceName = $request->input('device_name', 'Web Dashboard');
        $account->tokens()->where('name', $deviceName)->delete();
        $token = $account->createToken($deviceName)->plainTextToken;

        try {
            Auth::guard('web')->login($account);
            $request->session()->regenerate();
        } catch (\Throwable $e) {
            Log::warning('Session login notice: ' . $e->getMessage());
        }

        $this->recordActivity($account->id, 'login (' . $deviceName . ')');

        return $this->success(
            'Logged in successfully.',
            [
                'user' => new UserResource($account),
                'token' => $token,
            ],
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
