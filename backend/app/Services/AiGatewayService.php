<?php

namespace App\Services;

use App\Models\AiUsageLog;
use App\Models\SystemSetting;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiGatewayService
{
    /**
     * Dispatch prompt through the live Google Gemini API.
     */
    public function generate(
        string $feature,
        string $prompt,
        ?string $systemPrompt = null,
        ?Tenant $tenant = null,
        ?User $user = null,
        array $options = []
    ): array {
        $startTime = microtime(true);

        // Fetch dynamic settings
        $dbTemp = SystemSetting::get('gemini_temperature');
        $temperature = $options['temperature'] ?? ($dbTemp !== null ? (float)$dbTemp : 0.3);
        $maxTokens = $options['max_tokens'] ?? 2048;
        $formatJson = $options['format_json'] ?? false;

        // Check Clinic AI Access & Quota Balance
        if ($tenant) {
            if (isset($tenant->has_ai_access) && !$tenant->has_ai_access) {
                return [
                    'success' => false,
                    'error' => 'ai_access_disabled',
                    'message' => 'خدمات الذكاء الاصطناعي معطلة حالياً لهذه العيادة. يرجى التواصل مع إدارة المنصة لتفعيل الخدمة.',
                    'content' => '',
                ];
            }

            $monthlyLimit = $tenant->ai_monthly_token_limit ?: 100000;
            $usedThisMonth = $tenant->ai_tokens_used_this_month ?: 0;

            if ($usedThisMonth >= $monthlyLimit && !$tenant->ai_custom_quota_override) {
                return [
                    'success' => false,
                    'error' => 'quota_exceeded',
                    'message' => 'لقد استنفذت عيادتكم الحصة الشهرية المخصصة للذكاء الاصطناعي. يرجى الترقية أو التواصل مع السوبر أدمن.',
                    'content' => '',
                ];
            }
        }

        // Live Gemini API Call
        $result = $this->callGeminiWithFailover($prompt, $systemPrompt, $temperature, $maxTokens, $formatJson);

        $latencyMs = (int) round((microtime(true) - $startTime) * 1000);
        $promptTokens = $result['prompt_tokens'] ?? 250;
        $completionTokens = $result['completion_tokens'] ?? 750;
        $totalTokens = $promptTokens + $completionTokens;
        $estimatedCost = $this->estimateCost('gemini', $promptTokens, $completionTokens);
        $providerUsed = 'gemini';
        $modelName = $result['model'] ?? 'gemini-3.5-flash';

        if (!empty($result['success']) && !empty($result['content'])) {
            // Deduct Tokens on Tenant
            if ($tenant) {
                $tenant->increment('ai_tokens_used_this_month', $totalTokens);
                $tenant->increment('ai_tokens_used', $totalTokens);
                $tenant->increment('ai_credits_used', 1);
                $tenant->save();
            }

            // Log AI Usage Audit
            try {
                $clinicId = $tenant ? $tenant->id : ($user?->tenant_id ?: ($user?->clinic_id ?: 1));
                AiUsageLog::create([
                    'clinic_id' => $clinicId,
                    'tenant_id' => $tenant ? $tenant->id : $clinicId,
                    'user_id' => $user ? $user->id : null,
                    'feature' => $feature,
                    'provider_used' => $providerUsed,
                    'model_name' => $modelName,
                    'prompt_tokens' => $promptTokens,
                    'completion_tokens' => $completionTokens,
                    'total_tokens' => $totalTokens,
                    'estimated_cost_usd' => $estimatedCost,
                    'execution_time_ms' => $latencyMs,
                    'latency_ms' => $latencyMs,
                    'status' => 'live_gemini_success',
                ]);
            } catch (\Throwable $e) {
                Log::warning('Failed to write AiUsageLog: ' . $e->getMessage());
            }

            return [
                'success' => true,
                'status' => 'live_gemini_success',
                'content' => $result['content'],
                'synthese' => $result['content'],
                'provider_used' => $providerUsed,
                'model_name' => $modelName,
                'total_tokens' => $totalTokens,
                'latency_ms' => $latencyMs,
                'estimated_cost_usd' => $estimatedCost,
            ];
        }

        // Return clear error if Gemini API failed
        return [
            'success' => false,
            'status' => 'api_error',
            'error' => $result['error'] ?? 'تعذر الحصول على استجابة من محرك الذكاء الاصطناعي',
            'message' => $result['message'] ?? 'فشل الاتصال المباشر بـ Google Gemini API',
            'content' => '',
            'latency_ms' => $latencyMs,
        ];
    }

    /**
     * Multimodal Vision Analysis wrapper.
     */
    public function generateVision(
        string $feature,
        string $prompt,
        ?string $systemPrompt = null,
        array $imagePayload = [],
        ?Tenant $tenant = null,
        ?User $user = null,
        array $options = []
    ): array {
        $base64 = $imagePayload['data'] ?? '';
        $mime = $imagePayload['mime_type'] ?? 'image/jpeg';
        return $this->analyzeImageWithGemini($prompt, $base64, $mime, $systemPrompt, $tenant, $user);
    }

    /**
     * Multimodal Vision Analysis (Projective Drawings & Scans) via Gemini Vision.
     */
    public function analyzeImageWithGemini(
        string $prompt,
        string $base64Image,
        string $mimeType = 'image/jpeg',
        ?string $systemInstruction = null,
        ?Tenant $tenant = null,
        ?User $user = null
    ): array {
        $startTime = microtime(true);
        $apiKey = SystemSetting::get('gemini_api_key') ?: config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        $model = SystemSetting::get('gemini_model') ?: config('services.gemini.model') ?: 'gemini-3.5-flash';

        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        [
                            'inline_data' => [
                                'mime_type' => $mimeType,
                                'data' => $base64Image,
                            ]
                        ],
                        [
                            'text' => $prompt
                        ]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.3,
                'maxOutputTokens' => 3000,
            ]
        ];

        if ($systemInstruction) {
            $payload['system_instruction'] = [
                'parts' => [['text' => $systemInstruction]]
            ];
        }

        $result = null;
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        try {
            $response = Http::timeout(90)->connectTimeout(15)->post($url, $payload);
            if ($response->successful()) {
                $data = $response->json();
                $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
                $tokensUsed = $data['usageMetadata']['totalTokenCount'] ?? 500;
                $result = [
                    'content' => $text,
                    'tokens' => $tokensUsed,
                ];
            } else {
                Log::error("Gemini Vision HTTP {$response->status()}: " . $response->body());
            }
        } catch (\Throwable $e) {
            Log::error("Gemini Vision error on model {$model}: " . $e->getMessage());
        }

        $latencyMs = (int) round((microtime(true) - $startTime) * 1000);
        $totalTokens = $result['tokens'] ?? 400;
        $estimatedCost = $this->estimateCost('gemini', 200, $totalTokens);

        if ($result && !empty($result['content'])) {
            if ($tenant) {
                $tenant->increment('ai_tokens_used_this_month', $totalTokens);
                $tenant->increment('ai_tokens_used', $totalTokens);
                $tenant->increment('ai_credits_used', 1);
                $tenant->save();
            }

            try {
                $clinicId = $tenant ? $tenant->id : ($user?->tenant_id ?: ($user?->clinic_id ?: 1));
                AiUsageLog::create([
                    'clinic_id' => $clinicId,
                    'tenant_id' => $tenant ? $tenant->id : $clinicId,
                    'user_id' => $user ? $user->id : null,
                    'feature' => 'projective_drawing_analysis',
                    'provider_used' => 'gemini_vision',
                    'model_name' => $model,
                    'prompt_tokens' => 200,
                    'completion_tokens' => $totalTokens,
                    'total_tokens' => $totalTokens,
                    'estimated_cost_usd' => $estimatedCost,
                    'execution_time_ms' => $latencyMs,
                    'latency_ms' => $latencyMs,
                    'status' => 'live_gemini_success',
                ]);
            } catch (\Throwable $e) {
                Log::warning('Failed to write AiUsageLog for vision: ' . $e->getMessage());
            }

            return [
                'success' => true,
                'status' => 'live_gemini_success',
                'provider_used' => 'gemini_vision',
                'model_name' => $model,
                'content' => $result['content'],
                'total_tokens' => $totalTokens,
                'latency_ms' => $latencyMs,
                'estimated_cost_usd' => $estimatedCost,
            ];
        }

        return [
            'success' => false,
            'status' => 'api_error',
            'error' => 'تعذر تحليل الصورة عبر Gemini Vision',
            'latency_ms' => $latencyMs,
        ];
    }

    /**
     * Direct Gemini Generation with multi-model failover for 100% uptime.
     */
    private function callGeminiWithFailover(
        string $prompt,
        ?string $systemPrompt,
        float $temperature,
        int $maxTokens,
        bool $formatJson
    ): array {
        $apiKey = SystemSetting::get('gemini_api_key') ?: config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        if (!$apiKey) {
            return [
                'success' => false,
                'error' => 'Google Gemini API Key is missing in environment or settings.',
            ];
        }

        // Live verified models on this key
        $preferredModel = SystemSetting::get('gemini_model') ?: config('services.gemini.model') ?: 'gemini-3.5-flash';
        $modelsToTry = array_unique([
            $preferredModel,
            'gemini-3.5-flash',
            'gemini-3.5-flash-lite',
            'gemini-3.1-flash-lite',
        ]);

        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => $temperature,
                'maxOutputTokens' => max($maxTokens, 300),
            ]
        ];

        if ($systemPrompt) {
            $payload['system_instruction'] = [
                'parts' => [
                    ['text' => $systemPrompt]
                ]
            ];
        }

        if ($formatJson) {
            $payload['generationConfig']['responseMimeType'] = 'application/json';
        }

        $lastError = 'Unknown error';

        foreach ($modelsToTry as $model) {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

            try {
                $response = Http::timeout(90)->connectTimeout(15)->withHeaders([
                    'Content-Type' => 'application/json'
                ])->post($url, $payload);

                if ($response->successful()) {
                    $data = $response->json();
                    $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    $promptTokens = $data['usageMetadata']['promptTokenCount'] ?? 250;
                    $completionTokens = $data['usageMetadata']['candidatesTokenCount'] ?? 750;

                    if (!empty($text)) {
                        return [
                            'success' => true,
                            'content' => $text,
                            'model' => $model,
                            'prompt_tokens' => $promptTokens,
                            'completion_tokens' => $completionTokens,
                        ];
                    }
                }

                $lastError = "Model {$model} returned HTTP {$response->status()}: " . $response->body();
                Log::warning("Gemini {$model} failover notice: " . $lastError);

            } catch (\Throwable $e) {
                $lastError = "Model {$model} exception: " . $e->getMessage();
                Log::warning($lastError);
            }
        }

        Log::error("All Gemini models failed. Last error: " . $lastError);

        return [
            'success' => false,
            'error' => 'Gemini API Error: ' . $lastError,
            'message' => $lastError,
        ];
    }

    /**
     * Test connection probe for a given provider.
     */
    public function testProviderConnection(string $provider, ?string $apiKey = null): array
    {
        $startTime = microtime(true);
        $key = $apiKey ?: SystemSetting::get("{$provider}_api_key") ?: config("services.{$provider}.api_key") ?: env('GEMINI_API_KEY');
        $model = SystemSetting::get('gemini_model') ?: 'gemini-3.5-flash';

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}";
        $payload = [
            'contents' => [
                ['role' => 'user', 'parts' => [['text' => 'Bonjour, répondez uniquement par: PONG.']]]
            ]
        ];

        try {
            $response = Http::timeout(15)->connectTimeout(5)->post($url, $payload);
            $latency = (int) round((microtime(true) - $startTime) * 1000);

            if ($response->successful()) {
                $data = $response->json();
                $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
                return [
                    'success' => true,
                    'provider' => $provider,
                    'model' => $model,
                    'latency_ms' => $latency,
                    'content' => trim($text),
                    'message' => "الاتصال بمزود {$provider} ({$model}) نشط ومباشر بنجاح (زمن الاستجابة: {$latency}ms).",
                ];
            }

            return [
                'success' => false,
                'provider' => $provider,
                'latency_ms' => $latency,
                'message' => "خطأ في الاتصال: HTTP {$response->status()} - " . $response->body(),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'provider' => $provider,
                'error' => $e->getMessage(),
                'message' => "فشل الاتصال بمزود {$provider}: " . $e->getMessage(),
            ];
        }
    }

    /**
     * Estimate API token costs in USD.
     */
    private function estimateCost(string $provider, int $promptTokens, int $completionTokens): float
    {
        return round(($promptTokens * 0.000000075) + ($completionTokens * 0.00000030), 6);
    }
}
