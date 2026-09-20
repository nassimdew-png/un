<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // Geographic coordinates
            if (!Schema::hasColumn('tenants', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('address');
            }
            if (!Schema::hasColumn('tenants', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }

            // Onboarding & Conversion Funnel tracking
            if (!Schema::hasColumn('tenants', 'onboarding_completed_at')) {
                $table->timestamp('onboarding_completed_at')->nullable()->after('onboarding_tour_enabled');
            }
            if (!Schema::hasColumn('tenants', 'onboarding_current_step')) {
                $table->unsignedTinyInteger('onboarding_current_step')->default(1)->after('onboarding_completed_at');
            }
            if (!Schema::hasColumn('tenants', 'onboarding_score')) {
                $table->unsignedTinyInteger('onboarding_score')->default(0)->after('onboarding_current_step');
            }
            if (!Schema::hasColumn('tenants', 'last_onboarding_nudge_at')) {
                $table->timestamp('last_onboarding_nudge_at')->nullable()->after('onboarding_score');
            }
            if (!Schema::hasColumn('tenants', 'last_onboarding_nudge_template')) {
                $table->string('last_onboarding_nudge_template', 50)->nullable()->after('last_onboarding_nudge_at');
            }
        });

        // Seed / backfill realistic Wilayas and Coordinates for existing clinics
        $wilayaPresets = [
            'alger' => [
                'wilaya' => 'الجزائر العاصمة',
                'wilaya_code' => '16',
                'commune' => 'حيدرة',
                'lat' => 36.7538,
                'lng' => 3.0588,
            ],
            'oran' => [
                'wilaya' => 'وهران',
                'wilaya_code' => '31',
                'commune' => 'بئر الجير',
                'lat' => 35.6987,
                'lng' => -0.6349,
            ],
            'constantine' => [
                'wilaya' => 'قسنطينة',
                'wilaya_code' => '25',
                'commune' => 'الخروب',
                'lat' => 36.3650,
                'lng' => 6.6147,
            ],
            'annaba' => [
                'wilaya' => 'عنابة',
                'wilaya_code' => '23',
                'commune' => 'البوني',
                'lat' => 36.9000,
                'lng' => 7.7667,
            ],
            'blida' => [
                'wilaya' => 'البليدة',
                'wilaya_code' => '09',
                'commune' => 'أولاد يعيش',
                'lat' => 36.4700,
                'lng' => 2.8300,
            ],
            'setif' => [
                'wilaya' => 'سطيف',
                'wilaya_code' => '19',
                'commune' => 'العلمة',
                'lat' => 36.1911,
                'lng' => 5.4137,
            ],
            'tlemcen' => [
                'wilaya' => 'تلمسان',
                'wilaya_code' => '13',
                'commune' => 'منصورة',
                'lat' => 34.8783,
                'lng' => -1.3150,
            ],
            'bejaia' => [
                'wilaya' => 'بجاية',
                'wilaya_code' => '06',
                'commune' => 'أقبو',
                'lat' => 36.7559,
                'lng' => 5.0843,
            ],
            'biskra' => [
                'wilaya' => 'بسكرة',
                'wilaya_code' => '07',
                'commune' => 'طولقة',
                'lat' => 34.8504,
                'lng' => 5.7280,
            ],
            'batna' => [
                'wilaya' => 'باتنة',
                'wilaya_code' => '05',
                'commune' => 'عين التوتة',
                'lat' => 35.5559,
                'lng' => 6.1741,
            ],
            'ouargla' => [
                'wilaya' => 'ورقلة',
                'wilaya_code' => '30',
                'commune' => 'حاسي مسعود',
                'lat' => 31.9493,
                'lng' => 5.3250,
            ],
            'tizi_ouzou' => [
                'wilaya' => 'تيزي وزو',
                'wilaya_code' => '15',
                'commune' => 'عزازقة',
                'lat' => 36.7118,
                'lng' => 4.0459,
            ],
        ];

        // Intelligently distribute existing clinics across Algeria
        $tenants = DB::table('tenants')->get();
        $presetKeys = array_keys($wilayaPresets);
        $idx = 0;

        foreach ($tenants as $t) {
            $matchedKey = null;
            $nameLower = mb_strtolower($t->name);

            if (str_contains($nameLower, 'alger') || str_contains($nameLower, 'الجزائر')) {
                $matchedKey = 'alger';
            } elseif (str_contains($nameLower, 'oran') || str_contains($nameLower, 'وهران') || str_contains($nameLower, 'wahran')) {
                $matchedKey = 'oran';
            } elseif (str_contains($nameLower, 'constantine') || str_contains($nameLower, 'قسنطينة')) {
                $matchedKey = 'constantine';
            } elseif (str_contains($nameLower, 'annaba') || str_contains($nameLower, 'عنابة')) {
                $matchedKey = 'annaba';
            }

            if (!$matchedKey) {
                $matchedKey = $presetKeys[$idx % count($presetKeys)];
                $idx++;
            }

            $preset = $wilayaPresets[$matchedKey];

            DB::table('tenants')->where('id', $t->id)->update([
                'wilaya' => $preset['wilaya'],
                'wilaya_code' => $preset['wilaya_code'],
                'commune' => $t->commune ?: $preset['commune'],
                'latitude' => $preset['lat'],
                'longitude' => $preset['lng'],
                'address' => $t->address ?: ($preset['commune'] . '، ولاية ' . $preset['wilaya']),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'latitude',
                'longitude',
                'onboarding_completed_at',
                'onboarding_current_step',
                'onboarding_score',
                'last_onboarding_nudge_at',
                'last_onboarding_nudge_template',
            ]);
        });
    }
};
