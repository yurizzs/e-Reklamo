<?php
namespace App\Http\Controllers\API\v1;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Traits\ApiResponse;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use App\Models\ActivityLog;
class AuthenticationController extends Controller
{
    use ApiResponse;

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

        if (!Auth::attempt($request->only('username', 'password'))) {
            RateLimiter::hit($throttleKey, $decaySeconds);
            ActivityLog::create([
                'user_id' => null,
                'activity' => 'failed login (username: ' . $username . ', ip: ' . (string) $request->ip() . ')',
            ]);
            return $this->error('Invalid username or password.', 401);
        }

        RateLimiter::clear($throttleKey);
        $user = Auth::user();

        if ($request->filled('device_name')) {
            // Revoke any existing tokens for this device (prevent duplicates)
            $user->tokens()->where('name', $request->device_name)->delete();
            $token = $user->createToken($request->device_name)->plainTextToken;
            ActivityLog::create([
                'user_id' => $user->id,
                'activity' => 'login (token: ' . $request->device_name . ')',
            ]);
            return $this->success(
                'Logged in successfully.',
                [
                    'user'  => new UserResource($user),
                    'token' => $token,
                ],
                200
            );
        }

        $request->session()->regenerate();
        ActivityLog::create([
            'user_id' => $user->id,
            'activity' => 'login (session)',
        ]);
        return $this->success(
            'Logged in successfully.',
            ['user' => new UserResource($user)],
            200
        );
    }
    /**
     * Return the currently authenticated user.
     *
     * Works for both web (session) and mobile (Bearer token)
     * because Sanctum's auth middleware handles both guards.
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
     * Log out the current user.
     *
     * - Mobile: revokes the current access token.
     * - Web: invalidates the session.
     */
    public function logout(Request $request): JsonResponse
    {
        // ──────────────────────────────────────────
        // MOBILE: revoke the Bearer token used for this request
        // ──────────────────────────────────────────
        $user = $request->user();

        if ($user?->currentAccessToken() &&
            method_exists($user->currentAccessToken(), 'delete')) {
            ActivityLog::create([
                'user_id' => $user->id,
                'activity' => 'logout (token)',
            ]);
            $user->currentAccessToken()->delete();
            return $this->success('Logged out successfully.', null, 200);
        }
        // ──────────────────────────────────────────
        // WEB SPA: invalidate the session (unchanged)
        // ──────────────────────────────────────────
        if ($user) {
            ActivityLog::create([
                'user_id' => $user->id,
                'activity' => 'logout (session)',
            ]);
        }
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return $this->success('Logged out successfully.', null, 200);
    }
}
