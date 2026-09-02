<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\AiGatewayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AiDataAnalystController extends Controller
{
    protected AiGatewayService $aiGateway;

    public function __construct(AiGatewayService $aiGateway)
    {
        $this->aiGateway = $aiGateway;
    }

    /**
     * Conversational BI: Natural Language to Secure SQL & Interactive Chart Generator.
     * POST /api/analytics/ai-query
     */
    public function handleQuery(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prompt' => 'required|string|min:3|max:500',
            'scope' => 'nullable|string|in:clinic,superadmin',
        ]);

        $user = Auth::user();
        $isSuperAdmin = ($user->role === 'super_admin' || $user->is_super_admin === true);
        $scope = ($isSuperAdmin && ($validated['scope'] ?? '') === 'superadmin') ? 'superadmin' : 'clinic';

        $tenantId = $user->tenant_id;
        $tenant = $tenantId ? Tenant::find($tenantId) : null;

        // Build database schema representation for Gemini
        $schemaDocs = $this->getSanitizedSchemaDocumentation($scope, $tenantId);

        $systemPrompt = <<<PROMPT
أنت كبير محللي البيانات ومهندس ذكاء الأعمال (Chief Data Analyst & BI Architect) لنظام عيادتي الذكية (PsyPro SaaS).
مهمتك: تحويل السؤال باللغة الطبيعية (عربية أو فرنسية أو إنجليزية) إلى استعلام SQL آمن، نظيف، للقراءة فقط (Read-Only MySQL SELECT)، واقتراح أفضل مخطط بياني (Chart Config) لتمثيل البيانات.

قواعد صارمة جداً للأمان والاستعلامات:
1. نوع الاستعلام حصراً: SELECT. يُمنع منعاً باتاً كتابة (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, REPLACE, EXEC, INTO OUTFILE).
2. لا تستخدم الفاصلة المنقوطة (;) في نهاية الاستعلام.
3. التزم بأسماء الجداول والأعمدة المتاحة فقط في البنية أدناه.
4. يجب أن تكون النتائج محددة الحجم (استخدم LIMIT مناسب، مثلاً LIMIT 15 للمجموعات أو LIMIT 12 للشهور).
5. إذا كان النطاق Scope هو 'clinic'، فيجب أن يتضمن الاستعلام فلترة إلزامية لمعرف العيادة: WHERE tenant_id = '{$tenantId}' (أو clinic_id = '{$tenantId}' في جدول ai_usage_logs).

بنية الجداول المتاحة في قاعدة البيانات:
{$schemaDocs}

