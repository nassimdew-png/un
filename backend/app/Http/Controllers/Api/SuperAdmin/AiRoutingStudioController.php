<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AiCostLog;
use App\Models\AiProvider;
use App\Models\AiTaskRoute;
use App\Models\User;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;

class AiRoutingStudioController extends Controller
{
    protected function authorizeSuperAdmin(): ?User
    {
        $user = Auth::guard('sanctum')->user() ?: Auth::user() ?: request()->user();

        if (!$user) {
            $token = request()->bearerToken();
            if ($token) {
                $pat = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                if ($pat && $pat->tokenable) {
                    $user = $pat->tokenable;
                }
            }
        }

        if ($user) {
            $isSuper = (bool)$user->is_super_admin 
                || in_array($user->role, ['superadmin', 'super_admin', 'super_owner'])
                || in_array($user->admin_role ?? '', ['super_owner', 'support_agent'])
                || (method_exists($user, 'isSuperadmin') && $user->isSuperadmin());

            if (!$isSuper) {
                abort(403, 'غير مصرح لك بالوصول لأستوديو توجيه وتكلفة الذكاء الاصطناعي.');
            }
            return $user;
        }

        return null;
    }

    /**
     * Get AI Routing Studio Overview.
     * GET /api/super-admin/ai-routing/overview
     */
    public function getStudioOverview(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $providers = AiProvider::orderBy('priority', 'asc')->get()->map(function ($p) {
            $hasKey = !empty($p->api_key) || !empty(config('services.' . $p->slug . '.key')) || ($p->slug === 'gemini' && !empty(config('services.gemini.api_key')));
            $status = $hasKey ? ($p->status ?: 'healthy') : 'unconfigured';
            $isActive = (bool)($p->is_active && $hasKey);

            return [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'masked_key' => $hasKey ? $p->masked_api_key : 'غير مضبوط (No API Key)',
                'has_key' => $hasKey,
                'base_url' => $p->base_url,
                'default_model' => $p->default_model,
                'is_active' => $isActive,
                'priority' => $p->priority,
                'status' => $status,
                'latency_ms' => $hasKey ? $p->latency_ms : 0,
                'last_health_check' => $p->last_health_check_at ? $p->last_health_check_at->format('d/m/Y H:i') : null,
                'pricing_input_1m' => $p->pricing_input_1m,
                'pricing_output_1m' => $p->pricing_output_1m,
            ];
        });

        $routes = AiTaskRoute::orderBy('id', 'asc')->get();

        // Monthly Stats
        $startOfMonth = Carbon::now()->startOfMonth();
        $totalInputTokens = (int) AiCostLog::where('created_at', '>=', $startOfMonth)->sum('input_tokens');
        $totalOutputTokens = (int) AiCostLog::where('created_at', '>=', $startOfMonth)->sum('output_tokens');
        $totalTokens = $totalInputTokens + $totalOutputTokens;
        $totalCostUsd = (float) AiCostLog::where('created_at', '>=', $startOfMonth)->sum('estimated_cost_usd');
        $failoverCount = AiCostLog::where('created_at', '>=', $startOfMonth)->where('was_fallback_used', true)->count();

        // 1 USD = 220 DZD parallel/realistic exchange rate
        $totalCostDzd = round($totalCostUsd * 220, 2);

        // Usage by Provider
        $providerDistribution = AiCostLog::where('created_at', '>=', $startOfMonth)
            ->selectRaw('provider_slug, count(*) as call_count, sum(total_tokens) as tokens_sum, sum(estimated_cost_usd) as cost_sum')
            ->groupBy('provider_slug')
            ->get();

        // Recent Logs
        $recentLogs = AiCostLog::with('tenant')
            ->orderBy('id', 'desc')
            ->limit(15)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'clinic_name' => $log->tenant ? $log->tenant->name : 'النظام المركزي',
                    'task_type' => $log->task_type,
                    'provider_slug' => $log->provider_slug,
                    'model_name' => $log->model_name,
                    'tokens' => $log->total_tokens,
                    'cost_usd' => number_format($log->estimated_cost_usd, 5) . ' $',
                    'cost_dzd' => number_format($log->estimated_cost_usd * 220, 2) . ' د.ج',
                    'latency_ms' => $log->latency_ms,
                    'was_fallback' => $log->was_fallback_used,
                    'fallback_reason' => $log->fallback_reason,
                    'created_at' => $log->created_at ? $log->created_at->format('d/m/Y H:i:s') : 'N/A',
                ];
            });

        return response()->json([
            'success' => true,
            'providers' => $providers,
            'task_routes' => $routes,
            'stats' => [
                'total_tokens' => $totalTokens,
                'total_input_tokens' => $totalInputTokens,
                'total_output_tokens' => $totalOutputTokens,
                'total_cost_usd' => round($totalCostUsd, 4),
                'total_cost_dzd' => $totalCostDzd,
                'failover_count' => $failoverCount,
                'active_providers_count' => $providers->where('is_active', true)->count(),
            ],
            'provider_distribution' => $providerDistribution,
            'recent_logs' => $recentLogs,
        ]);
    }

    /**
     * Update Provider API key and configuration.
     * PUT /api/super-admin/ai-routing/providers/{id}
     */
    public function updateProvider(Request $request, int $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $provider = AiProvider::findOrFail($id);

        $validated = $request->validate([
            'api_key' => 'nullable|string',
            'default_model' => 'nullable|string|max:100',
            'is_active' => 'boolean',
            'priority' => 'integer|min:1|max:10',
            'pricing_input_1m' => 'nullable|numeric|min:0',
            'pricing_output_1m' => 'nullable|numeric|min:0',
        ]);

        if (!empty($validated['api_key'])) {
            $provider->api_key = trim($validated['api_key']);
        }
        if (!empty($validated['default_model'])) {
            $provider->default_model = $validated['default_model'];
        }
        if (isset($validated['is_active'])) {
            $provider->is_active = $validated['is_active'];
        }
        if (isset($validated['priority'])) {
            $provider->priority = $validated['priority'];
        }
        if (isset($validated['pricing_input_1m'])) {
            $provider->pricing_input_1m = $validated['pricing_input_1m'];
        }
        if (isset($validated['pricing_output_1m'])) {
            $provider->pricing_output_1m = $validated['pricing_output_1m'];
        }

        $provider->save();

        AuditLogger::log(
            'ai.provider_updated',
            "قام المشرف بتحديث إعدادات مزود الذكاء الاصطناعي: ({$provider->name})",
            'info',
            'AiProvider',
            (string) $provider->id,
            [
                'slug' => $provider->slug,
                'default_model' => $provider->default_model,
                'is_active' => $provider->is_active,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "تم تحديث إعدادات مزود ({$provider->name}) بنجاح.",
            'provider' => $provider,
        ]);
    }

    /**
     * Ping provider to test live latency and connectivity.
     * POST /api/super-admin/ai-routing/providers/{id}/ping
     */
    public function pingProvider(Request $request, int $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $provider = AiProvider::findOrFail($id);

        $startTime = microtime(true);
        $status = 'healthy';
        $latencyMs = 0;

        try {
            // Lightweight ping to base URL or API status
            $url = match ($provider->slug) {
                'gemini' => 'https://generativelanguage.googleapis.com',
                'openai' => 'https://api.openai.com/v1/models',
                'anthropic' => 'https://api.anthropic.com',
                'deepseek' => 'https://api.deepseek.com',
                'groq' => 'https://api.groq.com/openai/v1/models',
                default => $provider->base_url ?: 'https://google.com',
            };

            $response = Http::timeout(3)->get($url);
            $latencyMs = max(10, (int) round((microtime(true) - $startTime) * 1000));

            if ($latencyMs > 1000) {
                $status = 'degraded';
            } else {
                $status = 'healthy';
            }
        } catch (\Throwable $e) {
            $latencyMs = (int) round((microtime(true) - $startTime) * 1000);
            $status = 'failing';
        }

        $provider->latency_ms = $latencyMs;
        $provider->status = $status;
        $provider->last_health_check_at = now();
        $provider->save();

        return response()->json([
            'success' => true,
            'latency_ms' => $latencyMs,
            'status' => $status,
            'status_label_ar' => match ($status) {
                'healthy' => 'متصل ومستقر 🟢',
                'degraded' => 'استجابة بطيئة 🟡',
                default => 'غير متصل / انقطاع 🔴',
            },
            'last_check' => $provider->last_health_check_at->format('H:i:s'),
        ]);
    }

    /**
     * Update task routing (Primary & Fallback models).
     * PUT /api/super-admin/ai-routing/routes/{id}
     */
    public function updateTaskRoute(Request $request, int $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $route = AiTaskRoute::findOrFail($id);

        $validated = $request->validate([
            'primary_provider' => 'required|string',
            'primary_model' => 'required|string',
            'fallback_provider' => 'required|string',
            'fallback_model' => 'required|string',
            'temperature' => 'required|numeric|min:0|max:1',
            'max_tokens' => 'required|integer|min:256|max:16384',
            'is_enabled' => 'boolean',
        ]);

        $route->update($validated);

        AuditLogger::log(
            'ai.route_updated',
            "قام المشرف بتحديث مسار الذكاء الاصطناعي للمهمة: \"{$route->task_label_ar}\"",
            'info',
            'AiTaskRoute',
            (string) $route->id,
            [
                'primary' => "{$route->primary_provider} ({$route->primary_model})",
                'fallback' => "{$route->fallback_provider} ({$route->fallback_model})",
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "تم حفظ مسار مهمة ({$route->task_label_ar}) بنجاح.",
            'route' => $route,
        ]);
    }
}
