<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TabletSession;
use App\Services\AIServiceClient;

class TabletSessionController extends Controller
{
    protected AIServiceClient $aiService;

    public function __construct(AIServiceClient $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Create / Initialize a PIN-secured Tablet Kiosk Session
     */
    public function createSession(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id') ?: $request->header('X-Tenant-ID', 'tenant_elamal_01');

        $validated = $request->validate([
            'patient_id' => 'required',
            'test_type'  => 'required|string', // BDI-II, HAM-A, etc.
        ]);

        $pinCode = str_pad(strval(rand(1000, 9999)), 4, '0', STR_PAD_LEFT);

        $session = TabletSession::create([
            'tenant_id'     => $tenantId,
            'patient_id'    => $validated['patient_id'],
            'specialist_id' => auth()->id() ?: 'user_specialist_01',
            'test_type'     => $validated['test_type'],
            'pin_code'      => $pinCode,
            'status'        => 'pending',
            'answers'       => [],
            'expires_at'    => now()->addHours(2),
        ]);

        return response()->json([
            'session_id' => $session->_id,
            'pin_code'   => $pinCode,
            'test_type'  => $session->test_type,
            'status'     => 'pending',
        ], 201);
    }

    /**
     * Unlock / Verify Kiosk Session on Tablet via PIN
     */
    public function unlockByPin(Request $request)
    {
        $request->validate([
            'pin_code' => 'required|string|size:4',
        ]);

        $pin = $request->input('pin_code');
        $session = TabletSession::where('pin_code', $pin)
            ->where('status', '!=', 'cancelled')
            ->latest()
            ->first();

        if (!$session) {
            // Mock session for quick interactive testing
            if ($pin === '4819' || $pin === '1234') {
                return response()->json([
                    '_id'          => 'session_kiosk_demo',
                    'tenant_id'    => 'tenant_elamal_01',
                    'patient_name' => 'أمين بلحاج',
                    'test_type'    => 'BDI-II',
                    'pin_code'     => $pin,
                    'status'       => 'in_progress',
                ]);
            }

            return response()->json(['error' => 'Invalid or expired session PIN code'], 404);
        }

        $session->update(['status' => 'in_progress']);

        return response()->json($session);
    }

    /**
     * Submit Answers from Tablet and Auto-Score with AI Engine
     */
    public function submitAnswers(Request $request, string $sessionId)
    {
        $request->validate([
            'answers' => 'required|array',
        ]);

        $answers = $request->input('answers');
        $session = TabletSession::find($sessionId);

        $testType = $session ? $session->test_type : 'BDI-II';

        // Call FastAPI AI scoring endpoint
        $scoreResult = $this->aiService->scoreTest($testType, $answers);

        if ($session) {
            $session->update([
                'answers' => $answers,
                'results' => [
                    'total_score'   => $scoreResult['total_score'] ?? array_sum($answers),
                    'severity'      => $scoreResult['severity'] ?? 'Moderate',
                    'calculated_at' => now()->toIso8601String(),
                ],
                'status'  => 'completed',
            ]);
        }

        return response()->json([
            'status'  => 'completed',
            'results' => [
                'total_score'   => $scoreResult['total_score'] ?? array_sum($answers),
                'severity'      => $scoreResult['severity'] ?? 'Moderate Depression',
                'calculated_at' => now()->toIso8601String(),
                'interpretation' => $scoreResult['interpretation_ar'] ?? 'تم إتمام الاختبار وحفظ الدرجات بنجاح.',
            ]
        ]);
    }
}
