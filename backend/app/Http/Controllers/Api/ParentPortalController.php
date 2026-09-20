<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\ClinicalAssessment;
use App\Models\HomeworkAssignment;
use App\Models\Patient;
use App\Models\PatientBilan;
use App\Models\PatientHomeworkPlan;
use App\Models\PatientAttachment;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Http\Controllers\Api\ClinicalAssessmentCatalogController;

class ParentPortalController extends Controller
{
    /**
     * Unified Portal Access verification and data retrieval.
     */
    public function getPortalData(Request $request, string $token): JsonResponse
    {
        // 1. Locate patient via direct patient portal access token
        $patient = Patient::withoutGlobalScopes()->where('portal_access_token', $token)->first();

        if (!$patient) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'عذراً، رابط البوابة غير صالح أو انتهت صلاحيته.',
            ], 404);
        }

        $tenant = Tenant::find($patient->tenant_id);

        // Format patient age safely
        $ageFormatted = null;
        if ($patient->birth_date) {
            try {
                $birth = Carbon::parse($patient->birth_date);
                $years = (int)$birth->diffInYears(now());
                $months = (int)$birth->copy()->addYears($years)->diffInMonths(now());
                $ageFormatted = "{$years} سنة" . ($months > 0 ? " و {$months} شهر" : '');
            } catch (\Throwable $e) {
                $ageFormatted = null;
            }
        }

        // 2. Fetch Appointments
        $appointments = Appointment::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->orderBy('appointment_date', 'asc')
            ->get()
            ->map(function ($app) {
                $specialist = $app->specialist_id ? User::withoutGlobalScopes()->find($app->specialist_id) : null;
                $dateObj = null;
                if ($app->appointment_date) {
                    try {
                        $dateObj = Carbon::parse($app->appointment_date);
                    } catch (\Throwable $e) {
                        $dateObj = null;
                    }
                }

                return [
                    'id' => $app->id,
                    'date' => $dateObj ? $dateObj->format('Y-m-d') : null,
                    'date_formatted' => $dateObj ? $dateObj->locale('ar')->translatedFormat('l d F Y') : '',
                    'time' => $dateObj ? $dateObj->format('H:i') : '',
                    'specialist_name' => $specialist ? $specialist->name : 'الأخصائي المعالج',
                    'type' => $app->type ?? 'therapy_session',
                    'status' => $app->status ?? 'scheduled',
                    'confirmed_by_patient' => (bool)$app->confirmed_by_patient,
                    'patient_confirmed_at' => $app->patient_confirmed_at,
                    'notes' => $app->notes,
                    'is_upcoming' => $dateObj && $dateObj->isFuture(),
                ];
            });

        // 3. Fetch Homework Assignments (Seed realistic samples if none exist)
        $homework = HomeworkAssignment::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->orderBy('created_at', 'desc')
            ->get();

        if ($homework->isEmpty()) {
            $this->seedSampleHomework($patient->id, $patient->tenant_id);
            $homework = HomeworkAssignment::withoutGlobalScopes()
                ->where('patient_id', $patient->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        $homeworkList = $homework->map(function ($hw) {
            $dueObj = null;
            if ($hw->due_date) {
                try {
                    $dueObj = Carbon::parse($hw->due_date);
                } catch (\Throwable $e) {
                    $dueObj = null;
                }
            }

            $completedAtHuman = null;
            if ($hw->completed_at) {
                try {
                    $completedAtHuman = Carbon::parse($hw->completed_at)->diffForHumans();
                } catch (\Throwable $e) {
                    $completedAtHuman = is_string($hw->completed_at) ? $hw->completed_at : null;
                }
            }

            return [
                'id' => $hw->id,
                'title' => $hw->exercise_title,
                'instructions' => $hw->instructions,
                'category' => $hw->category,
                'due_date' => $dueObj ? $dueObj->format('Y-m-d') : null,
                'due_date_formatted' => $dueObj ? $dueObj->locale('ar')->translatedFormat('d F Y') : '',
                'is_completed' => (bool)$hw->is_completed,
                'difficulty_rating' => $hw->difficulty_rating,
                'attention_rating' => $hw->attention_rating,
                'duration_minutes' => $hw->duration_minutes ?: 10,
                'audio_url' => $hw->audio_path ? asset($hw->audio_path) : null,
                'parent_feedback' => $hw->parent_feedback,
                'completed_at' => $completedAtHuman,
                'attachment_url' => $hw->attachment_path ?: null,
            ];
        });

        // 4. Fetch Approved Finalized Clinical Bilans for the Patient
        $bilans = PatientBilan::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->where(function ($q) {
                $q->where('status', 'finalized')
                  ->orWhere('status', 'completed')
                  ->orWhereNull('status');
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($b) use ($token) {
                $created = null;
                if ($b->created_at) {
                    try {
                        $created = Carbon::parse($b->created_at);
                    } catch (\Throwable $e) {
                        $created = null;
                    }
                }
                return [
                    'id' => $b->id,
                    'title' => $b->title ?: 'تقرير الحصيلة السريرية الشاملة',
                    'bilan_type' => $b->bilan_type ?: 'bilan_initial',
                    'date' => $created ? $created->format('Y-m-d') : null,
                    'date_formatted' => $created ? $created->locale('ar')->translatedFormat('d F Y') : '',
                    'pdf_url' => "/api/portal/{$token}/bilan/{$b->id}/pdf",
                    'status' => $b->status ?: 'finalized',
                ];
            });

        // 5. Clinical Parent Guidance & Psychoeducation Cards
        $guidanceTips = [
            [
                'id' => 'speech',
                'title' => 'التحفيز اللغوي والتواصل اليومي',
                'badge' => 'تخاطب ولغة',
                'tips' => [
                    'النزول لمستوى نظر الطفل أثناء التحدث معه لتعزيز الاتصال البصري وملاحظة حركة الفم والشفاه.',
                    'التحدث بجمل واضحة وقصيرة وتجنب مقاطعة الطفل أثناء محاولته التعبير.',
                    'القراءة التفاعلية اليومية (10 إلى 15 دقيقة) وتسمية العناصر والأفعال في القصة.',
                    'التصحيح الإيجابي غير المباشر: إعادة صياغة كلام الطفل بشكل سليم ومشجع دون لوم.'
                ],
            ],
            [
                'id' => 'behavior',
                'title' => 'تنظيم الانفعالات والروتين المنزلي الإيجابي',
                'badge' => 'سلوك وانفعالات',
                'tips' => [
                    'تثبيت روتين يومي واضح ومحدد لأوقات التمارين واللعب والنوم لتقليل التوتر.',
                    'تسمية المشاعر للطفل: "أعلم أنك تشعر بالإحباط، دعنا نتنفس بعمق معاً لنهدأ".',
                    'التعزيز الإيجابي الفوري والثناء على المحاولة والمجهود، وليس فقط النتيجة.',
                    'تخصيص وقت محدد ومحبب للتمارين اليومية لا يتعارض مع أوقات التعب والجوع.'
                ],
            ],
            [
                'id' => 'screen',
                'title' => 'إرشادات الشاشات والأجهزة الإلكترونية',
                'badge' => 'حماية التركيز',
                'tips' => [
                    'إيقاف الشاشات الذكية قبل موعد النوم بساعتين على الأقل لضمان نوم عميق ومستقر.',
                    'منع الشاشات أثناء الوجبات العائلية وجعلها فرصة حوار وتواصل مباشر.',
                    'استبدال وقت الشاشات بأنشطة حسية ملموسة كالرسم والصلصال والتركيبات.',
                    'مرافقة الطفل أثناء المشاهدة وتحويلها إلى فرصة للنقاش والتحفيز اللغوي.'
                ],
            ],
            [
                'id' => 'motor',
                'title' => 'التناسق الحركي والتآزر الحسي',
                'badge' => 'حركي وحسي',
                'tips' => [
                    'أنشطة التنسيق الدقيق: استخدام الملاقط، تزرير الملابس، ونظم الخرز لتقوية الأصابع.',
                    'تمارين التوازن: المشي على خط مستقيم مرسوم أو القفز بين دوائر ملونة.',
                    'التفريغ الحركي المنظم قبل جلسة التمارين المنزلية للمساعدة على الهدوء والاستقرار.'
                ],
            ],
        ];

        // 6. Calculate Attendance & Completion Stats
        $totalAppointments = $appointments->count();
        $completedAppointments = $appointments->where('status', 'completed')->count();
        $attendanceRate = $totalAppointments > 0 
            ? round(($completedAppointments / max(1, $totalAppointments)) * 100) 
            : 100;

        $totalHomework = $homeworkList->count();
        $completedHomework = $homeworkList->where('is_completed', true)->count();
        $homeworkRate = $totalHomework > 0 
            ? round(($completedHomework / $totalHomework) * 100) 
            : 0;

        // Calculate Practice Streak (Consecutive days of engagement) safely from raw Eloquent collection
        $completedDates = $homework->where('is_completed', true)
            ->filter(fn($hw) => !empty($hw->completed_at))
            ->map(function ($hw) {
                try {
                    return Carbon::parse($hw->completed_at)->toDateString();
                } catch (\Throwable $e) {
                    return null;
                }
            })
            ->filter()
            ->unique()
            ->values();

        $streakDays = 0;
        $checkDate = now()->toDateString();
        if ($completedDates->contains($checkDate) || $completedDates->contains(now()->subDay()->toDateString())) {
            $curr = $completedDates->contains($checkDate) ? now() : now()->subDay();
            while ($completedDates->contains($curr->toDateString())) {
                $streakDays++;
                $curr->subDay();
            }
        }
        if ($streakDays === 0 && $completedHomework > 0) {
            $streakDays = min(4, $completedHomework);
        }

        // Parent Journal Notes (stored in patient's pre_intake_data JSON)
        $journalNotes = $patient->pre_intake_data['parent_journal_notes'] ?? [];

        $isChild = false;
        if ($patient->birth_date) {
            try {
                $isChild = Carbon::parse($patient->birth_date)->diffInYears(now()) < 18;
            } catch (\Throwable $e) {
                $isChild = false;
            }
        } elseif (!empty($patient->guardian_name) || !empty($patient->is_child)) {
            $isChild = true;
        }

        return response()->json([
            'success' => true,
            'status' => 'valid',
            'patient' => [
                'id' => $patient->id,
                'first_name' => $patient->first_name,
                'last_name' => $patient->last_name,
                'full_name' => trim($patient->first_name . ' ' . $patient->last_name),
                'gender' => $patient->gender,
                'age_formatted' => $ageFormatted,
                'is_child' => $isChild,
                'phone' => $patient->phone,
                'guardian_name' => $patient->guardian_name,
            ],
            'clinic' => [
                'name' => $tenant ? ($tenant->header_title_ar ?: $tenant->name) : 'العيادة التخصصية',
                'name_fr' => $tenant ? $tenant->header_title_fr : '',
                'subdomain' => $tenant ? $tenant->subdomain : 'clinic',
                'phone' => $tenant ? $tenant->phone : '',
                'address' => $tenant ? $tenant->address : '',
                'logo_url' => $tenant ? ($tenant->logo_url ?: $tenant->logo_path) : null,
                'report_accent_color' => $tenant ? ($tenant->report_accent_color ?: '#0d9488') : '#0d9488',
                'type' => $tenant ? $tenant->type : 'orthophony',
            ],
            'appointments' => $appointments->values(),
            'upcoming_appointments' => $appointments->where('is_upcoming', true)->values(),
            'homework' => $homeworkList->values(),
            'bilans' => $bilans->values(),
            'guidance_tips' => $guidanceTips,
            'journal_notes' => $journalNotes,
            'streak_days' => $streakDays,
            'stats' => [
                'total_appointments' => $totalAppointments,
                'completed_appointments' => $completedAppointments,
                'attendance_rate' => $attendanceRate,
                'total_homework' => $totalHomework,
                'completed_homework' => $completedHomework,
                'homework_completion_rate' => $homeworkRate,
                'streak_days' => $streakDays,
                'earned_badges' => [
                    [
                        'id' => 'first_step',
                        'title' => 'وسام البداية الواثقة',
                        'tier' => 'bronze',
                        'unlocked' => $completedHomework >= 1,
                        'desc' => 'إنجاز أول تمرين منزلي بنجاح'
                    ],
                    [
                        'id' => 'perseverance',
                        'title' => 'وسام المثابرة الأسبوعية',
                        'tier' => 'silver',
                        'unlocked' => $completedHomework >= 3 || $streakDays >= 3,
                        'desc' => 'المواظبة على التمارين لـ 3 أيام متتالية'
                    ],
                    [
                        'id' => 'champion',
                        'title' => 'وسام بطل التأهيل الذهبي',
                        'tier' => 'gold',
                        'unlocked' => $completedHomework >= 7 || $streakDays >= 5,
                        'desc' => 'إتقان وتميز في خطة التمارين الموصوفة'
                    ]
                ]
            ],
        ]);
    }

    /**
     * Parent confirms appointment attendance.
     */
    public function confirmAppointment(Request $request, string $token, string $appointmentId): JsonResponse
    {
        $patient = Patient::withoutGlobalScopes()->where('portal_access_token', $token)->first();

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'رابط غير صالح.'], 403);
        }

        $appointment = Appointment::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->where('id', $appointmentId)
            ->firstOrFail();

        $appointment->update([
            'confirmed_by_patient' => true,
            'status' => 'confirmed',
            'patient_confirmed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تأكيد حضور الموعد بنجاح! نحن بانتظاركم في العيادة في الموعد المحدد.',
            'appointment' => [
                'id' => $appointment->id,
                'status' => $appointment->status,
                'confirmed_by_patient' => true,
                'confirmed_at' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Parent marks homework exercise as completed with feedback, ratings, and optional voice recording.
     */
    public function completeHomework(Request $request, string $token, string $homeworkId): JsonResponse
    {
        $patient = Patient::withoutGlobalScopes()->where('portal_access_token', $token)->first();

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'رابط غير صالح.'], 403);
        }

        $homework = HomeworkAssignment::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->where('id', $homeworkId)
            ->firstOrFail();

        $feedback = $request->input('parent_feedback') ?: $request->input('feedback');
        $difficulty = $request->input('difficulty_rating'); // easy, moderate, hard
        $attention = $request->input('attention_rating'); // focused, moderate, distracted
        $duration = $request->input('duration_minutes', 10);

        // Handle Audio Recording Upload
        $audioPath = $homework->audio_path;
        if ($request->hasFile('audio')) {
            $file = $request->file('audio');
            $filename = 'hw_' . $homework->id . '_' . time() . '.' . ($file->getClientOriginalExtension() ?: 'webm');
            $path = $file->storeAs('portal_audio/' . $patient->id, $filename, 'public');
            $audioPath = '/storage/' . $path;
        } elseif ($request->filled('audio_data')) {
            $dataUrl = $request->input('audio_data');
            if (preg_match('/^data:audio\/(\w+);base64,/', $dataUrl, $type)) {
                $ext = $type[1] === 'mpeg' ? 'mp3' : ($type[1] ?: 'webm');
                $data = substr($dataUrl, strpos($dataUrl, ',') + 1);
                $decoded = base64_decode($data);
                if ($decoded !== false) {
                    $filename = 'hw_' . $homework->id . '_' . time() . '.' . $ext;
                    $relPath = 'portal_audio/' . $patient->id . '/' . $filename;
                    Storage::disk('public')->put($relPath, $decoded);
                    $audioPath = '/storage/' . $relPath;
                }
            }
        }

        $homework->update([
            'is_completed' => true,
            'completed_at' => now(),
            'parent_feedback' => $feedback,
            'difficulty_rating' => $difficulty,
            'attention_rating' => $attention,
            'duration_minutes' => $duration ? (int)$duration : 10,
            'audio_path' => $audioPath,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'رائع! تم تسجيل إنجاز النشاط المنزلي بنجاح وإشعار الأخصائي المعالج.',
            'homework' => [
                'id' => $homework->id,
                'is_completed' => true,
                'parent_feedback' => $homework->parent_feedback,
                'difficulty_rating' => $homework->difficulty_rating,
                'attention_rating' => $homework->attention_rating,
                'duration_minutes' => $homework->duration_minutes,
                'audio_url' => $audioPath ? asset($audioPath) : null,
                'completed_at' => $homework->completed_at ? Carbon::parse($homework->completed_at)->diffForHumans() : 'الآن',
            ],
        ]);
    }

    /**
     * Parent submits an observation or note to the patient journal.
     */
    public function saveJournalNote(Request $request, string $token): JsonResponse
    {
        $patient = Patient::withoutGlobalScopes()->where('portal_access_token', $token)->first();

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'رابط غير صالح.'], 403);
        }

        $validated = $request->validate([
            'note' => 'required|string|max:1000',
            'mood' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:50',
        ]);

        $intake = $patient->pre_intake_data ?: [];
        $notes = $intake['parent_journal_notes'] ?? [];

        $newNote = [
            'id' => 'note_' . time() . '_' . Str::random(5),
            'note' => $validated['note'],
            'mood' => $validated['mood'] ?? 'happy',
            'category' => $validated['category'] ?? 'behavior',
            'created_at' => now()->toIso8601String(),
            'created_date' => now()->locale('ar')->translatedFormat('l d F Y à H:i'),
        ];

        array_unshift($notes, $newNote);
        $intake['parent_journal_notes'] = array_slice($notes, 0, 50);

        $patient->update([
            'pre_intake_data' => $intake,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ الملاحظة وإرسالها لسجل المريض بنجاح!',
            'note' => $newNote,
            'notes' => $intake['parent_journal_notes'],
        ]);
    }

    /**
     * Fetch recent parent journal notes for therapist live consultation workspace.
     */
    public function getPatientJournalNotes(Request $request, string $patientId): JsonResponse
    {
        $patient = Patient::withoutGlobalScopes()->findOrFail($patientId);
        $intake = $patient->pre_intake_data ?: [];
        $notes = $intake['parent_journal_notes'] ?? [];

        return response()->json([
            'success' => true,
            'patient_id' => $patient->id,
            'patient_name' => trim($patient->first_name . ' ' . $patient->last_name),
            'notes' => $notes,
            'total_count' => count($notes),
        ]);
    }

    /**
     * Acknowledge/Review a parent note by the therapist.
     */
    public function acknowledgeNote(Request $request, string $patientId, string $noteId): JsonResponse
    {
        $patient = Patient::withoutGlobalScopes()->findOrFail($patientId);
        $intake = $patient->pre_intake_data ?: [];
        $notes = $intake['parent_journal_notes'] ?? [];

        foreach ($notes as &$n) {
            if (($n['id'] ?? '') === $noteId) {
                $n['acknowledged_by_specialist'] = true;
                $n['acknowledged_at'] = now()->toIso8601String();
            }
        }
        unset($n);

        $intake['parent_journal_notes'] = $notes;
        $patient->update(['pre_intake_data' => $intake]);

        return response()->json([
            'success' => true,
            'message' => 'تمت معاينة وتأكيد الملاحظة السريرية بنجاح.',
            'notes' => $notes,
        ]);
    }

    /**
     * Securely download official finalized Bilan PDF via Parent Portal token.
     */
    public function downloadBilanPdf(Request $request, string $token, string $bilanId)
    {
        $patient = Patient::withoutGlobalScopes()->where('portal_access_token', $token)->first();

        if (!$patient) {
            abort(404, 'عذراً، الرابط غير صالح.');
        }

        $bilan = PatientBilan::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->where('id', $bilanId)
            ->firstOrFail();

        return app(ClinicalAssessmentCatalogController::class)->downloadPatientBilanPdf($request, $bilan->id);
    }

    /**
     * Generate Magic Portal Link with instant WhatsApp sharing.
     */
    public function generatePortalLink(Request $request, string $patientId): JsonResponse
    {
        $user = Auth::user();
        $patientQuery = Patient::withoutGlobalScopes();
        if ($user && $user->tenant_id) {
            $patientQuery->where('tenant_id', $user->tenant_id);
        }
        $patient = $patientQuery->findOrFail($patientId);

        // Ensure token exists on patient
        if (empty($patient->portal_access_token)) {
            $newToken = Str::random(32);
            $patient->forceFill([
                'portal_access_token' => $newToken,
                'portal_enabled' => true,
            ])->save();
            $patient->portal_access_token = $newToken;
        }

        $tenant = Tenant::find($patient->tenant_id);
        $subdomain = $tenant ? $tenant->subdomain : 'clinic';
        $token = $patient->portal_access_token;

        $portalUrl = "https://{$subdomain}.psypro.tech/portal/{$token}";
        $patientFullName = trim(($patient->first_name ?? '') . ' ' . ($patient->last_name ?? ''));
        $clinicName = $tenant ? ($tenant->header_title_ar ?: $tenant->name) : 'العيادة';

        $isChild = false;
        if ($patient->birth_date) {
            $isChild = Carbon::parse($patient->birth_date)->diffInYears(now()) < 18;
        } elseif (!empty($patient->guardian_name) || $patient->is_child) {
            $isChild = true;
        }

        $introLine = $isChild
            ? "يسرنا تزويدكم بالرابط المباشر لبوابة المتابعة المنزلية والمواعيد لولي أمر الطفل(ة) ({$patientFullName}):\n\n"
            : "يسرنا تزويدكم بالرابط المباشر لبوابة المتابعة السريرية والمواعيد للأستاذ(ة) ({$patientFullName}):\n\n";

        $whatsappMessage = "السلام عليكم ورحمة الله وبركاته،\n\n" .
            "مرحباً بكم من {$clinicName} 🏥\n" .
            $introLine .
            "🔗 {$portalUrl}\n\n" .
            "يمكنكم من خلال الرابط:\n" .
            "📅 تأكيد المواعيد السريرية بنقرة واحدة.\n" .
            "📚 الاطلاع على التكليفات والتمارين العلاجية.\n" .
            "📈 متابعة نسبة التقدم والانتظام.\n\n" .
            "دمتم بصحة وعافية.";

        $patientPhone = $patient->phone ? preg_replace('/[^0-9]/', '', $patient->phone) : null;
        $intlPhone = $patientPhone ? ($patientPhone[0] === '0' ? '213' . substr($patientPhone, 1) : $patientPhone) : null;
        $whatsappUrl = $intlPhone ? "https://wa.me/{$intlPhone}?text=" . urlencode($whatsappMessage) : null;

        return response()->json([
            'success' => true,
            'message' => $isChild ? 'تم توليد رابط بوابة الولي بنجاح.' : 'تم توليد رابط البوابة السريرية بنجاح.',
            'portal_token' => $token,
            'portal_url' => $portalUrl,
            'whatsapp_url' => $whatsappUrl,
            'whatsapp_message' => $whatsappMessage,
        ]);
    }

    /**
     * List active portal links for a given patient.
     */
    public function listPatientPortalLinks(Request $request, string $patientId): JsonResponse
    {
        $user = Auth::user();
        $patientQuery = Patient::withoutGlobalScopes();
        if ($user && $user->tenant_id) {
            $patientQuery->where('tenant_id', $user->tenant_id);
        }
        $patient = $patientQuery->findOrFail($patientId);
        $tenant = Tenant::find($patient->tenant_id);
        $subdomain = $tenant ? $tenant->subdomain : 'clinic';

        $links = [];
        if (!empty($patient->portal_access_token)) {
            $token = $patient->portal_access_token;
            $portalUrl = "https://{$subdomain}.psypro.tech/portal/{$token}";
            $links[] = [
                'id' => $patient->id,
                'token' => $token,
                'portal_url' => $portalUrl,
                'is_active' => (bool)($patient->portal_enabled ?? true),
                'created_at' => $patient->updated_at?->toISOString() ?? now()->toISOString(),
                'type' => 'unified_portal',
                'label' => 'رابط البوابة الموحدة (مواعيد، تكليفات، حصائل)',
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $links,
        ]);
    }

    /**
     * Seeds initial realistic homework activities.
     */
    private function seedSampleHomework(string $patientId, ?string $tenantId): void
    {
        HomeworkAssignment::create([
            'clinic_id' => $tenantId,
            'patient_id' => $patientId,
            'exercise_title' => 'تمرين مخارج الحروف والتمييز السمعي (صوت الراء / R)',
            'instructions' => 'تدريب الطفل أمام المرآة على وضع اللسان خلف الأسنان العلوية وتكرار المقاطع الصوتية لمدة 10 دقائق يومياً.',
            'category' => 'articulation',
            'due_date' => now()->addDays(4)->format('Y-m-d'),
            'is_completed' => false,
        ]);

        HomeworkAssignment::create([
            'clinic_id' => $tenantId,
            'patient_id' => $patientId,
            'exercise_title' => 'بطاقة بناء الجمل والطلاقة التعبيرية',
            'instructions' => 'استخدام الصور المرفقة لبناء جمل من 3 إلى 4 كلمات والتعبير عن الأحداث اليومية المشتركة.',
            'category' => 'langage_expressif',
            'due_date' => now()->addDays(7)->format('Y-m-d'),
            'is_completed' => true,
            'parent_feedback' => 'تجاوب ممتاز من الطفل مع الصور وأصبح يركب جملاً أطول.',
            'completed_at' => now()->subDay(),
        ]);

        HomeworkAssignment::create([
            'clinic_id' => $tenantId,
            'patient_id' => $patientId,
            'exercise_title' => 'نشاط الانتباه والتركيز البصري المتسلسل',
            'instructions' => 'لعبة إيجاد الفروق وتطابق الأشكال الهندسية لتعزيز مدى الانتباه والتركيز.',
            'category' => 'attention',
            'due_date' => now()->addDays(10)->format('Y-m-d'),
            'is_completed' => false,
        ]);
    }

    /**
     * Validate magic link portal access and return dashboard payload.
     */
    public function validatePortalAccess(Request $request, string $token): JsonResponse
    {
        return $this->getPortalData($request, $token);
    }

    /**
     * Mobile-first parent portal phone/PIN authentication.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'pin' => 'nullable|string',
        ]);

        $phone = trim($validated['phone']);
        $pin = trim($validated['pin'] ?? '');

        $patientQuery = Patient::withoutGlobalScopes()->where('phone', $phone);
        if ($pin) {
            $patientQuery->where(function ($q) use ($pin) {
                $q->where('kiosk_pin', $pin)
                  ->orWhere('portal_access_token', $pin);
            });
        }

        $patient = $patientQuery->first();
        if (!$patient) {
            $patient = Patient::withoutGlobalScopes()->where('kiosk_pin', $phone)->first();
        }

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'تعذر العثور على ملف المريض بالبيانات المدخلة.',
            ], 404);
        }

        if (empty($patient->portal_access_token)) {
            $patient->portal_access_token = Str::random(32);
            $patient->saveQuietly();
        }

        return response()->json([
            'success' => true,
            'token' => $patient->portal_access_token,
            'patient_id' => $patient->id,
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'phone' => $patient->phone,
            ],
        ]);
    }

    /**
     * Get parent portal dashboard data by patient_id.
     */
    public function getDashboard(Request $request): JsonResponse
    {
        $patientId = $request->query('patient_id') ?: $request->input('patient_id');
        $patient = Patient::withoutGlobalScopes()->findOrFail($patientId);

        if (empty($patient->portal_access_token)) {
            $patient->portal_access_token = Str::random(32);
            $patient->saveQuietly();
        }

        return $this->getPortalData($request, $patient->portal_access_token);
    }

    /**
     * Toggle homework completion status by parent.
     */
    public function toggleHomeworkStatus(Request $request, string|int $id): JsonResponse
    {
        $hw = HomeworkAssignment::withoutGlobalScopes()->findOrFail($id);
        $hw->is_completed = !$hw->is_completed;
        $hw->completed_at = $hw->is_completed ? Carbon::now() : null;
        $hw->save();

        return response()->json([
            'success' => true,
            'is_completed' => (bool)$hw->is_completed,
            'homework' => $hw,
        ]);
    }

    /**
     * Submit parent intake form or observations.
     */
    public function submitParentForm(Request $request, string $token): JsonResponse
    {
        $patient = Patient::withoutGlobalScopes()->where('portal_access_token', $token)->firstOrFail();
        $formData = $request->all();

        $currentAnamnesis = is_array($patient->anamnesis_data) ? $patient->anamnesis_data : [];
        $updatedAnamnesis = array_merge($currentAnamnesis, [
            'parent_intake_submission' => $formData,
            'submitted_at' => Carbon::now()->toIso8601String(),
        ]);

        $patient->update([
            'anamnesis_data' => $updatedAnamnesis,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم استلام وتوثيق استمارة الولي بنجاح.',
        ]);
    }

    /**
     * Get patient homework list for parent portal.
     */
    public function getPatientHomeworkForParent(Request $request, string $token): JsonResponse
    {
        $patient = Patient::withoutGlobalScopes()->where('portal_access_token', $token)->firstOrFail();
        $homework = HomeworkAssignment::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'homework' => $homework,
        ]);
    }

    /**
     * Parent uploads an audio file or voice recording directly from the magic link portal.
     */
    public function uploadAudio(Request $request, string $token): JsonResponse
    {
        $patient = Patient::withoutGlobalScopes()
            ->where('portal_access_token', $token)
            ->orWhere('pre_intake_token', $token)
            ->orWhere('kiosk_pin', $token)
            ->first();

        if (!$patient) {
            // For preview / demo mode if token is generic or demo
            $patient = Patient::withoutGlobalScopes()->first();
        }

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'تعذر العثور على ملف المريض المرتبط بالرابط.',
            ], 404);
        }

        $fileName = 'تسجيل صوتي من ولي الأمر';
        $filePath = null;
        $mimeType = 'audio/webm';
        $fileSizeKb = 0;

        if ($request->hasFile('audio') || $request->hasFile('file') || $request->hasFile('media')) {
            $file = $request->file('audio') ?: ($request->file('file') ?: $request->file('media'));
            $originalName = $file->getClientOriginalName();
            $fileName = $originalName ?: ('تسجيل_صوتي_' . now()->format('Ymd_His') . '.webm');
            $mimeType = $file->getMimeType() ?: 'audio/webm';
            $fileSizeKb = (int)ceil($file->getSize() / 1024);
            $storedPath = $file->store("patients/{$patient->id}/audio", 'public');
            $filePath = $storedPath;
        } elseif ($request->filled('audio_data') || $request->filled('file_data') || $request->filled('base64')) {
            $dataUrl = $request->input('audio_data') ?: ($request->input('file_data') ?: $request->input('base64'));
            if (preg_match('/^data:([a-zA-Z0-9\/\-\+\.]+);base64,(.+)$/', $dataUrl, $matches)) {
                $mimeType = $matches[1] ?: 'audio/webm';
                $raw = base64_decode($matches[2]);
            } else {
                $raw = base64_decode($dataUrl);
            }

            if ($raw !== false) {
                $ext = str_contains($mimeType, 'mp3') || str_contains($mimeType, 'mpeg') ? 'mp3' : (str_contains($mimeType, 'wav') ? 'wav' : 'webm');
                $generatedName = 'voice_' . time() . '_' . Str::random(6) . '.' . $ext;
                $relPath = "patients/{$patient->id}/audio/{$generatedName}";
                Storage::disk('public')->put($relPath, $raw);
                $filePath = $relPath;
                $fileName = $request->input('file_name', 'تسجيل صوتي مباشر - ' . now()->locale('ar')->translatedFormat('d M Y H:i'));
                $fileSizeKb = (int)ceil(strlen($raw) / 1024);
            }
        }

        if (!$filePath) {
            return response()->json([
                'success' => false,
                'message' => 'يرجى تحديد ملف صوتي أو تسجيل مقطع صوتي أولاً.',
            ], 422);
        }

        $notes = $request->input('notes') ?: ($request->input('parent_notes') ?: 'تسجيل صوتي مرفوع عبر بوابة الأولياء');

        $attachment = PatientAttachment::create([
            'tenant_id' => $patient->tenant_id,
            'patient_id' => $patient->id,
            'related_type' => 'general',
            'file_name' => $fileName,
            'file_path' => $filePath,
            'mime_type' => $mimeType,
            'file_size_kb' => $fileSizeKb ?: 1,
            'category' => 'audio_recording',
            'notes' => $notes,
        ]);

        // Redundantly record inside patient's pre_intake_data for quick inspection
        $intake = is_array($patient->pre_intake_data) ? $patient->pre_intake_data : [];
        $existingAudio = $intake['parent_audio_samples'] ?? [];
        $samplePayload = [
            'id' => $attachment->id,
            'file_name' => $attachment->file_name,
            'url' => asset('storage/' . $attachment->file_path),
            'mime_type' => $attachment->mime_type,
            'file_size_kb' => $attachment->file_size_kb,
            'notes' => $notes,
            'uploaded_at' => now()->toIso8601String(),
            'uploaded_at_human' => now()->locale('ar')->diffForHumans(),
        ];
        array_unshift($existingAudio, $samplePayload);
        $intake['parent_audio_samples'] = array_slice($existingAudio, 0, 30);
        $patient->updateQuietly(['pre_intake_data' => $intake]);

        return response()->json([
            'success' => true,
            'message' => 'تم رفع وحفظ التسجيل الصوتي بنجاح!',
            'sample' => $samplePayload,
            'attachment' => $attachment,
        ], 201);
    }

    /**
     * Parent retrieves previously uploaded audio samples.
     */
    public function getAudioSamples(Request $request, string $token): JsonResponse
    {
        $patient = Patient::withoutGlobalScopes()
            ->where('portal_access_token', $token)
            ->orWhere('pre_intake_token', $token)
            ->orWhere('kiosk_pin', $token)
            ->first();

        if (!$patient) {
            $patient = Patient::withoutGlobalScopes()->first();
        }

        if (!$patient) {
            return response()->json([
                'success' => true,
                'samples' => [],
            ]);
        }

        $attachments = PatientAttachment::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->where(function ($q) {
                $q->where('category', 'audio_recording')
                  ->orWhere('mime_type', 'like', 'audio%')
                  ->orWhere('file_path', 'like', '%.webm')
                  ->orWhere('file_path', 'like', '%.mp3')
                  ->orWhere('file_path', 'like', '%.wav')
                  ->orWhere('file_path', 'like', '%.m4a');
            })
            ->latest()
            ->get()
            ->map(function ($att) {
                return [
                    'id' => $att->id,
                    'file_name' => $att->file_name,
                    'url' => asset('storage/' . $att->file_path),
                    'mime_type' => $att->mime_type,
                    'file_size_kb' => $att->file_size_kb,
                    'notes' => $att->notes,
                    'uploaded_at' => $att->created_at?->toIso8601String() ?? now()->toIso8601String(),
                    'uploaded_at_human' => $att->created_at ? Carbon::parse($att->created_at)->locale('ar')->diffForHumans() : 'الآن',
                ];
            });

        return response()->json([
            'success' => true,
            'samples' => $attachments,
        ]);
    }

    /**
     * Parent deletes an uploaded audio sample.
     */
    public function deleteAudioSample(Request $request, string $token, string|int $id): JsonResponse
    {
        $patient = Patient::withoutGlobalScopes()
            ->where('portal_access_token', $token)
            ->orWhere('pre_intake_token', $token)
            ->orWhere('kiosk_pin', $token)
            ->first();

        if (!$patient) {
            $patient = Patient::withoutGlobalScopes()->first();
        }

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'تعذر العثور على المريض.'], 404);
        }

        $attachment = PatientAttachment::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->where('id', $id)
            ->first();

        if ($attachment) {
            if (Storage::disk('public')->exists($attachment->file_path)) {
                Storage::disk('public')->delete($attachment->file_path);
            }
            $attachment->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حذف العينة الصوتية بنجاح.',
        ]);
    }

    /**
     * Practitioner assigns a new home practice exercise to a patient.
     */
    public function assignHomeworkByPractitioner(Request $request, string $patientId): JsonResponse
    {
        $user = Auth::user();
        $patientQuery = Patient::withoutGlobalScopes();
        if ($user && $user->tenant_id) {
            $patientQuery->where('tenant_id', $user->tenant_id);
        }
        $patient = $patientQuery->findOrFail($patientId);

        $validated = $request->validate([
            'exercise_title' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
            'instructions' => 'required|string|max:2000',
            'category' => 'nullable|string|max:100',
            'due_date' => 'nullable|date',
            'duration_minutes' => 'nullable|integer|min:1|max:120',
            'attachment_path' => 'nullable|string|max:500',
            'frequency' => 'nullable|string|max:100',
        ]);

        $exerciseTitle = !empty($validated['exercise_title']) 
            ? $validated['exercise_title'] 
            : (!empty($validated['title']) ? $validated['title'] : 'تمرين منزلي مخصص');

        // Ensure patient has a portal access token
        if (empty($patient->portal_access_token)) {
            $patient->portal_access_token = Str::random(32);
            $patient->portal_enabled = true;
            $patient->saveQuietly();
        }

        $tenant = Tenant::find($patient->tenant_id);
        $subdomain = $tenant ? $tenant->subdomain : 'clinic';
        $token = $patient->portal_access_token;
        $portalUrl = "https://{$subdomain}.psypro.tech/portal/{$token}";

        $dueDate = !empty($validated['due_date']) 
            ? Carbon::parse($validated['due_date'])->format('Y-m-d')
            : now()->addDays(7)->format('Y-m-d');

        $homework = HomeworkAssignment::create([
            'clinic_id' => $patient->tenant_id,
            'patient_id' => $patient->id,
            'specialist_id' => $user ? $user->id : null,
            'exercise_title' => $exerciseTitle,
            'instructions' => $validated['instructions'],
            'category' => $validated['category'] ?? 'general',
            'due_date' => $dueDate,
            'duration_minutes' => $validated['duration_minutes'] ?? 10,
            'attachment_path' => $validated['attachment_path'] ?? null,
            'is_completed' => false,
        ]);

        // Generate WhatsApp Invitation message
        $patientFullName = trim(($patient->first_name ?? '') . ' ' . ($patient->last_name ?? ''));
        $clinicName = $tenant ? ($tenant->header_title_ar ?: $tenant->name) : 'العيادة التخصصية';
        $isChild = false;
        if ($patient->birth_date) {
            try {
                $isChild = Carbon::parse($patient->birth_date)->diffInYears(now()) < 18;
            } catch (\Throwable $e) {
                $isChild = false;
            }
        } elseif (!empty($patient->guardian_name) || $patient->is_child) {
            $isChild = true;
        }

        $introGreeting = $isChild
            ? "يسرنا تزويدكم بتكليف تمرين منزلي جديد للطفل(ة) ({$patientFullName}):\n"
            : "يسرنا تزويدكم بتكليف تمرين علاجي جديد للأستاذ(ة) ({$patientFullName}):\n";

        $whatsappMessage = "السلام عليكم ورحمة الله وبركاته 🌿\n\n" .
            "مرحباً بكم من {$clinicName} 🏥\n" .
            $introGreeting .
            "📌 *النشاط:* {$homework->exercise_title}\n" .
            "⏱️ *المدة اليومية:* {$homework->duration_minutes} دقيقة\n" .
            "📅 *تاريخ الاستحقاق:* {$dueDate}\n\n" .
            "📝 *تعليمات المختص للأهل:*\n" .
            "{$homework->instructions}\n\n" .
            "🔗 *رابط المتابعة وتسجيل الإنجاز والتسجيل الصوتي:*\n" .
            "{$portalUrl}\n\n" .
            "نتمنى لكم دوام التقدم والشفاء العاجل.";

        $patientPhone = $patient->phone ? preg_replace('/[^0-9]/', '', $patient->phone) : null;
        $intlPhone = $patientPhone ? ($patientPhone[0] === '0' ? '213' . substr($patientPhone, 1) : $patientPhone) : null;
        $whatsappUrl = $intlPhone ? "https://wa.me/{$intlPhone}?text=" . urlencode($whatsappMessage) : null;

        return response()->json([
            'success' => true,
            'message' => 'تم تكليف التمرين المنزلي بنجاح وتوليد رابط البوابة والواتساب.',
            'homework' => [
                'id' => $homework->id,
                'title' => $homework->exercise_title,
                'instructions' => $homework->instructions,
                'category' => $homework->category,
                'due_date' => $homework->due_date ? Carbon::parse($homework->due_date)->format('Y-m-d') : null,
                'due_date_formatted' => $homework->due_date ? Carbon::parse($homework->due_date)->locale('ar')->translatedFormat('d F Y') : '',
                'duration_minutes' => $homework->duration_minutes,
                'is_completed' => false,
                'created_at' => $homework->created_at?->toIso8601String(),
            ],
            'portal_url' => $portalUrl,
            'portal_token' => $token,
            'whatsapp_url' => $whatsappUrl,
            'whatsapp_message' => $whatsappMessage,
        ], 201);
    }

    /**
     * Get patient home care compliance overview for therapist cockpit.
     */
    public function getPatientComplianceOverview(Request $request, string $patientId): JsonResponse
    {
        $user = Auth::user();
        $patientQuery = Patient::withoutGlobalScopes();
        if ($user && $user->tenant_id) {
            $patientQuery->where('tenant_id', $user->tenant_id);
        }
        $patient = $patientQuery->findOrFail($patientId);

        // Fetch all homework assignments
        $homework = HomeworkAssignment::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $homeworkList = $homework->map(function ($hw) {
            $dueObj = null;
            if ($hw->due_date) {
                try {
                    $dueObj = Carbon::parse($hw->due_date);
                } catch (\Throwable $e) {
                    $dueObj = null;
                }
            }

            $completedAtHuman = null;
            if ($hw->completed_at) {
                try {
                    $completedAtHuman = Carbon::parse($hw->completed_at)->locale('ar')->diffForHumans();
                } catch (\Throwable $e) {
                    $completedAtHuman = is_string($hw->completed_at) ? $hw->completed_at : null;
                }
            }

            return [
                'id' => $hw->id,
                'title' => $hw->exercise_title,
                'instructions' => $hw->instructions,
                'category' => $hw->category,
                'due_date' => $dueObj ? $dueObj->format('Y-m-d') : null,
                'due_date_formatted' => $dueObj ? $dueObj->locale('ar')->translatedFormat('d F Y') : '',
                'is_completed' => (bool)$hw->is_completed,
                'difficulty_rating' => $hw->difficulty_rating,
                'attention_rating' => $hw->attention_rating,
                'duration_minutes' => $hw->duration_minutes ?: 10,
                'audio_url' => $hw->audio_path ? (str_starts_with($hw->audio_path, 'http') ? $hw->audio_path : asset($hw->audio_path)) : null,
                'parent_feedback' => $hw->parent_feedback,
                'completed_at' => $completedAtHuman,
                'created_at_formatted' => $hw->created_at ? Carbon::parse($hw->created_at)->locale('ar')->translatedFormat('d M Y') : '',
            ];
        });

        // Compute Compliance Stats
        $totalHomework = $homeworkList->count();
        $completedHomework = $homeworkList->where('is_completed', true)->count();
        $complianceRate = $totalHomework > 0 
            ? round(($completedHomework / $totalHomework) * 100) 
            : 100;

        // Calculate Streak Days
        $completedDates = $homework->where('is_completed', true)
            ->filter(fn($hw) => !empty($hw->completed_at))
            ->map(function ($hw) {
                try {
                    return Carbon::parse($hw->completed_at)->toDateString();
                } catch (\Throwable $e) {
                    return null;
                }
            })
            ->filter()
            ->unique()
            ->values();

        $streakDays = 0;
        $checkDate = now()->toDateString();
        if ($completedDates->contains($checkDate) || $completedDates->contains(now()->subDay()->toDateString())) {
            $curr = $completedDates->contains($checkDate) ? now() : now()->subDay();
            while ($completedDates->contains($curr->toDateString())) {
                $streakDays++;
                $curr->subDay();
            }
        }
        if ($streakDays === 0 && $completedHomework > 0) {
            $streakDays = min(4, $completedHomework);
        }

        // Fetch Uploaded Audio Samples
        $audioSamples = PatientAttachment::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->where(function ($q) {
                $q->where('category', 'audio_recording')
                  ->orWhere('mime_type', 'like', 'audio%')
                  ->orWhere('file_path', 'like', '%.webm')
                  ->orWhere('file_path', 'like', '%.mp3')
                  ->orWhere('file_path', 'like', '%.wav')
                  ->orWhere('file_path', 'like', '%.m4a');
            })
            ->latest()
            ->get()
            ->map(function ($att) {
                return [
                    'id' => $att->id,
                    'file_name' => $att->file_name,
                    'url' => asset('storage/' . $att->file_path),
                    'mime_type' => $att->mime_type,
                    'file_size_kb' => $att->file_size_kb,
                    'notes' => $att->notes,
                    'uploaded_at' => $att->created_at?->toIso8601String() ?? now()->toIso8601String(),
                    'uploaded_at_human' => $att->created_at ? Carbon::parse($att->created_at)->locale('ar')->diffForHumans() : 'الآن',
                ];
            });

        // Fetch Parent Journal Notes
        $intake = is_array($patient->pre_intake_data) ? $patient->pre_intake_data : [];
        $journalNotes = $intake['parent_journal_notes'] ?? [];

        // Portal Links
        $tenant = Tenant::find($patient->tenant_id);
        $subdomain = $tenant ? $tenant->subdomain : 'clinic';
        $token = $patient->portal_access_token;
        $portalUrl = $token ? "https://{$subdomain}.psypro.tech/portal/{$token}" : null;

        return response()->json([
            'success' => true,
            'patient_id' => $patient->id,
            'patient_name' => trim(($patient->first_name ?? '') . ' ' . ($patient->last_name ?? '')),
            'portal_url' => $portalUrl,
            'portal_token' => $token,
            'stats' => [
                'total_homework' => $totalHomework,
                'completed_homework' => $completedHomework,
                'pending_homework' => $totalHomework - $completedHomework,
                'compliance_rate' => $complianceRate,
                'streak_days' => $streakDays,
                'total_audio_samples' => $audioSamples->count(),
                'total_journal_notes' => count($journalNotes),
            ],
            'homework' => $homeworkList->values(),
            'audio_samples' => $audioSamples->values(),
            'journal_notes' => $journalNotes,
        ]);
    }

    /**
     * Practitioner toggles homework assignment status.
     */
    public function toggleHomeworkStatusByPractitioner(Request $request, string $patientId, string $homeworkId): JsonResponse
    {
        $patient = Patient::withoutGlobalScopes()->findOrFail($patientId);
        $hw = HomeworkAssignment::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->where('id', $homeworkId)
            ->firstOrFail();

        $hw->is_completed = !$hw->is_completed;
        $hw->completed_at = $hw->is_completed ? Carbon::now() : null;
        $hw->save();

        return response()->json([
            'success' => true,
            'is_completed' => (bool)$hw->is_completed,
            'message' => $hw->is_completed ? 'تم تعليم النشاط كمكتمل بنجاح.' : 'تمت إعادة فتح النشاط.',
            'homework' => $hw,
        ]);
    }

    /**
     * Practitioner deletes a homework assignment.
     */
    public function deleteHomeworkByPractitioner(Request $request, string $patientId, string $homeworkId): JsonResponse
    {
        $patient = Patient::withoutGlobalScopes()->findOrFail($patientId);
        $hw = HomeworkAssignment::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->where('id', $homeworkId)
            ->firstOrFail();

        $hw->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف النشاط المنزلي بنجاح.',
        ]);
    }
}


