<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Appointment;
use App\Models\PublicAppointmentRequest;
use App\Models\Patient;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Throwable;

class PublicClinicBookingController extends Controller
{
    /**
     * Helper to find clinic by slug, subdomain, or ID
     */
    protected function resolveClinic(string $slug)
    {
        $slug = strtolower(trim($slug));
        $clinic = Tenant::where('slug', $slug)
            ->orWhere('subdomain', $slug)
            ->first();

        if (!$clinic && ($slug === 'elamal' || $slug === 'cabinet-elamal')) {
            $clinic = Tenant::firstOrCreate(
                ['subdomain' => 'elamal'],
                [
                    'name'                  => 'عيادة الأمل للتخاطب والدعم النفسي',
                    'slug'                  => 'elamal',
                    'specialty_type'        => 'multidisciplinary',
                    'doctor_name'           => 'د. سارة بن علي',
                    'doctor_title'          => 'أخصائية أرطوفونيا وأمراض التخاطب والنمو العصبي',
                    'bio'                   => 'عيادة متخصصة في تقييم وعلاج اضطرابات النطق والكلام، التأخر اللغوي، التأتأة، طيف التوحد، وصعوبات التعلم الأكاديمي بأحدث البروتوكولات الإكلينيكية والذكاء الاصطناعي التشخيصي.',
                    'address_details'       => 'حي 500 مسكن، عمارة C، الطابق الأول - الجزائر العاصمة (بالقرب من محطة المترو)',
                    'google_maps_url'       => 'https://maps.google.com/?q=Algiers,Algeria',
                    'booking_enabled'       => true,
                    'slot_duration_minutes' => 30,
                    'primary_color'         => '#0284c7',
                    'settings'              => [
                        'phone' => '0550 12 34 56',
                        'email' => 'contact@cabinet-elamal.dz',
                        'logo'  => 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=200&q=80'
                    ],
                    'working_hours_json'    => [
                        'days'  => ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
                        'start' => '09:00',
                        'end'   => '17:00',
                        'break' => '12:30 - 13:30'
                    ],
                    'services_json'         => [
                        [
                            'id'          => 'bilan_ortho',
                            'title'       => 'حصيلة وفحص أرطوفوني شامل (Bilan Orthophonique)',
                            'duration'    => '45 دقيقة',
                            'price'       => '3,500 دج',
                            'description' => 'تقييم شامل للنطق، اللغة الشفهية والمكتوبة، وفحص القدرات الإدراكية باستخدام مقاييس معيارية.'
                        ],
                        [
                            'id'          => 'session_rehab',
                            'title'       => 'جلسة إعادة تأهيل أرطوفوني (Rééducation)',
                            'duration'    => '30 دقيقة',
                            'price'       => '1,800 دج',
                            'description' => 'جلسة علاجية فردية مخصصة لتصحيح مخارج الحروف، التأتأة، وتطوير المهارات التعبيرية.'
                        ],
                        [
                            'id'          => 'psy_consultation',
                            'title'       => 'استشارة ودعم نفسي عيادي (Psychologie)',
                            'duration'    => '45 دقيقة',
                            'price'       => '2,500 دج',
                            'description' => 'جلسة استماع وتشخيص للاضطرابات السلوكية، القلق، فرط الحركة وتشتت الانتباه (ADHD).'
                        ]
                    ]
                ]
            );
        }

        return $clinic;
    }