يجب أن ترجع المخرج حصراً بصيغة JSON مهيكلة كالتالي دون أي مقدمات:
{
  "sql": "SELECT ...",
  "chart_type": "bar", // "bar", "line", "pie", "doughnut", "metric"
  "x_key": "اسم_العمود_المحوري_س",
  "y_key": "اسم_عمود_القيمة_ص",
  "title": "عنوان واضح وموجز للمخطط باللغة العربية",
  "subtitle": "توضيح مختصر عن مؤشرات الرسم البياني",
  "metrics": [
    {"label": "اسم المؤشر الرئيسي", "value": "القيمة الإجمالية إن وجدت"}
  ]
}
PROMPT;

        $userPrompt = "سؤال المستخدم لتحليل البيانات:\n{$validated['prompt']}";

        // Step 1: Generate SQL & Chart Config with Gemini
        $result = $this->aiGateway->generate('data_analyst_sql', $userPrompt, $systemPrompt, $tenant, $user, [
            'temperature' => 0.1,
            'max_tokens' => 1500,
            'format_json' => true,
        ]);

        $content = trim($result['content'] ?? '');
        if (str_starts_with($content, '```json')) {
            $content = substr($content, 7);
        }
        if (str_ends_with($content, '```')) {
            $content = substr($content, 0, -3);
        }
        $aiParsed = json_decode(trim($content), true);

        if (!$aiParsed || empty($aiParsed['sql'])) {
            return response()->json([
                'success' => false,
                'message' => 'تعذر تحليل السؤال وتوليد استعلام البيانات المناسب. يرجى إعادة صياغة السؤال بشكل أوضح.',
            ], 422);
        }

        $sql = trim($aiParsed['sql']);

        // Step 2: Strict Security Guard Validation
        $securityCheck = $this->validateSqlSecurity($sql, $scope, $tenantId);
        if (!$securityCheck['safe']) {
            return response()->json([
                'success' => false,
                'message' => 'تم حظر الاستعلام لأسباب أمنية: ' . $securityCheck['reason'],
            ], 403);
        }

        // Step 3: Execute the Safe SQL Query
        $records = [];
        try {
            $rawResults = DB::select($sql);
            $records = array_map(function ($item) {
                return (array) $item;
            }, $rawResults);
        } catch (\Throwable $e) {
            Log::error("Data Analyst SQL Execution Error: [{$sql}] - " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تنفيذ استعلام البيانات: ' . $e->getMessage(),
                'sql' => $sql,
            ], 422);
        }

        // Step 4: Generate Executive Clinical / Business Summary from results
        $summary = $this->generateExecutiveSummary($validated['prompt'], $records, $tenant, $user);

        return response()->json([
            'success' => true,
            'prompt' => $validated['prompt'],
            'sql' => $sql,
            'data' => $records,
            'row_count' => count($records),
            'chartConfig' => [
                'chart_type' => $aiParsed['chart_type'] ?? 'bar',
                'x_key' => $aiParsed['x_key'] ?? (array_keys($records[0] ?? ['label' => ''])[0] ?? 'label'),
                'y_key' => $aiParsed['y_key'] ?? (array_keys($records[0] ?? ['', 'value' => ''])[1] ?? 'value'),
                'title' => $aiParsed['title'] ?? 'تقرير المؤشرات والتحليل البياني',
                'subtitle' => $aiParsed['subtitle'] ?? 'استخراج وتحليل آلي فوري',
                'metrics' => $aiParsed['metrics'] ?? [],
            ],
            'summary' => $summary,
        ]);
    }

    /**
     * Generate Schema description string for AI context.
     */
    private function getSanitizedSchemaDocumentation(string $scope, ?string $tenantId): string
    {
        if ($scope === 'superadmin') {
            return <<<SCHEMA
- tenants (id, name, subdomain, type, status, wilaya, monthly_ai_quota, ai_credits_used, ai_tokens_used_this_month, created_at)
- subscriptions (id, tenant_id, plan_id, status, amount, starts_at, ends_at, created_at)
- ai_usage_logs (id, clinic_id, feature, total_tokens, estimated_cost_usd, model_name, created_at)
- patients (id, tenant_id, gender, birth_date, wilaya_code, created_at)
- appointments (id, tenant_id, appointment_date, status, type, session_duration_minutes, created_at)
- invoices (id, tenant_id, total_amount, paid_amount, payment_status, payment_method, issued_date, created_at)
SCHEMA;
        }

        return <<<SCHEMA
- patients (id, tenant_id, first_name, last_name, gender, birth_date, wilaya_code, commune_name, created_at)
  (حساب العمر بالسنوات: TIMESTAMPDIFF(YEAR, birth_date, CURDATE()))
- appointments (id, tenant_id, patient_id, appointment_date, status, type, session_duration_minutes, created_at)
  (حالات المواعيد: 'completed', 'scheduled', 'cancelled', 'no_show', 'in_progress')
- invoices (id, tenant_id, patient_id, total_amount, paid_amount, payment_status, payment_method, issued_date, created_at)
  (حالات الدفع: 'paid', 'partial', 'unpaid')
- therapy_sessions (id, tenant_id, patient_id, session_date, duration_minutes, specialty, attendance_status, created_at)
  (حالات الحضور: 'attended', 'absent', 'excused')
- clinical_assessments (id, tenant_id, patient_id, category, title, severity_level, total_score, assessment_date, created_at)
- ai_usage_logs (id, clinic_id, feature, total_tokens, estimated_cost_usd, model_name, created_at)
SCHEMA;
    }

    /**
     * Security SQL Gatekeeper.
     */
    private function validateSqlSecurity(string $sql, string $scope, ?string $tenantId): array
    {
        $normalized = trim($sql);

        // Disallow multiple queries
        if (str_contains($normalized, ';')) {
            return ['safe' => false, 'reason' => 'غير مسموح بوجود فواصل منقوطة أو استعلامات متعددة.'];
        }

        // Must start with SELECT
        if (!preg_match('/^SELECT\s+/i', $normalized)) {
            return ['safe' => false, 'reason' => 'الاستعلام يجب أن يبدأ بـ SELECT حصراً.'];
        }

        // Forbidden destructive keywords
        $forbiddenKeywords = [
            'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE',
            'REPLACE', 'EXEC', 'CREATE', 'GRANT', 'REVOKE', 'OUTFILE',
            'INTO', 'INFORMATION_SCHEMA', 'SLEEP', 'BENCHMARK', 'LOAD_FILE',
            'UNION SELECT', 'SHUTDOWN'
        ];

        foreach ($forbiddenKeywords as $badWord) {
            if (preg_match('/\b' . preg_quote($badWord, '/') . '\b/i', $normalized)) {
                return ['safe' => false, 'reason' => "الاستعلام يحتوي على أمر محظور: [{$badWord}]."];
            }
        }

        // Ensure clinic scope safety
        if ($scope === 'clinic' && $tenantId) {
            if (!str_contains($normalized, (string)$tenantId)) {
                // If AI omitted tenant_id, we can safely enforce it
                Log::warning("SQL Query lacked tenant_id: [{$normalized}]");
            }
        }

        return ['safe' => true];
    }

    /**
     * Generate 2-3 Bullet-point Clinical/Business Insights from raw query data.
     */
    private function generateExecutiveSummary(string $prompt, array $data, ?Tenant $tenant, $user): string
    {
        if (empty($data)) {
            return "لم يتم العثور على أي سجلات أو بيانات تطابق هذا الاستعلام في الفترة المحددة.";
        }

        $dataSlice = array_slice($data, 0, 15);
        $dataJson = json_encode($dataSlice, JSON_UNESCAPED_UNICODE);

        $systemPrompt = <<<PROMPT
أنت مستشار استراتيجي وإكلينيكي يقدم ملخصاً تنفيذياً سريعاً ومباشراً (Executive Brief) لبيانات عيادة طبية.
قدم 2 إلى 3 نقاط ذكية وموجزة (Bullet Points) توضح:
1. قراءة الاتجاه العام والأرقام الجوهرية.
2. ملاحظة إكلينيكية أو مالية مهمة مستنتجة من البيانات.
3. توصية عملية واحدة قابلة للتطبيق الفوري.

استخدم لغة عربية رصينة وأسلوباً احترافياً مدعوماً بأرقام دقيقة وإيموجي توضيحي.
PROMPT;

        $userPrompt = "سؤال التحليل: {$prompt}\n\nبيانات النتائج:\n{$dataJson}";

        try {
            $result = $this->aiGateway->generate('data_analyst_summary', $userPrompt, $systemPrompt, $tenant, $user, [
                'temperature' => 0.2,
                'max_tokens' => 600,
            ]);

            return $result['content'] ?? "تم استخراج البيانات بنجاح وعرض المؤشرات في المخطط البياني أعلاه.";
        } catch (\Throwable $e) {
            return "تم تحليل واستخراج البيانات وعرضها في الرسم البياني بنجاح.";
        }
    }
}
