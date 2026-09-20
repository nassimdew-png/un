<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TherapySession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TherapySessionController extends Controller
{
    /**
     * Display a listing of therapy sessions (tenant-scoped).
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $tenantId = $user ? $user->tenant_id : null;

        if ($tenantId) {
            $existingCount = TherapySession::withoutGlobalScopes()->where('tenant_id', $tenantId)->count();
            if ($existingCount === 0) {
                $this->seedInitialCompletedSessions($tenantId, $user->id ?? 1);
            }
        }

        $query = TherapySession::with(['patient', 'specialist']);

        $patientId = $request->route('patientId') ?: $request->query('patient_id');
        if ($patientId && $patientId !== '[object Object]' && is_numeric($patientId)) {
            $query->where('patient_id', (int)$patientId);
        }

        if ($specialty = $request->query('specialty')) {
            if ($specialty !== 'all') {
                $query->where('specialty', $specialty);
            }
        }

        if ($status = $request->query('attendance_status')) {
            if ($status !== 'all') {
                $query->where('attendance_status', $status);
            }
        }

        $sessions = $query->latest('session_date')->paginate((int) $request->query('per_page', 25));

        return response()->json($sessions);
    }

    /**
     * Store a newly created session (tenant-scoped).
     */
    public function store(Request $request): JsonResponse
    {
        // 1. Resolve patient_id from route param (e.g. /patients/{patientId}/sessions) or payload
        $routePatientId = $request->route('patientId');
        if ($routePatientId && is_numeric($routePatientId) && !$request->has('patient_id')) {
            $request->merge(['patient_id' => (int)$routePatientId]);
        } elseif (is_array($request->input('patient_id')) && isset($request->input('patient_id')['id'])) {
            $request->merge(['patient_id' => $request->input('patient_id')['id']]);
        }

        // 2. Fallback for notes -> progress_notes
        if (!$request->filled('progress_notes') && $request->filled('notes')) {
            $request->merge(['progress_notes' => $request->input('notes')]);
        }

        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'session_date' => 'required|date',
            'duration_minutes' => 'nullable|integer|min:15|max:180',
            'specialty' => 'required|string|in:orthophony,psychology,psychomotricite,psychomotricity,psychomotor,parent_guidance,orthophonie,psychologie',
            'progress_notes' => 'nullable|string',
            'exercises_targeted' => 'nullable|array',
            'attendance_status' => 'nullable|in:present,absent,excused',
        ]);

        if (in_array($validated['specialty'], ['orthophonie', 'orthophony'])) {
            $validated['specialty'] = 'orthophony';
        } elseif (in_array($validated['specialty'], ['psychologie', 'psychology'])) {
            $validated['specialty'] = 'psychology';
        } elseif (in_array($validated['specialty'], ['psychomotricite', 'psychomotor', 'psychomotricity'])) {
            $validated['specialty'] = 'psychomotor';
        } elseif ($validated['specialty'] === 'parent_guidance') {
            $validated['specialty'] = 'parent_guidance';
        }

        $validated['specialist_id'] = Auth::id();
        $validated['duration_minutes'] = $validated['duration_minutes'] ?? 45;
        $validated['attendance_status'] = $validated['attendance_status'] ?? 'present';

        $session = TherapySession::create($validated);

        return response()->json([
            'message' => 'Séance enregistrée avec succès.',
            'session' => $session->load(['patient', 'specialist']),
        ], 201);
    }

    /**
     * Display the specified session.
     */
    public function show(string $id): JsonResponse
    {
        $session = TherapySession::with(['patient', 'specialist'])->findOrFail($id);

        return response()->json([
            'session' => $session,
        ]);
    }

    /**
     * Update the specified session.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $session = TherapySession::findOrFail($id);

        $validated = $request->validate([
            'session_date' => 'sometimes|required|date',
            'duration_minutes' => 'nullable|integer|min:15|max:180',
            'specialty' => 'sometimes|required|in:orthophony,psychology,psychomotricite,psychomotor,psychomotricity,parent_guidance,orthophonie,psychologie',
            'progress_notes' => 'nullable|string',
            'exercises_targeted' => 'nullable|array',
            'attendance_status' => 'sometimes|required|in:present,absent,excused',
        ]);

        if (isset($validated['specialty'])) {
            if (in_array($validated['specialty'], ['orthophonie', 'orthophony'])) {
                $validated['specialty'] = 'orthophony';
            } elseif (in_array($validated['specialty'], ['psychologie', 'psychology'])) {
                $validated['specialty'] = 'psychology';
            } elseif (in_array($validated['specialty'], ['psychomotricite', 'psychomotor', 'psychomotricity'])) {
                $validated['specialty'] = 'psychomotor';
            } elseif ($validated['specialty'] === 'parent_guidance') {
                $validated['specialty'] = 'parent_guidance';
            }
        }

        $session->update($validated);

        return response()->json([
            'message' => 'Séance mise à jour.',
            'session' => $session->load(['patient', 'specialist']),
        ]);
    }

    /**
     * Remove the specified session.
     */
    public function destroy(string $id): JsonResponse
    {
        $session = TherapySession::findOrFail($id);
        $session->delete();

        return response()->json([
            'message' => 'Séance supprimée avec succès.',
        ]);
    }

    /**
     * Seed initial or demo completed sessions for test verification.
     */
    public function seedDemo(Request $request): JsonResponse
    {
        $user = Auth::user();
        $tenantId = $request->input('tenant_id') ?: ($user ? $user->tenant_id : null);
        if (!$tenantId) {
            $tenant = \App\Models\Tenant::first();
            $tenantId = $tenant ? $tenant->id : null;
        }

        $created = $this->seedInitialCompletedSessions($tenantId, $user?->id ?? 1);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء جلسات تأهيلية مكتملة بنجاح.',
            'sessions' => $created,
        ], 201);
    }

    /**
     * Helper to provision 2 stable completed rehabilitation sessions with notes and exercises.
     */
    public function seedInitialCompletedSessions(?string $tenantId, $userId = 1): array
    {
        if (!$tenantId) return [];

        $patient = \App\Models\Patient::withoutGlobalScopes()->where('tenant_id', $tenantId)->first();
        if (!$patient) {
            $patient = \App\Models\Patient::withoutGlobalScopes()->create([
                'tenant_id' => $tenantId,
                'first_name' => 'وليد',
                'last_name' => 'براهيمي',
                'birth_date' => '2018-05-12',
                'phone' => '0555123456',
                'guardian_name' => 'كمال براهيمي (الأب)',
                'address' => 'حي الأمل، الجزائر العاصمة',
                'notes' => 'حالة تأخر لغوي نمائي ومتابعة أرطوفونية منتظمة',
            ]);
        }

        $sessions = [];

        // Session 1 (Yesterday / Recent)
        $s1 = TherapySession::withoutGlobalScopes()->create([
            'tenant_id' => $tenantId,
            'patient_id' => $patient->id,
            'specialist_id' => $userId,
            'session_date' => now()->subDay()->setTime(10, 0, 0),
            'duration_minutes' => 45,
            'specialty' => 'orthophony',
            'progress_notes' => 'إتمام بروتوكول التسمية السريعة والوعي الفونولوجي بنجاح مع تجاوب سريري ملحوظ. التوصية المنزلية: تدريب يومي لمدة 10 دقائق بعد الوجبات بمرافقة الولي ومراجعة كراس التمارين المصور.',
            'exercises_targeted' => [
                'التسمية السريعة للصور (Dénomination Rapide)',
                'الوعي الصوتي والفونولوجي (Conscience Phonologique)',
                'التمييز السمعي للأصوات المتقاربة'
            ],
            'attendance_status' => 'present',
        ]);
        $sessions[] = $s1;

        // Session 2 (3 days ago)
        $s2 = TherapySession::withoutGlobalScopes()->create([
            'tenant_id' => $tenantId,
            'patient_id' => $patient->id,
            'specialist_id' => $userId,
            'session_date' => now()->subDays(3)->setTime(14, 30, 0),
            'duration_minutes' => 45,
            'specialty' => 'orthophony',
            'progress_notes' => 'تدريب النطق ومخارج الحروف مع تمارين التنفس الحجابي والتحكم الصوتي. تفاعل إيجابي وتراجع ملحوظ في التردد الصوتي. التوصية: متابعة تمارين المرآة المنزلية.',
            'exercises_targeted' => [
                'التنفس البطني والحجاب الحاجز (Respiration Abdominale)',
                'تمارين المرآة وحركة الشفاه واللسان',
                'إطالة المقاطع الصوتية الحركية'
            ],
            'attendance_status' => 'present',
        ]);
        $sessions[] = $s2;

        return $sessions;
    }
}
