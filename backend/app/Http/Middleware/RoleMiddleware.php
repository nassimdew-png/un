<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    /**
     * Handle an incoming request and enforce RBAC.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  mixed  ...$roles
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        if (!empty($roles) && !in_array($user->role, $roles) && $user->role !== 'superadmin') {
            return response()->json(['error' => 'Forbidden - Insufficient permissions for role: ' . $user->role], 403);
        }

        return $next($request);
    }
}
