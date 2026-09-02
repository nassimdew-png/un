<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiUsageLog;
use App\Models\SystemSetting;
use App\Models\Tenant;
use App\Services\AiGatewayService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperAdminAiController extends Controller
{
    protected AiGatewayService $gateway;

    public function __construct(AiGatewayService $gateway)
    {
        $this->gateway = $gateway;
    }

    /**
     * Get Complete AI Hub Settings, Global Usage Metrics & Clinic Consumption Table.
     */
    public function getSettings(): JsonResponse
    {
        $startOfMonth = Carbon::now()->startOfMonth();

        // Aggregated Usage Metrics
        $totalTokensThisMonth = (int) AiUsageLog::where('created_at', '>=', $startOfMonth)->sum('total_tokens');
        $totalCostUsd = (float) AiUsageLog::where('created_at', '>=', $startOfMonth)->sum('estimated_cost_usd');
        $totalCalls = AiUsageLog::where('created_at', '>=', $startOfMonth)->count();
        $fallbackCalls = AiUsageLog::where('created_at', '>=', $startOfMonth)->where('status', 'fallback_triggered')->count();
        $successRate = $totalCalls > 0 ? round((($totalCalls - $fallbackCalls) / $totalCalls) * 100, 1) : 100.0;

        // Current Database Settings
        $geminiKey = SystemSetting::get('gemini_api_key') ?: config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        $geminiModel = SystemSetting::get('gemini_model', config('services.gemini.model', 'gemini-3.6-flash'));
        $geminiTemp = (float) SystemSetting::get('gemini_temperature', 0.7);
        $freeAiCredits = (int) SystemSetting::get('free_ai_credits_per_tenant', 3);
        $primaryProvider = SystemSetting::get('ai_primary_provider', 'gemini');

        // Masked key for UI security
        $maskedGeminiKey = '';
        if ($geminiKey) {
            $maskedGeminiKey = substr($geminiKey, 0, 6) . '••••••••••••••••' . substr($geminiKey, -4);
        }

        // Active AI Clinics Count
        $activeAiClinicsCount = Tenant::where('has_ai_access', true)->count();

        // Clinic Quota & Usage Table
        $clinics = Tenant::select(
            'id', 'name', 'subdomain', 'status', 'has_ai_access', 'monthly_ai_quota', 'ai_credits_used',
            'ai_monthly_token_limit', 'ai_tokens_used_this_month', 'ai_tokens_balance'
        )
        ->orderBy('ai_tokens_used_this_month', 'desc')
        ->get()
        ->map(function ($c) {
            $limit = $c->ai_monthly_token_limit ?: 100000;
            $used = $c->ai_tokens_used_this_month ?: 0;
            $percent = $limit > 0 ? round(($used / $limit) * 100, 1) : 0;

            return [
                'id' => $c->id,
                'name' => $c->name,
                'subdomain' => $c->subdomain,
                'status' => $c->status,
                'has_ai_access' => (bool) ($c->has_ai_access ?? true),
                'monthly_ai_quota' => (int) ($c->monthly_ai_quota ?? 50),
                'ai_credits_used' => (int) ($c->ai_credits_used ?? 0),
                'monthly_limit' => $limit,
                'used_this_month' => $used,
                'balance' => $c->ai_tokens_balance,
                'usage_percentage' => min($percent, 100),
            ];
        });

        // Recent Audit Logs
        $recentLogs = AiUsageLog::with('tenant:id,name')
            ->orderBy('created_at', 'desc')
            ->limit(25)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'clinic_name' => $log->tenant->name ?? 'عيادة تجريبية',
                    'feature' => $log->feature,
                    'provider' => $log->provider_used,
                    'model' => $log->model_name,
                    'tokens' => $log->total_tokens,
                    'cost_usd' => $log->estimated_cost_usd,
                    'latency_ms' => $log->execution_time_ms ?: $log->latency_ms,
                    'status' => $log->status,
                    'created_at' => $log->created_at ? $log->created_at->format('Y-m-d H:i') : null,
                ];
            });

        return response()->json([
            'success' => true,
            'settings' => [
                'gemini_api_key' => $geminiKey,
                'gemini_api_key_masked' => $maskedGeminiKey,
                'gemini_model' => $geminiModel,
                'gemini_temperature' => $geminiTemp,
                'free_ai_credits_per_tenant' => $freeAiCredits,
                'primary_provider' => $primaryProvider,
            ],
            'stats' => [
                'total_tokens_month' => $totalTokensThisMonth,
                'total_cost_usd' => $totalCostUsd,
                'total_cost_dzd' => round($totalCostUsd * 240, 2),
                'total_calls' => $totalCalls,
                'fallback_calls' => $fallbackCalls,
                'success_rate' => $successRate,
                'active_ai_clinics_count' => $activeAiClinicsCount,
            ],
            'clinics' => $clinics,
            'recent_logs' => $recentLogs,
        ]);
    }

    /**
     * Update Dynamic AI Settings & API Keys.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'gemini_api_key' => 'nullable|string',
            'gemini_model' => 'nullable|string',
            'gemini_temperature' => 'nullable|numeric|min:0|max:1',
            'free_ai_credits_per_tenant' => 'nullable|integer|min:0',
            'primary_provider' => 'nullable|string|in:gemini,openai,claude',
        ]);

        if (!empty($validated['gemini_api_key'])) {
            SystemSetting::set('gemini_api_key', $validated['gemini_api_key'], 'ai');
        }
        if (!empty($validated['gemini_model'])) {
            SystemSetting::set('gemini_model', $validated['gemini_model'], 'ai');
        }
        if (isset($validated['gemini_temperature'])) {
            SystemSetting::set('gemini_temperature', (string)$validated['gemini_temperature'], 'ai');
        }
        if (isset($validated['free_ai_credits_per_tenant'])) {
            SystemSetting::set('free_ai_credits_per_tenant', (string)$validated['free_ai_credits_per_tenant'], 'ai');
        }
        if (!empty($validated['primary_provider'])) {
            SystemSetting::set('ai_primary_provider', $validated['primary_provider'], 'ai');
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ وتحديث إعدادات الذكاء الاصطناعي ومفتاح Gemini بنجاح.',
        ]);
    }

    /**
     * Live Ping & Latency Test for Gemini API.
     */
    public function testConnection(Request $request): JsonResponse
    {
        $provider = $request->input('provider', 'gemini');
        $apiKey = $request->input('api_key', null);

        if (!$apiKey) {
            $apiKey = SystemSetting::get("{$provider}_api_key") ?: config("services.{$provider}.api_key") ?: config("services.ai.{$provider}_api_key") ?: env(strtoupper($provider) . '_API_KEY');
        }

        $result = $this->gateway->testProviderConnection($provider, $apiKey);

        return response()->json($result);
    }

    /**
     * Toggle AI Access & Monthly Quota for a Specific Clinic.
     */
    public function toggleClinicAiAccess($clinicId, Request $request): JsonResponse
    {
        $tenant = Tenant::find($clinicId) 
            ?: Tenant::where('subdomain', (string)$clinicId)->first() 
            ?: Tenant::findOrFail($clinicId);

        $validated = $request->validate([
            'has_ai_access' => 'nullable|boolean',
            'monthly_ai_quota' => 'nullable|integer|min:0',
            'monthly_limit' => 'nullable|integer|min:0',
            'bonus_tokens' => 'nullable|integer|min:0',
            'reset_usage' => 'nullable|boolean',
        ]);

        if (isset($validated['has_ai_access'])) {
            $tenant->has_ai_access = (bool)$validated['has_ai_access'];
        }

        if (isset($validated['monthly_ai_quota'])) {
            $tenant->monthly_ai_quota = $validated['monthly_ai_quota'];
        }

        if (isset($validated['monthly_limit'])) {
            $tenant->ai_monthly_token_limit = $validated['monthly_limit'];
            $tenant->ai_monthly_token_quota = $validated['monthly_limit'];
        }

        if (!empty($validated['bonus_tokens'])) {
            $tenant->ai_tokens_balance = ($tenant->ai_tokens_balance ?? 0) + $validated['bonus_tokens'];
        }

        if (!empty($validated['reset_usage'])) {
            $tenant->ai_tokens_used_this_month = 0;
            $tenant->ai_credits_used = 0;
            $tenant->ai_quota_reset_at = now()->toDateString();
        }

        $tenant->save();

        return response()->json([
            'success' => true,
            'message' => "تم تحديث صلاحيات وحصة الذكاء الاصطناعي للعيادة ({$tenant->name}) بنجاح.",
            'tenant' => $tenant,
        ]);
    }

    /**
     * Reset monthly usage counters across all clinics.
     */
    public function resetMonthlyUsage(): JsonResponse
    {
        Tenant::query()->update([
            'ai_tokens_used_this_month' => 0,
            'ai_credits_used' => 0,
            'ai_quota_reset_at' => now()->toDateString(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تصفير عداد الاستهلاك الشهري لكافة العيادات وتجديد الرصيد بنجاح.',
        ]);
    }
}
