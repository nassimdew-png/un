<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DigitalTherapyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []]);
    }

    public function testLogResult(Request $request): JsonResponse
    {
        return response()->json(['success' => true]);
    }

    public function logResults(Request $request, $patientId): JsonResponse
    {
        return response()->json(['success' => true]);
    }

    public function getPatientProgression(Request $request, $patientId): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []]);
    }

    public function exportDysphagiaPdf(Request $request, $patientId)
    {
        $patient = \App\Models\Patient::findOrFail($patientId);
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.assessment_report', [
            'assessment' => new \App\Models\ClinicalAssessment(['title' => 'بروتوكول عسر البلع والاضطرابات الفمية الوجهية']),
            'patient' => $patient,
            'specialist' => \Illuminate\Support\Facades\Auth::user(),
            'tenant' => \Illuminate\Support\Facades\Auth::user()?->tenant,
        ]);
        return $pdf->stream('Dysphagia_' . ($patient->last_name ?? 'Patient') . '.pdf');
    }
}

