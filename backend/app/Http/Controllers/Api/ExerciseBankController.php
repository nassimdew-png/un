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

class ExerciseBankController extends Controller
{
    /**
     * Rich pre-seeded clinical library across all clinical categories
     */
    protected function getPreSeededExercises(): array
    {
        return [
            // 1. 🗣️ تمارين مخارج الأصوات والنطق (Articulation & Speech)
            [
                'id'                => 'art_01',
                'title'             => 'تثبيت وتصحيح مخرج صوت الراء (R)',
                'category'          => 'articulation',
                'specialty'         => 'orthophonie',
                'disorder_type'     => 'speech',
                'target_age'        => '3-6',
                'difficulty'        => 'medium',
                'pages_count'       => 8,
                'duration_minutes'  => 15,
                'sound_letter'      => 'ر',
                'sound_positions'   => [
                    'initial' => ['رَأْس', 'رِجْل', 'رُمَّان', 'رَمْل', 'رَبِيع'],
                    'medial'  => ['قَمَر', 'كُرَة', 'مِرْآة', 'قِطَار', 'جَرَس'],
                    'final'   => ['نَهْر', 'بَحْر', 'سُور', 'طَيْر', 'زَهْر']
                ],
                'description'       => 'بطاقات تفاعلية لتمارين اللسان ورفع طرف اللسان مع إصدار صوت الاهتزاز والتدريب على وضعيات الحرف (أول، وسط، وآخر الكلمة).',
                'clinical_goals'    => [
                    'رفع طرف اللسان خلف القواطع العليا بدون ملامسة الشفاه',
                    'نطق حرف الراء في الكلمات البسيطة بدقة 80%+',
                    'التمييز السمعي بين الراء واللام والواو'
                ],
                'instructions'      => 'يتم التدريب على 5 تكرارات لكل كلمة مع استخدام المرآة والتعزيز الإيجابي.',
                'thumbnail_url'     => 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80',
                'interactive_steps' => [
                    ['step' => 1, 'name' => 'تمارين حركة اللسان (Lingual Elevation)', 'guide' => 'رفع اللسان إلى سقف الحلق 10 مرات متتالية.'],
                    ['step' => 2, 'name' => 'الصوت المعزول (Isolated /r/)', 'guide' => 'إصدار صوت المحرك (Trrrrr) مع تيار هوائي زفيري قوي.'],
                    ['step' => 3, 'name' => 'المقاطع الصوتية (رَا - رُو - رِي)', 'guide' => 'تكرار المقاطع المفتوحة والمضمومة والمكسورة.'],
                    ['step' => 4, 'name' => 'الكلمات في بداية ووسط ونهاية الجمل', 'guide' => 'رَكِبَ رَامِي القِطَارَ السَّرِيع.']
                ],
                'assigned_count'    => 142,
                'rating'            => 4.95,
                'is_featured'       => true
            ],
            [
                'id'                => 'art_02',
                'title'             => 'تصحيح اللدغة في الحروف الصفيرية (السين والصاد والزاي)',
                'category'          => 'articulation',
                'specialty'         => 'orthophonie',
                'disorder_type'     => 'speech',
                'target_age'        => '7-12',
                'difficulty'        => 'easy',
                'pages_count'       => 12,
                'duration_minutes'  => 20,
                'sound_letter'      => 'س',
                'sound_positions'   => [
                    'initial' => ['سَيَّارَة', 'سَمَكَة', 'سَاعَة', 'سُلَحْفَاة'],
                    'medial'  => ['مَسْجِد', 'فُسْتَان', 'عَسَل', 'جِسْر'],
                    'final'   => ['شَمْس', 'خَسّ', 'فَأْس', 'كُرْسِيّ']
                ],
                'description'       => 'علاج اللدغة الأمامية والجانبية لحرف السين عبر ضبط موضع الأسنان ومجرى الهواء المركزي.',
                'clinical_goals'    => [
                    'إبقاء طرف اللسان خلف القواطع السفلية دون خروجه بين الأسنان',
                    'توجيه تيار الهواء على الخط الأوسط للسان',
                    'نطق السين الصافية في الكلمات والجمل'
                ],
                'instructions'      => 'وضع اليد أمام الفم للإحساس ببرودة الهواء المركزي الخارج أثناء إصدار صوت الصفير.',
                'thumbnail_url'     => 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
                'interactive_steps' => [
                    ['step' => 1, 'name' => 'إغلاق الأسنان وابتسامة خفيفة', 'guide' => 'إطباق الأسنان الخفيف مع سحب زوايا الفم للوراء.'],
                    ['step' => 2, 'name' => 'صوت الصفير المستمر (Sssss)', 'guide' => 'إخراج هواء رفيع وبارد مستمر.'],
                    ['step' => 3, 'name' => 'دمج السين مع الحركات القصيرة', 'guide' => 'سَ - سُ - سِ مع بطاقات مصورة.']
                ],
                'assigned_count'    => 118,
                'rating'            => 4.9,
                'is_featured'       => true
            ],

            // 2. 📖 كراسات وأوراق عمل قابلة للطباعة (Printable PDF Worksheets)
            [
                'id'                => 'prn_01',
                'title'             => 'كراس المتاهات وتتبع المسارات لتقوية الإدراك والتآزر البصري الحركي',
                'category'          => 'printable',
                'specialty'         => 'multidisciplinary',
                'disorder_type'     => 'learning_disabilities',
                'target_age'        => '3-6',
                'difficulty'        => 'easy',
                'pages_count'       => 20,
                'duration_minutes'  => 15,
                'description'       => 'أوراق عمل مهيأة للطباعة المباشرة تحتوي على 20 متاهة متدرجة الصعوبة لتدريب الطفل على التحكم بالقلم، التخطيط البصري، والتهيئة للكتابة.',
                'clinical_goals'    => [
                    'تحسين التآزر بين العين واليد وثبات مسكة القلم',
                    'تطوير التخطيط المكاني وتتبع المسارات دون الخروج عن الحدود',
                    'زيادة مدة الجلوس والتركيز المستمر'
                ],
                'instructions'      => 'طباعة ورقة يومياً وتكليف الطفل بتوصيل الشخصية إلى الهدف دون لمس الخطوط السوداء.',
                'thumbnail_url'     => 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=400&q=80',
                'interactive_steps' => [
                    ['step' => 1, 'name' => 'المتاهات المستقيمة والمنحنية', 'guide' => 'توصيل الأرنب إلى الجزرة عبر مسار واسع.'],
                    ['step' => 2, 'name' => 'المتاهات ذات التفرعات البسيطة', 'guide' => 'اختيار الطريق الصحيح وتجاوز العقبات.'],
                    ['step' => 3, 'name' => 'متاهات التحدي الهندسي المتقاطع', 'guide' => 'تتبع المسار الدائري المعقد.']
                ],
                'assigned_count'    => 210,
                'rating'            => 4.98,
                'is_featured'       => true
            ],
            [
                'id'                => 'prn_02',
                'title'             => 'كراس التهيئة للقراءة والتمييز البصري للحروف المتشابهة (ب، ت، ث، ن، ي)',
                'category'          => 'printable',
                'specialty'         => 'orthophonie',
                'disorder_type'     => 'learning_disabilities',
                'target_age'        => '7-12',
                'difficulty'        => 'medium',
                'pages_count'       => 16,
                'duration_minutes'  => 25,
                'description'       => 'أوراق عمل متخصصة لعلاج الخلط البصري وصعوبات القراءة (ديسلكسيا) عبر تلوين النقاط، استخراج الحرف المستهدف، والتمييز الموضعي.',
                'clinical_goals'    => [
                    'التمييز البصري بين أشكال الحروف ذات النقاط المختلفة',
                    'معالجة مشكلة الانعكاس والخلط المكاني في القراءة',
                    'تعزيز الوعي الفونولوجي والربط بين الرسم والصوت'
                ],
                'instructions'      => 'تلوين الحرف المستهدف بلون محدد والبحث عنه داخل شبكة الحروف العشوائية.',
                'thumbnail_url'     => 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=400&q=80',
                'interactive_steps' => [
                    ['step' => 1, 'name' => 'التمييز بين موضع النقاط', 'guide' => 'نقطة تحت (ب) مقابل نقطتين فوق (ت) وثلاث نقاط (ث).'],
                    ['step' => 2, 'name' => 'شطب الدخيل في الكلمات', 'guide' => 'اكتشاف الحرف المختلف في السطر.'],
                    ['step' => 3, 'name' => 'قراءة المقاطع الصوتية المتباينة', 'guide' => 'بَا - تَا - ثَا - نَا - يَا.']
                ],
                'assigned_count'    => 165,
                'rating'            => 4.92,
                'is_featured'       => false
            ],

            // 3. 🧩 القصص الاجتماعية وبطاقات PECS (Social Stories & PECS)
            [
                'id'                => 'pecs_01',
                'title'             => 'بطاقات التواصل البصري PECS (المرحلة الأولى والثانية - الطلب الأساسي)',
                'category'          => 'pecs',
                'specialty'         => 'multidisciplinary',
                'disorder_type'     => 'autism',
                'target_age'        => '3-6',
                'difficulty'        => 'easy',
                'pages_count'       => 24,
                'duration_minutes'  => 30,
                'description'       => 'مجموعة 48 بطاقة بصرية ملونة ومصنفة (الأطعمة، المشروبات، الألعاب، أفعال الروتين) مصممة وفق بروتوكول بيكس للتواصل البديل.',
                'clinical_goals'    => [
                    'المبادرة بالتبادل التواصلي وتسليم الصورة للمدرب للحصول على المعزز',
                    'الانتقال من الصورة المفردة إلى شريط الجملة (أنا أريد + شيء)',
                    'تقليل نوبات الغضب الناتجة عن صعوبة التعبير اللفظي'
                ],
                'instructions'      => 'قص البطاقات وتغليفها حرارياً وتثبيتها بلاصق فيلكرو في دفتر التواصل الخاص بالطفل.',
                'thumbnail_url'     => 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=400&q=80',
                'interactive_steps' => [
                    ['step' => 1, 'name' => 'تبادل البطاقة المفردة', 'guide' => 'الطفل يمسك بطاقة "ماء" ويسلمها في يد الأخصائي.'],
                    ['step' => 2, 'name' => 'زيادة المسافة والبحث عن الدفتر', 'guide' => 'الطفل يتوجه إلى الدفتر ويختار البطاقة بنفسه.'],
                    ['step' => 3, 'name' => 'التمييز بين صورتين (مرغوبة وغير مرغوبة)', 'guide' => 'اختيار اللعبة المفضلة وتجاهل المنديل.']
                ],
                'assigned_count'    => 194,
                'rating'            => 4.97,
                'is_featured'       => true
            ],
            [
                'id'                => 'pecs_02',
                'title'             => 'قصة اجتماعية مصورة: "كيف أنتظر دوري في الفصل والعيادة؟"',
                'category'          => 'pecs',
                'specialty'         => 'psychology',
                'disorder_type'     => 'behavior',
                'target_age'        => '7-12',
                'difficulty'        => 'easy',
                'pages_count'       => 10,
                'duration_minutes'  => 15,
                'description'       => 'قصة اجتماعية مرسومة توضح مفهوم الانتظار، رفع اليد قبل التحدث، واستراتيجيات التهدئة أثناء انتظار الألعاب الجماعية.',
                'clinical_goals'    => [
                    'فهم القواعد الاجتماعية والمشاركة مع الأقران',
                    'تقليل الاندفاعية ومقاطعة الآخرين',
                    'تعلم العد العكسي حتى 10 لتهدئة التوتر أثناء الانتظار'
                ],
                'instructions'      => 'قراءة القصة مع الطفل قبل بدء النشاط الجماعي وتمثيل الأدوار التفاعلية.',
                'thumbnail_url'     => 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&w=400&q=80',
                'interactive_steps' => [
                    ['step' => 1, 'name' => 'قراءة القصة مع ملامسة الصور', 'guide' => 'الربط بين تعبيرات الوجه ومشاعره.'],
                    ['step' => 2, 'name' => 'تمثيل دور الانتظار بالتايمر البصري', 'guide' => 'انتظار رنين الساعة لمدة دقيقتين لنيل الدور.'],
                    ['step' => 3, 'name' => 'منح نجمة التعزيز الفوري', 'guide' => 'إلصاق ملصق بطل الانتظار في لوحة الشرف.']
                ],
                'assigned_count'    => 87,
                'rating'            => 4.89,
                'is_featured'       => false
            ],

            // 4. 🧠 تمارين الانتباه والذاكرة التنفيذية (Executive Functions)
            [
                'id'                => 'exec_01',
                'title'             => 'برنامج تنمية الذاكرة العاملة والتمييز السمعي المتسلسل (Working Memory)',
                'category'          => 'executive',
                'specialty'         => 'psychology',
                'disorder_type'     => 'skills_development',
                'target_age'        => '7-12',
                'difficulty'        => 'advanced',
                'pages_count'       => 18,
                'duration_minutes'  => 20,
                'description'       => 'تمارين إدراكية متدرجة تهدف إلى تدريب الطفل على تذكر متتالية من 3 إلى 6 أرقام أو كلمات وإعادتها بالترتيب المباشر والعكسي.',
                'clinical_goals'    => [
                    'توسيع سعة الذاكرة العاملة اللفظية والمكانية',
                    'تطوير مهارة معالجة واسترجاع المعلومات السمعية في بيئة مشتتة',
                    'تحسين استيعاب التعليمات المركبة متعددة الخطوات'
                ],
                'instructions'      => 'يلقي الأخصائي الأرقام بنبرة هادئة بمعدل رقم كل ثانية ثم يطلب من الطفل تكرارها بالعكس.',
                'thumbnail_url'     => 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=400&q=80',
                'interactive_steps' => [
                    ['step' => 1, 'name' => 'التكرار المباشر للأرقام (3 إلى 5 عناصر)', 'guide' => '7 - 2 - 9 -> الطفل يعيد: 7 - 2 - 9.'],
                    ['step' => 2, 'name' => 'التكرار العكسي (Reverse Recall)', 'guide' => '4 - 1 - 8 -> الطفل يعيد: 8 - 1 - 4.'],
                    ['step' => 3, 'name' => 'تتبع التعليمات الثلاثية المركبة', 'guide' => 'المس أنفك، ثم صفق مرتين، ثم ارفع يدك اليسرى.']
                ],
                'assigned_count'    => 134,
                'rating'            => 4.93,
                'is_featured'       => true
            ],
            [
                'id'                => 'exec_02',
                'title'             => 'مصفوفات التركيز والتحكم الاندفاعي (Go / No-Go Tasks)',
                'category'          => 'executive',
                'specialty'         => 'psychology',
                'disorder_type'     => 'behavior',
                'target_age'        => '7-12',
                'difficulty'        => 'medium',
                'pages_count'       => 14,
                'duration_minutes'  => 15,
                'description'       => 'أنشطة الكف التثبيطي والتحكم في الاستجابة الاندفاعية للأطفال مفرطي الحركة، والتوقف عند ظهور المنبه المحظور.',
                'clinical_goals'    => [
                    'تدريب الفص الجبهي على كبح الاستجابة الحركية المتسرعة',
                    'تقليل أخطاء الاندفاع وسرعة البديهة في التمييز الإدراكي',
                    'تطوير المرونة المعرفية والانتقال بين القواعد المختلفة'
                ],
                'instructions'      => 'الصفق عند رؤية الدائرة الخضراء، والتوقف التام عند ظهور المربع الأحمر.',
                'thumbnail_url'     => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=400&q=80',
                'interactive_steps' => [
                    ['step' => 1, 'name' => 'قاعدة اللون الأخضر والأحمر', 'guide' => 'استجابة سريعة للرمز المسموح وتجميد الحركة للرمز الممنوع.'],
                    ['step' => 2, 'name' => 'عكس القواعد المعرفية (Rule Switching)', 'guide' => 'عندما أقول "نهار" أغمض عينيك، وعندما أقول "ليل" افتحهما.'],
                    ['step' => 3, 'name' => 'تحدي شطب الرموز الموقوت (Stroop Simple)', 'guide' => 'شطب النجوم الصفراء فقط خلال 60 ثانية.']
                ],
                'assigned_count'    => 156,
                'rating'            => 4.91,
                'is_featured'       => false
            ]
        ];
    }

