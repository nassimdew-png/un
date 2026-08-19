<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Appointment;

class AppointmentController extends Controller
{
    /**
     * Get clinic appointments schedule
     */
    public function index(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id') ?: $request->header('X-Tenant-ID', 'tenant_elamal_01');

        $appointments = Appointment::where('tenant_id', $tenantId)->latest()->get();

        if ($appointments->isEmpty()) {
            return response()->json([
                [
                    '_id'              => 'app_01',
                    'tenant_id'        => 'tenant_elamal_01',
                    'patient_id'       => 'pat_01',
                    'patient_name'     => 'ياسين بن علي',
                    'specialist_name'  => 'د. نادية مرابط',
                    'appointment_date' => '2026-08-19',
                    'start_time'       => '09:00',
                    'end_time'         => '09:45',
                    'session_type'     => 'orthophonie_bilan',
                    'status'           => 'completed',
                    'fee'              => 3500,
                    'is_paid'          => true,
                ],
                [
                    '_id'              => 'app_02',
                    'tenant_id'        => 'tenant_elamal_01',
                    'patient_id'       => 'pat_02',
                    'patient_name'     => 'سارة قدور',
                    'specialist_name'  => 'د. نادية مرابط',
                    'appointment_date' => '2026-08-19',
                    'start_time'       => '10:30',
                    'end_time'         => '11:15',
                    'session_type'     => 'orthophonie_session',
                    'status'           => 'scheduled',
                    'fee'              => 2500,
                    'is_paid'          => false,
                ],
                [
                    '_id'              => 'app_03',
                    'tenant_id'        => 'tenant_elamal_01',
                    'patient_id'       => 'pat_03',
                    'patient_name'     => 'أمين بلحاج',
                    'specialist_name'  => 'أ. كريم سعيدي (نفساني)',
                    'appointment_date' => '2026-08-19',
                    'start_time'       => '14:00',
                    'end_time'         => '15:00',
                    'session_type'     => 'psy_consultation',
                    'status'           => 'scheduled',
                    'fee'              => 4000,
                    'is_paid'          => true,
                ]
            ]);
        }

        return response()->json($appointments);
    }

    /**
     * Book a new appointment
     */
    public function store(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id') ?: $request->header('X-Tenant-ID', 'tenant_elamal_01');

        $validated = $request->validate([
            'patient_id'       => 'required',
            'appointment_date' => 'required|date',
            'start_time'       => 'required',
            'end_time'         => 'required',
            'session_type'     => 'required|string',
            'fee'              => 'nullable|numeric',
        ]);

        $validated['tenant_id'] = $tenantId;
        $validated['status'] = 'scheduled';
        $appointment = Appointment::create($validated);

        return response()->json($appointment, 201);
    }
}
