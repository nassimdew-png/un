<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\TherapySession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AppointmentController extends Controller
{
    /**
     * List appointments (tenant-scoped with date/specialist filters).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Appointment::with(['patient', 'specialist', 'invoice']);

        if ($startDate = $request->query('start_date')) {
            $query->whereDate('appointment_date', '>=', $startDate);
        }

        if ($endDate = $request->query('end_date')) {
            $query->whereDate('appointment_date', '<=', $endDate);
        }

        if ($specialistId = $request->query('specialist_id')) {
            $query->where('specialist_id', $specialistId);
        }

        if ($patientId = $request->query('patient_id')) {
            $query->where('patient_id', $patientId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $appointments = $query->orderBy('appointment_date', 'desc')->paginate((int) $request->query('per_page', 25));

        return response()->json($appointments);
    }

    /**
     * Store a new appointment.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'specialist_id' => 'nullable|exists:users,id',
            'appointment_date' => 'required|date',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'type' => 'nullable|string',
            'status' => 'nullable|in:scheduled,confirmed,in_progress,completed,cancelled,no_show',
            'notes' => 'nullable|string',
        ]);

        $validated['specialist_id'] = $validated['specialist_id'] ?? ($user ? $user->id : null);
        if (empty($validated['specialist_id'])) {
            $defaultUser = \App\Models\User::first();
            $validated['specialist_id'] = $defaultUser ? $defaultUser->id : null;
        }

        $validated['tenant_id'] = $user ? $user->tenant_id : null;
        if (empty($validated['tenant_id'])) {
            $patient = \App\Models\Patient::find($validated['patient_id']);
            $validated['tenant_id'] = $patient ? $patient->tenant_id : 1;
        }

        $validated['status'] = $validated['status'] ?? 'scheduled';
        $validated['type'] = $validated['type'] ?? 'therapy_session';

        // Map general type aliases
        if ($validated['type'] === 'consultation') {
            $validated['type'] = 'initial_consultation';
        } elseif ($validated['type'] === 'therapy') {
            $validated['type'] = 'therapy_session';
        }

        $appointment = Appointment::create($validated);

        return response()->json([
            'message' => 'Rendez-vous planifié avec succès.',
            'id' => $appointment->id,
            'appointment' => $appointment->load(['patient', 'specialist']),
            'data' => $appointment,
        ], 201);
    }

    /**
     * Quick start immediate session for a patient.
     */
    public function quickStartSession(Request $request): JsonResponse
    {
        $user = Auth::user();
        $patientId = $request->input('patient_id');
        $patient = \App\Models\Patient::find($patientId);

        $specialistId = $request->input('specialist_id');
        if (empty($specialistId)) {
            $specialistId = $user ? $user->id : (\App\Models\User::first()?->id);
        }

        $tenantId = $user ? $user->tenant_id : ($patient?->tenant_id ?? 1);

        $appointment = Appointment::create([
            'tenant_id' => $tenantId,
            'patient_id' => $patientId,
            'specialist_id' => $specialistId,
            'appointment_date' => now()->toDateString(),
            'start_time' => now()->format('H:i'),
            'type' => 'therapy_session',
            'status' => 'in_progress',
            'notes' => $request->input('notes', 'جلسة علاجية فورية ومباشرة'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم بدء الجلسة العلاجية بنجاح.',
            'id' => $appointment->id,
            'appointment' => $appointment->load(['patient', 'specialist']),
        ], 201);
    }

    /**
     * Start an appointment session (mark in_progress).
     */
    public function startSession(string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->update(['status' => 'in_progress']);

        return response()->json([
            'success' => true,
            'message' => 'تم بدء الجلسة.',
            'appointment' => $appointment->load(['patient', 'specialist']),
        ]);
    }

    /**
     * Complete an appointment session and optionally record a therapy session.
     */
    public function completeSession(string $id, Request $request): JsonResponse
    {
        $user = Auth::user();
        $appointment = Appointment::with(['patient', 'specialist'])->findOrFail($id);
        
        $notes = $request->input('notes', $appointment->notes);
        $appointment->update([
            'status' => 'completed',
            'notes' => $notes,
        ]);

        $session = null;
        if ($request->input('save_therapy_session', true)) {
            $specialty = $request->input('specialty', 'orthophony');
            if (!in_array($specialty, ['orthophony', 'psychology'])) {
                $specialty = 'orthophony';
            }

            $duration = (int) $request->input('duration_minutes', 45);
            if ($duration < 5) $duration = 45;

            $session = TherapySession::create([
                'tenant_id' => $appointment->tenant_id ?: ($user ? $user->tenant_id : 1),
                'patient_id' => $appointment->patient_id,
                'specialist_id' => $appointment->specialist_id ?: ($user ? $user->id : (\App\Models\User::first()?->id)),
                'session_date' => $appointment->appointment_date ?: now()->toDateString(),
                'duration_minutes' => $duration,
                'specialty' => $specialty,
                'progress_notes' => $request->input('progress_notes', $notes),
                'exercises_targeted' => $request->input('exercises_targeted', []),
                'attendance_status' => 'present',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إنهاء وتوثيق الجلسة بنجاح.',
            'appointment' => $appointment->fresh(['patient', 'specialist']),
            'therapy_session' => $session,
        ]);
    }

    /**
     * Display appointment details.
     */
    public function show(string $id): JsonResponse
    {
        $appointment = Appointment::with(['patient', 'specialist', 'invoice'])->findOrFail($id);

        return response()->json([
            'appointment' => $appointment,
            'data' => $appointment,
        ]);
    }

    /**
     * Update appointment or status.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'appointment_date' => 'sometimes|required|date',
            'specialist_id' => 'sometimes|nullable|exists:users,id',
            'type' => 'sometimes|nullable|string',
            'status' => 'sometimes|required|in:scheduled,confirmed,in_progress,completed,cancelled,no_show',
            'notes' => 'nullable|string',
        ]);

        $appointment->update($validated);

        return response()->json([
            'message' => 'Rendez-vous mis à jour.',
            'appointment' => $appointment->load(['patient', 'specialist']),
        ]);
    }

    /**
     * Delete appointment.
     */
    public function destroy(string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->delete();

        return response()->json([
            'message' => 'Rendez-vous supprimé.',
        ]);
    }
}
