<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\ClinicBrandingSetting;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\PatientBilan;
use App\Models\PublicBookingRequest;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClinicController extends Controller
{
    /**
     * Helper to get current authenticated tenant.
     */
    protected function getActiveTenant(): ?Tenant
    {
        $user = Auth::user();
        if (!$user) {
            return null;
        }

        if ($user->tenant_id) {
            $tenant = Tenant::find($user->tenant_id) ?: Tenant::where('id', (int)$user->tenant_id)->first();
            if ($tenant) {
                return $tenant;
            }
        }

        return Tenant::first();
    }

    /**
     * Get Today's Agenda and Reception Queue Summary.
     */
    public function getTodayAgendaSummary(Request $request): JsonResponse
    {
        $todayStr = Carbon::today()->toDateString();

        $appointments = Appointment::with(['patient', 'specialist'])
            ->whereDate('appointment_date', $todayStr)
            ->orderBy('appointment_date', 'asc')
            ->get();

        $waitingRoom = $appointments->filter(function ($a) {
            return in_array($a->status, ['confirmed', 'arrived', 'waiting']);
        })->values();

        $inProgress = $appointments->filter(function ($a) {
            return in_array($a->status, ['in_progress', 'in_consultation']);
        })->values();

        $completed = $appointments->filter(function ($a) {
            return $a->status === 'completed';
        })->values();

        $scheduled = $appointments->filter(function ($a) {
            return $a->status === 'scheduled';
        })->values();

        // Count unbilled sessions today
        $unbilledCount = Appointment::whereDate('appointment_date', $todayStr)
            ->whereIn('status', ['completed', 'in_progress', 'in_consultation'])
            ->whereDoesntHave('invoice')
            ->count();

        // Draft bilans count
        $draftBilansCount = PatientBilan::where('status', 'draft')->count();

        // Waiting list pending count
        $waitingListCount = PublicBookingRequest::where('status', 'pending')->count();

        // Today's total cash/collected from invoices
        $todayCollected = Invoice::whereDate('created_at', $todayStr)->sum('paid_amount');

        return response()->json([
            'success' => true,
            'date' => $todayStr,
            'stats' => [
                'total_today' => $appointments->count(),
                'waiting_room' => $waitingRoom->count(),
                'in_progress' => $inProgress->count(),
                'completed' => $completed->count(),
                'scheduled' => $scheduled->count(),
                'no_show' => $appointments->where('status', 'no_show')->count(),
                'cancelled' => $appointments->where('status', 'cancelled')->count(),
                'today_collected' => (float)$todayCollected,
            ],
            'waiting_room' => $waitingRoom,
            'in_progress' => $inProgress,
            'completed' => $completed,
            'appointments' => $appointments,
            'unbilled_sessions_count' => $unbilledCount,
            'draft_bilans_count' => $draftBilansCount,
            'waiting_list_count' => $waitingListCount,
        ]);
    }

    /**
     * Get real-time daily pulse metrics.
     */
    public function getDailyPulse(Request $request): JsonResponse
    {
        return $this->getTodayAgendaSummary($request);
    }

    /**
     * Update appointment status (from front-desk or consultation).
     */
    public function updateAppointmentStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:scheduled,confirmed,in_progress,in_consultation,completed,cancelled,no_show',
        ]);

        $status = $validated['status'];
        if ($status === 'in_consultation') {
            $status = 'in_progress';
        }

        $appointment = Appointment::with(['patient', 'specialist'])->findOrFail($id);
        $appointment->status = $status;
        $appointment->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة الموعد بنجاح.',
            'appointment' => $appointment,
        ]);
    }

    /**
     * Get Smart Waiting List.
     */
    public function getWaitingList(Request $request): JsonResponse
    {
        try {
            $tenant = $this->getActiveTenant();
            $query = PublicBookingRequest::query();

            if ($tenant) {
                $query->where(function ($q) use ($tenant) {
                    $q->where('clinic_id', $tenant->id)
                      ->orWhereNull('clinic_id');
                });
            }

            if ($status = $request->query('status')) {
                if ($status === 'waiting') {
                    $query->whereIn('status', ['pending', 'waiting']);
                } else {
                    $query->where('status', $status);
                }
            }

            if ($specialty = $request->query('specialty')) {
                $query->where('specialty', $specialty);
            }

            if ($search = $request->query('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('patient_name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            $entries = $query->latest()->get();

            $statsQuery = PublicBookingRequest::query();
            if ($tenant) {
                $statsQuery->where(function ($q) use ($tenant) {
                    $q->where('clinic_id', $tenant->id)
                      ->orWhereNull('clinic_id');
                });
            }

            $pendingCount = (clone $statsQuery)->whereIn('status', ['pending', 'waiting'])->count();
            $contactedCount = (clone $statsQuery)->where('status', 'contacted')->count();
            $convertedCount = (clone $statsQuery)->where('status', 'converted')->count();
            $cancelledCount = (clone $statsQuery)->where('status', 'cancelled')->count();
            $totalCount = (clone $statsQuery)->count();

            $stats = [
                'total' => $totalCount,
                'total_waiting' => $pendingCount,
                'pending' => $pendingCount,
                'contacted' => $contactedCount,
                'converted' => $convertedCount,
                'converted_total' => $convertedCount,
                'cancelled' => $cancelledCount,
            ];

            return response()->json([
                'success' => true,
                'waiting_list' => $entries,
                'stats' => $stats,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Waiting list get error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'تعذر تحميل قائمة الانتظار.',
                'waiting_list' => [],
                'stats' => ['total' => 0, 'pending' => 0, 'converted' => 0, 'cancelled' => 0],
            ], 500);
        }
    }

    /**
     * Add new entry to waiting list.
     */
    public function addToWaitingList(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'patient_name' => 'required|string|max:255',
                'phone' => 'required|string|max:50',
                'specialty_needed' => 'nullable|string|max:100',
                'urgency_level' => 'nullable|string|max:50',
                'preferred_days' => 'nullable|array',
                'notes' => 'nullable|string',
            ]);

            $tenant = $this->getActiveTenant();
            $clinicId = $tenant ? $tenant->id : (Tenant::first()?->id ?? '01a01ce6-d75c-73f4-8b2c-66b4fd9fad28');

            $preferredDaysText = 'مرن / أي يوم متاح';
            if (!empty($validated['preferred_days']) && is_array($validated['preferred_days'])) {
                $preferredDaysText = implode(', ', $validated['preferred_days']);
            }

            $booking = PublicBookingRequest::create([
                'clinic_id' => $clinicId,
                'patient_name' => $validated['patient_name'],
                'phone' => $validated['phone'],
                'specialty' => $validated['specialty_needed'] ?? 'orthophonie',
                'preferred_date' => Carbon::today()->toDateString(),
                'preferred_time_slot' => $preferredDaysText,
                'reason_for_visit' => $validated['notes'] ?? ($validated['urgency_level'] ?? 'طلب موعد وقائمة انتظار'),
                'status' => 'pending',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل الحالة في قائمة الانتظار الذكية بنجاح.',
                'entry' => $booking,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'يرجى التأكد من ملء الاسم ورقم الهاتف بشكل صحيح.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Waiting list store error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'تعذر إضافة الحالة لقائمة الانتظار حالياً: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Convert waitlist entry to scheduled appointment.
     */
    public function convertWaitingToAppointment(Request $request, string $id): JsonResponse
    {
        try {
            $appointmentDate = $request->input('appointment_date') ?: $request->input('date');
            $appointmentType = $request->input('appointment_type') ?: $request->input('type', 'therapy_session');

            if (empty($appointmentDate)) {
                return response()->json([
                    'success' => false,
                    'message' => 'يرجى تحديد تاريخ الموعد السريري بشكل صحيح.',
                ], 422);
            }

            $validated = [
                'appointment_date' => $appointmentDate,
                'start_time' => $request->input('start_time'),
                'end_time' => $request->input('end_time'),
                'appointment_type' => $appointmentType,
                'patient_id' => $request->input('patient_id'),
            ];

            $entry = PublicBookingRequest::findOrFail($id);
            $tenant = $this->getActiveTenant();
            $clinicId = $tenant ? $tenant->id : ($entry->clinic_id ?: Tenant::first()?->id);

            $patientId = $validated['patient_id'] ?? null;
            if (!$patientId) {
                // Find or create patient by name and phone
                $names = explode(' ', trim($entry->patient_name), 2);
                $firstName = $names[0] ?? 'مريض';
                $lastName = $names[1] ?? 'جديد';

                $patient = Patient::withoutGlobalScopes()
                    ->where('phone', $entry->phone)
                    ->when($clinicId, fn ($q) => $q->where('tenant_id', $clinicId))
                    ->first();

                if (!$patient) {
                    $patient = Patient::withoutGlobalScopes()->create([
                        'tenant_id' => $clinicId,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'phone' => $entry->phone,
                        'birth_date' => Carbon::now()->subYears(8)->toDateString(),
                        'gender' => 'male',
                        'kiosk_pin' => (string)rand(100000, 999999),
                    ]);
                }
                $patientId = $patient->id;
            }

            $datetime = $validated['appointment_date'];
            if (!empty($validated['start_time'])) {
                $datetime = $validated['appointment_date'] . 'T' . $validated['start_time'];
            }

            $appointment = Appointment::withoutGlobalScopes()->create([
                'tenant_id' => $clinicId,
                'patient_id' => $patientId,
                'specialist_id' => Auth::id() ?: 1,
                'appointment_date' => $datetime,
                'type' => $validated['appointment_type'] ?? 'initial_consultation',
                'status' => 'scheduled',
                'notes' => 'محول من قائمة الانتظار الذكية: ' . ($entry->reason_for_visit ?? ''),
            ]);

            $entry->status = 'converted';
            $entry->save();

            return response()->json([
                'success' => true,
                'message' => 'تم تحويل الحالة إلى موعد سريري بنجاح.',
                'appointment' => $appointment,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Waiting list convert error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'تعذر تحويل الحالة إلى موعد: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update waiting entry status.
     */
    public function updateWaitingStatus(Request $request, string $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'required|string|max:50',
            ]);

            $entry = PublicBookingRequest::findOrFail($id);
            $entry->status = $validated['status'];
            $entry->save();

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث حالة قائمة الانتظار.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'تعذر تحديث الحالة: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete waiting entry.
     */
    public function deleteWaitingEntry(Request $request, string $id): JsonResponse
    {
        try {
            $entry = PublicBookingRequest::findOrFail($id);
            $entry->delete();

            return response()->json([
                'success' => true,
                'message' => 'تم حذف الحالة من قائمة الانتظار.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'تعذر حذف الحالة: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Forward branding methods to ClinicSettingsController logic.
     */
    public function getClinicBranding(Request $request): JsonResponse
    {
        return app(ClinicSettingsController::class)->getBranding($request);
    }

    public function updateClinicBranding(Request $request): JsonResponse
    {
        return app(ClinicSettingsController::class)->updateBranding($request);
    }
}
