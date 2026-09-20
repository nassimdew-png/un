<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Patient;
use App\Models\Tenant;
use App\Services\AiClinicalSynthesisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AiCopilotController extends Controller
{
    protected AiClinicalSynthesisService $synthesisService;

    public function __construct(AiClinicalSynthesisService $synthesisService)
    {
        $this->synthesisService = $synthesisService;
    }

    /**
     * Generate bilingual AI clinical bilan synthesis.
     */
    public function generateBilan(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'selected_assessment_ids' => 'nullable|array',
            'practitioner_notes' => 'nullable|string|max:8000',
            'language' => 'nullable|string|in:fr,ar',
            'audience' => 'nullable|string|in:medical,parent',
        ]);

        $patient = Patient::where('tenant_id', $user->tenant_id)->findOrFail($validated['patient_id']);
        $language = $validated['language'] ?? 'fr';
        $audience = $validated['audience'] ?? 'medical';
        $selectedAssessmentIds = $validated['selected_assessment_ids'] ?? [];
        $practitionerNotes = $validated['practitioner_notes'] ?? null;

        $result = $this->synthesisService->generateBilan(
            $patient,
            $selectedAssessmentIds,
            $practitionerNotes,
            $language,
            $audience,
            $user
        );

        if (($result['status'] ?? '') === 'quota_exceeded') {
            return response()->json($result, 429);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Get AI Token quota and usage status for the authenticated clinic tenant.
     */
    public function getQuotaStatus(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $tenant = Tenant::find($user->tenant_id);
        $balance = $tenant ? ($tenant->ai_tokens_balance ?? 100000) : 100000;
        $used = $tenant ? ($tenant->ai_tokens_used ?? 0) : 0;
        $quota = $tenant ? ($tenant->ai_monthly_token_quota ?? 100000) : 100000;
        $percentUsed = $quota > 0 ? min(100, round(($used / $quota) * 100, 1)) : 0;

        return response()->json([
            'success' => true,
            'quota' => [
                'tokens_balance' => $balance,
                'tokens_used' => $used,
                'monthly_quota' => $quota,
                'percentage_used' => $percentUsed,
                'status' => $balance > 0 ? 'active' : 'exhausted',
            ],
        ]);
    }

    /**
     * Get AI Generation Logs for clinic workspace.
     */
    public function getLogs(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $logs = DB::table('ai_generation_logs')
            ->where('clinic_id', $user->tenant_id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'logs' => $logs,
        ]);
    }

    /**
     * AI suggest SMART PEI therapeutic goals.
     */
    public function suggestPeiGoals(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'specialty' => 'nullable|string',
            'notes' => 'nullable|string|max:5000',
            'current_goals' => 'nullable|array',
            'language' => 'nullable|string|in:ar,fr',
        ]);

        $patient = Patient::when($user->tenant_id, function ($q) use ($user) {
            $q->where(function ($sub) use ($user) {
                $sub->where('tenant_id', $user->tenant_id)->orWhereNull('tenant_id');
            });
        })->findOrFail($validated['patient_id']);
        $specialty = $validated['specialty'] ?? 'orthophony';
        $language = $validated['language'] ?? 'ar';
        $contextData = [
            'notes' => $validated['notes'] ?? '',
            'current_goals' => $validated['current_goals'] ?? [],
        ];

        $result = $this->synthesisService->suggestPeiGoals($patient, $specialty, $contextData, $language, $user);

        return response()->json($result);
    }

    /**
     * AI suggest Next Session Blueprint & Family Home Care protocol.
     */
    public function suggestNextSession(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'specialty' => 'nullable|string',
            'soap' => 'nullable|array',
            'suds_pre' => 'nullable|numeric',
            'suds_post' => 'nullable|numeric',
            'accuracy' => 'nullable|numeric',
            'exercises' => 'nullable|array',
            'session_duration' => 'nullable|numeric',
            'language' => 'nullable|string|in:ar,fr',
        ]);

        $patient = Patient::when($user->tenant_id, function ($q) use ($user) {
            $q->where(function ($sub) use ($user) {
                $sub->where('tenant_id', $user->tenant_id)->orWhereNull('tenant_id');
            });
        })->findOrFail($validated['patient_id']);
        $specialty = $validated['specialty'] ?? 'orthophony';
        $language = $validated['language'] ?? 'ar';

        $result = $this->synthesisService->suggestNextSession($patient, $specialty, $validated, $language, $user);

        return response()->json($result);
    }
}

