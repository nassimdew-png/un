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
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'specialist_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date',
            'type' => 'required|in:initial_consultation,follow_up,assessment,therapy_session',
            'status' => 'nullable|in:scheduled,confirmed,completed,cancelled,no_show',
            'notes' => 'nullable|string',
        ]);

        $validated['status'] = $validated['status'] ?? 'scheduled';

        $appointment = Appointment::create($validated);

        return response()->json([
            'message' => 'Rendez-vous planifié avec succès.',
            'appointment' => $appointment->load(['patient', 'specialist']),
        ], 201);
    }

    /**
     * Display appointment details.
     */
    public function show(string $id): JsonResponse
    {
        $appointment = Appointment::with(['patient', 'specialist', 'invoice'])->findOrFail($id);

        return response()->json([
            'appointment' => $appointment,
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
            'specialist_id' => 'sometimes|required|exists:users,id',
            'type' => 'sometimes|required|in:initial_consultation,follow_up,assessment,therapy_session',
            'status' => 'sometimes|required|in:scheduled,confirmed,completed,cancelled,no_show',
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