    /**
     * GET /api/public/clinic/{slug}
     * Returns sanitized public clinic details for the mini-site
     */
    public function show(string $slug)
    {
        try {
            $clinic = $this->resolveClinic($slug);

            if (!$clinic) {
                return response()->json(['success' => false, 'message' => 'العيادة غير موجودة'], 404);
            }

            return response()->json([
                'success' => true,
                'clinic'  => [
                    'id'                    => (string) ($clinic->_id ?? $clinic->id),
                    'name'                  => $clinic->name,
                    'slug'                  => $clinic->slug ?? $clinic->subdomain,
                    'subdomain'             => $clinic->subdomain,
                    'specialty_type'        => $clinic->specialty_type ?? 'multidisciplinary',
                    'doctor_name'           => $clinic->doctor_name ?? 'د. المشرف الإكلينيكي',
                    'doctor_title'          => $clinic->doctor_title ?? 'أخصائي معتمد',
                    'bio'                   => $clinic->bio ?? 'عيادة إكلينيكية متخصصة تقدم استشارات وفحوصات دقيقة.',
                    'address_details'       => $clinic->address_details ?? 'الجزائر العاصمة',
                    'google_maps_url'       => $clinic->google_maps_url ?? null,
                    'booking_enabled'       => $clinic->booking_enabled ?? true,
                    'slot_duration_minutes' => $clinic->slot_duration_minutes ?? 30,
                    'primary_color'         => $clinic->primary_color ?? '#0284c7',
                    'phone'                 => $clinic->settings['phone'] ?? '0550 00 00 00',
                    'email'                 => $clinic->settings['email'] ?? null,
                    'logo'                  => $clinic->settings['logo'] ?? null,
                    'working_hours'         => $clinic->working_hours_json ?? [
                        'days'  => ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
                        'start' => '09:00',
                        'end'   => '17:00'
                    ],
                    'services'              => $clinic->services_json ?? [
                        [
                            'id'          => 'bilan_ortho',
                            'title'       => 'فحص وتقييم أرطوفوني شامل',
                            'duration'    => '45 دقيقة',
                            'price'       => '3,500 دج',
                            'description' => 'فحص اللغة والنطق للأطفال والكبار.'
                        ],
                        [
                            'id'          => 'rehab_session',
                            'title'       => 'جلسة إعادة تأهيل علاجية',
                            'duration'    => '30 دقيقة',
                            'price'       => '1,800 دج',
                            'description' => 'جلسة فردية منتظمة وفق خطة علاجية مخصصة.'
                        ]
                    ]
                ]
            ]);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/public/clinic/{slug}/available-slots
     * Compute open slots for a specific date
     */
    public function availableSlots(string $slug, Request $request)
    {
        try {
            $clinic = $this->resolveClinic($slug);
            if (!$clinic) {
                return response()->json(['success' => false, 'message' => 'العيادة غير موجودة'], 404);
            }

            $dateStr = $request->query('date', Carbon::today()->format('Y-m-d'));
            $slotDuration = $clinic->slot_duration_minutes ?? 30;

            // Generate slots from 09:00 to 17:00
            $startHour = 9;
            $endHour = 17;

            $allSlots = [];
            $currentTime = Carbon::createFromFormat('Y-m-d H:i', "{$dateStr} 09:00");
            $endTime = Carbon::createFromFormat('Y-m-d H:i', "{$dateStr} 17:00");

            while ($currentTime->lt($endTime)) {
                $timeSlot = $currentTime->format('H:i');
                // Skip lunch break (12:30 - 13:30)
                if ($timeSlot !== '12:30' && $timeSlot !== '13:00') {
                    $allSlots[] = $timeSlot;
                }
                $currentTime->addMinutes($slotDuration);
            }

            // Find existing booked slots for this clinic on that date
            $clinicId = (string)($clinic->_id ?? $clinic->id);
            $bookedTimes = PublicAppointmentRequest::where('clinic_id', $clinicId)
                ->where('appointment_date', $dateStr)
                ->where('status', '!=', 'cancelled')
                ->pluck('start_time')
                ->toArray();

            $existingAppointments = Appointment::where('tenant_id', $clinicId)
                ->where('appointment_date', $dateStr)
                ->where('status', '!=', 'cancelled')
                ->pluck('start_time')
                ->toArray();

            $allBooked = array_unique(array_merge($bookedTimes, $existingAppointments));

            $availableSlots = array_values(array_diff($allSlots, $allBooked));

            return response()->json([
                'success'         => true,
                'date'            => $dateStr,
                'slot_duration'   => $slotDuration,
                'all_slots'       => $allSlots,
                'booked_slots'    => array_values($allBooked),
                'available_slots' => $availableSlots
            ]);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/public/clinic/{slug}/book
     * Real-time appointment booking by patients/parents
     */
    public function book(string $slug, Request $request)
    {
        try {
            $request->validate([
                'patient_full_name' => 'required|string|max:120',
                'patient_age'       => 'nullable|integer|min:1|max:120',
                'parent_name'       => 'nullable|string|max:120',
                'phone'             => 'required|string|min:9|max:20',
                'email'             => 'nullable|email',
                'service_type'      => 'required|string',
                'appointment_date'  => 'required|date|after_or_equal:today',
                'start_time'        => 'required|string',
                'notes'             => 'nullable|string|max:500',
            ]);

            $clinic = $this->resolveClinic($slug);
            if (!$clinic) {
                return response()->json(['success' => false, 'message' => 'العيادة غير موجودة'], 404);
            }

            if (!($clinic->booking_enabled ?? true)) {
                return response()->json(['success' => false, 'message' => 'الحجز الإلكتروني معطل حالياً في هذه العيادة.'], 403);
            }

            $clinicId = (string)($clinic->_id ?? $clinic->id);
            $dateStr = Carbon::parse($request->appointment_date)->format('Y-m-d');
            $startTime = trim($request->start_time);
            $slotDuration = $clinic->slot_duration_minutes ?? 30;
            $endTime = Carbon::createFromFormat('H:i', $startTime)->addMinutes($slotDuration)->format('H:i');

            // Prevent Double-Booking Check
            $alreadyBooked = PublicAppointmentRequest::where('clinic_id', $clinicId)
                ->where('appointment_date', $dateStr)
                ->where('start_time', $startTime)
                ->where('status', '!=', 'cancelled')
                ->exists();

            if ($alreadyBooked) {
                return response()->json([
                    'success' => false,
                    'message' => 'عذراً، هذا التوقيت تم حجزه مسبقاً من قِبل مريض آخر. يرجى اختيار موعد آخر.'
                ], 409);
            }

            // Generate clean reference: BK-ELAMAL-XXXX
            $subPrefix = strtoupper(substr($clinic->subdomain ?? 'CLI', 0, 6));
            $bookingRef = 'BK-' . $subPrefix . '-' . rand(1000, 9999);

            $booking = PublicAppointmentRequest::create([
                'clinic_id'         => $clinicId,
                'patient_full_name' => $request->patient_full_name,
                'patient_age'       => $request->patient_age,
                'parent_name'       => $request->parent_name,
                'phone'             => $request->phone,
                'email'             => $request->email,
                'service_type'      => $request->service_type,
                'appointment_date'  => $dateStr,
                'start_time'        => $startTime,
                'end_time'          => $endTime,
                'notes'             => $request->notes,
                'status'            => 'pending_confirmation',
                'booking_reference' => $bookingRef,
            ]);

            // Also synchronize with main clinic Appointments calendar
            Appointment::create([
                'tenant_id'        => $clinicId,
                'appointment_date' => $dateStr,
                'start_time'       => $startTime,
                'end_time'         => $endTime,
                'status'           => 'scheduled',
                'session_type'     => $request->service_type,
                'notes'            => "حجز إلكتروني خارجي (#{$bookingRef}) للمريض: {$request->patient_full_name} | هاتف: {$request->phone} " . ($request->notes ? " | ملاحظات: {$request->notes}" : ""),
                'is_paid'          => false
            ]);

            return response()->json([
                'success'           => true,
                'message'           => 'تم تسجيل طلب حجز موعدك بنجاح! ستتلقى تأكيداً عبر الاتصال أو رسالة نصية.',
                'booking_reference' => $bookingRef,
                'details'           => [
                    'clinic_name'      => $clinic->name,
                    'doctor_name'      => $clinic->doctor_name ?? 'الأخصائي المعالج',
                    'patient_name'     => $request->patient_full_name,
                    'service_type'     => $request->service_type,
                    'date'             => $dateStr,
                    'time'             => "من {$startTime} إلى {$endTime}",
                    'address'          => $clinic->address_details ?? 'مقر العيادة',
                    'phone'            => $clinic->settings['phone'] ?? '0550 12 34 56'
                ]
            ], 201);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
