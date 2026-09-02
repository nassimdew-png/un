<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClinicCustomDomain;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class CustomDomainManagerController extends Controller
{
    protected string $serverIp = '145.223.116.54';

    /**
     * Get the authenticated clinic ID.
     */
    protected function getClinicId(Request $request): ?string
    {
        $user = $request->user();
        return $user ? $user->tenant_id : null;
    }

    /**
     * Clean and normalize a domain string.
     */
    protected function cleanDomain(string $raw): string
    {
        $domain = strtolower(trim($raw));
        $domain = preg_replace('#^https?://#i', '', $domain);
        $domain = preg_replace('#/.*$#', '', $domain);
        $domain = preg_replace('#:.*$#', '', $domain);
        return trim($domain);
    }

    /**
     * GET /api/clinic/domains
     * List all custom domains for the authenticated clinic.
     */
    public function index(Request $request): JsonResponse
    {
        $clinicId = $this->getClinicId($request);
        if (!$clinicId) {
            return response()->json(['success' => false, 'message' => 'العيادة غير محددة.'], 400);
        }

        $domains = ClinicCustomDomain::where('clinic_id', $clinicId)->latest()->get();

        return response()->json([
            'success' => true,
            'server_ip' => $this->serverIp,
            'domains' => $domains,
            'data' => $domains,
        ]);
    }

    /**
     * POST /api/clinic/domains
     * Register a new custom domain for the clinic in pending_dns status.
     */
    public function store(Request $request): JsonResponse
    {
        $clinicId = $this->getClinicId($request);
        if (!$clinicId) {
            return response()->json(['success' => false, 'message' => 'العيادة غير محددة.'], 400);
        }

        $request->validate([
            'domain' => 'required|string|max:255',
        ]);

        $domain = $this->cleanDomain($request->input('domain'));

        // Basic domain validation
        if (!preg_match('/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i', $domain)) {
            return response()->json([
                'success' => false,
                'message' => 'صيغة اسم النطاق غير صالحة. يرجى إدخال نطاق صالح مثل (example.com أو dr-name.dz).',
            ], 422);
        }

        // Prevent attaching system platform domains
        if (str_ends_with($domain, 'psypro.tech') || $domain === 'psypro.tech' || $domain === 'localhost') {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن استخدام نطاق المنصة الرسمي كنطاق مخصص.',
            ], 422);
        }

        // Check uniqueness across the entire system
        $exists = ClinicCustomDomain::where('domain', $domain)->exists();
        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'هذا النطاق مسجل ومربوط بالفعل في النظام.',
            ], 422);
        }

        $record = ClinicCustomDomain::create([
            'clinic_id' => $clinicId,
            'domain' => $domain,
            'status' => 'pending_dns',
            'server_ip' => $this->serverIp,
            'is_primary' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة النطاق بنجاح. يرجى إعداد سجلات الـ DNS المطلوبة في لوحة تحكم مزود النطاق الخاص بك.',
            'domain' => $record,
            'dns_instructions' => [
                'type' => 'A',
                'host' => '@',
                'value' => $this->serverIp,
                'ttl' => '3600 (أو تلقائي)',
            ],
        ], 201);
    }

    /**
     * POST /api/clinic/domains/{id}/verify-dns
     * Query DNS A-records to verify domain propagation.
     */
    public function verifyDns(Request $request, $id): JsonResponse
    {
        $clinicId = $this->getClinicId($request);
        $record = ClinicCustomDomain::where('id', $id)
            ->when($clinicId, fn($q) => $q->where('clinic_id', $clinicId))
            ->firstOrFail();

        $domain = $record->domain;
        $resolvedIps = [];

        // 1. Try dns_get_record
        $dnsRecords = @dns_get_record($domain, DNS_A);
        if (is_array($dnsRecords)) {
            foreach ($dnsRecords as $r) {
                if (!empty($r['ip'])) {
                    $resolvedIps[] = $r['ip'];
                }
            }
        }

        // 2. Fallback to gethostbyname
        $hostIp = @gethostbyname($domain);
        if ($hostIp && $hostIp !== $domain && !in_array($hostIp, $resolvedIps)) {
            $resolvedIps[] = $hostIp;
        }

        $detectedIp = !empty($resolvedIps) ? $resolvedIps[0] : null;
        $record->dns_detected_ip = $detectedIp;

        $isMatching = in_array($this->serverIp, $resolvedIps);

        if ($isMatching) {
            $record->status = ($record->status === 'ssl_active') ? 'ssl_active' : 'dns_verified';
            $record->error_message = null;
            $record->save();

            return response()->json([
                'success' => true,
                'is_verified' => true,
                'status' => $record->status,
                'domain' => $record,
                'message' => 'تهانينا! تم التحقق من توجيه سجلات الـ DNS بنجاح إلى سيرفر المنصة. يمكنك الآن توليد شهادة SSL.',
            ]);
        }

        $record->status = 'pending_dns';
        $record->save();

        return response()->json([
            'success' => false,
            'is_verified' => false,
            'status' => 'pending_dns',
            'domain' => $record,
            'detected_ip' => $detectedIp,
            'required_ip' => $this->serverIp,
            'message' => $detectedIp 
                ? "تم اكتشاف أن النطاق موجه إلى IP: ({$detectedIp}) بينما الـ IP المطلوب هو ({$this->serverIp}). يرجى تحديث سجل A في مزود النطاق."
                : "لم يتم اكتشاف سجلات A موجهة للنطاق بعد. قد يستغرق انتشار الـ DNS بضع دقائق.",
        ]);
    }

    /**
     * POST /api/clinic/domains/{id}/issue-ssl
     * Execute provisioning script to create virtual host and issue Let's Encrypt SSL certificate.
     */
    public function issueSsl(Request $request, $id): JsonResponse
    {
        $clinicId = $this->getClinicId($request);
        $record = ClinicCustomDomain::where('id', $id)
            ->when($clinicId, fn($q) => $q->where('clinic_id', $clinicId))
            ->firstOrFail();

        $domain = $record->domain;

        // Perform quick DNS verification check first
        $hostIp = @gethostbyname($domain);
        if ($hostIp !== $this->serverIp && $record->status === 'pending_dns') {
            return response()->json([
                'success' => false,
                'message' => "لا يمكن توليد شهادة SSL قبل اكتمال توجيه الـ DNS إلى السيرفر ({$this->serverIp}).",
            ], 400);
        }

        // Execute provisioning script
        $scriptPath = '/usr/local/bin/provision-clinic-domain.sh';
        $cmd = file_exists($scriptPath) 
            ? "sudo {$scriptPath} " . escapeshellarg($domain) . " provision"
            : "bash /var/www/clinic-saas/provision-clinic-domain.sh " . escapeshellarg($domain) . " provision";

        try {
            $process = Process::fromShellCommandline($cmd);
            $process->setTimeout(120);
            $process->run();

            if (!$process->isSuccessful()) {
                $errorOutput = $process->getErrorOutput() ?: $process->getOutput();
                Log::error("SSL provisioning failed for {$domain}: " . $errorOutput);
                $record->status = 'failed';
                $record->error_message = substr($errorOutput, 0, 500);
                $record->save();

                return response()->json([
                    'success' => false,
                    'message' => 'تعذر إكمال توليد شهادة SSL تلقائياً: ' . $errorOutput,
                    'domain' => $record,
                ], 500);
            }

            // Provisioning successful
            $record->status = 'ssl_active';
            $record->ssl_issued_at = now();
            $record->ssl_expires_at = now()->addDays(90);
            $record->error_message = null;
            $record->save();

            // Link domain to tenant record
            $tenant = Tenant::find($record->clinic_id);
            if ($tenant) {
                $tenant->custom_domain = $domain;
                $tenant->save();
            }

            return response()->json([
                'success' => true,
                'status' => 'ssl_active',
                'message' => "تم تثبيت شهادة SSL وتفعيل النطاق المخصص (https://{$domain}) بنجاح!",
                'domain' => $record,
            ]);
        } catch (\Exception $e) {
            Log::error("SSL provisioning exception for {$domain}: " . $e->getMessage());
            $record->status = 'failed';
            $record->error_message = $e->getMessage();
            $record->save();

            return response()->json([
                'success' => false,
                'message' => 'حدث استثناء أثناء إعداد وتفعيل شهادة الأمان: ' . $e->getMessage(),
                'domain' => $record,
            ], 500);
        }
    }

    /**
     * DELETE /api/clinic/domains/{id}
     * Remove custom domain and teardown reverse proxy configurations.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $clinicId = $this->getClinicId($request);
        $record = ClinicCustomDomain::where('id', $id)
            ->when($clinicId, fn($q) => $q->where('clinic_id', $clinicId))
            ->firstOrFail();

        $domain = $record->domain;

        // Run removal script
        $scriptPath = '/usr/local/bin/provision-clinic-domain.sh';
        $cmd = file_exists($scriptPath) 
            ? "sudo {$scriptPath} " . escapeshellarg($domain) . " remove"
            : "bash /var/www/clinic-saas/provision-clinic-domain.sh " . escapeshellarg($domain) . " remove";

        try {
            $process = Process::fromShellCommandline($cmd);
            $process->setTimeout(60);
            $process->run();
        } catch (\Exception $e) {
            Log::warning("Domain cleanup warning for {$domain}: " . $e->getMessage());
        }

        // Unlink from tenant
        $tenant = Tenant::find($record->clinic_id);
        if ($tenant && $tenant->custom_domain === $domain) {
            $tenant->custom_domain = null;
            $tenant->save();
        }

        $record->delete();

        return response()->json([
            'success' => true,
            'message' => "تم حذف النطاق ({$domain}) وإلغاء إعدادات التوجيه بنجاح.",
        ]);
    }
}
