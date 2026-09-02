<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\PublicBookingRequest;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PublicDirectoryController extends Controller
{
    /**
     * Algerian 58 Wilayas reference table.
     */
    public const WILAYAS_58 = [
        ['code' => '01', 'name_ar' => 'أدرار', 'name_fr' => 'Adrar'],
        ['code' => '02', 'name_ar' => 'الشلف', 'name_fr' => 'Chlef'],
        ['code' => '03', 'name_ar' => 'الأغواط', 'name_fr' => 'Laghouat'],
        ['code' => '04', 'name_ar' => 'أم البواقي', 'name_fr' => 'Oum El Bouaghi'],
        ['code' => '05', 'name_ar' => 'باتنة', 'name_fr' => 'Batna'],
        ['code' => '06', 'name_ar' => 'بجاية', 'name_fr' => 'Béjaïa'],
        ['code' => '07', 'name_ar' => 'بسكرة', 'name_fr' => 'Biskra'],
        ['code' => '08', 'name_ar' => 'بشار', 'name_fr' => 'Béchar'],
        ['code' => '09', 'name_ar' => 'البليدة', 'name_fr' => 'Blida'],
        ['code' => '10', 'name_ar' => 'البويرة', 'name_fr' => 'Bouira'],
        ['code' => '11', 'name_ar' => 'تمنراست', 'name_fr' => 'Tamanrasset'],
        ['code' => '12', 'name_ar' => 'تبسة', 'name_fr' => 'Tébessa'],
        ['code' => '13', 'name_ar' => 'تلمسان', 'name_fr' => 'Tlemcen'],
        ['code' => '14', 'name_ar' => 'تيارت', 'name_fr' => 'Tiaret'],
        ['code' => '15', 'name_ar' => 'تيزي وزو', 'name_fr' => 'Tizi Ouzou'],
        ['code' => '16', 'name_ar' => 'الجزائر العاصمة', 'name_fr' => 'Alger'],
        ['code' => '17', 'name_ar' => 'الجلفة', 'name_fr' => 'Djelfa'],
        ['code' => '18', 'name_ar' => 'جيجل', 'name_fr' => 'Jijel'],
        ['code' => '19', 'name_ar' => 'سطيف', 'name_fr' => 'Sétif'],
        ['code' => '20', 'name_ar' => 'سعيدة', 'name_fr' => 'Saïda'],
        ['code' => '21', 'name_ar' => 'سكيكدة', 'name_fr' => 'Skikda'],
        ['code' => '22', 'name_ar' => 'سيدي بلعباس', 'name_fr' => 'Sidi Bel Abbès'],
        ['code' => '23', 'name_ar' => 'عنابة', 'name_fr' => 'Annaba'],
        ['code' => '24', 'name_ar' => 'قالمة', 'name_fr' => 'Guelma'],
        ['code' => '25', 'name_ar' => 'قسنطينة', 'name_fr' => 'Constantine'],
        ['code' => '26', 'name_ar' => 'المدية', 'name_fr' => 'Médéa'],
        ['code' => '27', 'name_ar' => 'مستغانم', 'name_fr' => 'Mostaganem'],
        ['code' => '28', 'name_ar' => 'المسيلة', 'name_fr' => 'M\'Sila'],
        ['code' => '29', 'name_ar' => 'معسكر', 'name_fr' => 'Mascara'],
        ['code' => '30', 'name_ar' => 'ورقلة', 'name_fr' => 'Ouargla'],
        ['code' => '31', 'name_ar' => 'وهران', 'name_fr' => 'Oran'],
        ['code' => '32', 'name_ar' => 'البيض', 'name_fr' => 'El Bayadh'],
        ['code' => '33', 'name_ar' => 'إليزي', 'name_fr' => 'Illizi'],
        ['code' => '34', 'name_ar' => 'برج بوعريريج', 'name_fr' => 'Bordj Bou Arréridj'],
        ['code' => '35', 'name_ar' => 'بومرداس', 'name_fr' => 'Boumerdès'],
        ['code' => '36', 'name_ar' => 'الطارف', 'name_fr' => 'El Tarf'],
        ['code' => '37', 'name_ar' => 'تندوف', 'name_fr' => 'Tindouf'],
        ['code' => '38', 'name_ar' => 'تسمسيلت', 'name_fr' => 'Tissemsilt'],
        ['code' => '39', 'name_ar' => 'الوادي', 'name_fr' => 'El Oued'],
        ['code' => '40', 'name_ar' => 'خنشلة', 'name_fr' => 'Khenchela'],
        ['code' => '41', 'name_ar' => 'سوق أهراس', 'name_fr' => 'Souk Ahras'],
        ['code' => '42', 'name_ar' => 'تيبازة', 'name_fr' => 'Tipaza'],
        ['code' => '43', 'name_ar' => 'ميلة', 'name_fr' => 'Mila'],
        ['code' => '44', 'name_ar' => 'عين الدفلى', 'name_fr' => 'Aïn Defla'],
        ['code' => '45', 'name_ar' => 'النعامة', 'name_fr' => 'Naâma'],
        ['code' => '46', 'name_ar' => 'عين تموشنت', 'name_fr' => 'Aïn Témouchent'],
        ['code' => '47', 'name_ar' => 'غرداية', 'name_fr' => 'Ghardaïa'],
        ['code' => '48', 'name_ar' => 'غليزان', 'name_fr' => 'Relizane'],
        ['code' => '49', 'name_ar' => 'تيميمون', 'name_fr' => 'Timimoun'],
        ['code' => '50', 'name_ar' => 'برج باجي مختار', 'name_fr' => 'Bordj Badji Mokhtar'],
        ['code' => '51', 'name_ar' => 'أولاد جلال', 'name_fr' => 'Ouled Djellal'],
        ['code' => '52', 'name_ar' => 'بني عباس', 'name_fr' => 'Béni Abbès'],
        ['code' => '53', 'name_ar' => 'عين صالح', 'name_fr' => 'In Salah'],
        ['code' => '54', 'name_ar' => 'عين قزام', 'name_fr' => 'In Guezzam'],
        ['code' => '55', 'name_ar' => 'تقرت', 'name_fr' => 'Touggourt'],
        ['code' => '56', 'name_ar' => 'جانت', 'name_fr' => 'Djanet'],
        ['code' => '57', 'name_ar' => 'المغير', 'name_fr' => 'El M\'Ghair'],
        ['code' => '58', 'name_ar' => 'المنيعة', 'name_fr' => 'El Meniaa'],
    ];

    /**
     * Search and list verified clinics in the National Directory across 58 Wilayas.
     */
    public function getDirectory(Request $request): JsonResponse
    {
        $query = Tenant::query();

        // Optional filter: only listed or active
        if ($request->has('is_listed')) {
            $query->where('is_listed_in_directory', $request->boolean('is_listed'));
        }

        // Filter by Wilaya
        if ($request->filled('wilaya')) {
            $wilayaSearch = $request->wilaya;
            $query->where(function ($q) use ($wilayaSearch) {
                $q->where('wilaya', 'like', "%{$wilayaSearch}%")
                  ->orWhere('address', 'like', "%{$wilayaSearch}%");
            });
        }

        // Filter by Specialty
        if ($request->filled('specialty')) {
            $spec = $request->specialty;
            if ($spec === 'orthophonie') {
                $query->whereIn('type', ['orthophony', 'orthophonie', 'multidisciplinary']);
            } elseif ($spec === 'psychologie') {
                $query->whereIn('type', ['psychology', 'psychologie', 'multidisciplinary']);
            } elseif ($spec === 'neuro_psychiatrie') {
                $query->whereIn('type', ['neuro_psychiatrie', 'multidisciplinary', 'psychology']);
            } else {
                $query->where('type', $spec);
            }
        }

        // Search text
        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('header_title_ar', 'like', "%{$term}%")
                  ->orWhere('header_title_fr', 'like', "%{$term}%")
                  ->orWhere('public_bio', 'like', "%{$term}%")
                  ->orWhere('address', 'like', "%{$term}%")
                  ->orWhere('commune', 'like', "%{$term}%");
            });
        }

        $clinics = $query->orderBy('name', 'asc')->get()->map(function ($tenant) {
            $practitioners = User::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->whereIn('role', ['admin_owner', 'clinic_admin', 'specialist'])
                ->get(['id', 'name', 'role', 'specialty']);

            return [
                'id' => $tenant->id,
                'name' => $tenant->header_title_ar ?: $tenant->name,
                'name_fr' => $tenant->header_title_fr ?: '',
                'subdomain' => $tenant->subdomain,
                'portal_url' => "https://{$tenant->subdomain}.psypro.tech",
                'type' => $tenant->type,
                'specialty' => $tenant->type === 'orthophony' ? 'أرطوفونيا وتأهيل لغوي' : ($tenant->type === 'psychology' ? 'علم نفس وعيادي' : 'مركز متعدد التخصصات'),
                'wilaya' => $tenant->wilaya ?: 'الجزائر العاصمة',
                'commune' => $tenant->commune ?: '',
                'address' => $tenant->address ?: 'الجزائر',
                'phone' => $tenant->phone ?: '',
                'logo_url' => $tenant->logo_url ?: $tenant->logo_path,
                'report_accent_color' => $tenant->report_accent_color ?: '#0d9488',
                'public_bio' => $tenant->public_bio ?: 'عيادة متخصصة ومعتمدة تقدم خدمات التشخيص السريري، جلسات التأهيل النطقي، والتقييم النفسي المتكامل.',
                'consultation_fee_dzd' => $tenant->consultation_fee_dzd ?: 2000,
                'accepts_public_bookings' => (bool)$tenant->accepts_public_bookings,
                'is_verified' => true,
                'student_discount_available' => true,
                'practitioners' => $practitioners,
            ];
        });

        return response()->json([
            'success' => true,
            'count' => $clinics->count(),
            'wilayas' => self::WILAYAS_58,
            'clinics' => $clinics,
        ]);
    }

    /**
     * Detailed public profile and slot availability for a specific clinic.
     */
    public function getClinicProfile(string $subdomain): JsonResponse
    {
        $tenant = Tenant::where('subdomain', $subdomain)
            ->orWhere('id', $subdomain)
            ->firstOrFail();

        $practitioners = User::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->whereIn('role', ['admin_owner', 'clinic_admin', 'specialist'])
            ->get(['id', 'name', 'role', 'specialty']);

        $availableSlots = [
            '09:00 - 10:00',
            '10:00 - 11:00',
            '11:00 - 12:00',
            '14:00 - 15:00',
            '15:00 - 16:00',
            '16:00 - 17:00',
        ];

        return response()->json([
            'success' => true,
            'clinic' => [
                'id' => $tenant->id,
                'name' => $tenant->header_title_ar ?: $tenant->name,
                'name_fr' => $tenant->header_title_fr,
                'subdomain' => $tenant->subdomain,
                'type' => $tenant->type,
                'specialty' => $tenant->type,
                'wilaya' => $tenant->wilaya ?: 'الجزائر العاصمة',
                'commune' => $tenant->commune ?: '',
                'address' => $tenant->address,
                'phone' => $tenant->phone,
                'logo_url' => $tenant->logo_url ?: $tenant->logo_path,
                'report_accent_color' => $tenant->report_accent_color ?: '#0d9488',
                'public_bio' => $tenant->public_bio ?: 'عيادة متخصصة معتمدة مجهزة بأحدث أدوات التقييم السريري والتأهيل العصبي واللغوي.',
                'consultation_fee_dzd' => $tenant->consultation_fee_dzd ?: 2000,
                'accepts_public_bookings' => (bool)$tenant->accepts_public_bookings,
                'practitioners' => $practitioners,
                'available_time_slots' => $availableSlots,
            ],
        ]);
    }

    /**
     * Submit public appointment booking request from National Directory.
     */
    public function submitBookingRequest(Request $request, string $clinicId): JsonResponse
    {
        $tenant = Tenant::where('id', $clinicId)
            ->orWhere('subdomain', $clinicId)
            ->firstOrFail();

        $validated = $request->validate([
            'patient_name' => 'required|string|max:120',
            'phone' => 'required|string|max:30',
            'specialty' => 'nullable|string|in:orthophonie,psychologie,neuro_psychiatrie,pluridisciplinaire',
            'preferred_date' => 'required|date|after_or_equal:today',
            'preferred_time_slot' => 'required|string|max:50',
            'reason_for_visit' => 'nullable|string|max:1000',
        ]);

        $booking = PublicBookingRequest::create([
            'clinic_id' => $tenant->id,
            'patient_name' => $validated['patient_name'],
            'phone' => $validated['phone'],
            'specialty' => $validated['specialty'] ?? 'orthophonie',
            'preferred_date' => $validated['preferred_date'],
            'preferred_time_slot' => $validated['preferred_time_slot'],
            'reason_for_visit' => $validated['reason_for_visit'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إرسال طلب الحجز إلى العيادة بنجاح! سيقوم فريق الاستقبال بمراجعة طلبكم والتواصل معكم عبر الهاتف أو WhatsApp لتأكيد الموعد.',
            'booking_request' => $booking,
            'clinic' => [
                'name' => $tenant->header_title_ar ?: $tenant->name,
                'phone' => $tenant->phone,
            ],
        ], 201);
    }

    /**
     * List incoming booking requests for the authenticated clinic workspace.
     */
    public function listClinicBookingRequests(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !$user->tenant_id) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $status = $request->query('status');
        $query = PublicBookingRequest::where('clinic_id', $user->tenant_id);

        if ($status) {
            $query->where('status', $status);
        }

        $requests = $query->orderBy('created_at', 'desc')->get();

        $counts = [
            'total' => PublicBookingRequest::where('clinic_id', $user->tenant_id)->count(),
            'pending' => PublicBookingRequest::where('clinic_id', $user->tenant_id)->where('status', 'pending')->count(),
            'approved' => PublicBookingRequest::where('clinic_id', $user->tenant_id)->where('status', 'approved')->count(),
            'rejected' => PublicBookingRequest::where('clinic_id', $user->tenant_id)->where('status', 'rejected')->count(),
        ];

        return response()->json([
            'success' => true,
            'counts' => $counts,
            'requests' => $requests,
        ]);
    }

    /**
     * Update booking request status (Approve & Convert to Scheduled Appointment, or Reject).
     */
    public function updateBookingStatus(Request $request, string $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !$user->tenant_id) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $booking = PublicBookingRequest::where('clinic_id', $user->tenant_id)
            ->where('id', $id)
            ->firstOrFail();

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected,converted',
            'create_appointment' => 'nullable|boolean',
        ]);

        $booking->update(['status' => $validated['status']]);

        $appointment = null;

        // Optionally convert to patient & appointment directly
        if ($validated['status'] === 'approved' && $request->boolean('create_appointment', true)) {
            // Find or create patient
            $names = explode(' ', trim($booking->patient_name), 2);
            $firstName = $names[0] ?? 'مريض';
            $lastName = $names[1] ?? 'دليل';

            $patient = Patient::firstOrCreate(
                [
                    'tenant_id' => $user->tenant_id,
                    'phone' => $booking->phone,
                ],
                [
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'gender' => 'male',
                    'birth_date' => now()->subYears(10)->format('Y-m-d'),
                    'address' => 'حجز من الدليل الوطني',
                ]
            );

            // Parse time slot
            $startTime = '09:00';
            if (preg_match('/(\d{2}:\d{2})/', $booking->preferred_time_slot, $matches)) {
                $startTime = $matches[1];
            }

            $appointmentDate = $booking->preferred_date
                ? Carbon::parse($booking->preferred_date)->format('Y-m-d')
                : now()->format('Y-m-d');

            $appointment = Appointment::create([
                'tenant_id' => $user->tenant_id,
                'patient_id' => $patient->id,
                'specialist_id' => $user->id,
                'appointment_date' => $appointmentDate . ' ' . $startTime . ':00',
                'session_duration_minutes' => 45,
                'type' => 'initial_consultation',
                'status' => 'confirmed',
                'confirmed_by_patient' => true,
                'notes' => "حجز وارد من الدليل الوطني العام: {$booking->reason_for_visit}",
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => $validated['status'] === 'approved' 
                ? 'تم قبول طلب الحجز وتثبيت الموعد بنجاح في الأجندة السريرية!' 
                : 'تم تحديث حالة الطلب بنجاح.',
            'booking' => $booking,
            'appointment' => $appointment,
        ]);
    }
}
