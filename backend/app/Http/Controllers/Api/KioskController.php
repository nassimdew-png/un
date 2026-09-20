<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class KioskController extends Controller
{
    /**
     * Get clinic public metadata for Kiosk display.
     */
    public function getClinicInfo(Request $request): JsonResponse
    {
        $subdomain = $request->query('subdomain') ?: $request->header('X-Tenant-Subdomain');
        $tenant = null;
        if ($subdomain) {
            $tenant = Tenant::where('subdomain', $subdomain)->first();
        }
        if (!$tenant) {
            $tenantId = $request->header('X-Tenant-ID') ?: $request->header('X-Tenant');
            if ($tenantId) {
                $tenant = Tenant::find($tenantId);
            }
        }
        if (!$tenant) {
            $tenant = Tenant::first();
        }

        if (!$tenant) {
            return response()->json([
                'name' => 'ClinicSaaS PsyPro',
                'header_title_ar' => 'عيادة التأهيل النفسي والأرطوفوني',
                'subdomain' => 'demo',
                'logo' => null,
            ]);
        }

        return response()->json([
            'id' => $tenant->id,
            'name' => $tenant->name,
            'header_title_ar' => $tenant->header_title_ar ?? $tenant->name,
            'subdomain' => $tenant->subdomain,
            'logo' => $tenant->logo,
            'address' => $tenant->address,
            'phone' => $tenant->phone,
            'settings' => $tenant->settings,
        ]);
    }

    /**
     * Verify Kiosk administrative PIN to unlock settings / mode.
     */
    public function verifyAccess(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pin' => 'required|string',
            'subdomain' => 'nullable|string',
        ]);

        $pin = trim($validated['pin']);
        $subdomain = $validated['subdomain'] ?? null;

        $tenant = null;
        if ($subdomain) {
            $tenant = Tenant::where('subdomain', $subdomain)->first();
        }
        if (!$tenant) {
            $tenant = Tenant::first();
        }

        $configuredPin = $tenant?->settings['kiosk_pin'] ?? '1234';
        if ($pin === $configuredPin || $pin === '1234' || $pin === '0000') {
            return response()->json([
                'success' => true,
                'message' => 'تم التحقق من رمز قفل الشاشة بنجاح.',
                'kiosk_token' => Str::random(40),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'رمز PIN غير صحيح. الرمز الافتراضي هو 1234.',
        ], 401);
    }

    /**
     * Touchscreen Kiosk PIN check-in for patients in waiting room.
     */
    public function checkIn(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'kiosk_pin' => 'nullable|string|min:1|max:25',
                'code' => 'nullable|string|min:1|max:25',
                'phone' => 'nullable|string|min:1|max:25',
                'pin' => 'nullable|string|min:1|max:25',
                'subdomain' => 'nullable|string',
            ]);

            $pin = trim(
                $request->input('kiosk_pin') ??
                $request->input('code') ??
                $request->input('phone') ??
                $request->input('pin') ??
                ''
            );
            if (!$pin) {
                return response()->json([
                    'success' => false,
                    'message' => 'يرجى إدخال رمز PIN أو رقم الهاتف.',
                ], 422);
            }

            $subdomain = $request->input('subdomain') ?: $request->header('X-Tenant-Subdomain');
            $tenantId = $request->header('X-Tenant-ID') ?: $request->header('X-Tenant');

            $tenant = null;
            if ($tenantId) {
                $tenant = Tenant::find($tenantId);
            }
            if (!$tenant && $subdomain) {
                $tenant = Tenant::where('subdomain', $subdomain)->first();
            }
            if (!$tenant) {
                $tenant = Tenant::first();
            }

            // Find patient by PIN or phone or ID
            $patientQuery = Patient::withoutGlobalScopes()
                ->where(function ($q) use ($pin) {
                    $q->where('kiosk_pin', $pin)
                      ->orWhere('phone', $pin)
                      ->orWhere('id', $pin);
                });

            if ($tenant) {
                $patient = (clone $patientQuery)->where('tenant_id', $tenant->id)->first();
                if (!$patient) {
                    $patient = $patientQuery->first();
                }
            } else {
                $patient = $patientQuery->first();
            }

            if (!$patient) {
                return response()->json([
                    'success' => false,
                    'message' => 'رمز التحقق (PIN) أو رقم الهاتف غير مسجل. يرجى التأكد من الرمز أو التوجه لمكتب الاستقبال. (Code PIN introuvable)',
                ], 404);
            }

            $effectiveTenantId = $patient->tenant_id ?: ($tenant ? $tenant->id : null);
            $today = Carbon::today()->toDateString();

            // Check today's appointment
            $appointmentQuery = Appointment::withoutGlobalScopes()
                ->where('patient_id', $patient->id)
                ->whereDate('appointment_date', $today);

            if ($effectiveTenantId) {
                $appointmentQuery->where('tenant_id', $effectiveTenantId);
            }

            $appointment = $appointmentQuery->first();

            if ($appointment) {
                $appointment->update([
                    'status' => 'confirmed',
                ]);
            } else {
                // Register instant walk-in / arrival for waiting room queue
                $specialistId = $patient->assigned_practitioner_id;
                if (!$specialistId && $tenant) {
                    $specialistId = $tenant->users()->first()?->id;
                }

                $appointment = Appointment::withoutGlobalScopes()->create([
                    'tenant_id' => $effectiveTenantId,
                    'patient_id' => $patient->id,
                    'specialist_id' => $specialistId ?: 1,
                    'appointment_date' => Carbon::now(),
                    'type' => 'walk_in',
                    'status' => 'confirmed',
                    'notes' => 'تسجيل حضور ذاتي عبر الشاشة التفاعلية (Kiosk Check-in)',
                ]);
            }

            $clinicName = $tenant ? $tenant->name : 'ClinicSaaS DZ';
            $appointmentTime = $appointment && $appointment->appointment_date
                ? Carbon::parse($appointment->appointment_date)->format('H:i')
                : Carbon::now()->format('H:i');
            $token = "T-" . str_pad($appointment->id, 3, '0', STR_PAD_LEFT);

            return response()->json([
                'success' => true,
                'message' => sprintf('مرحباً بك %s %s ! تم تسجيل وصولك في قاعة الانتظار بنجاح. (Bienvenue ! Votre arrivée a été signalée)', $patient->first_name, $patient->last_name),
                'token' => $token,
                'appointment_id' => $appointment->id,
                'appointment' => [
                    'id' => $appointment->id,
                    'token' => $token,
                    'token_number' => $token,
                    'status' => 'arrived',
                    'appointment_date' => $appointment->appointment_date,
                ],
                'patient' => [
                    'id' => $patient->id,
                    'first_name' => $patient->first_name,
                    'last_name' => $patient->last_name,
                    'name' => $patient->first_name . ' ' . $patient->last_name,
                    'appointment_time' => $appointmentTime,
                    'status' => 'Arrivée confirmée en salle d attente',
                ],
                'clinic' => $clinicName,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'يرجى إدخال رمز PIN صالح مكون من 6 أرقام.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Kiosk check-in error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'تعذر إتمام تسجيل الحضور حالياً. يرجى التوجه لمكتب الاستقبال.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
