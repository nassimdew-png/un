<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
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

        $appointments = $query->orderBy('appointment_date', 'asc')->paginate((int) $request->query('per_page', 50));

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
        $validated['tenant_id'] = $user ? $user->tenant_id : null;
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

        $appointment = Appointment::create([
            'tenant_id' => $user ? $user->tenant_id : null,
            'patient_id' => $patientId,
            'specialist_id' => $request->input('specialist_id', $user ? $user->id : null),
            'appointment_date' => now()->toDateString(),
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
     * Complete an appointment session.
     */
    public function completeSession(string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->update(['status' => 'completed']);

        return response()->json([
            'success' => true,
            'message' => 'تم إنهاء الجلسة وحفظ التقرير بنجاح.',
            'appointment' => $appointment->load(['patient', 'specialist']),
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
