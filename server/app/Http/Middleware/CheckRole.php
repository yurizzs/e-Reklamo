<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * Usage: middleware('role:admin') or middleware('role:admin,operator')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated.',
                'data' => null,
            ], 401);
        }

        $userRole = is_object($user->role) && isset($user->role->value) 
            ? $user->role->value 
            : (string) $user->role;

        if (!in_array($userRole, $roles)) {
            return response()->json([
                'status' => 'error',
                'message' => 'You do not have permission to access this resource.',
                'data' => null,
            ], 403);
        }

        return $next($request);
    }
}
