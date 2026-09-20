<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BlockedIp;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    /**
     * Check if user is Super Admin
     */
    private function authorizeSuperAdmin(): void
    {
        $user = Auth::user();
        if ($user && !($user->role === 'super_admin' || $user->is_super_admin === true)) {
            abort(403, 'غير مصرح: هذه الميزة مخصصة لمسؤول المنصة العام (Super Admin).');
        }
    }

    /**
     * Security & Audit KPIs Overview
     * GET /api/super-admin/audit-logs/overview
     */
    public function getSecurityOverview(): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $hasTable = Schema::hasTable('audit_logs');
        if (!$hasTable) {
            return response()->json([
                'success' => true,
                'stats' => [
                    'total_today' => 0,
                    'critical_count' => 0,
                    'warning_count' => 0,
                    'impersonations_count' => 0,
                    'blocked_ips_count' => 0,
                ],
                'recent_critical' => [],
            ]);
        }

        $today = Carbon::today();

        $totalToday = AuditLog::whereDate('created_at', $today)->count();
        $criticalCount = AuditLog::whereIn('severity', ['critical', 'emergency'])->count();
        $warningCount = AuditLog::where('severity', 'warning')->count();
        $impersonationsCount = AuditLog::where('event_type', 'like', '%impersonation%')->count();
        $blockedIpsCount = Schema::hasTable('blocked_ips') ? BlockedIp::count() : 0;

        $recentCritical = AuditLog::whereIn('severity', ['warning', 'critical', 'emergency'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'stats' => [
                'total_today' => $totalToday,
                'critical_count' => $criticalCount,
                'warning_count' => $warningCount,
                'impersonations_count' => $impersonationsCount,
                'blocked_ips_count' => $blockedIpsCount,
            ],
            'recent_critical' => $recentCritical,
        ]);
    }

    /**
     * List audit logs with multi-dimensional filtering, multi-tenant isolation, and pagination.
     * GET /api/super-admin/audit-logs
     * GET /api/audit-logs
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::guard('sanctum')->user() ?: Auth::user() ?: $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح: يرجى تسجيل الدخول أولاً.',
            ], 401);
        }

        $isSuperAdmin = ($user->role === 'super_admin' || $user->is_super_admin === true);

        if (!Schema::hasTable('audit_logs')) {
            return response()->json([
                'success' => true,
                'data' => [],
                'total' => 0,
                'message' => 'جدول سجلات التدقيق قيد الإنشاء.',
            ]);
        }

        $query = AuditLog::query();

        // Multi-tenant isolation:
        // - Super Admin: View all logs across the platform, or scope to a specific tenant if provided.
        // - Clinic Users (admin_owner, clinic_admin, doctor, etc.): Strictly scoped to their own clinic tenant_id.
        if ($isSuperAdmin) {
            if ($request->filled('tenant_id')) {
                $query->where('tenant_id', (string) $request->input('tenant_id'));
            } elseif ($request->header('X-Tenant-Id')) {
                $query->where('tenant_id', (string) $request->header('X-Tenant-Id'));
            }
        } else {
            $tenantId = $user->tenant_id ?: ($user->clinic_id ?: null);
            if (!$tenantId) {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصرح: لا توجد عيادة مرتبطة بهذا الحساب.',
                ], 403);
            }
            $query->where('tenant_id', (string) $tenantId);
        }

        // Search term (searches email, name, description, ip, action, metadata, etc.)
        if ($request->filled('search')) {
            $term = trim($request->input('search'));
            $query->where(function ($q) use ($term) {
                $q->where('action_description', 'like', "%{$term}%")
                  ->orWhere('user_name', 'like', "%{$term}%")
                  ->orWhere('user_email', 'like', "%{$term}%")
                  ->orWhere('ip_address', 'like', "%{$term}%")
                  ->orWhere('event_type', 'like', "%{$term}%")
                  ->orWhere('action', 'like', "%{$term}%")
                  ->orWhere('auditable_type', 'like', "%{$term}%")
                  ->orWhere('target_type', 'like', "%{$term}%")
                  ->orWhere('auditable_id', 'like', "%{$term}%")
                  ->orWhere('target_id', 'like', "%{$term}%")
                  ->orWhere('metadata', 'like', "%{$term}%");
            });
        }

        // Dedicated email / user filter if provided
        if ($request->filled('user_email')) {
            $em = trim($request->input('user_email'));
            $query->where(function ($q) use ($em) {
                $q->where('user_email', 'like', "%{$em}%")
                  ->orWhere('metadata', 'like', "%{$em}%");
            });
        }
        if ($request->filled('email')) {
            $em = trim($request->input('email'));
            $query->where(function ($q) use ($em) {
                $q->where('user_email', 'like', "%{$em}%")
                  ->orWhere('metadata', 'like', "%{$em}%");
            });
        }

        // Action / Event Type filter
        if ($request->filled('action')) {
            $act = $request->input('action');
            if ($act !== 'ALL' && $act !== 'all') {
                $query->where(function ($q) use ($act) {
                    $q->where('action', $act)->orWhere('event_type', $act);
                    if (str_contains(strtolower($act), 'impersonat')) {
                        $q->orWhere('action', 'like', '%impersonat%')
                          ->orWhere('event_type', 'like', '%impersonat%');
                    }
                });
            }
        }
        if ($request->filled('event_type')) {
            $evt = $request->input('event_type');
            if ($evt !== 'ALL' && $evt !== 'all') {
                $query->where(function ($q) use ($evt) {
                    $q->where('event_type', $evt)->orWhere('action', $evt);
                    if (str_contains(strtolower($evt), 'impersonat')) {
                        $q->orWhere('event_type', 'like', '%impersonat%')
                          ->orWhere('action', 'like', '%impersonat%');
                    }
                });
            }
        }

        // Entity / Auditable / Target Type filter
        if ($request->filled('auditable_type')) {
            $type = $request->input('auditable_type');
            if ($type !== 'ALL' && $type !== 'all') {
                $query->where(function ($q) use ($type) {
                    $q->where('auditable_type', $type)->orWhere('target_type', $type);
                });
            }
        }
        if ($request->filled('target_type')) {
            $type = $request->input('target_type');
            if ($type !== 'ALL' && $type !== 'all') {
                $query->where(function ($q) use ($type) {
                    $q->where('target_type', $type)->orWhere('auditable_type', $type);
                });
            }
        }

        // Severity filter (ALL, info, warning, critical)
        if ($request->filled('severity') && $request->input('severity') !== 'ALL') {
            $query->severity($request->input('severity'));
        }

        // Date range & single date filtering (supports start_date, end_date, date_from, date_to, date)
        $startDate = $request->input('start_date') ?: ($request->input('date_from') ?: $request->input('date'));
        $endDate = $request->input('end_date') ?: $request->input('date_to');

        if ($startDate && $endDate) {
            $startUtc = Carbon::parse($startDate)->startOfDay()->subHours(14);
            $endUtc = Carbon::parse($endDate)->endOfDay()->addHours(14);
            $query->whereBetween('created_at', [$startUtc, $endUtc]);
        } elseif ($startDate) {
            $startUtc = Carbon::parse($startDate)->startOfDay()->subHours(14);
            if ($request->filled('date') && !$request->filled('start_date') && !$request->filled('date_from')) {
                // Exact single day match with worldwide timezone tolerance window (+/- 14h)
                $endUtc = Carbon::parse($startDate)->endOfDay()->addHours(14);
                $query->whereBetween('created_at', [$startUtc, $endUtc]);
            } else {
                // start_date / date_from: from this date onwards (inclusive of worldwide local timezone)
                $query->where('created_at', '>=', $startUtc);
            }
        } elseif ($endDate) {
            $endUtc = Carbon::parse($endDate)->endOfDay()->addHours(14);
            $query->where('created_at', '<=', $endUtc);
        }

        $perPage = (int) $request->input('per_page', 50);
        $perPage = max(10, min(200, $perPage));

        $logs = $query->with(['user' => fn($q) => $q->withoutGlobalScopes()])->orderBy('id', 'desc')->paginate($perPage);

        // Format items to guarantee user object (with email, name, role) is always populated
        $items = collect($logs->items())->map(function ($log) {
            $userName = $log->user_name ?: ($log->user?->name ?: 'Système');
            $userEmail = $log->user_email ?: ($log->user?->email ?: 'N/A');
            $userRole = $log->user_role ?: ($log->user?->role ?: 'user');

            $logArray = $log->toArray();
            $logArray['user'] = [
                'id' => $log->user_id,
                'name' => $userName,
                'email' => $userEmail,
                'role' => $userRole,
            ];
            $logArray['user_name'] = $userName;
            $logArray['user_email'] = $userEmail;
            $logArray['user_role'] = $userRole;
            return $logArray;
        });

        return response()->json([
            'success' => true,
            'data' => $items,
            'pagination' => [
                'total' => $logs->total(),
                'per_page' => $logs->perPage(),
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }

    /**
     * Get Blocked IPs List
     * GET /api/super-admin/audit-logs/blocked-ips
     */
    public function getBlockedIps(): JsonResponse
    {
        $this->authorizeSuperAdmin();

        if (!Schema::hasTable('blocked_ips')) {
            return response()->json(['success' => true, 'blocked_ips' => []]);
        }

        $ips = BlockedIp::orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'blocked_ips' => $ips,
        ]);
    }

    /**
     * Block an IP Address
     * POST /api/super-admin/audit-logs/block-ip
     */
    public function blockIp(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $validated = $request->validate([
            'ip_address' => 'required|string',
            'reason' => 'nullable|string',
            'expires_in_hours' => 'nullable|integer',
        ]);

        $user = Auth::user();
        $ip = trim($validated['ip_address']);
        $reason = $validated['reason'] ?? 'حظر أمني يدوي من قبل المشرف العام';

        $expiresAt = null;
        if (!empty($validated['expires_in_hours']) && $validated['expires_in_hours'] > 0) {
            $expiresAt = Carbon::now()->addHours((int) $validated['expires_in_hours']);
        }

        $blocked = BlockedIp::updateOrCreate(
            ['ip_address' => $ip],
            [
                'reason' => $reason,
                'blocked_by_user_id' => $user?->id,
                'blocked_by_name' => $user?->name ?? 'Super Admin',
                'expires_at' => $expiresAt,
            ]
        );

        // Record in audit log
        AuditLogger::log(
            'security.ip_blocked',
            "تم حظر عنوان الـ IP المشبوه [{$ip}] - السبب: {$reason}",
            'critical',
            'IPAddress',
            $ip,
            ['blocked_id' => $blocked->id, 'expires_at' => $expiresAt]
        );

        return response()->json([
            'success' => true,
            'message' => "تم حظر العنوان [{$ip}] بنجاح!",
            'blocked_ip' => $blocked,
        ]);
    }

    /**
     * Unblock an IP Address
     * DELETE /api/super-admin/audit-logs/blocked-ips/{id}
     */
    public function unblockIp($id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $blocked = BlockedIp::findOrFail($id);
        $ip = $blocked->ip_address;
        $blocked->delete();

        // Record in audit log
        AuditLogger::log(
            'security.ip_unblocked',
            "تم إلغاء حظر عنوان الـ IP [{$ip}] والسماح له بالاتصال مجدداً.",
            'warning',
            'IPAddress',
            $ip
        );

        return response()->json([
            'success' => true,
            'message' => "تم إلغاء حظر العنوان [{$ip}] بنجاح!",
        ]);
    }

    /**
     * Export Audit Logs as CSV
     * GET /api/super-admin/audit-logs/export
     */
    public function exportLogs(Request $request): StreamedResponse
    {
        $user = Auth::guard('sanctum')->user() ?: Auth::user() ?: $request->user();
        if (!$user) {
            abort(401, 'غير مصرح: يرجى تسجيل الدخول.');
        }

        $isSuperAdmin = ($user->role === 'super_admin' || $user->is_super_admin === true);

        $query = AuditLog::query();

        if ($isSuperAdmin) {
            if ($request->filled('tenant_id')) {
                $query->where('tenant_id', (string) $request->input('tenant_id'));
            }
        } else {
            $tenantId = $user->tenant_id ?: ($user->clinic_id ?: null);
            if (!$tenantId) {
                abort(403, 'غير مصرح: لا توجد عيادة مرتبطة بهذا الحساب.');
            }
            $query->where('tenant_id', (string) $tenantId);
        }

        if ($request->filled('severity')) {
            $query->severity($request->input('severity'));
        }
        if ($request->filled('event_type')) {
            $query->eventType($request->input('event_type'));
        }
        if ($request->filled('search')) {
            $query->search($request->input('search'));
        }

        $filename = 'audit_logs_' . date('Y_m_d_His') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for Excel Arabic support
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, [
                'ID',
                'التاريخ والتوقيت',
                'درجة الخطورة',
                'نوع الحدث',
                'الوصف الجنائي',
                'المستخدم',
                'البريد',
                'الدور',
                'معرف العيادة',
                'عنوان IP',
                'المتصفح والنظام',
            ]);

            $query->orderBy('created_at', 'desc')->chunk(200, function ($logs) use ($handle) {
                foreach ($logs as $log) {
                    fputcsv($handle, [
                        $log->id,
                        $log->created_at->format('Y-m-d H:i:s'),
                        strtoupper($log->severity),
                        $log->event_type,
                        $log->action_description,
                        $log->user_name,
                        $log->user_email,
                        $log->user_role,
                        $log->tenant_id ?? 'عام / المنصة',
                        $log->ip_address,
                        $log->user_agent,
                    ]);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
