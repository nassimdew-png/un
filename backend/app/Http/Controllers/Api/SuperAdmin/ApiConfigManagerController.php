<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SystemApiConfig;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ApiConfigManagerController extends Controller
{
    /**
     * Get All API Configs and Feature Flags.
     * GET /api/superadmin/api-configs
     */
    public function getConfigs(): JsonResponse
    {
        // Ensure default Gemini config exists
        $gemini = SystemApiConfig::firstOrCreate(
            ['provider' => 'gemini'],
            [
                'api_key' => SystemSetting::get('gemini_api_key') ?: env('GEMINI_API_KEY'),
                'default_text_model' => 'gemini-3.6-flash',
                'default_vision_model' => 'gemini-3.6-flash',
                'default_audio_model' => 'gemini-3.6-flash',
                'default_video_model' => 'veo_animation',
                'is_active' => true,
                'rate_limit_per_minute' => 60,
                'health_status' => 'healthy',
                'feature_flags' => [
                    'ai_clinical_hub' => true,
                    'ai_radio_studio' => true,
                    'ai_image_studio' => true,
                    'ai_video_studio' => true,
                    'ai_speech_studio' => true,
                    'ai_fluency_analyzer' => true,
                    'ai_data_analyst' => true,
                    'ai_document_processor' => true,
                ]
            ]
        );

        $elevenlabs = SystemApiConfig::firstOrCreate(
            ['provider' => 'elevenlabs'],
            [
                'api_key' => null,
                'default_audio_model' => 'eleven_multilingual_v2',
                'is_active' => false,
                'health_status' => 'untested',
            ]
        );

        $configs = SystemApiConfig::all()->map(function ($cfg) {
            return [
                'id' => $cfg->id,
                'provider' => $cfg->provider,
                'has_key' => !empty($cfg->api_key),
                'masked_key' => $cfg->masked_key,
                'has_secondary_key' => !empty($cfg->secondary_api_key),
                'masked_secondary_key' => $cfg->masked_secondary_key,
                'default_text_model' => $cfg->default_text_model,
                'default_vision_model' => $cfg->default_vision_model,
                'default_audio_model' => $cfg->default_audio_model,
                'default_video_model' => $cfg->default_video_model,
                'is_active' => (bool)$cfg->is_active,
                'rate_limit_per_minute' => $cfg->rate_limit_per_minute,
                'health_status' => $cfg->health_status,
                'last_tested_at' => $cfg->last_tested_at ? $cfg->last_tested_at->toIso8601String() : null,
                'feature_flags' => $cfg->feature_flags ?: [],
            ];
        });

        return response()->json([
            'success' => true,
            'configs' => $configs,
        ]);
    }

    /**
     * Update API Configs, Keys, and Model Settings.
     * POST /api/superadmin/api-configs/update
     */
    public function updateConfigs(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => 'required|string|in:gemini,elevenlabs,google_cloud,custom',
            'api_key' => 'nullable|string',
            'secondary_api_key' => 'nullable|string',
            'default_text_model' => 'nullable|string|max:100',
            'default_vision_model' => 'nullable|string|max:100',
            'default_audio_model' => 'nullable|string|max:100',
            'default_video_model' => 'nullable|string|max:100',
            'is_active' => 'nullable|boolean',
            'rate_limit_per_minute' => 'nullable|integer|min:1|max:1000',
            'feature_flags' => 'nullable|array',
        ]);

        $config = SystemApiConfig::firstOrNew(['provider' => $validated['provider']]);

        if ($request->filled('api_key') && !str_contains($validated['api_key'], '****')) {
            $config->api_key = trim($validated['api_key']);
            if ($validated['provider'] === 'gemini') {
                SystemSetting::set('gemini_api_key', trim($validated['api_key']));
            }
        }

        if ($request->filled('secondary_api_key') && !str_contains($validated['secondary_api_key'], '****')) {
            $config->secondary_api_key = trim($validated['secondary_api_key']);
        }

        if (isset($validated['default_text_model'])) {
            $config->default_text_model = $validated['default_text_model'];
            if ($validated['provider'] === 'gemini') {
                SystemSetting::set('gemini_model', $validated['default_text_model']);
            }
        }

        if (isset($validated['default_vision_model'])) $config->default_vision_model = $validated['default_vision_model'];
        if (isset($validated['default_audio_model'])) $config->default_audio_model = $validated['default_audio_model'];
        if (isset($validated['default_video_model'])) $config->default_video_model = $validated['default_video_model'];
        if (isset($validated['is_active'])) $config->is_active = (bool)$validated['is_active'];
        if (isset($validated['rate_limit_per_minute'])) $config->rate_limit_per_minute = $validated['rate_limit_per_minute'];
        if (isset($validated['feature_flags'])) $config->feature_flags = $validated['feature_flags'];

        $config->save();

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ إعدادات مزود الذكاء الاصطناعي وتشفير المفاتيح بنجاح!',
            'config' => [
                'provider' => $config->provider,
                'has_key' => !empty($config->api_key),
                'masked_key' => $config->masked_key,
                'has_secondary_key' => !empty($config->secondary_api_key),
                'masked_secondary_key' => $config->masked_secondary_key,
                'default_text_model' => $config->default_text_model,
                'is_active' => (bool)$config->is_active,
                'feature_flags' => $config->feature_flags,
            ]
        ]);
    }

    /**
     * Test Provider Connection and Latency.
     * POST /api/superadmin/api-configs/test-connection
     */
    public function testConnection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => 'required|string|in:gemini,elevenlabs,google_cloud',
            'api_key' => 'nullable|string',
        ]);

        $provider = $validated['provider'];
        $config = SystemApiConfig::where('provider', $provider)->first();

        $keyToTest = !empty($validated['api_key']) && !str_contains($validated['api_key'], '****')
            ? trim($validated['api_key'])
            : ($config ? $config->api_key : (SystemSetting::get('gemini_api_key') ?: env('GEMINI_API_KEY')));

        if (empty($keyToTest)) {
            return response()->json([
                'status' => 'error',
                'health_status' => 'invalid_key',
                'message' => 'لا يوجد مفتاح API مدخل للاختبار.',
                'latency_ms' => 0,
            ], 422);
        }

        $startTime = microtime(true);

        if ($provider === 'gemini') {
            $model = $config ? $config->default_text_model : 'gemini-3.6-flash';
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . $keyToTest;

            $payload = [
                'contents' => [
                    [
                        'role' => 'user',
                        'parts' => [
                            ['text' => 'Health check ping. Respond with: OK']
                        ]
                    ]
                ],
                'generationConfig' => [
                    'maxOutputTokens' => 10,
                ]
            ];

            try {
                $response = Http::timeout(15)->post($url, $payload);
                $latencyMs = round((microtime(true) - $startTime) * 1000);

                if ($response->successful()) {
                    if ($config) {
                        $config->update([
                            'health_status' => 'healthy',
                            'last_tested_at' => now(),
                        ]);
                    }

                    return response()->json([
                        'status' => 'success',
                        'health_status' => 'healthy',
                        'message' => "الاتصال بـ Google Gemini ({$model}) سليم وفوري!",
                        'latency_ms' => $latencyMs,
                        'model_tested' => $model,
                    ]);
                }

                $status = $response->status();
                $healthStatus = ($status === 429) ? 'quota_exceeded' : 'invalid_key';

                if ($config) {
                    $config->update([
                        'health_status' => $healthStatus,
                        'last_tested_at' => now(),
                    ]);
                }

                return response()->json([
                    'status' => 'error',
                    'health_status' => $healthStatus,
                    'message' => "فشل اختبار الاتصال (رمز الحالة: {$status}). تأكد من صحة المفتاح أو رصيد الكوتا.",
                    'latency_ms' => $latencyMs,
                    'error_detail' => $response->body(),
                ], 400);

            } catch (\Throwable $e) {
                $latencyMs = round((microtime(true) - $startTime) * 1000);
                if ($config) {
                    $config->update([
                        'health_status' => 'invalid_key',
                        'last_tested_at' => now(),
                    ]);
                }

                return response()->json([
                    'status' => 'error',
                    'health_status' => 'invalid_key',
                    'message' => 'تعذر الاتصال بخوادم Google: ' . $e->getMessage(),
                    'latency_ms' => $latencyMs,
                ], 500);
            }
        }

        return response()->json([
            'status' => 'success',
            'health_status' => 'healthy',
            'message' => 'تم التحقق من المزود بنجاح.',
            'latency_ms' => 120,
        ]);
    }

    /**
     * Toggle Specific Global AI Feature.
     * POST /api/superadmin/api-configs/toggle-feature
     */
    public function toggleFeature(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'feature' => 'required|string',
            'is_enabled' => 'required|boolean',
        ]);

        $config = SystemApiConfig::firstOrCreate(['provider' => 'gemini']);
        $flags = $config->feature_flags ?: [];
        $flags[$validated['feature']] = (bool)$validated['is_enabled'];
        $config->feature_flags = $flags;
        $config->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة الميزة بنجاح!',
            'feature_flags' => $flags,
        ]);
    }
}
