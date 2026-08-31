<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ClinicalTestController extends Controller
{
    /**
     * Get list of standardized clinical tests and diagnostic scales
     */
    public function index()
    {
        $tests = [
            [
                'id'            => 'arabic_articulation_pcc',
                'title'         => 'رائز الفحص النطقي العربي المعياري (PCC)',
                'category'      => 'orthophonie',
                'category_name' => 'تقويم النطق والتخاطب',
                'duration'      => '20-30 دقيقة',
                'target_age'    => '3 سنوات فما فوق',
                'norm_standard' => 'المعيار الصوتي العربي / الجزائري',
                'badge'         => 'معتمد رسمياً',
                'questions_count' => 28,
            ],
            [
                'id'            => 'cars_2_autism',
                'title'         => 'مقياس تقدير التوحد الطفولي (CARS-2)',
                'category'      => 'autism',
                'category_name' => 'طيف التوحد والنمو',
                'duration'      => '30-45 دقيقة',
                'target_age'    => 'سنتان فما فوق',
                'norm_standard' => 'Childhood Autism Rating Scale (CARS-2-ST)',
                'badge'         => 'المعيار الذهبي',
                'questions_count' => 15,
            ],
            [
                'id'            => 'bdi_2_depression',
                'title'         => 'مقياس بيك للاكتئاب السريري (BDI-II)',
                'category'      => 'psychology',
                'category_name' => 'العيادة النفسية للبالغين والمراهقين',
                'duration'      => '10-15 دقيقة',
                'target_age'    => '13 سنة فما فوق',
                'norm_standard' => 'Beck Depression Inventory (BDI-II)',
                'badge'         => 'مقنن دولياً',
                'questions_count' => 21,
            ],
            [
                'id'            => 'conners_3_adhd',
                'title'         => 'مقياس كونرز لفرط الحركة وتشتت الانتباه (Conners-3)',
                'category'      => 'psychology',
                'category_name' => 'صعوبات التعلم والانتباه',
                'duration'      => '20 دقيقة',
                'target_age'    => '6 - 18 سنة',
                'norm_standard' => 'Conners 3rd Edition',
                'badge'         => 'ADHD تشخيص',
                'questions_count' => 24,
            ],
            [
                'id'            => 'ssi_4_stuttering',
                'title'         => 'مقياس اضطراب طلاقة الكلام والتأتأة (SSI-4)',
                'category'      => 'orthophonie',
                'category_name' => 'تقويم النطق والتخاطب',
                'duration'      => '25 دقيقة',
                'target_age'    => 'أطفال وبالغين',
                'norm_standard' => 'Stuttering Severity Instrument (SSI-4)',
                'badge'         => 'الطلاقة الكلامية',
                'questions_count' => 12,
            ],
            [
                'id'            => 'dyslexia_battery',
                'title'         => 'بطارية عسر القراءة وصعوبات التعلم النمائية',
                'category'      => 'learning_disabilities',
                'category_name' => 'صعوبات التعلم والتأهيل المعرفي',
                'duration'      => '35 دقيقة',
                'target_age'    => '6 - 12 سنة',
                'norm_standard' => 'المعيار المعرفي الفونولوجي',
                'badge'         => 'ديسليكسيا',
                'questions_count' => 18,
            ]
        ];

        return response()->json([
            'status' => 'success',
            'total'  => count($tests),
            'tests'  => $tests,
            'data'   => $tests
        ]);
    }
}
