<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    /**
     * Log a security or business event into audit_logs.
     *
     * @param string $eventType e.g. 'auth.login', 'auth.impersonation_start', 'clinic.status_change'
     * @param string $description Arabic human-readable summary
     * @param string $severity 'info', 'warning', 'critical', 'emergency'
     * @param string|null $targetType e.g. 'Tenant', 'User', 'IPAddress'
     * @param string|null $targetId e.g. tenant id or user id
     * @param array|null $metadata extra key-value pairs
     * @param string|null $tenantId explicit tenant id override
     * @param mixed $actorUser optional explicit acting User model
     * @return AuditLog|null
     */
    public static function log(
        string $eventType,
        string $description,
        string $severity = 'info',
        ?string $targetType = null,
        ?string $targetId = null,
        ?array $metadata = null,
        ?string $tenantId = null,
        $actorUser = null
    ): ?AuditLog {
        try {
            $user = $actorUser 
                ?: (Auth::guard('sanctum')->user() ?: Auth::user() ?: Request::user());

            // If user is not yet authenticated in this request context but this is an impersonation action
            if (!$user && str_contains($eventType, 'impersonat')) {
                $user = \App\Models\User::withoutGlobalScopes()
                    ->where('role', 'superadmin')
                    ->orWhere('is_super_admin', true)
                    ->first();
            }

            $ip = Request::ip() ?? ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
            $userAgent = Request::userAgent() ?? ($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown');

            $resolvedTenantId = $tenantId
                ?? ($user?->tenant_id ?? ($user?->clinic_id ?? null));

            $userName = $user?->name ?? 'المشرف العام (SuperAdmin)';
            $userEmail = $user?->email ?? 'superadmin@clinic-saas.dz';
            $userRole = $user?->role ?? ($user?->is_super_admin ? 'superadmin' : 'clinic_admin');

            $log = AuditLog::create([
                'tenant_id' => $resolvedTenantId ? (string) $resolvedTenantId : null,
                'user_id' => $user?->id,
                'user_name' => $userName,
                'user_email' => $userEmail,
                'user_role' => $userRole,
                'event_type' => $eventType,
                'action' => $eventType,
                'severity' => strtolower($severity),
                'action_description' => $description,
                'target_type' => $targetType,
                'auditable_type' => $targetType ?? 'Tenant',
                'target_id' => $targetId ? (string) $targetId : null,
                'auditable_id' => $targetId ? (string) $targetId : null,
                'ip_address' => $ip,
                'user_agent' => substr($userAgent, 0, 500),
                'metadata' => $metadata,
            ]);

            return $log;
        } catch (\Throwable $e) {
            // Fail safely: never crash the core application flow if logging fails
            Log::warning('AuditLogger recording error: ' . $e->getMessage(), [
                'event_type' => $eventType,
            ]);
            return null;
        }
    }
}
