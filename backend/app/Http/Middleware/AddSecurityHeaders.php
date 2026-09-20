<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddSecurityHeaders
{
    /**
     * Handle an incoming request and attach enterprise-grade security headers.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Security headers mitigating Clickjacking, MIME-sniffing, SSL-stripping, and XSS
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');

        // Restrict permissive CORS on sensitive admin / superadmin routes
        if ($request->is('api/super-admin*') || $request->is('api/superadmin*')) {
            $origin = $request->header('Origin');
            $allowedDomains = [
                'https://psypro.tech',
                'https://www.psypro.tech',
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:5173',
            ];

            if ($origin && (in_array($origin, $allowedDomains) || preg_match('/^https:\/\/[a-z0-9\-]+\.psypro\.tech$/', $origin))) {
                $response->headers->set('Access-Control-Allow-Origin', $origin);
                $response->headers->set('Access-Control-Allow-Credentials', 'true');
            } else {
                $response->headers->set('Access-Control-Allow-Origin', 'https://psypro.tech');
            }
        }

        return $response;
    }
}
