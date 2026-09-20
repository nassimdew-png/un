# 🤖 AGENTS.md — دليل وتوجيهات الوكلاء الذكيين (AI Coding Agent Guidelines)

> **وثيقة التوجيهات الهندسية والسريرية الإلزامية للمشروع (PsyPro / ClinicSaaS)**  
> يُلزم جميع الوكلاء الذكيين (AI Coding Assistants مثل Antigravity, Claude, Cursor, Gemini) بقراءة هذه التوجيهات واتباعها بدقة قبل إجراء أي تعديل أو كتابة كود جديد.

---

## 1. فلسفة المشروع والهوية السريرية (Clinical & Design Principles)

1. **طبيعة المنصة (Medical-Grade Clinical EHR & Cockpit)**:
   - المنصة مخصصة للأطباء النفسانيين، أخصائيي الأرطوفونيا والتخاطب، وأخصائيي التأهيل الحركي.
   - **ممنوع منعاً باتاً** إدراج ألعاب كرتونية، دمى، أو أوضاع طفولية غير طبية داخل واجهة الجلسة أو السجلات السريرية (تم حذف مسرح الطفل وبطاقات التخاطب بقرار المستخدم ويجب عدم إعادتها).
   - المعايير السريرية المعتمدة هي: التوثيق الطبي المنهجي (SOAP Notes)، المقاييس المعيارية (Psychometrics)، سجلات إعادة الهيكلة المعرفية (CBT)، مقياس الضيق (SUDS)، ومصفوفة الفحص الفونولوجي والحركي.

2. **الهوية البصرية ودعم اللغة العربية (RTL First & Zen Aesthetics)**:
   - الواجهة الأساسية تدعم اللغة العربية من اليمين إلى اليسار (RTL) بشكل أصيل.
   - يجب الحفاظ على لوحة ألوان طبية هادئة (Slate Dark / Clean Emerald / Teal / Indigo / Violet) بتباين ناعم يمنع إجهاد عين المعالج أثناء الجلسات الطويلة.
   - استخدام بطاقات زجاجية ناعمة (`backdrop-blur-md border border-slate-800`).

---

## 2. ميثاق الحفاظ على استقرار النظام (Core Architectural Safeguards)

### ⚠️ قواعد إلزامية لتجنب أي أخطاء أو انتكاسات (Zero-Regression Rules):

#### أ. قمرة الجلسة السريرية المباشرة (`ActiveConsultationWorkspace.jsx`):
- تعتمد على **المسار السريري المتسلسل من 4 خطوات (4-Step Guided Flow)**:
  - `1️⃣ الاستقبال والمزاج (Accueil & Baseline)`
  - `2️⃣ التدخل والبروتوكولات (Interventions & Tools)`
  - `3️⃣ التوثيق السريري الذكي (SOAP Notes & Scribe)`
  - `4️⃣ الإنهاء والإحالات والفوترة (Closure, Referrals & Billing)`
- **الميقاتية الحية (Stopwatch)** يجب أن تظل مستمرة عبر جميع المراحل دون انقطاع أو تصفير تلقائي.
- **أهداف الخطة العلاجية الفردية (PEI Goals)** يجب أن تتغير ديناميكياً مع اختيار التخصص (`DEFAULT_PEI_GOALS_BY_SPECIALTY`)، مع تمكين المعالج من إضافة هدف مخصص.

