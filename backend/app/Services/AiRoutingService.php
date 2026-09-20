<?php

namespace App\Services;

use App\Models\AiCostLog;
use App\Models\AiProvider;
use App\Models\AiTaskRoute;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiRoutingService
{
    /**
     * Execute a clinical AI task with automatic failover and cost tracking.
     */
    public static function executeTask(string $taskType, string $prompt, array $options = []): array
    {
        $startTime = microtime(true);
        $user = Auth::user();
        $tenantId = $user?->tenant_id ?? ($user?->clinic_id ?? null);

        // Find task route
        $route = AiTaskRoute::where('task_type', $taskType)->where('is_enabled', true)->first();

        $primarySlug = $route?->primary_provider ?? 'gemini';
        $primaryModel = $route?->primary_model ?? 'gemini-2.5-flash';
        $fallbackSlug = $route?->fallback_provider ?? 'openai';
        $fallbackModel = $route?->fallback_model ?? 'gpt-4o-mini';

        $temperature = (float) ($options['temperature'] ?? ($route?->temperature ?? 0.7));
        $maxTokens = (int) ($options['max_tokens'] ?? ($route?->max_tokens ?? 2048));

        // 1. Try Primary Provider
        $primaryProvider = AiProvider::where('slug', $primarySlug)->where('is_active', true)->first();
        $primaryResult = null;
        $fallbackUsed = false;
        $fallbackReason = null;

        if ($primaryProvider && !empty($primaryProvider->api_key)) {
            try {
                $primaryResult = self::callProvider(
                    $primaryProvider,
                    $primaryModel,
                    $prompt,
                    $temperature,
                    $maxTokens
                );
            } catch (\Throwable $e) {
                Log::warning("Primary AI Provider [{$primarySlug}] failed: " . $e->getMessage());
                $fallbackReason = $e->getMessage();
            }
        } else {
            $fallbackReason = "المزود الأساسي ({$primarySlug}) غير مهيأ بمفتاح API.";
        }

        // 2. If Primary succeeded
        if ($primaryResult && !empty($primaryResult['text'])) {
            $latencyMs = (int) round((microtime(true) - $startTime) * 1000);
            $costUsd = self::calculateCost($primaryProvider, $primaryResult['input_tokens'], $primaryResult['output_tokens']);

            self::logCost([
                'tenant_id' => $tenantId,
                'user_id' => $user?->id,
                'provider_slug' => $primarySlug,
                'model_name' => $primaryModel,
                'task_type' => $taskType,
                'input_tokens' => $primaryResult['input_tokens'],
                'output_tokens' => $primaryResult['output_tokens'],
                'total_tokens' => $primaryResult['total_tokens'],
                'estimated_cost_usd' => $costUsd,
                'latency_ms' => $latencyMs,
                'was_fallback_used' => false,
            ]);

            return [
                'success' => true,
                'text' => $primaryResult['text'],
                'provider' => $primarySlug,
                'model' => $primaryModel,
                'tokens' => $primaryResult['total_tokens'],
                'cost_usd' => $costUsd,
                'latency_ms' => $latencyMs,
                'was_fallback' => false,
            ];
        }

        // 3. Fallback Triggered!
        $fallbackProvider = AiProvider::where('slug', $fallbackSlug)->where('is_active', true)->first();

        if ($fallbackProvider && !empty($fallbackProvider->api_key)) {
            try {
                $fallbackResult = self::callProvider(
                    $fallbackProvider,
                    $fallbackModel,
                    $prompt,
                    $temperature,
                    $maxTokens
                );

                if ($fallbackResult && !empty($fallbackResult['text'])) {
                    $latencyMs = (int) round((microtime(true) - $startTime) * 1000);
                    $costUsd = self::calculateCost($fallbackProvider, $fallbackResult['input_tokens'], $fallbackResult['output_tokens']);

                    self::logCost([
                        'tenant_id' => $tenantId,
                        'user_id' => $user?->id,
                        'provider_slug' => $fallbackSlug,
                        'model_name' => $fallbackModel,
                        'task_type' => $taskType,
                        'input_tokens' => $fallbackResult['input_tokens'],
                        'output_tokens' => $fallbackResult['output_tokens'],
                        'total_tokens' => $fallbackResult['total_tokens'],
                        'estimated_cost_usd' => $costUsd,
                        'latency_ms' => $latencyMs,
                        'was_fallback_used' => true,
                        'fallback_reason' => $fallbackReason,
                    ]);

                    AuditLogger::log(
                        'ai.failover_triggered',
                        "تم تفعيل مسار الذكاء الاصطناعي البديل ({$fallbackSlug}) لمهمة [{$taskType}] بعد تعثر المزود الأساسي ({$primarySlug})",
                        'warning',
                        'AiTaskRoute',
                        (string) ($route?->id ?? 0),
                        [
                            'primary' => $primarySlug,
                            'fallback' => $fallbackSlug,
                            'reason' => $fallbackReason,
                        ]
                    );

                    return [
                        'success' => true,
                        'text' => $fallbackResult['text'],
                        'provider' => $fallbackSlug,
                        'model' => $fallbackModel,
                        'tokens' => $fallbackResult['total_tokens'],
                        'cost_usd' => $costUsd,
                        'latency_ms' => $latencyMs,
                        'was_fallback' => true,
                        'fallback_reason' => $fallbackReason,
                    ];
                }
            } catch (\Throwable $e) {
                Log::error("Fallback AI Provider [{$fallbackSlug}] also failed: " . $e->getMessage());
            }
        }

        return [
            'success' => false,
            'message' => 'تعذر إكمال طلب الذكاء الاصطناعي مع كل من المزود الأساسي والبديل: ' . ($fallbackReason ?? 'انقطاع الاتصال.'),
            'was_fallback' => true,
        ];
    }

    /**
     * Call specific AI provider API.
     */
    protected static function callProvider(AiProvider $provider, string $model, string $prompt, float $temp, int $maxTokens): array
    {
        $slug = $provider->slug;
        $key = $provider->api_key;

        if ($slug === 'gemini') {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}";
            $res = Http::timeout(25)->post($url, [
                'contents' => [
                    ['parts' => [['text' => $prompt]]],
                ],
                'generationConfig' => [
                    'temperature' => $temp,
                    'maxOutputTokens' => $maxTokens,
                ],
            ]);

            if ($res->failed()) {
                throw new \Exception("Gemini HTTP Error " . $res->status() . ": " . $res->body());
            }

            $json = $res->json();
            $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
            $inTok = $json['usageMetadata']['promptTokenCount'] ?? (int) (strlen($prompt) / 4);
            $outTok = $json['usageMetadata']['candidatesTokenCount'] ?? (int) (strlen($text) / 4);

            return [
                'text' => $text,
                'input_tokens' => $inTok,
                'output_tokens' => $outTok,
                'total_tokens' => $inTok + $outTok,
            ];
        }

        // OpenAI, DeepSeek, Groq all use OpenAI-compatible completions format
        $endpoint = match ($slug) {
            'openai' => 'https://api.openai.com/v1/chat/completions',
            'deepseek' => 'https://api.deepseek.com/chat/completions',
            'groq' => 'https://api.groq.com/openai/v1/chat/completions',
            default => 'https://api.openai.com/v1/chat/completions',
        };

        $res = Http::withToken($key)->timeout(25)->post($endpoint, [
            'model' => $model,
            'messages' => [
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => $temp,
            'max_tokens' => $maxTokens,
        ]);

        if ($res->failed()) {
            throw new \Exception("{$slug} HTTP Error " . $res->status() . ": " . $res->body());
        }

        $json = $res->json();
        $text = $json['choices'][0]['message']['content'] ?? '';
        $inTok = $json['usage']['prompt_tokens'] ?? (int) (strlen($prompt) / 4);
        $outTok = $json['usage']['completion_tokens'] ?? (int) (strlen($text) / 4);

        return [
            'text' => $text,
            'input_tokens' => $inTok,
            'output_tokens' => $outTok,
            'total_tokens' => $inTok + $outTok,
        ];
    }

    /**
     * Calculate cost based on provider pricing ($ / 1M tokens).
     */
    protected static function calculateCost(AiProvider $provider, int $inTok, int $outTok): float
    {
        $inCost = ($inTok / 1000000) * ($provider->pricing_input_1m ?? 0.15);
        $outCost = ($outTok / 1000000) * ($provider->pricing_output_1m ?? 0.60);
        return round($inCost + $outCost, 6);
    }

    /**
     * Log cost safely.
     */
    protected static function logCost(array $data): void
    {
        try {
            AiCostLog::create($data);
        } catch (\Throwable $e) {
            Log::warning('Failed to log AI cost: ' . $e->getMessage());
        }
    }
}
