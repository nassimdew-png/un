<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    /**
     * Complete Clinical & Administrative Permissions Catalog (24 Granular Permissions in 6 Clinical Pillars).
     */
    public const PERMISSIONS_CATALOG = [
        'patients' => [
            'category_name' => 'إدارة المرضى والسجلات الطبية (Patient EHR)',
            'category_icon' => 'Users',
            'items' => [
                'view_patients_all' => [
                    'label' => 'رؤية كافة ملفات مرضى العيادة',
                    'desc' => 'الاطلاع على الملفات الإدارية لجميع المرضى المسجلين بالمركز',
                ],
                'view_patients_assigned' => [
                    'label' => 'رؤية المرضى المخصصين فقط',
                    'desc' => 'حصر الرؤية على الحالات وجداول المواعيد الموكلة للمعالج شخصياً',
                ],
                'create_patients' => [
                    'label' => 'تسجيل وإضافة مرضى جدد',
                    'desc' => 'إضافة ملف مريض جديد وتحديث بيانات الأولياء والهاتف والمدرسة',
                ],
                'edit_patients' => [
                    'label' => 'تعديل السجلات الإدارية للمرضى',
                    'desc' => 'تحديث بطاقة المريض، السوابق العامة، ومعلومات الاتصال',
                ],
                'delete_patients' => [
                    'label' => 'أرشفة وحذف ملفات المرضى',
                    'desc' => 'صلاحية حساسة لحذف أو أرشفة السجلات الطبية للمرضى',
                ],
                'view_medical_confidential' => [
                    'label' => 'الاطلاع على السوابق الطبية والنفسية السرية',
                    'desc' => 'كشف السجل الطبي السري، التشخيص المتقدم، والملاحظات الحساسة',
                ],
            ],
        ],
        'clinical' => [
            'category_name' => 'العمليات السريرية والتشخيص (Clinical Suite & SOAP)',
            'category_icon' => 'Stethoscope',
            'items' => [
                'start_sessions' => [
                    'label' => 'بدء الجلسة السريرية المباشرة والميقاتية',
                    'desc' => 'إطلاق قمرة الجلسة ذات الـ 4 خطوات مع التحكم بالمؤقت الحي والملاحظات',
                ],
                'manage_soap' => [
                    'label' => 'توثيق SOAP والمساعد الصوتي السريري',
                    'desc' => 'كتابة وتعديل ملاحظات SOAP واستخدام مسجل الصوت والتلخيص الذكي',
                ],
                'run_assessments' => [
                    'label' => 'تمرير المقاييس والاختبارات الرقمية الـ 18',
                    'desc' => 'إجراء الروائز المعيارية وحساب النتائج ورادار الخطورة السريرية وتنبيهات الأمان',
                ],
                'generate_bilans' => [
                    'label' => 'توليد واعتماد الحصائل السريرية (Master Bilan)',
                    'desc' => 'صياغة التقرير التشخيصي النهائي والخطة العلاجية الفردية PEI',
                ],
                'export_medical_pdf' => [
                    'label' => 'طباعة وتصدير التقارير الطبية الرسمية PDF',
                    'desc' => 'تنزيل ومشاركة ملفات PDF بالترويسة المعتمدة والختم الطبي الرقمي',
                ],
                'teletherapy_module' => [
                    'label' => 'إدارة عيادة التطبيب عن بعد وغرف الفيديو',
                    'desc' => 'إنشاء غرف الاتصال المشفرة ومشاركة الروابط المباشرة مع الأولياء',
                ],
                'ai_clinical_suite' => [
                    'label' => 'استخدام الذكاء الاصطناعي السريري والـ DDSS',
                    'desc' => 'توليد صياغات SOAP المقترحة، تحليل الفونولوجيا، وتوصيات التدخل',
                ],
            ],
        ],
        'specialties' => [
            'category_name' => 'القمرات التخصصية السريرية (Specialty Cockpits)',
            'category_icon' => 'Award',
            'items' => [
                'orthophony_module' => [
                    'label' => 'قمرة الأرطوفونيا ومصفوفة الفحص الفونولوجي',
                    'desc' => 'أدوات النطق، التأتأة، اختبار التسمية السريعة، وأرشفة التسجيلات الصوتية',
                ],
                'psychology_cbt_module' => [
                    'label' => 'قمرة علم النفس وسجلات CBT ومقياس الضيق SUDS',
                    'desc' => 'سجلات إعادة الهيكلة المعرفية، مقاييس القلق والاكتئاب، وتتبع المزاج',
                ],
                'psychomotricity_module' => [
                    'label' => 'قمرة التأهيل النفسي الحركي ومخطط الجسد',
                    'desc' => 'تقييم التوازن، التناسق الحركي الدقيق والجانبية، ومخططات الجسد التفاعلية',
                ],
            ],
        ],
        'agenda' => [
            'category_name' => 'الأجندة والمواعيد وقاعة الانتظار الذكية (Agenda & Front Desk)',
            'category_icon' => 'Calendar',
            'items' => [
                'manage_appointments' => [
                    'label' => 'حجز وتعديل وإلغاء المواعيد السريرية',
                    'desc' => 'إدارة جدول الحصص اليومية والأسبوعية، المواعيد المتكررة، وكشف التعارضات',
                ],
                'manage_waiting_room' => [
                    'label' => 'إدارة قاعة الانتظار وبورن Kiosk وشاشة TV',
                    'desc' => 'تسجيل حضور المرضى بالـ PIN واستدعاء الشاشة وبث النداء الصوتي الآلي',
                ],
                'send_whatsapp_reminders' => [
                    'label' => 'إرسال تذكيرات ورسائل WhatsApp للأولياء',
                    'desc' => 'إطلاق رسائل التذكير المباشرة وروابط بوابات التقييم والواجبات المنزلية',
                ],
            ],
        ],
        'finance' => [
            'category_name' => 'الفوترة والتحصيل المالي والعمولات (Finance & Billing)',
            'category_icon' => 'CreditCard',
            'items' => [
                'view_invoices' => [
                    'label' => 'الاطلاع على الفواتير وسجل المداخيل',
                    'desc' => 'عرض سجل العمليات المالية والمدفوعات والمستحقات المتبقية',
                ],
                'create_invoices' => [
                    'label' => 'إصدار الفواتير وسندات القبض وإيصالات BaridiMob',
                    'desc' => 'إنشاء فاتورة جلسة أو حصيلة مع تسجيل الدفع نقداً أو إلكترونياً',
                ],
                'manage_tariffs' => [
                    'label' => 'تعديل أسعار الخدمات السريرية وبوادئ الفواتير',
                    'desc' => 'تحديد تسعيرة الحصص الفردية والحصائل في إعدادات العيادة',
                ],
                'view_doctor_commissions' => [
                    'label' => 'متابعة أتعاب وعمولات الأطباء والمعالجين',
                    'desc' => 'الاطلاع على تقرير حساب النسب المئوية لأتعاب المعالجين عن الجلسات',
                ],
            ],
        ],
        'settings' => [
            'category_name' => 'إدارة النظام والكوادر والأمان (Admin & Governance)',
            'category_icon' => 'Shield',
            'items' => [
                'manage_clinic_settings' => [
                    'label' => 'تعديل إعدادات وهوية وترويسة العيادة A4',
                    'desc' => 'تحديث الشعار، الختم الطبي الرقمي، أوقات العمل، وسياسات البوابة',
                ],
                'manage_staff_users' => [
                    'label' => 'إدارة حسابات وأدوار وصلاحيات الطاقم (RBAC)',
                    'desc' => 'إضافة موظفين جدد، تخصيص مصفوفة الصلاحيات، وإعادة تعيين كلمات السر',
                ],
                'view_audit_logs' => [
                    'label' => 'الاطلاع على سجل التدقيق الأمني ونشاط النظام',
                    'desc' => 'مراجعة سجلات الدخول والتعديلات الحساسة وحركات الملفات',
                ],
                'export_full_database' => [
                    'label' => 'تصدير قاعدة البيانات الكاملة (JSON Backup)',
                    'desc' => 'تنزيل نسخة احتياطية شاملة لكافة سجلات وبيانات العيادة',
                ],
            ],
        ],
    ];

    /**
     * Default Preset Permissions per Role.
     */
    public static function getDefaultPermissionsForRole(string $role): array
    {
        switch ($role) {
            case 'admin_owner':
            case 'clinic_admin':
            case 'superadmin':
                // Full Access to all 24 permissions
                $all = [];
                foreach (self::PERMISSIONS_CATALOG as $cat) {
                    foreach (array_keys($cat['items']) as $key) {
                        $all[] = $key;
                    }
                }
                return $all;

            case 'doctor':
            case 'specialist':
                return [
                    'view_patients_all',
                    'view_patients_assigned',
                    'create_patients',
                    'edit_patients',
                    'view_medical_confidential',
                    'start_sessions',
                    'manage_soap',
                    'run_assessments',
                    'generate_bilans',
                    'export_medical_pdf',
                    'teletherapy_module',
                    'ai_clinical_suite',
                    'orthophony_module',
                    'psychology_cbt_module',
                    'psychomotricity_module',
                    'manage_appointments',
                    'manage_waiting_room',
                    'send_whatsapp_reminders',
                    'view_invoices',
                    'create_invoices',
                    'view_doctor_commissions',
                ];

            case 'orthophonist':
                return [
                    'view_patients_all',
                    'view_patients_assigned',
                    'create_patients',
                    'edit_patients',
                    'view_medical_confidential',
                    'start_sessions',
                    'manage_soap',
                    'run_assessments',
                    'generate_bilans',
                    'export_medical_pdf',
                    'teletherapy_module',
                    'ai_clinical_suite',
                    'orthophony_module',
                    'manage_appointments',
                    'manage_waiting_room',
                    'send_whatsapp_reminders',
                    'view_invoices',
                    'create_invoices',
                    'view_doctor_commissions',
                ];

            case 'psychologist':
                return [
                    'view_patients_all',
                    'view_patients_assigned',
                    'create_patients',
                    'edit_patients',
                    'view_medical_confidential',
                    'start_sessions',
                    'manage_soap',
                    'run_assessments',
                    'generate_bilans',
                    'export_medical_pdf',
                    'teletherapy_module',
                    'ai_clinical_suite',
                    'psychology_cbt_module',
                    'manage_appointments',
                    'manage_waiting_room',
                    'send_whatsapp_reminders',
                    'view_invoices',
                    'create_invoices',
                    'view_doctor_commissions',
                ];

            case 'psychomotor':
                return [
                    'view_patients_all',
                    'view_patients_assigned',
                    'create_patients',
                    'edit_patients',
                    'view_medical_confidential',
                    'start_sessions',
                    'manage_soap',
                    'run_assessments',
                    'generate_bilans',
                    'export_medical_pdf',
                    'teletherapy_module',
                    'psychomotricity_module',
                    'manage_appointments',
                    'manage_waiting_room',
                    'send_whatsapp_reminders',
                    'view_invoices',
                    'create_invoices',
                    'view_doctor_commissions',
                ];

            case 'receptionist':
            case 'secretary':
                return [
                    'view_patients_all',
                    'create_patients',
                    'edit_patients',
                    'manage_appointments',
                    'manage_waiting_room',
                    'send_whatsapp_reminders',
                    'view_invoices',
                    'create_invoices',
                ];

            case 'assistant':
            case 'intern':
                return [
                    'view_patients_assigned',
                    'start_sessions',
                    'manage_soap',
                    'run_assessments',
                    'manage_waiting_room',
                ];

            default:
                return ['view_patients_assigned', 'manage_appointments'];
        }
    }

    /**
     * Helper to get active tenant ID.
     */
    protected function getActiveTenantId(): ?string
    {
        $user = Auth::user();
        if (!$user) return null;
        return $user->tenant_id ?: Tenant::first()?->id;
    }

    /**
     * Return full permissions catalog, categories and role presets.
     */
    public function getPermissionsCatalog(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'catalog' => self::PERMISSIONS_CATALOG,
            'role_presets' => [
                'clinic_admin' => self::getDefaultPermissionsForRole('clinic_admin'),
                'specialist' => self::getDefaultPermissionsForRole('specialist'),
                'orthophonist' => self::getDefaultPermissionsForRole('orthophonist'),
                'psychologist' => self::getDefaultPermissionsForRole('psychologist'),
                'psychomotor' => self::getDefaultPermissionsForRole('psychomotor'),
                'doctor' => self::getDefaultPermissionsForRole('doctor'),
                'receptionist' => self::getDefaultPermissionsForRole('receptionist'),
                'secretary' => self::getDefaultPermissionsForRole('secretary'),
                'assistant' => self::getDefaultPermissionsForRole('assistant'),
                'intern' => self::getDefaultPermissionsForRole('intern'),
            ],
            'roles_info' => [
                'clinic_admin' => ['title' => 'مدير العيادة / مسؤول النظام', 'desc' => 'صلاحيات كاملة 100% لإدارة الحسابات، المالية، الإعدادات، والملفات الطبية'],
                'specialist' => ['title' => 'أخصائي معالج / طبيب سريري', 'desc' => 'صلاحيات سريرية متكاملة للتقييم، الجلسات، الحصائل، والتطبيب عن بعد'],
                'orthophonist' => ['title' => 'أخصائي أرطوفونيا وتخاطب', 'desc' => 'قمرة الأرطوفونيا، الفحص الفونولوجي، المقاييس، والحصائل السريرية'],
                'psychologist' => ['title' => 'أخصائي نفساني عيادي', 'desc' => 'قمرة علم النفس، سجلات CBT، مقاييس المزاج والقلق، وتوثيق SOAP'],
                'psychomotor' => ['title' => 'أخصائي تأهيل نفسي حركي', 'desc' => 'قمرة التأهيل الحركي، فحص الجسد والتناسق، وحصص العلاج الحركي'],
                'doctor' => ['title' => 'طبيب سريري / استشاري', 'desc' => 'إشراف طبي وسريري كامل مع إصدار التقارير والفواتير'],
                'receptionist' => ['title' => 'استقبال وسكرتارية طبية', 'desc' => 'إدارة الأجندة، قاعة الانتظار، الفواتير، وتذكيرات WhatsApp مع حظر السجلات السرية'],
                'assistant' => ['title' => 'مساعد سريري / متدرب', 'desc' => 'مساعدة في الحصص ومتابعة الجلسات المخصصة تحت إشراف الطبيب المعالج'],
            ],
        ]);
    }

    /**
     * List clinic staff members.
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $this->getActiveTenantId();

        $query = User::query();

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        if ($role = $request->query('role')) {
            if ($role !== 'all') {
                $query->where('role', $role);
            }
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('specialty', 'like', "%{$search}%")
                  ->orWhere('room_number', 'like', "%{$search}%");
            });
        }

        $staff = $query->latest()->get();

        // Ensure each member has permissions array hydrated with defaults if empty
        $staff->transform(function ($member) {
            if (empty($member->permissions) || !is_array($member->permissions)) {
                $member->permissions = self::getDefaultPermissionsForRole($member->role ?? 'specialist');
            }
            return $member;
        });

        return response()->json([
            'success' => true,
            'data' => $staff,
            'staff' => $staff, // backwards compatibility
            'total' => $staff->count(),
        ]);
    }

    /**
     * Create a new staff member (e.g., secretary, receptionist, specialist).
     */
    public function store(Request $request): JsonResponse
    {
        $tenantId = $this->getActiveTenantId();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:50',
            'role' => ['required', 'string'],
            'specialty' => 'nullable|string|max:150',
            'room_number' => 'nullable|string|max:50',
            'commission_percentage' => 'nullable|numeric|min:0|max:100',
            'password' => 'required|string|min:6',
            'permissions' => 'nullable|array',
        ]);

        $permissions = !empty($validated['permissions'])
            ? $validated['permissions']
            : self::getDefaultPermissionsForRole($validated['role']);

        $user = User::create([
            'tenant_id' => $tenantId,
            'name' => trim($validated['name']),
            'email' => strtolower(trim($validated['email'])),
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'specialty' => $validated['specialty'] ?? (in_array($validated['role'], ['receptionist', 'secretary']) ? 'استقبال وسكرتارية طبية' : null),
            'room_number' => $validated['room_number'] ?? null,
            'commission_percentage' => $validated['commission_percentage'] ?? 0.00,
            'password' => Hash::make($validated['password']),
            'permissions' => $permissions,
            'is_active' => true,
            'has_completed_tour' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء حساب عضو الفريق وتفعيل الصلاحيات بنجاح! ✨',
            'user' => $user,
        ], 201);
    }

    /**
     * Show single staff member.
     */
    public function show(string $id): JsonResponse
    {
        $tenantId = $this->getActiveTenantId();
        $user = User::where('tenant_id', $tenantId)->findOrFail($id);

        if (empty($user->permissions) || !is_array($user->permissions)) {
            $user->permissions = self::getDefaultPermissionsForRole($user->role ?? 'specialist');
        }

        return response()->json([
            'success' => true,
            'user' => $user,
            'data' => $user,
        ]);
    }

    /**
     * Update staff member details or role.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $tenantId = $this->getActiveTenantId();
        $user = User::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => 'nullable|string|max:50',
            'role' => 'sometimes|required|string',
            'specialty' => 'nullable|string|max:150',
            'room_number' => 'nullable|string|max:50',
            'commission_percentage' => 'nullable|numeric|min:0|max:100',
            'password' => 'nullable|string|min:6',
            'is_active' => 'nullable|boolean',
            'permissions' => 'nullable|array',
        ]);

        if (isset($validated['name'])) $user->name = trim($validated['name']);
        if (isset($validated['email'])) $user->email = strtolower(trim($validated['email']));
        if (array_key_exists('phone', $validated)) $user->phone = $validated['phone'];
        if (array_key_exists('specialty', $validated)) $user->specialty = $validated['specialty'];
        if (array_key_exists('room_number', $validated)) $user->room_number = $validated['room_number'];
        if (array_key_exists('commission_percentage', $validated)) $user->commission_percentage = $validated['commission_percentage'];
        if (isset($validated['is_active'])) $user->is_active = $validated['is_active'];
        
        if (isset($validated['role']) && $validated['role'] !== $user->role) {
            $user->role = $validated['role'];
            // If permissions not explicitly provided, update to role defaults
            if (!isset($validated['permissions'])) {
                $user->permissions = self::getDefaultPermissionsForRole($validated['role']);
            }
        }

        if (isset($validated['permissions'])) {
            $user->permissions = $validated['permissions'];
        }

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث بيانات وصلاحيات عضو الفريق بنجاح.',
            'user' => $user,
        ]);
    }

    /**
     * Dedicated Endpoint to Update Granular Permissions Matrix for a Staff Member.
     */
    public function updatePermissions(Request $request, string $id): JsonResponse
    {
        $tenantId = $this->getActiveTenantId();
        $user = User::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'permissions' => 'required|array',
        ]);

        $user->permissions = $validated['permissions'];
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ وتفعيل مصفوفة الصلاحيات بنجاح! 🛡️',
            'permissions' => $user->permissions,
            'user' => $user,
        ]);
    }

    /**
     * Toggle Active Status (Enable / Freeze Staff Login).
     */
    public function toggleStatus(string $id): JsonResponse
    {
        $tenantId = $this->getActiveTenantId();
        $user = User::where('tenant_id', $tenantId)->findOrFail($id);

        if ($user->id === Auth::id()) {
            return response()->json(['success' => false, 'message' => 'لا يمكنك تعطيل حسابك الشخصي النشط.'], 400);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => $user->is_active ? 'تم تفعيل حساب الموظف والسماح له بالدخول.' : 'تم تجميد حساب الموظف ومنعه من الدخول مؤقتاً.',
            'is_active' => $user->is_active,
            'user' => $user,
        ]);
    }

    /**
     * Delete / Remove staff member.
     */
    public function destroy(string $id): JsonResponse
    {
        $tenantId = $this->getActiveTenantId();
        $user = User::where('tenant_id', $tenantId)->findOrFail($id);

        if ($user->id === Auth::id()) {
            return response()->json(['success' => false, 'message' => 'لا يمكنك حذف حسابك الشخصي.'], 400);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف حساب الموظف بنجاح.',
        ]);
    }
}
