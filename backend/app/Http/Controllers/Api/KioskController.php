<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KioskController extends Controller
{
    /**
     * Touchscreen Kiosk PIN check-in for patients in waiting room.
     */
    public function checkIn(Request $request): JsonResponse
    {
        $request->validate([
            'kiosk_pin' => 'required|string|size:6',
            'subdomain' => 'nullable|string',
        ]);

        $subdomain = $request->input('subdomain') ?: $request->header('X-Tenant-Subdomain') ?: 'elbiar-ortho';

        $tenant = Tenant::where('subdomain', $subdomain)->first();

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Cabinet introuvable.',
            ], 404);
        }

        // Find patient by PIN in tenant
        $patient = Patient::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('kiosk_pin', $request->kiosk_pin)
            ->first();

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Code PIN invalide. Veuillez vérifier auprès de l accueil.',
            ], 404);
        }

        // Check today's appointment
        $today = date('Y-m-d');
        $appointment = Appointment::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('patient_id', $patient->id)
            ->whereDate('appointment_date', $today)
            ->first();

        if ($appointment) {
            $appointment->update(['status' => 'confirmed']);
        }

        return response()->json([
            'success' => true,
            'message' => sprintf('Bienvenue %s %s ! Votre arrivée a été signalée.', $patient->first_name, $patient->last_name),
            'patient' => [
                'name' => $patient->first_name . ' ' . $patient->last_name,
                'appointment_time' => $appointment ? date('H:i', strtotime($appointment->appointment_date)) : 'Consultation du jour',
                'status' => 'Arrivée confirmée en salle d attente',
            ],
            'clinic' => $tenant->name,
        ]);
    }
}
