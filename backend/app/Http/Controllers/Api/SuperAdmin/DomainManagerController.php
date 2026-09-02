<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\ClinicCustomDomain;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class DomainManagerController extends Controller
{
    protected string $serverIp = '145.223.116.54';

    /**
     * GET /api/super-admin/domains
     * List all custom domains across all clinics.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ClinicCustomDomain::with('tenant:id,name,subdomain,status');

        if ($request->has('status') && $request->input('status') !== '') {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('search') && $request->input('search') !== '') {
            $s = trim($request->input('search'));
            $query->where(function($q) use ($s) {
                $q->where('domain', 'like', "%{$s}%")
                  ->orWhereHas('tenant', fn($t) => $t->where('name', 'like', "%{$s}%")->orWhere('subdomain', 'like', "%{$s}%"));
            });
        }

        $domains = $query->latest()->get();

        $stats = [
            'total' => ClinicCustomDomain::count(),
            'ssl_active' => ClinicCustomDomain::where('status', 'ssl_active')->count(),
            'pending_dns' => ClinicCustomDomain::where('status', 'pending_dns')->count(),
            'dns_verified' => ClinicCustomDomain::where('status', 'dns_verified')->count(),
            'failed' => ClinicCustomDomain::where('status', 'failed')->count(),
        ];

        return response()->json([
            'success' => true,
            'server_ip' => $this->serverIp,
            'stats' => $stats,
            'domains' => $domains,
            'data' => $domains,
        ]);
    }

    /**
     * POST /api/super-admin/domains/{id}/force-renew
     * Re-issue or force provision SSL certificate for a domain.
     */
    public function forceRenew(Request $request, $id): JsonResponse
    {
        $record = ClinicCustomDomain::findOrFail($id);
        $domain = $record->domain;

        $scriptPath = '/usr/local/bin/provision-clinic-domain.sh';
        $cmd = file_exists($scriptPath) 
            ? "sudo {$scriptPath} " . escapeshellarg($domain) . " provision"
            : "bash /var/www/clinic-saas/provision-clinic-domain.sh " . escapeshellarg($domain) . " provision";

        try {
            $process = Process::fromShellCommandline($cmd);
            $process->setTimeout(120);
            $process->run();

            if (!$process->isSuccessful()) {
                $error = $process->getErrorOutput() ?: $process->getOutput();
                $record->status = 'failed';
                $record->error_message = substr($error, 0, 500);
                $record->save();

                return response()->json([
                    'success' => false,
                    'message' => 'فشل التجديد الإجباري: ' . $error,
                    'domain' => $record,
                ], 500);
            }

            $record->status = 'ssl_active';
            $record->ssl_issued_at = now();
            $record->ssl_expires_at = now()->addDays(90);
            $record->error_message = null;
            $record->save();

            $tenant = Tenant::find($record->clinic_id);
            if ($tenant) {
                $tenant->custom_domain = $domain;
                $tenant->save();
            }

            return response()->json([
                'success' => true,
                'status' => 'ssl_active',
                'message' => "تم تجديد شهادة SSL وتحديث إعدادات النطاق ({$domain}) بنجاح.",
                'domain' => $record,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ أثناء التجديد: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/super-admin/domains/{id}
     * Force delete a custom domain from the platform.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $record = ClinicCustomDomain::findOrFail($id);
        $domain = $record->domain;

        $scriptPath = '/usr/local/bin/provision-clinic-domain.sh';
        $cmd = file_exists($scriptPath) 
            ? "sudo {$scriptPath} " . escapeshellarg($domain) . " remove"
            : "bash /var/www/clinic-saas/provision-clinic-domain.sh " . escapeshellarg($domain) . " remove";

        try {
            $process = Process::fromShellCommandline($cmd);
            $process->setTimeout(60);
            $process->run();
        } catch (\Exception $e) {
            Log::warning("SuperAdmin domain remove error: " . $e->getMessage());
        }

        $tenant = Tenant::find($record->clinic_id);
        if ($tenant && $tenant->custom_domain === $domain) {
            $tenant->custom_domain = null;
            $tenant->save();
        }

        $record->delete();

        return response()->json([
            'success' => true,
            'message' => "تم حذف النطاق ({$domain}) من المنصة بنجاح.",
        ]);
    }
}
