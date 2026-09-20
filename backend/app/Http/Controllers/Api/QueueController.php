<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QueueController extends Controller
{
    /**
     * Public TV Display queue for waiting room.
     */
    public function getTvQueue(Request $request, ?string $tenantSlug = null): JsonResponse
    {
        $tenant = null;
        if ($tenantSlug && $tenantSlug !== 'undefined' && $tenantSlug !== 'null') {
            $tenant = Tenant::where('subdomain', $tenantSlug)
                ->orWhere('id', $tenantSlug)
                ->orWhere('name', $tenantSlug)
                ->first();
        }

        if (!$tenant && $request->query('subdomain')) {
            $tenant = Tenant::where('subdomain', $request->query('subdomain'))->first();
        }

        if (!$tenant && $request->header('X-Tenant-Subdomain')) {
            $tenant = Tenant::where('subdomain', $request->header('X-Tenant-Subdomain'))->first();
        }

        if (!$tenant && $request->user() && $request->user()->tenant_id) {
            $tenant = Tenant::find($request->user()->tenant_id);
        }

        if (!$tenant && $request->header('X-Tenant-Id')) {
            $tenant = Tenant::find($request->header('X-Tenant-Id'));
        }

        $today = Carbon::today();

        if (!$tenant) {
            $recentApp = Appointment::where(function ($q) use ($today) {
                $q->whereDate('appointment_date', $today)
                  ->orWhereDate('called_at', $today)
                  ->orWhereDate('updated_at', $today);
            })->latest('updated_at')->first();

            if ($recentApp && $recentApp->tenant_id) {
                $tenant = Tenant::find($recentApp->tenant_id);
            }
            if (!$tenant) {
                $tenant = Tenant::first();
            }
        }

        $query = Appointment::with(['patient:id,first_name,last_name', 'specialist:id,name'])
            ->where(function ($q) use ($today) {
                $q->whereDate('appointment_date', $today)
                  ->orWhereDate('called_at', $today)
                  ->orWhereDate('updated_at', $today);
            });

        if ($tenant) {
            $query->where('tenant_id', $tenant->id);
        }

        $appointments = $query->orderBy('appointment_date', 'asc')->get();

        // Find active calling (most recently called in_progress)
        $currentCalling = $appointments->where('status', 'in_progress')
            ->sortByDesc(fn ($a) => $a->called_at ?? $a->updated_at)
            ->first();

        // If no appointment is in_progress, check by called_at or recent call
        if (!$currentCalling) {
            $currentCalling = $appointments->whereNotNull('called_at')
                ->sortByDesc(fn ($a) => $a->called_at ?? $a->updated_at)
                ->first();
        }

        if (!$currentCalling) {
            $currentCalling = Appointment::with(['patient:id,first_name,last_name', 'specialist:id,name'])
                ->when($tenant, fn($q) => $q->where('tenant_id', $tenant->id))
                ->where(function ($q) {
                    $q->where('status', 'in_progress')
                      ->orWhereNotNull('called_at');
                })
                ->latest('updated_at')
                ->first();
        }

        // Recently called list
        $recentCalled = $appointments->where('status', 'in_progress')
            ->sortByDesc(fn ($a) => $a->called_at ?? $a->updated_at)
            ->take(4)
            ->values()
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'token' => "T-" . str_pad($a->id, 3, '0', STR_PAD_LEFT),
                    'token_number' => "T-" . str_pad($a->id, 3, '0', STR_PAD_LEFT),
                    'patient_name' => $a->patient ? ($a->patient->first_name . ' ' . $a->patient->last_name) : 'مريض',
                    'patient_initials' => $a->patient ? (mb_substr($a->patient->first_name, 0, 1) . '. ' . mb_substr($a->patient->last_name, 0, 1) . '.') : '—',
                    'specialist' => $a->specialist ? $a->specialist->name : 'الأخصائي المعالج',
                    'called_at' => $a->called_at ? Carbon::parse($a->called_at)->format('H:i') : Carbon::parse($a->updated_at)->format('H:i'),
                    'room' => 'قاعة الاستشارة والتشخيص 1',
                    'room_name' => 'قاعة الاستشارة والتشخيص 1',
                ];
            });

        // Waiting queue
        $waitingList = $appointments->whereIn('status', ['confirmed', 'arrived', 'pending', 'waiting'])
            ->values()
            ->map(function ($a, $idx) {
                return [
                    'id' => $a->id,
                    'token' => "T-" . str_pad($a->id, 3, '0', STR_PAD_LEFT),
                    'time' => $a->appointment_date ? Carbon::parse($a->appointment_date)->format('H:i') : '—',
                    'patient_name' => $a->patient ? ($a->patient->first_name . ' ' . $a->patient->last_name) : 'مريض',
                    'patient_initials' => $a->patient ? (mb_substr($a->patient->first_name, 0, 1) . '. ' . mb_substr($a->patient->last_name, 0, 1) . '.') : '—',
                    'specialist' => $a->specialist ? $a->specialist->name : 'الأخصائي المعالج',
                    'status' => $a->status,
                    'position' => $idx + 1,
                ];
            });

        $tickerText = $tenant && $tenant->tv_display_ticker_text
            ? $tenant->tv_display_ticker_text
            : 'مرحباً بكم في العيادة. يرجى الانتظار بهدوء حتى يظهر رقم تذكرتكم على الشاشة. نتمنى لكم دوام الصحة والعافية والشفاء العاجل.';

        return response()->json([
            'success' => true,
            'clinic' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo_url' => $tenant->logo_url ?? null,
                'ticker_text' => $tickerText,
                'audio_chime_enabled' => (bool) ($tenant->tv_audio_chime_enabled ?? true),
            ] : [
                'name' => 'العيادة الطبية التخصصية',
                'ticker_text' => $tickerText,
                'audio_chime_enabled' => true,
            ],
            'tenant' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
            ] : [
                'name' => 'عيادة الاستشارات المتخصصة',
            ],
            'current_calling' => $currentCalling ? [
                'id' => $currentCalling->id,
                'token' => "T-" . str_pad($currentCalling->id, 3, '0', STR_PAD_LEFT),
                'token_number' => "T-" . str_pad($currentCalling->id, 3, '0', STR_PAD_LEFT),
                'patient_name' => $currentCalling->patient ? ($currentCalling->patient->first_name . ' ' . $currentCalling->patient->last_name) : 'المريض التالي',
                'patient_initials' => $currentCalling->patient ? (mb_substr($currentCalling->patient->first_name, 0, 1) . '. ' . mb_substr($currentCalling->patient->last_name, 0, 1) . '.') : '—',
                'specialist' => $currentCalling->specialist ? $currentCalling->specialist->name : 'الأخصائي المعالج',
                'called_at' => $currentCalling->called_at ? Carbon::parse($currentCalling->called_at)->format('H:i:s') : Carbon::parse($currentCalling->updated_at)->format('H:i:s'),
                'call_counter' => (int) ($currentCalling->call_counter ?? 1),
                'room' => 'قاعة الاستشارة والتشخيص',
                'room_name' => 'قاعة الاستشارة والتشخيص',
            ] : null,
            'current_call' => $currentCalling ? [
                'id' => $currentCalling->id,
                'token' => "T-" . str_pad($currentCalling->id, 3, '0', STR_PAD_LEFT),
                'token_number' => "T-" . str_pad($currentCalling->id, 3, '0', STR_PAD_LEFT),
                'patient_name' => $currentCalling->patient ? ($currentCalling->patient->first_name . ' ' . $currentCalling->patient->last_name) : 'المريض التالي',
                'room_name' => 'قاعة الاستشارة والتشخيص',
            ] : null,
            'recent_called' => $recentCalled,
            'recent_calls' => $recentCalled,
            'waiting_list' => $waitingList,
            'ticker_messages' => [
                $tickerText,
                'يرجى احترام الهدوء داخل قاعة الانتظار',
                'مواعيد اليوم تخضع لنظام النداء الرقمي'
            ],
            'stats' => [
                'total_today' => $appointments->count(),
                'waiting_count' => $waitingList->count(),
                'completed_count' => $appointments->where('status', 'completed')->count(),
            ],
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Call next patient in queue or specific appointment.
     */
    public function callNext(Request $request, ?string $appointmentId = null): JsonResponse
    {
        $id = $appointmentId ?? $request->input('appointment_id');

        if ($id) {
            $appointment = Appointment::with(['patient', 'specialist'])->findOrFail($id);
            $appointment->status = 'in_progress';
            $appointment->called_at = now();
            $appointment->call_counter = ($appointment->call_counter ?? 0) + 1;
            $appointment->save();

            $token = "T-" . str_pad($appointment->id, 3, '0', STR_PAD_LEFT);
            $patientName = $appointment->patient ? ($appointment->patient->first_name . ' ' . $appointment->patient->last_name) : 'المريض';
            $roomName = $request->input('room_name', 'قاعة الاستشارة والتشخيص 1');

            return response()->json([
                'success' => true,
                'message' => 'تم نداء المريض على شاشة قاعة الانتظار بنجاح.',
                'token' => $token,
                'token_number' => $token,
                'patient_name' => $patientName,
                'room_name' => $roomName,
                'room' => $roomName,
                'appointment' => $appointment,
            ]);
        }

        $next = Appointment::where(function ($q) {
                $q->whereDate('appointment_date', Carbon::today())
                  ->orWhereDate('updated_at', Carbon::today());
            })
            ->whereIn('status', ['confirmed', 'arrived', 'pending', 'waiting'])
            ->orderBy('appointment_date', 'asc')
            ->first();

        if (!$next) {
            return response()->json([
                'success' => false,
                'message' => 'لا يوجد مرضى في قاعة الانتظار حالياً.',
            ], 404);
        }

        $next->status = 'in_progress';
        $next->called_at = now();
        $next->call_counter = ($next->call_counter ?? 0) + 1;
        $next->save();

        $token = "T-" . str_pad($next->id, 3, '0', STR_PAD_LEFT);
        $patientName = $next->patient ? ($next->patient->first_name . ' ' . $next->patient->last_name) : 'المريض التالي';
        $roomName = $request->input('room_name', 'قاعة الاستشارة والتشخيص 1');

        return response()->json([
            'success' => true,
            'message' => 'تم نداء المريض التالي بنجاح على شاشة قاعة الانتظار.',
            'token' => $token,
            'token_number' => $token,
            'patient_name' => $patientName,
            'room_name' => $roomName,
            'room' => $roomName,
            'appointment' => $next->load(['patient', 'specialist']),
        ]);
    }

    /**
     * Alias for callNext to support calling a patient by appointment id directly.
     */
    public function callPatient(Request $request, ?string $appointmentId = null): JsonResponse
    {
        return $this->callNext($request, $appointmentId);
    }

    /**
     * Update waiting room TV settings.
     */
    public function updateTvSettings(Request $request): JsonResponse
    {
        $tenantId = $request->user()?->tenant_id ?? $request->header('X-Tenant-Id');
        $tenant = Tenant::find($tenantId) ?? Tenant::first();

        if (!$tenant) {
            return response()->json(['success' => false, 'message' => 'العيادة غير موجودة'], 404);
        }

        $validated = $request->validate([
            'tv_display_ticker_text' => 'nullable|string|max:500',
            'tv_audio_chime_enabled' => 'nullable|boolean',
        ]);

        $tenant->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث إعدادات شاشة قاعة الانتظار بنجاح.',
            'tenant' => [
                'tv_display_ticker_text' => $tenant->tv_display_ticker_text,
                'tv_audio_chime_enabled' => (bool)$tenant->tv_audio_chime_enabled,
            ],
        ]);
    }
}
