<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Patient;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class GeoClinicMapController extends Controller
{
    /**
     * Standard coordinates for the 58 Algerian Wilayas (Centroids & metadata)
     */
    public static array $wilayasMeta = [
        '01' => ['name_ar' => 'أدرار', 'name_fr' => 'Adrar', 'region' => 'south', 'lat' => 27.8742, 'lng' => -0.2939, 'pop' => 440000],
        '02' => ['name_ar' => 'الشلف', 'name_fr' => 'Chlef', 'region' => 'center', 'lat' => 36.1652, 'lng' => 1.3345, 'pop' => 1100000],
        '03' => ['name_ar' => 'الأغواط', 'name_fr' => 'Laghouat', 'region' => 'high_plateaus', 'lat' => 33.8000, 'lng' => 2.8651, 'pop' => 520000],
        '04' => ['name_ar' => 'أم البواقي', 'name_fr' => 'Oum El Bouaghi', 'region' => 'east', 'lat' => 35.8755, 'lng' => 7.1135, 'pop' => 650000],
        '05' => ['name_ar' => 'باتنة', 'name_fr' => 'Batna', 'region' => 'east', 'lat' => 35.5559, 'lng' => 6.1741, 'pop' => 1250000],
        '06' => ['name_ar' => 'بجاية', 'name_fr' => 'Béjaïa', 'region' => 'east', 'lat' => 36.7559, 'lng' => 5.0843, 'pop' => 980000],
        '07' => ['name_ar' => 'بسكرة', 'name_fr' => 'Biskra', 'region' => 'high_plateaus', 'lat' => 34.8504, 'lng' => 5.7280, 'pop' => 780000],
        '08' => ['name_ar' => 'بشار', 'name_fr' => 'Béchar', 'region' => 'south', 'lat' => 31.6167, 'lng' => -2.2167, 'pop' => 310000],
        '09' => ['name_ar' => 'البليدة', 'name_fr' => 'Blida', 'region' => 'center', 'lat' => 36.4700, 'lng' => 2.8300, 'pop' => 1200000],
        '10' => ['name_ar' => 'البويرة', 'name_fr' => 'Bouira', 'region' => 'center', 'lat' => 36.3749, 'lng' => 3.9020, 'pop' => 740000],
        '11' => ['name_ar' => 'تمنراست', 'name_fr' => 'Tamanrasset', 'region' => 'south', 'lat' => 22.7850, 'lng' => 5.5228, 'pop' => 220000],
        '12' => ['name_ar' => 'تبسة', 'name_fr' => 'Tébessa', 'region' => 'east', 'lat' => 35.4042, 'lng' => 8.1242, 'pop' => 690000],
        '13' => ['name_ar' => 'تلمسان', 'name_fr' => 'Tlemcen', 'region' => 'west', 'lat' => 34.8783, 'lng' => -1.3150, 'pop' => 1050000],
        '14' => ['name_ar' => 'تيارت', 'name_fr' => 'Tiaret', 'region' => 'high_plateaus', 'lat' => 35.3710, 'lng' => 1.3170, 'pop' => 880000],
        '15' => ['name_ar' => 'تيزي وزو', 'name_fr' => 'Tizi Ouzou', 'region' => 'center', 'lat' => 36.7118, 'lng' => 4.0459, 'pop' => 1180000],
        '16' => ['name_ar' => 'الجزائر العاصمة', 'name_fr' => 'Alger', 'region' => 'center', 'lat' => 36.7538, 'lng' => 3.0588, 'pop' => 3500000],
        '17' => ['name_ar' => 'الجلفة', 'name_fr' => 'Djelfa', 'region' => 'high_plateaus', 'lat' => 34.6728, 'lng' => 3.2630, 'pop' => 1350000],
        '18' => ['name_ar' => 'جيجل', 'name_fr' => 'Jijel', 'region' => 'east', 'lat' => 36.8206, 'lng' => 5.7667, 'pop' => 680000],
        '19' => ['name_ar' => 'سطيف', 'name_fr' => 'Sétif', 'region' => 'east', 'lat' => 36.1911, 'lng' => 5.4137, 'pop' => 1650000],
        '20' => ['name_ar' => 'سعيدة', 'name_fr' => 'Saïda', 'region' => 'west', 'lat' => 34.8303, 'lng' => 0.1517, 'pop' => 360000],
        '21' => ['name_ar' => 'سكيكدة', 'name_fr' => 'Skikda', 'region' => 'east', 'lat' => 36.8792, 'lng' => 6.9075, 'pop' => 950000],
        '22' => ['name_ar' => 'سيدي بلعباس', 'name_fr' => 'Sidi Bel Abbès', 'region' => 'west', 'lat' => 35.1899, 'lng' => -0.6308, 'pop' => 650000],
        '23' => ['name_ar' => 'عنابة', 'name_fr' => 'Annaba', 'region' => 'east', 'lat' => 36.9000, 'lng' => 7.7667, 'pop' => 720000],
        '24' => ['name_ar' => 'قالمة', 'name_fr' => 'Guelma', 'region' => 'east', 'lat' => 36.4621, 'lng' => 7.4261, 'pop' => 510000],
        '25' => ['name_ar' => 'قسنطينة', 'name_fr' => 'Constantine', 'region' => 'east', 'lat' => 36.3650, 'lng' => 6.6147, 'pop' => 1100000],
        '26' => ['name_ar' => 'المدية', 'name_fr' => 'Médéa', 'region' => 'center', 'lat' => 36.2642, 'lng' => 2.7539, 'pop' => 890000],
        '27' => ['name_ar' => 'مستغانم', 'name_fr' => 'Mostaganem', 'region' => 'west', 'lat' => 35.9312, 'lng' => 0.0892, 'pop' => 800000],
        '28' => ['name_ar' => 'المسيلة', 'name_fr' => 'M\'Sila', 'region' => 'high_plateaus', 'lat' => 35.7058, 'lng' => 4.5419, 'pop' => 1100000],
        '29' => ['name_ar' => 'معسكر', 'name_fr' => 'Mascara', 'region' => 'west', 'lat' => 35.3967, 'lng' => 0.1403, 'pop' => 840000],
        '30' => ['name_ar' => 'ورقلة', 'name_fr' => 'Ouargla', 'region' => 'south', 'lat' => 31.9493, 'lng' => 5.3250, 'pop' => 620000],
        '31' => ['name_ar' => 'وهران', 'name_fr' => 'Oran', 'region' => 'west', 'lat' => 35.6987, 'lng' => -0.6349, 'pop' => 1800000],
        '32' => ['name_ar' => 'البيض', 'name_fr' => 'El Bayadh', 'region' => 'high_plateaus', 'lat' => 33.6832, 'lng' => 1.0193, 'pop' => 300000],
        '33' => ['name_ar' => 'إليزي', 'name_fr' => 'Illizi', 'region' => 'south', 'lat' => 26.4833, 'lng' => 8.4667, 'pop' => 60000],
        '34' => ['name_ar' => 'برج بوعريريج', 'name_fr' => 'Bordj Bou Arreridj', 'region' => 'high_plateaus', 'lat' => 36.0732, 'lng' => 4.7611, 'pop' => 700000],
        '35' => ['name_ar' => 'بومرداس', 'name_fr' => 'Boumerdès', 'region' => 'center', 'lat' => 36.7667, 'lng' => 3.4772, 'pop' => 880000],
        '36' => ['name_ar' => 'الطارف', 'name_fr' => 'El Tarf', 'region' => 'east', 'lat' => 36.7672, 'lng' => 8.3139, 'pop' => 440000],
        '37' => ['name_ar' => 'تندوف', 'name_fr' => 'Tindouf', 'region' => 'south', 'lat' => 27.6761, 'lng' => -8.1478, 'pop' => 65000],
        '38' => ['name_ar' => 'تسمسيلت', 'name_fr' => 'Tissemsilt', 'region' => 'high_plateaus', 'lat' => 35.6072, 'lng' => 1.8108, 'pop' => 320000],
        '39' => ['name_ar' => 'الوادي', 'name_fr' => 'El Oued', 'region' => 'south', 'lat' => 33.3683, 'lng' => 6.8675, 'pop' => 740000],
        '40' => ['name_ar' => 'خنشلة', 'name_fr' => 'Khenchela', 'region' => 'east', 'lat' => 35.4358, 'lng' => 7.1433, 'pop' => 420000],
        '41' => ['name_ar' => 'سوق أهراس', 'name_fr' => 'Souk Ahras', 'region' => 'east', 'lat' => 36.2864, 'lng' => 7.9511, 'pop' => 470000],
        '42' => ['name_ar' => 'تيبازة', 'name_fr' => 'Tipaza', 'region' => 'center', 'lat' => 36.5897, 'lng' => 2.4475, 'pop' => 650000],
        '43' => ['name_ar' => 'ميلة', 'name_fr' => 'Mila', 'region' => 'east', 'lat' => 36.4503, 'lng' => 6.2644, 'pop' => 820000],
        '44' => ['name_ar' => 'عين الدفلى', 'name_fr' => 'Aïn Defla', 'region' => 'center', 'lat' => 36.2644, 'lng' => 1.9678, 'pop' => 830000],
        '45' => ['name_ar' => 'النعامة', 'name_fr' => 'Naâma', 'region' => 'high_plateaus', 'lat' => 33.2667, 'lng' => -0.3167, 'pop' => 230000],
        '46' => ['name_ar' => 'عين تموشنت', 'name_fr' => 'Aïn Témouchent', 'region' => 'west', 'lat' => 35.2975, 'lng' => -1.1403, 'pop' => 400000],
        '47' => ['name_ar' => 'غرداية', 'name_fr' => 'Ghardaïa', 'region' => 'south', 'lat' => 32.4909, 'lng' => 3.6736, 'pop' => 410000],
        '48' => ['name_ar' => 'غليزان', 'name_fr' => 'Relizane', 'region' => 'west', 'lat' => 35.7372, 'lng' => 0.5558, 'pop' => 790000],
        '49' => ['name_ar' => 'تيميمون', 'name_fr' => 'Timimoun', 'region' => 'south', 'lat' => 29.2639, 'lng' => 0.2311, 'pop' => 130000],
        '50' => ['name_ar' => 'برج باجي مختار', 'name_fr' => 'Bordj Badji Mokhtar', 'region' => 'south', 'lat' => 21.3278, 'lng' => 0.9542, 'pop' => 30000],
        '51' => ['name_ar' => 'أولاد جلال', 'name_fr' => 'Ouled Djellal', 'region' => 'high_plateaus', 'lat' => 34.4333, 'lng' => 5.0667, 'pop' => 180000],
        '52' => ['name_ar' => 'بني عباس', 'name_fr' => 'Béni Abbès', 'region' => 'south', 'lat' => 30.1333, 'lng' => -2.1667, 'pop' => 55000],
        '53' => ['name_ar' => 'عين صالح', 'name_fr' => 'In Salah', 'region' => 'south', 'lat' => 27.2000, 'lng' => 2.4667, 'pop' => 60000],
        '54' => ['name_ar' => 'عين قزام', 'name_fr' => 'In Guezzam', 'region' => 'south', 'lat' => 19.5667, 'lng' => 5.7667, 'pop' => 25000],
        '55' => ['name_ar' => 'تقرت', 'name_fr' => 'Touggourt', 'region' => 'south', 'lat' => 33.1053, 'lng' => 6.0578, 'pop' => 270000],
        '56' => ['name_ar' => 'جانت', 'name_fr' => 'Djanet', 'region' => 'south', 'lat' => 24.5539, 'lng' => 9.4847, 'pop' => 25000],
        '57' => ['name_ar' => 'المغير', 'name_fr' => 'El M\'Ghair', 'region' => 'south', 'lat' => 33.9500, 'lng' => 5.9167, 'pop' => 170000],
        '58' => ['name_ar' => 'المنيعة', 'name_fr' => 'El Meniaa', 'region' => 'south', 'lat' => 30.5833, 'lng' => 2.8833, 'pop' => 85000],
    ];

    protected function authorizeSuperAdmin(): ?User
    {
        $user = Auth::guard('sanctum')->user() ?: Auth::user() ?: request()->user();

        if (!$user) {
            $token = request()->bearerToken();
            if ($token) {
                $pat = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                if ($pat && $pat->tokenable) {
                    $user = $pat->tokenable;
                }
            }
        }

        if ($user) {
            $isSuper = (bool)$user->is_super_admin 
                || in_array($user->role, ['superadmin', 'super_admin', 'super_owner'])
                || in_array($user->admin_role ?? '', ['super_owner', 'support_agent'])
                || (method_exists($user, 'isSuperadmin') && $user->isSuperadmin());

            if (!$isSuper) {
                abort(403, 'غير مصرح لك بالوصول لخريطة انتشار العيادات الجغرافية.');
            }
            return $user;
        }

        return null;
    }

    /**
     * Get Geo-Clinic Map Overview and telemetry.
     * GET /api/super-admin/geo-map/overview
     */
    public function getGeoOverview(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $tenants = Tenant::with(['plan'])->get();

        // Count clinics per Wilaya
        $wilayasSummary = [];
        foreach (self::$wilayasMeta as $code => $meta) {
            $wilayasSummary[$code] = [
                'code' => $code,
                'name_ar' => $meta['name_ar'],
                'name_fr' => $meta['name_fr'],
                'region' => $meta['region'],
                'lat' => $meta['lat'],
                'lng' => $meta['lng'],
                'population' => $meta['pop'],
                'clinics_count' => 0,
                'active_clinics' => 0,
                'trial_clinics' => 0,
                'orthophony_count' => 0,
                'psychology_count' => 0,
                'multidisciplinary_count' => 0,
                'patients_count' => 0,
                'density_level' => 'none',
                'expansion_score' => 0,
            ];
        }

        $clinicsList = [];
        $regionCounts = [
            'center' => 0,
            'east' => 0,
            'west' => 0,
            'high_plateaus' => 0,
            'south' => 0,
        ];

        $specialtyCounts = [
            'orthophony' => 0,
            'psychology' => 0,
            'multidisciplinary' => 0,
        ];

        foreach ($tenants as $t) {
            $owner = User::where('tenant_id', $t->id)->first();
            $patientCount = Patient::where('tenant_id', $t->id)->count();

            // Resolve Wilaya Code
            $wCode = $t->wilaya_code ? str_pad($t->wilaya_code, 2, '0', STR_PAD_LEFT) : null;
            if (!$wCode && !empty($t->wilaya)) {
                // Attempt to match by name
                foreach (self::$wilayasMeta as $code => $meta) {
                    if (str_contains($t->wilaya, $meta['name_ar']) || str_contains($t->wilaya, $meta['name_fr'])) {
                        $wCode = $code;
                        break;
                    }
                }
            }

            // Fallback coordinates if missing
            $lat = $t->latitude;
            $lng = $t->longitude;
            if ((!$lat || !$lng) && $wCode && isset(self::$wilayasMeta[$wCode])) {
                $lat = self::$wilayasMeta[$wCode]['lat'];
                $lng = self::$wilayasMeta[$wCode]['lng'];
            }

            $clinicType = $t->type ?: 'multidisciplinary';
            if (str_contains($clinicType, 'ortho')) {
                $clinicType = 'orthophony';
            } elseif (str_contains($clinicType, 'psycho')) {
                $clinicType = 'psychology';
            } else {
                $clinicType = 'multidisciplinary';
            }

            if (isset($specialtyCounts[$clinicType])) {
                $specialtyCounts[$clinicType]++;
            }

            if ($wCode && isset($wilayasSummary[$wCode])) {
                $wilayasSummary[$wCode]['clinics_count']++;
                if ($t->status === 'active') {
                    $wilayasSummary[$wCode]['active_clinics']++;
                } else {
                    $wilayasSummary[$wCode]['trial_clinics']++;
                }
                $wilayasSummary[$wCode][$clinicType . '_count']++;
                $wilayasSummary[$wCode]['patients_count'] += $patientCount;

                $reg = $wilayasSummary[$wCode]['region'];
                if (isset($regionCounts[$reg])) {
                    $regionCounts[$reg]++;
                }
            }

            $clinicsList[] = [
                'id' => $t->id,
                'name' => $t->name,
                'subdomain' => $t->subdomain,
                'type' => $clinicType,
                'type_label_ar' => $clinicType === 'orthophony' ? 'أرطوفونيا' : ($clinicType === 'psychology' ? 'علم النفس' : 'متعدد التخصصات'),
                'wilaya' => $t->wilaya ?: ($wCode ? self::$wilayasMeta[$wCode]['name_ar'] : 'غير محدد'),
                'wilaya_code' => $wCode ?: '16',
                'commune' => $t->commune ?: 'المركز',
                'address' => $t->address ?: ($t->wilaya ? 'ولاية ' . $t->wilaya : 'الجزائر'),
                'phone' => $t->phone ?: ($owner?->phone ?: '--'),
                'doctor_name' => $owner?->name ?: 'طبيب العيادة',
                'doctor_email' => $owner?->email ?: '--',
                'status' => $t->status ?: 'trial',
                'latitude' => $lat,
                'longitude' => $lng,
                'patients_count' => $patientCount,
                'plan_name' => $t->custom_plan_name ?: ($t->plan?->name_ar ?: 'الخطة السريرية'),
                'created_at' => $t->created_at ? $t->created_at->format('Y-m-d') : null,
            ];
        }

        // Calculate density & White Spaces (Expansion Opportunities)
        $coveredWilayasCount = 0;
        $topWilayaCode = '16';
        $topWilayaClinics = 0;
        $whiteSpaces = [];

        foreach ($wilayasSummary as $code => &$ws) {
            $cnt = $ws['clinics_count'];
            if ($cnt > 0) {
                $coveredWilayasCount++;
                if ($cnt >= 4) {
                    $ws['density_level'] = 'high';
                } elseif ($cnt >= 2) {
                    $ws['density_level'] = 'medium';
                } else {
                    $ws['density_level'] = 'low';
                }

                if ($cnt > $topWilayaClinics) {
                    $topWilayaClinics = $cnt;
                    $topWilayaCode = $code;
                }
            } else {
                $ws['density_level'] = 'none';
                // High population + 0 clinics = High expansion opportunity!
                $score = round($ws['population'] / 100000);
                $ws['expansion_score'] = $score;

                $whiteSpaces[] = [
                    'code' => $code,
                    'name_ar' => $ws['name_ar'],
                    'name_fr' => $ws['name_fr'],
                    'region' => $ws['region'],
                    'population' => $ws['population'],
                    'expansion_score' => $score,
                    'priority' => $ws['population'] > 1000000 ? 'عالية جداً (كثافة سكانية)' : ($ws['population'] > 600000 ? 'أولوية مرتفعة' : 'أولوية متوسطة'),
                ];
            }
        }
        unset($ws);

        // Sort white spaces by population descending
        usort($whiteSpaces, fn($a, $b) => $b['population'] <=> $a['population']);

        $totalWilayas = 58;
        $coveragePct = round(($coveredWilayasCount / $totalWilayas) * 100, 1);

        return response()->json([
            'success' => true,
            'national_stats' => [
                'total_clinics' => $tenants->count(),
                'active_clinics' => $tenants->where('status', 'active')->count(),
                'trial_clinics' => $tenants->where('status', 'trial')->count(),
                'total_wilayas' => $totalWilayas,
                'covered_wilayas' => $coveredWilayasCount,
                'coverage_pct' => $coveragePct,
                'white_spaces_count' => $totalWilayas - $coveredWilayasCount,
                'top_wilaya' => [
                    'code' => $topWilayaCode,
                    'name_ar' => self::$wilayasMeta[$topWilayaCode]['name_ar'] ?? 'الجزائر العاصمة',
                    'clinics_count' => $topWilayaClinics,
                ],
                'region_distribution' => [
                    'center' => [
                        'name_ar' => 'الشمال والوسط',
                        'count' => $regionCounts['center'],
                        'pct' => $tenants->count() > 0 ? round(($regionCounts['center'] / $tenants->count()) * 100) : 0,
                    ],
                    'east' => [
                        'name_ar' => 'الشرق الجزائري',
                        'count' => $regionCounts['east'],
                        'pct' => $tenants->count() > 0 ? round(($regionCounts['east'] / $tenants->count()) * 100) : 0,
                    ],
                    'west' => [
                        'name_ar' => 'الغرب والوهراني',
                        'count' => $regionCounts['west'],
                        'pct' => $tenants->count() > 0 ? round(($regionCounts['west'] / $tenants->count()) * 100) : 0,
                    ],
                    'high_plateaus' => [
                        'name_ar' => 'الهضاب العليا',
                        'count' => $regionCounts['high_plateaus'],
                        'pct' => $tenants->count() > 0 ? round(($regionCounts['high_plateaus'] / $tenants->count()) * 100) : 0,
                    ],
                    'south' => [
                        'name_ar' => 'الجنوب الكبير',
                        'count' => $regionCounts['south'],
                        'pct' => $tenants->count() > 0 ? round(($regionCounts['south'] / $tenants->count()) * 100) : 0,
                    ],
                ],
                'specialty_distribution' => $specialtyCounts,
            ],
            'wilayas' => array_values($wilayasSummary),
            'clinics' => $clinicsList,
            'white_spaces' => array_slice($whiteSpaces, 0, 10),
        ]);
    }

    /**
     * Update clinic geolocation and coordinates.
     * POST /api/super-admin/geo-map/clinics/{id}/location
     */
    public function updateClinicLocation(Request $request, string $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'wilaya' => 'required|string|max:100',
            'wilaya_code' => 'required|string|max:10',
            'commune' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        // If coordinates omitted, autofill from Wilaya centroid
        $wCode = str_pad($validated['wilaya_code'], 2, '0', STR_PAD_LEFT);
        if ((empty($validated['latitude']) || empty($validated['longitude'])) && isset(self::$wilayasMeta[$wCode])) {
            $validated['latitude'] = self::$wilayasMeta[$wCode]['lat'];
            $validated['longitude'] = self::$wilayasMeta[$wCode]['lng'];
        }

        $tenant->update([
            'wilaya' => $validated['wilaya'],
            'wilaya_code' => $wCode,
            'commune' => $validated['commune'] ?? $tenant->commune,
            'address' => $validated['address'] ?? $tenant->address,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
        ]);

        AuditLogger::log(
            'clinic.geo_updated',
            "قام المشرف العام بتحديث الموقع الجغرافي لعيادة: \"{$tenant->name}\" (ولاية: {$tenant->wilaya} [{$wCode}])",
            'info',
            'Tenant',
            $tenant->id,
            [
                'wilaya' => $tenant->wilaya,
                'wilaya_code' => $tenant->wilaya_code,
                'commune' => $tenant->commune,
                'coordinates' => "{$tenant->latitude}, {$tenant->longitude}",
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الموقع الجغرافي وإحداثيات العيادة بنجاح!',
            'clinic' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'wilaya' => $tenant->wilaya,
                'wilaya_code' => $tenant->wilaya_code,
                'commune' => $tenant->commune,
                'address' => $tenant->address,
                'latitude' => $tenant->latitude,
                'longitude' => $tenant->longitude,
            ],
        ]);
    }

    /**
     * Auto geocode all clinics missing coordinates based on Wilaya centroids.
     * POST /api/super-admin/geo-map/auto-geocode
     */
    public function autoGeocodeClinics(): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $tenants = Tenant::whereNull('latitude')->orWhereNull('longitude')->get();
        $updatedCount = 0;

        foreach ($tenants as $t) {
            $wCode = $t->wilaya_code ? str_pad($t->wilaya_code, 2, '0', STR_PAD_LEFT) : '16';
            if (isset(self::$wilayasMeta[$wCode])) {
                $meta = self::$wilayasMeta[$wCode];
                $t->update([
                    'wilaya' => $t->wilaya ?: $meta['name_ar'],
                    'wilaya_code' => $wCode,
                    'latitude' => $meta['lat'],
                    'longitude' => $meta['lng'],
                ]);
                $updatedCount++;
            }
        }

        if ($updatedCount > 0) {
            AuditLogger::log(
                'clinic.batch_geocoded',
                "تمت المعايرة الجغرافية التلقائية لـ {$updatedCount} عيادة طبية بنجاح.",
                'info',
                'Tenant'
            );
        }

        return response()->json([
            'success' => true,
            'message' => "تم ضبط الإحداثيات الجغرافية لـ {$updatedCount} عيادة تلقائياً بنجاح.",
            'updated_count' => $updatedCount,
        ]);
    }
}
