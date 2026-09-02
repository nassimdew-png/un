<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles)) {
            return response()->json([
                'message' => 'Unauthorized: Insufficient role permissions.',
                'required_roles' => $roles,
                'user_role' => $user ? $user->role : null,
            ], 403);
        }

        return $next($request);
    }
}