    /**
     * GET /api/exercises
     * List all clinical exercises and workbooks
     */
    public function index(Request $request)
    {
        try {
            $category = $request->query('category', 'all');
            $disorder = $request->query('disorder', 'all');
            $targetAge = $request->query('target_age', 'all');
            $search = $request->query('search', '');

            // Ensure exercises exist in database
            if (ClinicalExercise::count() === 0) {
                foreach ($this->getPreSeededExercises() as $item) {
                    ClinicalExercise::create($item);
                }
            }

            $query = ClinicalExercise::query();

            if ($category && $category !== 'all') {
                $query->where('category', $category);
            }

            if ($disorder && $disorder !== 'all') {
                $query->where('disorder_type', $disorder);
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

            if ($exercises->isEmpty()) {
                $all = $this->getPreSeededExercises();
                $filtered = array_filter($all, function ($item) use ($category, $targetAge, $search) {
                    if ($category !== 'all' && $item['category'] !== $category) return false;
                    if ($targetAge !== 'all' && $item['target_age'] !== $targetAge) return false;
                    if ($search && !str_contains($item['title'], $search) && !str_contains($item['description'], $search)) return false;
                    return true;
                });
                return response()->json([
                    'success'   => true,
                    'total'     => count($filtered),
                    'exercises' => array_values($filtered)
                ]);
            }

            return response()->json([
                'success'   => true,
                'total'     => $exercises->count(),
                'exercises' => $exercises
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success'   => true,
                'total'     => count($this->getPreSeededExercises()),
                'exercises' => $this->getPreSeededExercises()
            ]);
        }
    }

    /**
     * POST /api/exercises/assign-to-patient
     * Assign exercise as homework to a specific patient
     */
    public function assignToPatient(Request $request)
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

            return response()->json([
                'success'  => true,
                'message'  => "تم إسناد \"{$request->exercise_title}\" كواجب منزلي لملف المريض بنجاح مع التوجيهات العلاجية.",
                'assigned' => $assigned
            ], 201);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
