<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClinicalExercise;
use App\Models\PatientAssignedExercise;
use App\Models\Tenant;
use App\Models\Patient;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Throwable;

class ExercisesBankController extends Controller
{
    /**
     * Curated standard default clinical library
     */
    protected function getDefaultLibrary(): array
    {
        return [
            [
                'title'             => 'كراس تدريبات مخرج حرف الراء (التثبيت والتعميم في الكلمات والجمل)',
                'category'          => 'articulation',
                'specialty'         => 'orthophonie',
                'target_age'        => '3-6',
                'difficulty'        => 'medium',
                'pages_count'       => 16,
                'duration_minutes'  => 20,
                'description'       => 'برنامج تأهيلي متكامل لتصحيح عيوب نطق حرف الراء (اللدغة الرائية) بدءاً من الصوت المعزول، المقاطع الصوتية القصيرة والطويلة، وصولاً للتعميم في المحادثة العفوية.',
                'clinical_goals'    => [
                    'تقوية عضلة اللسان وتحفيز الاهتزاز في الجزء الأمامي من سقف الحلق الصلب',
                    'نطق حرف الراء في أول الكلمة، وسطها، وآخرها بدقة تفوق 90%',
                    'التمييز السمعي بين الراء واللام والياء والواو'
                ],
                'instructions'      => 'يتم التدريب يومياً لمدة 15 دقيقة أمام المرآة مع استخدام خافض اللسان في المراحل الأولى لتثبيت الوضعية التشريحية الصحيحة.',
                'thumbnail_url'     => 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80',
                'preview_images'    => [
                    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80'
                ],
                'interactive_steps' => [
                    ['step' => 1, 'name' => 'تمارين تحريك اللسان (Motor Exercises)', 'guide' => 'رفع طرف اللسان خلف القواطع العليا 10 مرات متتالية.'],
                    ['step' => 2, 'name' => 'الصوت المعزول مع الاهتزاز', 'guide' => 'إصدار صوت الاهتزاز (Trrrr) مع الزفير القوي.'],
                    ['step' => 3, 'name' => 'تثبيت المقاطع الصوتية (را - رو - ري)', 'guide' => 'تكرار المقاطع مع تشديد حركة الشفتين.'],
                    ['step' => 4, 'name' => 'الكلمات المستهدفة', 'guide' => 'رَأْس، قَمَر، سَيَّارَة، قِطَار، شَجَرَة.']
                ],
                'assigned_count'    => 142,
                'rating'            => 4.95,
                'is_featured'       => true
            ],
            [
                'title'             => 'كراس علاج التأتأة واضطرابات الطلاقة الكلامية (تقنيات الاسترخاء والإيقاع)',
                'category'          => 'stuttering',
                'specialty'         => 'orthophonie',
                'target_age'        => '7-12',
                'difficulty'        => 'advanced',
                'pages_count'       => 24,
                'duration_minutes'  => 30,
                'description'       => 'دليل إكلينيكي متقدم لعلاج التأتأة وحبسات الكلام عند الأطفال واليافعين، يرتكز على ضبط التنفس البطني، البداية السهلة (Easy Onset)، والإطالة الصوتية المرنة.',
                'clinical_goals'    => [
                    'التحكم في التنفس البطني والتوافق التنفسي الصوتي',
                    'تقليل التشنجات الحركية المصاحبة للكلام (رفرفة العين، حركة الرأس)',
                    'اكتساب طلاقة حوارية في مواقف الضغط والمواقف الاجتماعية'
                ],
                'instructions'      => 'تطبيق تقنية البداية اللينة للصوت ومطابقة سرعة الكلام مع الإيقاع البصري الموجه.',
                'thumbnail_url'     => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=400&q=80',
                'preview_images'    => [
                    'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80'
                ],
                'interactive_steps' => [
                    ['step' => 1, 'name' => 'التنفس البطني العميق (Diaphragmatic Breathing)', 'guide' => 'شهيق 4 ثوانٍ - حبس ثانيتين - زفير بطيء 6 ثوانٍ.'],
                    ['step' => 2, 'name' => 'البداية الصوتية اللينة (Soft Onset)', 'guide' => 'بدء نطق حروف العلة بنعومة وتدريج بالشدة.'],
                    ['step' => 3, 'name' => 'القراءة المتناغمة بالإيقاع', 'guide' => 'قراءة جمل متدرجة الطول مع فترات راحة محسوبة.']
                ],
                'assigned_count'    => 98,
                'rating'            => 4.9,
                'is_featured'       => true
            ],
            [
                'title'             => 'أوراق عمل الانتباه البصري والتركيز للأطفال المصابين بـ ADHD',
                'category'          => 'cognitive',
                'specialty'         => 'psychology',
                'target_age'        => '7-12',
                'difficulty'        => 'medium',
                'pages_count'       => 18,
                'duration_minutes'  => 15,
                'description'       => 'سلسلة تمارين إدراكية مصممة لزيادة المدى الانتباهي، تصفية المشتتات البصرية، وتطوير سرعة المعالجة والتحكم الاندفاعي.',
                'clinical_goals'    => [
                    'زيادة مدة التركيز المستمر على المهمة لأكثر من 15 دقيقة متواصلة',
                    'تطوير التمييز البصري بين الأشكال المتشابهة والمتقاربة',
                    'تقليل الاندفاعية في اتخاذ القرار وإتمام المهام'
                ],
                'instructions'      => 'إنجاز صفحة واحدة يومياً في بيئة هادئة مع تسجيل الوقت المستغرق لمتابعة تطور السرعة والدقة.',
                'thumbnail_url'     => 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=400&q=80',
                'preview_images'    => [
                    'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=600&q=80'
                ],
                'interactive_steps' => [
                    ['step' => 1, 'name' => 'تتبع المسارات والمتاهات المعقدة', 'guide' => 'البحث عن المسار دون رفع القلم أو لمس الجدران.'],
                    ['step' => 2, 'name' => 'استخراج الفروق الدقيقة والمصفوفات', 'guide' => 'شطب الأرقام أو الرموز المستهدفة خلال وقت محدد.'],
                    ['step' => 3, 'name' => 'إكمال النمط والتسلسل المنطقي', 'guide' => 'تحديد العنصر المفقود في المتتالية.']
                ],
                'assigned_count'    => 185,
                'rating'            => 4.88,
                'is_featured'       => false
            ],
            [
                'title'             => 'كراس التأخر اللغوي النمائي وبناء الجمل التعبيرية (للأطفال 3-6 سنوات)',
                'category'          => 'workbook',
                'specialty'         => 'orthophonie',
                'target_age'        => '3-6',
                'difficulty'        => 'easy',
                'pages_count'       => 28,
                'duration_minutes'  => 25,
                'description'       => 'كراس تطبيقي شامل بالألوان والرسومات الإيضاحية لإثراء الرصيد اللغوي، تدريب الطفل على تكوين جمل من كلمتين وثلاث كلمات، واستخدام أدوات الربط والضمائر.',
                'clinical_goals'    => [
                    'توسيع الحصيلة اللغوية الاستقبالية والتعبيرية لأكثر من 200 كلمة حية',
                    'بناء تركيب جملي سليم (فاعل + فعل + مفعول به)',
                    'توظيف حروف الجر والصفات والألوان في التعبير اليومي'
                ],
                'instructions'      => 'تفاعل الوالدين والأخصائي مع الصور والقصص القصيرة المتسلسلة لتعزيز التعبير العفوي.',
                'thumbnail_url'     => 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&w=400&q=80',
                'preview_images'    => [
                    'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&w=600&q=80'
                ],
                'interactive_steps' => [
                    ['step' => 1, 'name' => 'التسمية والتعرف على المفردات اليومية', 'guide' => 'تسمية الأطعمة، الحيوانات، وسائل النقل، وأجزاء الجسم.'],
                    ['step' => 2, 'name' => 'تركيب جملة الفعل والفاعل', 'guide' => 'الولد يشرب الماء / البنت ترسم شجرة.'],
                    ['step' => 3, 'name' => 'تسلسل الأحداث وسرد قصة من 3 صور', 'guide' => 'ترتيب الصور وسرد الحكاية بكلمات الطفل الخاصة.']
                ],
                'assigned_count'    => 210,
                'rating'            => 4.98,
                'is_featured'       => true
            ],
            [
                'title'             => 'كراس العلاج المعرفي السلوكي (CBT) لتعديل السلوك وإدارة القلق والمشاعر',
                'category'          => 'psychology',
                'specialty'         => 'psychology',
                'target_age'        => '7-12',
                'difficulty'        => 'medium',
                'pages_count'       => 20,
                'duration_minutes'  => 30,
                'description'       => 'كراس علاجي مبسط للأطفال والمراهقين يهدف إلى التعرف على المشاعر (مقياس مقياس الحرارة الانفعالي)، دحض الأفكار التلقائية السلبية، وجدول التعزيز الإيجابي المنزلي.',
                'clinical_goals'    => [
                    'تسمية المشاعر والتعبير اللفظي الصحيح عن الغضب والقلق والخوف',
                    'ربط العلاقة بين الفكرة، الشعور، والسلوك السلبي',
                    'اكتساب استراتيجيات التهدئة الذاتية وحل المشكلات'
                ],
                'instructions'      => 'يتم العمل عليه في نهاية كل جلسة نفسية وتحديد مهام منزلية بمشاركة الأسرة.',
                'thumbnail_url'     => 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=400&q=80',
                'preview_images'    => [
                    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=600&q=80'
                ],
                'interactive_steps' => [
                    ['step' => 1, 'name' => 'مقياس المشاعر الحراري (Emotion Thermometer)', 'guide' => 'تحديد شدة الشعور من 1 إلى 10.'],
                    ['step' => 2, 'name' => 'صيد الأفكار السلبية واستبدالها', 'guide' => 'تحويل "أنا لا أستطيع" إلى "سأحاول خطوة بخطوة".'],
                    ['step' => 3, 'name' => 'خطة التعزيز والمكافآت السلوكية', 'guide' => 'جمع النقاط اليومية لتحقيق هدف سلوكي متفق عليه.']
                ],
                'assigned_count'    => 115,
                'rating'            => 4.92,
                'is_featured'       => false
            ],
            [
                'title'             => 'برنامج التواصل البصري والوظيفي لأطفال طيف التوحد (PECS & TEACCH)',
                'category'          => 'autism',
                'specialty'         => 'multidisciplinary',
                'target_age'        => '3-6',
                'difficulty'        => 'medium',
                'pages_count'       => 32,
                'duration_minutes'  => 30,
                'description'       => 'بطاقات وجداول مصورة لتأسيس الطلب التواصلي بالصور، زيادة التواصل البصري والمشاركة التفاعلية، والروتين البصري اليومي لتقليل نوبات الغضب.',
                'clinical_goals'    => [
                    'تأسيس المبادرة بالتواصل لطلب الاحتياجات الأساسية بالصور (PECS المرحلة 1 و 2)',
                    'زيادة مدة التواصل البصري والانتباه المشترك مع المدرب',
                    'تنظيم البيئة وفهم الجدول البصري اليومي للأنشطة'
                ],
                'instructions'      => 'استخدام التعزيز المباشر والإيجابي الفوري وتدريب الأسرة على تعميم البطاقات بالمنزل.',
                'thumbnail_url'     => 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=400&q=80',
                'preview_images'    => [
                    'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80'
                ],
                'interactive_steps' => [
                    ['step' => 1, 'name' => 'تبادل الصورة المفردة مقابل المعزز', 'guide' => 'تسليم بطاقة العصير أو اللعبة للحصول عليها.'],
                    ['step' => 2, 'name' => 'شريط الجملة المصورة (أنا أريد + شيء)', 'guide' => 'تركيب جملة الطلب ونزع الشريط وتقديمه للمدرب.'],
                    ['step' => 3, 'name' => 'الجدول البصري للمهام اليومية (First / Then)', 'guide' => 'أولاً: عمل الحروف، ثم: اللعب بالصلصال.']
                ],
                'assigned_count'    => 160,
                'rating'            => 4.96,
                'is_featured'       => true
            ]
        ];
    }

