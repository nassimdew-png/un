<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\SessionSoapNote;
use App\Services\AiVoiceDocumentationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SessionDocumentationController extends Controller
{
    protected AiVoiceDocumentationService $voiceService;

    public function __construct(AiVoiceDocumentationService $voiceService)
    {
        $this->voiceService = $voiceService;
    }

    /**
     * Upload voice recording or text dictation to extract structured SOAP note.
     */
    public function processVoiceSoap(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $patientId = $request->input('patient_id');
        $patient = $patientId ? Patient::where('tenant_id', $user->tenant_id)->find($patientId) : null;

        $audioFile = $request->file('audio');
        $rawText = $request->input('transcript', '');
        $language = $request->input('language', 'fr');

        $patientContext = [
            'patient_name' => $patient ? "{$patient->first_name} {$patient->last_name}" : 'Patient',
            'age' => $patient && $patient->birth_date ? \Carbon\Carbon::parse($patient->birth_date)->age : null,
            'specialty' => $request->input('specialty', 'orthophonie'),
        ];

        $soapData = $this->voiceService->transcribeAndStructureSoap(
            $audioFile ?: $rawText,
            $patientContext,
            $language
        );

        return response()->json([
            'success' => true,
            'data' => $soapData,
        ]);
    }

    /**
     * Save finalized SOAP note to patient records.
     */
    public function saveSoapNote(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'patient_id' => 'required|integer',
            'appointment_id' => 'nullable|integer',
            'session_date' => 'nullable|date',
            'audio_duration_seconds' => 'nullable|integer',
            'raw_transcript' => 'nullable|string',
            'subjective' => 'nullable|string',
            'objective' => 'nullable|string',
            'assessment' => 'nullable|string',
            'plan' => 'nullable|string',
        ]);

        $patient = Patient::where('tenant_id', $user->tenant_id)->findOrFail($validated['patient_id']);

        $soapNote = SessionSoapNote::create([
            'clinic_id' => $user->tenant_id,
            'patient_id' => $patient->id,
            'practitioner_id' => $user->id,
            'appointment_id' => $validated['appointment_id'] ?? null,
            'session_date' => $validated['session_date'] ?? now()->toDateString(),
            'audio_duration_seconds' => $validated['audio_duration_seconds'] ?? null,
            'raw_transcript' => $validated['raw_transcript'] ?? null,
            'subjective' => $validated['subjective'] ?? null,
            'objective' => $validated['objective'] ?? null,
            'assessment' => $validated['assessment'] ?? null,
            'plan' => $validated['plan'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ التقرير السريري SOAP في ملف المريض بنجاح.',
            'note' => $soapNote,
        ]);
    }

    /**
     * Get patient's SOAP notes history.
     */
    public function getPatientSoapHistory(int $patientId): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $patient = Patient::where('tenant_id', $user->tenant_id)->findOrFail($patientId);

        $notes = SessionSoapNote::with('practitioner:id,name')
            ->where('patient_id', $patient->id)
            ->orderBy('session_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'patient_id' => $patient->id,
            'count' => $notes->count(),
            'notes' => $notes,
        ]);
    }

    /**
     * Anamnesis Copilot: Suggest smart exploratory questions based on intake data.
     */
    public function suggestAnamnesisQuestions(Request $request): JsonResponse
    {
        $intakeData = $request->input('intake_data', []);
        $specialty = $request->input('specialty', 'orthophonie');
        $ageInMonths = (int) $request->input('age_in_months', 48);
        $language = $request->input('language', 'ar');

        $questions = $this->voiceService->generateAnamnesisQuestions(
            $intakeData,
            $specialty,
            $ageInMonths,
            $language
        );

        return response()->json([
            'success' => true,
            'questions' => $questions,
        ]);
    }
}
