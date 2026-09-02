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
        $query = TherapySession::with(['patient', 'specialist']);

        if ($patientId = $request->query('patient_id')) {
            $query->where('patient_id', $patientId);
        }

        if ($specialty = $request->query('specialty')) {
            $query->where('specialty', $specialty);
        }

        if ($status = $request->query('attendance_status')) {
            $query->where('attendance_status', $status);
        }

        $sessions = $query->latest('session_date')->paginate((int) $request->query('per_page', 25));

        return response()->json($sessions);
    }

    /**
     * Store a newly created session (tenant-scoped).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'session_date' => 'required|date',
            'duration_minutes' => 'nullable|integer|min:15|max:180',
            'specialty' => 'required|in:orthophony,psychology',
            'progress_notes' => 'nullable|string',
            'exercises_targeted' => 'nullable|array',
            'attendance_status' => 'nullable|in:present,absent,excused',
        ]);

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
            'specialty' => 'sometimes|required|in:orthophony,psychology',
            'progress_notes' => 'nullable|string',
            'exercises_targeted' => 'nullable|array',
            'attendance_status' => 'sometimes|required|in:present,absent,excused',
        ]);

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
}
