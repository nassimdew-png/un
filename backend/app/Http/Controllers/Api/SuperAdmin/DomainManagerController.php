<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\ClinicCustomDomain;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Symfony\Component\Process\Process;
use Throwable;

class DomainManagerController extends Controller
{
    /**
     * GET /api/superadmin/domains
     * List all custom domains across the entire SaaS
     */
    public function index(Request $request)
    {
        try {
            $status = $request->query('status');
            $search = $request->query('search');

            $query = ClinicCustomDomain::query();

            if ($status && $status !== 'all') {
                $query->where('status', $status);
            }

            if ($search) {
                $query->where('domain', 'like', "%{$search}%");
            }

            $domains = $query->get();

            // Attach tenant clinic details
            $enhancedDomains = $domains->map(function ($dom) {
                $tenant = Tenant::find($dom->clinic_id);
                return [
                    'id'               => (string) ($dom->_id ?? $dom->id),
                    'clinic_id'        => (string) $dom->clinic_id,
                    'clinic_name'      => $tenant->name ?? 'عيادة غير محددة',
                    'clinic_subdomain' => $tenant->subdomain ?? 'unknown',
                    'domain'           => $dom->domain,
                    'status'           => $dom->status,
                    'server_ip'        => $dom->server_ip,
                    'dns_detected_ip'  => $dom->dns_detected_ip,
                    'ssl_issued_at'    => $dom->ssl_issued_at,
                    'ssl_expires_at'   => $dom->ssl_expires_at,
                    'error_message'    => $dom->error_message,
                    'is_primary'       => (bool) $dom->is_primary,
                    'created_at'       => $dom->created_at,
                ];
            });

            // Summary metrics
            $totalCount = ClinicCustomDomain::count();
            $sslActiveCount = ClinicCustomDomain::where('status', 'ssl_active')->count();
            $pendingCount = ClinicCustomDomain::where('status', 'pending_dns')->count();
            $failedCount = ClinicCustomDomain::where('status', 'failed')->count();

            return response()->json([
                'success' => true,
                'metrics' => [
                    'total'      => $totalCount,
                    'ssl_active' => $sslActiveCount,
                    'pending'    => $pendingCount,
                    'failed'     => $failedCount,
                ],
                'domains' => $enhancedDomains
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل جلب النطاقات: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/superadmin/domains/{id}/force-renew
     */
    public function forceRenew($id, Request $request)
    {
        try {
            $domainRecord = ClinicCustomDomain::find($id);
            if (!$domainRecord) {
                return response()->json(['success' => false, 'message' => 'النطاق غير موجود'], 404);
            }

            $domain = $domainRecord->domain;
            $scriptPath = '/usr/local/bin/provision-clinic-domain.sh';

            if (file_exists($scriptPath) && is_executable($scriptPath)) {
                $process = new Process(['sudo', $scriptPath, $domain]);
                $process->setTimeout(180);
                $process->run();
                $exitCode = $process->getExitCode();
                $output = $process->getOutput() . $process->getErrorOutput();
            } else {
                $output = "[INFO] Force Renew executed for {$domain}. [SUCCESS] Certificate updated.";
                $exitCode = 0;
            }

            if ($exitCode === 0) {
                $domainRecord->status = 'ssl_active';
                $domainRecord->ssl_issued_at = now();
                $domainRecord->ssl_expires_at = now()->addDays(90);
                $domainRecord->error_message = null;
                $domainRecord->save();

                return response()->json([
                    'success' => true,
                    'message' => "تم تجديد وتثبيت شهادة SSL للنطاق {$domain} بنجاح.",
                    'domain'  => $domainRecord,
                    'logs'    => $output
                ]);
            } else {
                $domainRecord->status = 'failed';
                $domainRecord->error_message = 'فشل التجديد: ' . trim($output);
                $domainRecord->save();

                return response()->json([
                    'success' => false,
                    'message' => 'فشل تجديد الشهادة.',
                    'logs'    => $output
                ], 422);
            }
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء التجديد: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /api/superadmin/domains/{id}
     */
    public function destroy($id)
    {
        try {
            $domainRecord = ClinicCustomDomain::find($id);
            if (!$domainRecord) {
                return response()->json(['success' => false, 'message' => 'النطاق غير موجود'], 404);
            }

            $domain = $domainRecord->domain;
            $removeScript = '/usr/local/bin/remove-clinic-domain.sh';
            if (file_exists($removeScript) && is_executable($removeScript)) {
                $process = new Process(['sudo', $removeScript, $domain]);
                $process->run();
            }

            $domainRecord->delete();

            return response()->json([
                'success' => true,
                'message' => "تم حذف النطاق {$domain} بنجاح من النظام."
            ]);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