    /**
     * GET /api/exercises/bank
     * List all clinical exercises and workbooks
     */
    public function index(Request $request)
    {
        try {
            $category = $request->query('category', 'all');
            $specialty = $request->query('specialty', 'all');
            $targetAge = $request->query('target_age', 'all');
            $search = $request->query('search', '');

            // Ensure default seeded library in DB
            if (ClinicalExercise::count() === 0) {
                foreach ($this->getDefaultLibrary() as $item) {
                    ClinicalExercise::create($item);
                }
            }

            $query = ClinicalExercise::query();

            if ($category && $category !== 'all') {
                $query->where('category', $category);
            }

            if ($specialty && $specialty !== 'all') {
                $query->where('specialty', $specialty);
            }

            if ($targetAge && $targetAge !== 'all') {
                $query->where('target_age', $targetAge);
            }

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            $exercises = $query->get();

            return response()->json([
                'success'   => true,
                'total'     => $exercises->count(),
                'exercises' => $exercises
            ]);
        } catch (Throwable $e) {
            // Graceful fallback to default library
            return response()->json([
                'success'   => true,
                'total'     => count($this->getDefaultLibrary()),
                'exercises' => $this->getDefaultLibrary()
            ]);
        }
    }

    /**
     * POST /api/exercises/assign
     * Assign an exercise or workbook to a patient
     */
    public function assign(Request $request)
    {
        try {
            $request->validate([
                'patient_id'       => 'required|string',
                'exercise_id'      => 'required|string',
                'exercise_title'   => 'required|string',
                'frequency_weekly' => 'nullable|string',
                'due_date'         => 'nullable|date',
                'therapist_notes'  => 'nullable|string',
            ]);

            $tenant = $request->get('current_tenant');
            $clinicId = (string)($tenant ? ($tenant->_id ?? $tenant->id) : 'elamal');

            $assigned = PatientAssignedExercise::create([
                'clinic_id'           => $clinicId,
                'patient_id'          => $request->patient_id,
                'exercise_id'         => $request->exercise_id,
                'exercise_title'      => $request->exercise_title,
                'specialist_id'       => $request->user() ? (string)$request->user()->_id : null,
                'therapist_notes'     => $request->therapist_notes,
                'frequency_weekly'    => $request->frequency_weekly ?? 'daily',
                'due_date'            => $request->due_date ? Carbon::parse($request->due_date) : Carbon::now()->addDays(14),
                'status'              => 'assigned',
                'progress_percentage' => 0,
            ]);

            // Increment exercise assigned counter
            $ex = ClinicalExercise::find($request->exercise_id);
            if ($ex) {
                $ex->assigned_count = ($ex->assigned_count ?? 0) + 1;
                $ex->save();
            }

            return response()->json([
                'success'  => true,
                'message'  => "تم تعيين \"{$request->exercise_title}\" للمريض بنجاح مع إضافة التعليمات العلاجية.",
                'assigned' => $assigned
            ], 201);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/exercises/categories
     */
    public function categories()
    {
        return response()->json([
            'success'    => true,
            'categories' => [
                ['id' => 'all', 'name' => 'جميع الكراسات والتمارين', 'count' => 150],
                ['id' => 'articulation', 'name' => '🗣️ مخارج الحروف والنطق', 'count' => 45],
                ['id' => 'workbook', 'name' => '📚 كراسات علاجية متكاملة', 'count' => 38],
                ['id' => 'stuttering', 'name' => '🌊 التأتأة والطلاقة الكلامية', 'count' => 22],
                ['id' => 'cognitive', 'name' => '🧩 التأهيل المعرفي وADHD', 'count' => 26],
                ['id' => 'psychology', 'name' => '🧠 العلاج السلوكي والمشاعر', 'count' => 19],
                ['id' => 'autism', 'name' => '🌟 طيف التوحد والتواصل البصري', 'count' => 24],
            ]
        ]);
    }
}
