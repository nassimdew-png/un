<?php

namespace App\Jobs;

use App\Models\SystemErrorDiagnostic;
use App\Services\AiGatewayService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AnalyzeSystemExceptionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $exceptionClass;
    public string $message;
    public string $file;
    public int $line;
    public ?string $stackTrace;
    public ?string $codeContext;

    /**
     * Create a new job instance.
     */
    public function __construct(
        string $exceptionClass,
        string $message,
        string $file,
        int $line,
        ?string $stackTrace = null,
        ?string $codeContext = null
    ) {
        $this->exceptionClass = $exceptionClass;
        $this->message = $message;
        $this->file = $file;
        $this->line = $line;
        $this->stackTrace = $stackTrace;
        $this->codeContext = $codeContext;
    }

    /**
     * Execute the job.
     */
    public function handle(AiGatewayService $aiGateway): void
    {
        // 1. Read Code Context around the error line if not provided
        $codeContext = $this->codeContext;
        if (empty($codeContext) && File::exists($this->file) && File::isFile($this->file)) {
            $lines = file($this->file);
            if ($lines) {
                $start = max(0, $this->line - 20);
                $length = 40;
                $slice = array_slice($lines, $start, $length);
                $numbered = [];
                foreach ($slice as $offset => $lineContent) {
                    $currLine = $start + $offset + 1;
                    $prefix = ($currLine === $this->line) ? ' ➜ ' : '   ';
                    $numbered[] = sprintf('%s%4d | %s', $prefix, $currLine, rtrim($lineContent));
                }
                $codeContext = implode("\n", $numbered);
            }
        }

        // Check if an existing diagnostic record exists for this exact file & line
        $existing = SystemErrorDiagnostic::where('file', $this->file)
            ->where('line', $this->line)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            $existing->increment('occurrences_count');
            $existing->update([
                'last_seen_at' => now(),
                'message' => $this->message,
            ]);
            return;
        }

        // 2. Format Structured AI Prompt
        $systemPrompt = <<<PROMPT
أنت نظام المراقبة الذاتي وإصلاح أخطاء الخادم (AI Error 500 Interceptor & Auto-Patch Engine) لمنصة PsyPro Clinic SaaS المبنية بـ Laravel 11.
مهمتك: تشخيص الخطأ غير المعالج المرفق، تحديد سببه الجذري بدقة، واقتراح ترقيع موحد (Unified Diff Patch) وكود كامل مصحح للملف.

أرجع المخرج حصراً بتنسيق JSON مهيكل كالتالي دون أي نصوص إضافية:
{
  "root_cause": "شرح مفصل بالعربية لسبب الخطأ ولماذا حدث هذا الاستثناء في هذا السطر بالذات...",
  "severity": "critical", // "critical", "high", "medium", "low"
  "patch_diff": "--- a/file\n+++ b/file\n@@ -10,4 +10,5 @@\n- old_code\n+ new_code",
  "suggested_code": "<?php ... Full corrected file code ...",
  "summary": "ملخص التعديل السريع"
}
PROMPT;

        $shortTrace = $this->stackTrace ? implode("\n", array_slice(explode("\n", $this->stackTrace), 0, 20)) : 'No trace';

        $userPrompt = <<<USERPROMPT
تقرير استثناء الخادم المباشر (Error 500):
- نوع الاستثناء: {$this->exceptionClass}
- رسالة الخطأ: {$this->message}
- الملف المصدر: {$this->file} (السطر: {$this->line})

مقتطف الكود المحيط بالخطأ:
```php
{$codeContext}
```

تتبع المكدس (Stack Trace):
```
{$shortTrace}
```
USERPROMPT;

        try {
            $result = $aiGateway->generate('error_500_diagnostic', $userPrompt, $systemPrompt, null, null, [
                'temperature' => 0.1,
                'max_tokens' => 4000,
            ]);

            $content = trim($result['content'] ?? '');
            $parsed = null;

            if (preg_match('/```(?:json)?\s*(\{.*\})\s*```/is', $content, $m)) {
                $parsed = json_decode(trim($m[1]), true);
            }
            if (!$parsed) {
                $cleanContent = $content;
                if (str_starts_with($cleanContent, '```json')) {
                    $cleanContent = substr($cleanContent, 7);
                }
                if (str_ends_with($cleanContent, '```')) {
                    $cleanContent = substr($cleanContent, 0, -3);
                }
                $parsed = json_decode(trim($cleanContent), true);
            }

            $rootCause = $parsed['root_cause'] ?? Str::limit($content, 500);
            $severity = $parsed['severity'] ?? 'high';
            $patchDiff = $parsed['patch_diff'] ?? ("--- a/" . basename($this->file) . "\n+++ b/" . basename($this->file) . "\n@@ -{$this->line},1 +{$this->line},1 @@\n+// تم تشخيص ومعالجة الخطأ");
            $suggestedCode = $parsed['suggested_code'] ?? null;

            SystemErrorDiagnostic::create([
                'exception_class' => $this->exceptionClass,
                'message' => $this->message,
                'file' => $this->file,
                'line' => $this->line,
                'stack_trace' => $this->stackTrace,
                'code_context' => $codeContext,
                'ai_diagnosis' => $rootCause,
                'proposed_patch' => $patchDiff,
                'suggested_code' => $suggestedCode,
                'status' => 'pending',
                'severity' => $severity,
                'occurrences_count' => 1,
                'last_seen_at' => now(),
            ]);

            Log::info("AI Auto-Diagnostic successfully created for exception [{$this->exceptionClass}] at {$this->file}:{$this->line}");

        } catch (\Throwable $e) {
            Log::error("AnalyzeSystemExceptionJob failed: " . $e->getMessage());

            // Still save error record even if AI generation failed
            SystemErrorDiagnostic::create([
                'exception_class' => $this->exceptionClass,
                'message' => $this->message,
                'file' => $this->file,
                'line' => $this->line,
                'stack_trace' => $this->stackTrace,
                'code_context' => $codeContext,
                'ai_diagnosis' => 'تم رصد الخطأ، تعذر توليد التحليل التلقائي: ' . $e->getMessage(),
                'status' => 'pending',
                'severity' => 'high',
                'occurrences_count' => 1,
                'last_seen_at' => now(),
            ]);
        }
    }
}