#### ب. محرك المقاييس والاختبارات الرقمية المعيارية الـ 18:
- بنك الأسئلة المركزي موجود في: [`frontend/src/components/therapy/PsychologicalQuestionsData.js`](file:///e:/3/frontend/src/components/therapy/PsychologicalQuestionsData.js).
- كود المقياس وحسابه يجب أن يظل متطابقاً بين:
  1. نافذة التمرير المباشر للمعالج: `InteractiveTestPassationModal.jsx`
  2. بوابة المريض الذاتية: `PatientTestPortalView.jsx`
  3. محرر السوبر أدمن البصري: `AssessmentsCatalogManagerTab.jsx`
  4. وحدة المعالجة الخلفية: `ClinicalTestAssignmentController.php`
- **تنبيهات الأمان السريري (Red Alerts)**: بنود إيذاء النفس أو الأفكار الانتحارية (مثل البند 9 في BDI-II و PHQ-9) تعتبر خطاً أحمر؛ يجب فحصها دائماً عند استقبال أي استجابة ووسم السجل فوراً بـ `🚨 [تنبيه أمان سريري عاجل - RED ALERT]`.

#### ج. قمرة الأجندة والمواعيد السريرية (`Appointments.jsx` & `AppointmentModal.jsx`):
- يجب الحفاظ على **زوايا الرؤية الـ 4** (جدول الحصص بالساعة Timeline، شبكة الأسبوع، التقويم الشهري، والقائمة).
- الربط المباشر مع `ActiveConsultationWorkspace`: لا تحذف زر "بدء الجلسة السريرية" أو آليات إطلاق الجلسة المباشرة بملء الشاشة مع الميقاتية.
- كشف التعارضات التلقائي (Conflict Detection) وجدولة الحصص المتكررة أسبوعياً (Recurrence) جزء أساسي من تجربة المعالج.
- الحفاظ على تكامل قاعة الانتظار وبورن الـ PIN ورسائل التذكير الرسمية عبر WhatsApp.

#### د. قواعد نزاهة نماذج البيانات والاشتراكات (Model Integrity Rules):
- **قاعدة ذهبية إلزامية**: نموذج باقات وخطط الاشتراك في النظام هو **`App\Models\SubscriptionPlan`**.
  - **ممنوع نهائياً** كتابة `App\Models\Plan` أو `Plan::class`. لا يوجد كلاس بهذا الاسم في المشروع؛ استدعاؤه يؤدي فوراً إلى انهيار الخادم بخطأ: `Fatal error: Class "App\Models\Plan" not found`.
  - العلاقة السليمة في أي نموذج (مثل `Tenant.php`, `DiscountCoupon.php`, `SaasInvoice.php`):
    ```php
    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }
    ```

#### هـ. قواعد الترقيم ونطاق متغيرات React و JSX (Frontend Variable Scoping Rules):
- **ممنوع منعاً باتاً** إدراج إعلانات متغيرات (`const`, `let`, `var`) أو حسابات المصفوفات والترقيم (`paginatedClinics = clinics.slice(...)`) داخل عناصر الـ JSX أو وسط شجرة المكون.
- أي حساب ترقيم أو فلترة أو اشتقاق لحالات البيانات يجب أن يتم حصراً في **جسم الدالة (Component Function Body)** قبل تعليمة `return (...)`.
- تصفير رقم الصفحة (`setCurrentPage(1)`) تلقائياً كلما تغيرت فلاتر البحث أو الولايات أو الحالات.

#### و. قمرة القيادة والسيطرة للسوبر أدمن (SuperAdmin Pro Control Suite):
تتكون لوحة السوبر أدمن (`SuperAdminDashboardView.jsx`) من منظومة متكاملة من التبويبات المربوطة بمتحكمات مخصصة في الباك إند (`backend/app/Http/Controllers/Api/SuperAdmin/`):
1. **قمرة السيطرة السيادية (`sovereign_tower`)**: `SovereignControlTowerController.php` (إدارة الصيانة الشاملة، حجر العيادات، وتعديل الحصص المباشر).
2. **إدارة العيادات والاشتراكات (`clinics`)**: `SuperAdminController.php` (التحكم في العيادات، الترقيم الصارم، الدخول كمسؤول عيادة `Impersonate`، وتعيين/تغيير كلمة سر مسؤول العيادة المباشر مع التوثيق الجنائي في `AuditLogger`).
3. **خريطة انتشار العيادات الوطنية 58 ولاية (`geo_map`)**: `GeoClinicMapController.php` (التوزيع الجغرافي، الإحداثيات، والكثافة الطبية الوطنية).
4. **محرك الكوبونات وبرنامج الإحالات (`coupons`)**: `PromoReferralEngineController.php` (أكواد الخصم، شركاء الإحالة، وعمولات BaridiMob).
5. **دورة الاشتراكات ومطابقة الدفع (`lifecycle`)**: `SubscriptionLifecycleController.php` (أتمتة المطاردة، إيصالات الدفع، وفترات السماح).
6. **قمع تهيئة العيادات والتحويل (`onboarding_funnel`)**: `ClinicOnboardingFunnelController.php` (متابعة الخطوات الـ 6 لتهيئة العيادة).
7. **صحة السيرفر وخدمات PM2 (`telemetry`)**: `ServerTelemetryController.php` (إحصاءات الموارد والعمليات والذاكرة وإعادة التشغيل).
8. **أستوديو توجيه الذكاء وتتبع التكلفة (`ai_routing`)**: `AiRoutingStudioController.php` (مزودو AI، التوجيه الذكي، وميزانيات التكلفة).
9. **مركز البث والإعلانات العامة (`broadcasts`)**: `SystemBroadcastController.php` (إعلانات وشريط التنبيه العام للعيادات).
10. **سجل التدقيق الجنائي والأمني (`audit_logs`)**: `AuditLogController.php` (حظر العناوين المشبوهة وسجل العمليات الحساسة).

---

## 3. بيئتا العمل والنشر السحابي (Staging vs Production Architecture)

يعتمد المشروع نظام البيئتين المنفصلتين لضمان أعلى درجات الاستقرار والموثوقية:

### أ. بيئة التطوير والتجريب (Staging / Dev VPS):
- **IP السيرفر**: `145.223.116.54`
- **النطاق**: `https://psypro.tech` و النطاقات الفرعية `*.psypro.tech`
- **الهدف**: كتابة الكود الجديد، إضافة الميزات، اختبارات الجودة (QA)، تجريب العيادات الوهمية وتعديلات الواجهة وقاعدة البيانات.
- **القاعدة**: كافة التعديلات اليومية وتجارب التطوير تُرفع وتُختبر على هذا السيرفر أولاً.

### ب. بيئة الإنتاج والإطلاق الرسمي (Production Live VPS):
- **IP السيرفر**: `197.140.142.48`
- **النطاق الرسمي**: `https://psysnap.com` و النطاقات الفرعية للعيادات `*.psysnap.com`
- **الهدف**: خدمة الأطباء الحقيقيين، المرضى، الاشتراكات الفعلية، والأداء الحقيقي المشفر بـ SSL.
- **🚨 قاعدة ذهبية إلزامية**: **ممنوع منعاً باتاً** النشر على سيرفر الإنتاج (`197.140.142.48`) إلا بعد اكتمال الميزة وتجربتها بنجاح على سيرفر التجريب والحصول على **موافقة صريحة ومباشرة من المستخدم**.

### ج. المواصفات المشتركة لبيئتي العمل:
- **المفتاح المحلي**: `C:/Users/Nassim/.ssh/id_ed25519_vps`
- **مسار المشروع على السيرفرين**: `/var/www/clinic-saas/`
- **إدارة العمليات (PM2 Processes)**:
  - Process 0: `clinic-backend` (Laravel API - Port 8000)
  - Process 1: `clinic-frontend` (Vite PWA Client - Port 3001)
  - Process 2: `clinic-queue` (Background Workers)
- **بروتوكول النشر**:
  - فك ضغط التحديثات في مسار المشروع.
  - مسح الكاش وبناء الـ Frontend وإعادة تشغيل خدمات PM2 الثلاث والتأكد من أنها `online`.

---

## 4. قائمة الملفات الحرجة التي تتطلب الحذر الشديد (Critical Files Map)

| الملف | الوظيفة | تنبيه أمان |
| :--- | :--- | :--- |
| `frontend/src/components/ActiveConsultationWorkspace.jsx` | قمرة الجلسة المباشرة (4 خطوات) | لا تكسر الميقاتية، SOAP، أو مسار الخطوات. |
| `frontend/src/components/Appointments.jsx` | قمرة الأجندة والمواعيد وقاعة الانتظار | حافظ على زوايا الرؤية الـ 4 وزر إطلاق الجلسة المباشر. |
| `frontend/src/components/AppointmentModal.jsx` | نافذة الجدولة والحجز السريري | حافظ على فحص التعارض والتكرار الأسبوعي وتذكير WhatsApp. |
| `frontend/src/components/super-admin/SuperAdminDashboardView.jsx` | لوحة السوبر أدمن الشاملة والترقيم | حافظ على حساب الترقيم خارج الـ JSX ودعم فلاتر البحث. |
| `backend/app/Models/Tenant.php` | نموذج العيادة المستأجرة | استدعِ دائماً `SubscriptionPlan::class` وتجنب `Plan::class`. |
| `backend/app/Models/SubscriptionPlan.php` | نموذج باقات الاشتراك والأسعار | النموذج المعتمد لجميع العلاقات المالية والاشتراكات. |
| `backend/app/Models/DiscountCoupon.php` | نموذج كوبونات الخصم | يرتبط بـ `SubscriptionPlan::class` عبر `applicable_plan_id`. |
| `frontend/src/components/therapy/PsychologicalQuestionsData.js` | بنك الأسئلة لـ 18 رائزاً معيارياً | حافظ على سلامة الـ JSON ومصطلحات القياس. |
| `frontend/src/components/therapy/InteractiveTestPassationModal.jsx` | نافذة تمرير المقاييس في الجلسة | حافظ على إرجاع `onSaved` لحقن النتيجة في SOAP. |
| `frontend/src/components/super-admin/AssessmentsCatalogManagerTab.jsx` | محرر السوبر أدمن لبنود المقاييس | تأكد من توافق بنية `norms_payload`. |
| `backend/app/Http/Controllers/Api/SuperAdmin/GeoClinicMapController.php` | محرك خريطة العيادات الوطنية (58 ولاية) | حافظ على مصفوفة الإحداثيات وحساب كثافة الولايات. |
| `backend/app/Http/Controllers/Api/SuperAdmin/PromoReferralEngineController.php` | محرك الكوبونات والإحالات | تأكد من جلب العلاقات مع `SubscriptionPlan`. |
| `backend/app/Http/Controllers/Api/ClinicalTestAssignmentController.php` | معالج تكليف المقاييس والبوابة | احذر من تعطيل فحص Red Alert. |
| `backend/app/Http/Controllers/Api/AppointmentController.php` | معالج المواعيد والجلسات والتذكيرات | حافظ على دعم تكرار الحصص وكشف التعارضات وإحصاءات الانتظار. |
| `frontend/src/components/assessments/MasterBilanBuilderModal.jsx` | محرر ومولد الحصيلة السريرية الرسمية | حافظ على تكامل المقاييس الـ 18 وأهداف PEI والتوليد العربي. |
| `backend/app/Http/Controllers/Api/ClinicalAssessmentCatalogController.php` | معالج الحصائل وخدمة الـ PDF وتشكيل النصوص | حافظ على دعم ArPHP وتشكيل الخطوط وتنبيهات Red Alert. |

---

## 5. بروتوكول التحقق قبل إنهاء المهمة (Checklist Before Turn Completion)

1. [ ] التأكد من خلو ملفات JavaScript المعدلة من أي أخطاء تركيبية (Syntax Errors).
2. [ ] التأكد من أن التعديل يحترم اللغة العربية واتجاه RTL.
3. [ ] التأكد من عدم استخدام الكلاس غير الموجود `App\Models\Plan` واستخدام `SubscriptionPlan` بدلاً منه.
4. [ ] التأكد من عدم إدراج إعلانات متغيرات `const` داخل بنية الـ JSX.
5. [ ] التأكد من بناء الفرونت إند بنجاح عبر `npm run build` على السيرفر بدون أي كسر للحزم.
6. [ ] التأكد من تنظيف كاش لارفيل بعد تعديل المسارات أو النماذج (`php artisan optimize:clear`).
7. [ ] التأكد من أن خدمات PM2 الثلاث (`backend`, `frontend`, `queue`) تعمل بشكل مستقر (`online`).
8. [ ] تحديث وثائق المشروع (`scaffold.md`, `ARCHITECTURE.md`, `README.md`, `walkthrough.md`) فور أي تغيير جوهري.

