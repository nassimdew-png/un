<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\ClinicSubscription;
use App\Models\SaasInvoice;
use App\Models\SaasPaymentRequest;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\User;
use App\Services\AuditLogger;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SubscriptionLifecycleController extends Controller
{
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
                abort(403, 'غير مصرح لك بالوصول لإدارة دورة حياة الاشتراكات.');
            }
            return $user;
        }

        return null;
    }

    /**
     * Get Lifecycle Overview: statistics, categorization, and smart countdowns.
     * GET /api/super-admin/lifecycle/overview
     */
    public function getLifecycleOverview(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $now = Carbon::now();
        $statusFilter = $request->query('status', 'all');
        $search = $request->query('search', '');

        $tenants = Tenant::with(['plan'])->get();

        $counts = [
            'total' => $tenants->count(),
            'active' => 0,
            'expiring_soon' => 0,
            'in_grace_period' => 0,
            'suspended' => 0,
            'trial' => 0,
            'bypassed' => 0,
            'pending_proofs' => SaasPaymentRequest::where('status', 'pending')->count(),
            'pending_proofs_amount' => (float) SaasPaymentRequest::where('status', 'pending')->sum('amount_dzd'),
        ];

        $enrichedClinics = [];

        foreach ($tenants as $tenant) {
            $owner = User::where('tenant_id', $tenant->id)->first();
            $plan = $tenant->plan;
            $planName = $tenant->custom_plan_name ?? ($plan ? $plan->name_ar : 'باقة مخصصة');

            // Calculate lifecycle status & days remaining
            $expiryDate = $tenant->subscription_ends_at ?? $tenant->trial_ends_at;
            $daysRemaining = 0;
            $lifecycleStatus = 'active';
            $statusLabelAr = 'نشط ومستقر 🟢';
            $inGracePeriod = false;
            $graceHoursRemaining = 0;

            if ($tenant->bypass_expiration) {
                $daysRemaining = null;
                $lifecycleStatus = 'bypassed';
                $statusLabelAr = 'دائم / VIP 💎';
                $counts['bypassed']++;
            } elseif ($tenant->status === 'trial' || $tenant->status === 'trialing') {
                $daysRemaining = $tenant->trial_ends_at ? (int) $now->diffInDays($tenant->trial_ends_at, false) : 14;
                $lifecycleStatus = 'trial';
                if ($tenant->trial_ends_at && $now->greaterThan($tenant->trial_ends_at)) {
                    $pastDays = abs($daysRemaining);
                    $statusLabelAr = $pastDays === 0 ? 'انتهت الفترة التجريبية اليوم 🔴' : "منتهية منذ {$pastDays} " . ($pastDays > 10 ? 'يوماً' : 'أيام') . ' 🔴';
                } else {
                    $statusLabelAr = $daysRemaining === 0 ? 'تنتهي التجربة اليوم! ⚠️' : "فترة تجريبية ({$daysRemaining} يوم متبقي) ⏳";
                }
                $counts['trial']++;
            } elseif ($tenant->status === 'suspended') {
                $daysRemaining = 0;
                $lifecycleStatus = 'suspended';
                $statusLabelAr = 'معلق / مجمد ⛔';
                $counts['suspended']++;
            } else {
                if ($tenant->subscription_ends_at) {
                    $daysRemaining = (int) $now->diffInDays($tenant->subscription_ends_at, false);

                    if ($daysRemaining > 7) {
                        $lifecycleStatus = 'active';
                        $statusLabelAr = 'نشط ومستقر 🟢';
                        $counts['active']++;
                    } elseif ($daysRemaining >= 1 && $daysRemaining <= 7) {
                        $lifecycleStatus = 'expiring_soon';
                        $statusLabelAr = "ينتهي خلال {$daysRemaining} أيام 🟡";
                        $counts['expiring_soon']++;
                    } elseif ($daysRemaining === 0) {
                        $lifecycleStatus = 'expiring_soon';
                        $statusLabelAr = 'ينتهي اليوم! ⚠️';
                        $counts['expiring_soon']++;
                    } else {
                        // Expired - check grace period
                        if ($tenant->grace_period_ends_at && Carbon::parse($tenant->grace_period_ends_at)->isFuture()) {
                            $inGracePeriod = true;
                            $graceHoursRemaining = (int) $now->diffInHours($tenant->grace_period_ends_at, false);
                            $lifecycleStatus = 'in_grace_period';
                            $statusLabelAr = "في فترة السماح الطبي ({$graceHoursRemaining} س متبقية) 🟠";
                            $counts['in_grace_period']++;
                        } else {
                            $lifecycleStatus = 'suspended';
                            $statusLabelAr = 'منتهي الصلاحية 🔴';
                            $counts['suspended']++;
                        }
                    }
                } else {
                    $lifecycleStatus = 'active';
                    $statusLabelAr = 'دائم / غير محدد 🟢';
                    $daysRemaining = null;
                    $counts['active']++;
                }
            }

            // Has pending payment request?
            $hasPendingProof = SaasPaymentRequest::where('clinic_id', $tenant->id)
                ->where('status', 'pending')
                ->exists();

            $clinicData = [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
                'type' => $tenant->type,
                'wilaya' => $tenant->wilaya,
                'phone' => $tenant->phone ?? ($owner ? $owner->phone : '--'),
                'doctor_name' => $owner ? $owner->name : 'المشرف المسؤول',
                'doctor_email' => $owner ? $owner->email : '--',
                'plan_name' => $planName,
                'plan_id' => $tenant->plan_id,
                'billing_cycle' => $tenant->billing_cycle ?? 'yearly',
                'subscription_ends_at' => $tenant->subscription_ends_at ? $tenant->subscription_ends_at->format('Y-m-d') : null,
                'trial_ends_at' => $tenant->trial_ends_at ? $tenant->trial_ends_at->format('Y-m-d') : null,
                'days_remaining' => $daysRemaining,
                'lifecycle_status' => $lifecycleStatus,
                'status_label_ar' => $statusLabelAr,
                'in_grace_period' => $inGracePeriod,
                'grace_period_ends_at' => $tenant->grace_period_ends_at ? $tenant->grace_period_ends_at->format('Y-m-d H:i') : null,
                'last_chased_at' => $tenant->last_chased_at ? $tenant->last_chased_at->format('Y-m-d H:i') : null,
                'chase_count' => (int) ($tenant->chase_count ?? 0),
                'last_chased_template' => $tenant->last_chased_template,
                'has_pending_proof' => $hasPendingProof,
                'bypass_expiration' => (bool) $tenant->bypass_expiration,
            ];

            // Filter
            if ($statusFilter !== 'all' && $lifecycleStatus !== $statusFilter) {
                continue;
            }

            if (!empty($search)) {
                $q = mb_strtolower($search);
                $matches = str_contains(mb_strtolower($tenant->name), $q)
                    || str_contains(mb_strtolower($tenant->subdomain), $q)
                    || str_contains(mb_strtolower($clinicData['doctor_name']), $q)
                    || str_contains(mb_strtolower($clinicData['phone']), $q);
                if (!$matches) {
                    continue;
                }
            }

            $enrichedClinics[] = $clinicData;
        }

        return response()->json([
            'success' => true,
            'counts' => $counts,
            'clinics' => $enrichedClinics,
            'coordinates' => $this->getPlatformCoordinates(),
        ]);
    }

    /**
     * Send Smart Renewal Chaser (WhatsApp & Email Generator).
     * POST /api/super-admin/lifecycle/clinics/{id}/chase
     */
    public function sendRenewalChaser(Request $request, string $clinicId): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $validated = $request->validate([
            'template' => 'required|string|in:early_7d,urgent_24h,grace_period,suspension,custom',
            'custom_message' => 'nullable|string|max:1000',
        ]);

        $tenant = Tenant::findOrFail($clinicId);
        $owner = User::where('tenant_id', $tenant->id)->first();
        $coordinates = $this->getPlatformCoordinates();

        $doctorName = $owner ? $owner->name : 'دكتور(ة) الفاضل(ة)';
        $phone = $tenant->phone ?? ($owner ? $owner->phone : '');
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = '213' . substr($cleanPhone, 1);
        } elseif (!str_starts_with($cleanPhone, '213') && strlen($cleanPhone) === 9) {
            $cleanPhone = '213' . $cleanPhone;
        }

        $expiryDate = $tenant->subscription_ends_at ? $tenant->subscription_ends_at->format('d/m/Y') : 'قريباً';
        $planName = $tenant->custom_plan_name ?? ($tenant->plan ? $tenant->plan->name_ar : 'باقة العيادة الطبية المتقدمة');
        $amountDzd = $tenant->custom_price_dzd ?? ($tenant->plan ? $tenant->plan->price_yearly : 25000);
        $amountFormatted = number_format($amountDzd, 0) . ' د.ج';

        $template = $validated['template'];
        $message = '';

        if ($template === 'custom' && !empty($validated['custom_message'])) {
            $message = $validated['custom_message'];
        } else {
            $message = match ($template) {
                'early_7d' => "مرحباً د. {$doctorName}، تحية طيبة من فريق منصة PsyPro الطبية 🌿\n\nنود تذكيركم بأن اشتراك عيادتكم ({$tenant->name}) في [{$planName}] سينتهي في {$expiryDate}.\n\nلضمان استمرار وصولكم غير المنقطع لسجلات المرضى والجلسات والذكاء الاصطناعي، يرجى التجديد عبر بريدي موب:\n💳 RIP: {$coordinates['rip']}\n👤 المستفيد: {$coordinates['titulaire']}\n💰 المبلغ السنوي: {$amountFormatted}\n\nبعد التحويل، يرجى إرسال صورة الوصل لتفعيل الاشتراك فوراً. دمت في رعاية الله.",

                'urgent_24h' => "🚨 تنبيه عاجل — منصة PsyPro الطبية\nد. {$doctorName} المحترم(ة)،\n\nاشتراك عيادتكم ({$tenant->name}) سينتهي غداً ({$expiryDate})!\nلتجنب تجميد المواعيد والملفات السريرية، يرجى إتمام التجديد:\n💳 BaridiMob RIP: {$coordinates['rip']}\n💰 المبلغ: {$amountFormatted}\n\nفي حال تم التحويل يرجى الرد بصورة الوصل لاعتماده فوراً.",

                'grace_period' => "⚠️ إشعار فترة السماح الطبية — PsyPro\nد. {$doctorName}،\n\nلقد انتهت صلاحية اشتراك عيادة ({$tenant->name})، وقد تم تفعيل [فترة سماح طبية خاصة] حرصاً منا على متابعة مرضاكم دون انقطاع.\n\nيرجى تسوية الاشتراك خلال 48 ساعة لتفادي الحظر الآلي للنظام:\n💳 RIP: {$coordinates['rip']}\n📞 خدمة العملاء: {$coordinates['phone']}",

                'suspension' => "⛔ إشعار تعليق الحساب — منصة PsyPro\nد. {$doctorName}،\n\nنحيطكم علماً بأنه تم تعليق حساب عيادة ({$tenant->name}) مؤقتاً لانتهاء فترة السماح.\n\nيمكنكم استعادة وتفعيل الحساب وكافة البيانات الطبية فورياً بمجرد إرسال وصل التجديد:\n💳 RIP: {$coordinates['rip']}\n💰 المبلغ: {$amountFormatted}\n\nنحن بانتظاركم دائماً.",

                default => "تحية طيبة د. {$doctorName} من فريق PsyPro، نرجو التكرم بالاطلاع على حالة تجديد اشتراك عيادتكم."
            };
        }

        $whatsappUrl = !empty($cleanPhone)
            ? 'https://wa.me/' . $cleanPhone . '?text=' . urlencode($message)
            : null;

        // Update chaser stats
        $tenant->last_chased_at = now();
        $tenant->chase_count = ((int)$tenant->chase_count) + 1;
        $tenant->last_chased_template = $template;
        $tenant->save();

        // Audit Log
        AuditLogger::log(
            'subscription.chaser_sent',
            "تم إرسال تذكير تجديد اشتراك (قالب: {$template}) لعيادة ({$tenant->name}) عبر الواتساب/البريد",
            'info',
            'Tenant',
            $tenant->id,
            [
                'doctor_name' => $doctorName,
                'phone' => $phone,
                'template' => $template,
                'whatsapp_url' => $whatsappUrl ? 'Generated' : 'No Phone',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "تم تجهيز رسالة التذكير بنجاح وتسجيل العملية في سجل التدقيق.",
            'whatsapp_url' => $whatsappUrl,
            'message_text' => $message,
            'chase_count' => $tenant->chase_count,
            'last_chased_at' => $tenant->last_chased_at->format('Y-m-d H:i'),
        ]);
    }

    /**
     * Grant Medical Grace Period.
     * POST /api/super-admin/lifecycle/clinics/{id}/grace-period
     */
    public function grantGracePeriod(Request $request, string $clinicId): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $validated = $request->validate([
            'days' => 'required|integer|min:1|max:30',
            'notes' => 'nullable|string|max:255',
        ]);

        $tenant = Tenant::findOrFail($clinicId);
        $days = (int) $validated['days'];
        $now = Carbon::now();

        $baseDate = ($tenant->grace_period_ends_at && $tenant->grace_period_ends_at->isFuture())
            ? $tenant->grace_period_ends_at
            : $now;

        $newGraceEnd = $baseDate->copy()->addDays($days);
        $tenant->grace_period_ends_at = $newGraceEnd;
        $tenant->status = 'active';
        $tenant->save();

        AuditLogger::log(
            'subscription.grace_period_granted',
            "تم منح فترة سماح طبية للعيادة ({$tenant->name}) حتى تاريخ " . $newGraceEnd->format('d/m/Y H:i'),
            'warning',
            'Tenant',
            $tenant->id,
            [
                'days' => $days,
                'new_grace_end' => $newGraceEnd->toISOString(),
                'notes' => $validated['notes'] ?? 'فترة سماح مقدمة من المشرف العام لمتابعة الحالات السريرية.',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "تم تمديد فترة السماح الطبية لعيادة ({$tenant->name}) بنجاح حتى " . $newGraceEnd->format('d/m/Y H:i'),
            'grace_period_ends_at' => $newGraceEnd->format('Y-m-d H:i'),
        ]);
    }

    /**
     * Manual Quick Renewal by Super Admin.
     * POST /api/super-admin/lifecycle/clinics/{id}/manual-renew
     */
    public function manualRenewClinic(Request $request, string $clinicId): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $validated = $request->validate([
            'plan_id' => 'nullable',
            'duration_months' => 'required|integer|in:1,3,6,12,24',
            'amount_dzd' => 'required|numeric|min:0',
            'payment_method' => 'required|string|in:baridimob,ccp,bank_transfer,cash,free_grant',
            'reference' => 'nullable|string|max:100',
            'admin_notes' => 'nullable|string|max:255',
        ]);

        $tenant = Tenant::findOrFail($clinicId);
        $now = Carbon::now();
        $months = (int) $validated['duration_months'];

        // If plan_id is provided, resolve and update the tenant's plan
        $plan = null;
        if (!empty($validated['plan_id'])) {
            $plan = SubscriptionPlan::where('id', $validated['plan_id'])
                ->orWhere('slug', $validated['plan_id'])
                ->first();
            if ($plan) {
                $tenant->plan_id = (string) $plan->id;
            }
        } elseif ($tenant->plan_id) {
            $plan = SubscriptionPlan::find($tenant->plan_id);
        }

        $currentEnd = ($tenant->subscription_ends_at && $tenant->subscription_ends_at->gt($now))
            ? $tenant->subscription_ends_at
            : $now;

        $newEnd = $currentEnd->copy()->addMonths($months);

        $tenant->subscription_ends_at = $newEnd;
        $tenant->status = 'active';
        $tenant->grace_period_ends_at = null; // Clear grace period
        $tenant->save();

        // Update or create ClinicSubscription record
        $sub = ClinicSubscription::where('clinic_id', $tenant->id)->latest()->first();
        if (!$sub) {
            $sub = new ClinicSubscription(['clinic_id' => $tenant->id]);
        }
        $sub->subscription_plan_id = $plan ? $plan->id : $tenant->plan_id;
        $sub->starts_at = $now;
        $sub->ends_at = $newEnd;
        $sub->status = 'active';
        $sub->payment_reference = $validated['reference'] ?? 'MANUAL_SUPERADMIN_' . time();
        $sub->notes = $validated['admin_notes'] ?? 'تجديد اشتراك يدوي من لوحة السوبر أدمن.';
        $sub->save();

        // Generate official SaaS Invoice
        $invoiceNumber = 'INV-SAAS-' . date('Y') . '-' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
        $invoice = SaasInvoice::create([
            'invoice_number' => $invoiceNumber,
            'clinic_id' => $tenant->id,
            'subscription_plan_id' => $plan ? $plan->id : $tenant->plan_id,
            'amount_dzd' => (float)$validated['amount_dzd'],
            'billing_cycle' => $months >= 12 ? 'yearly' : 'monthly',
            'period_start' => $now,
            'period_end' => $newEnd,
            'payment_method' => $validated['payment_method'],
        ]);

        AuditLogger::log(
            'subscription.manual_renew',
            "قام المشرف العام بتجديد اشتراك عيادة ({$tenant->name}) يدوياً لمدة {$months} أشهر حتى تاريخ " . $newEnd->format('d/m/Y'),
            'info',
            'Tenant',
            $tenant->id,
            [
                'amount_dzd' => $validated['amount_dzd'],
                'months' => $months,
                'new_end' => $newEnd->toISOString(),
                'invoice_number' => $invoiceNumber,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "تم تجديد اشتراك عيادة ({$tenant->name}) بنجاح حتى " . $newEnd->format('d/m/Y') . " مع إصدار الفاتورة رقم {$invoiceNumber}.",
            'subscription_ends_at' => $newEnd->format('Y-m-d'),
            'invoice' => $invoice,
        ]);
    }

    /**
     * Get BaridiMob Payment Proof Inbox.
     * GET /api/super-admin/lifecycle/proofs
     */
    public function getPaymentProofInbox(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $status = $request->query('status', 'all');

        $query = SaasPaymentRequest::with(['clinic', 'plan', 'reviewer'])->latest();

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $proofs = $query->paginate(25);

        return response()->json([
            'success' => true,
            'data' => $proofs->items(),
            'total' => $proofs->total(),
            'pending_count' => SaasPaymentRequest::where('status', 'pending')->count(),
        ]);
    }

    /**
     * Approve BaridiMob Payment Proof.
     * POST /api/super-admin/lifecycle/proofs/{id}/approve
     */
    public function approvePaymentProof(Request $request, int $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $proof = SaasPaymentRequest::with(['clinic', 'plan'])->findOrFail($id);

        if ($proof->status === 'approved') {
            return response()->json(['success' => false, 'message' => 'تم اعتماد هذا الوصل مسبقاً.'], 422);
        }

        $tenant = Tenant::findOrFail($proof->clinic_id);
        $now = Carbon::now();
        $cycle = $proof->billing_cycle ?? 'yearly';

        $currentEnd = ($tenant->subscription_ends_at && $tenant->subscription_ends_at->gt($now))
            ? $tenant->subscription_ends_at
            : $now;

        $newEnd = $cycle === 'yearly'
            ? $currentEnd->copy()->addYear()
            : $currentEnd->copy()->addMonth();

        $tenant->subscription_ends_at = $newEnd;
        $tenant->status = 'active';
        $tenant->grace_period_ends_at = null;
        $tenant->save();

        // Update proof
        $reviewer = Auth::user();
        $proof->status = 'approved';
        $proof->reviewed_by = $reviewer ? $reviewer->id : 1;
        $proof->reviewed_at = $now;
        $proof->admin_notes = $request->input('admin_notes', 'تم التحقق من مطابقة الحوالة واعتماد التجديد بنجاح.');
        $proof->save();

        // Generate Invoice
        $invoiceNumber = 'INV-SAAS-' . date('Y') . '-' . str_pad($proof->id, 5, '0', STR_PAD_LEFT);
        $invoice = SaasInvoice::create([
            'invoice_number' => $invoiceNumber,
            'clinic_id' => $tenant->id,
            'subscription_plan_id' => $proof->subscription_plan_id,
            'payment_request_id' => $proof->id,
            'amount_dzd' => $proof->amount_dzd,
            'billing_cycle' => $cycle,
            'period_start' => $now,
            'period_end' => $newEnd,
            'payment_method' => $proof->payment_method ?? 'baridimob',
        ]);

        // Process coupon redemption if coupon code attached
        if (!empty($proof->coupon_code)) {
            $coupon = \App\Models\DiscountCoupon::where('code', $proof->coupon_code)->first();
            if ($coupon) {
                $coupon->increment('used_count');
                \App\Models\CouponRedemption::create([
                    'coupon_id' => $coupon->id,
                    'clinic_id' => $tenant->id,
                    'original_amount_dzd' => $proof->original_amount_dzd ?: $proof->amount_dzd,
                    'discount_applied_dzd' => $proof->discount_amount_dzd ?: 0,
                    'final_amount_dzd' => $proof->amount_dzd,
                    'invoice_id' => $invoice->id,
                    'payment_request_id' => $proof->id,
                    'redeemed_at' => $now,
                ]);
            }
        }

        // Process referral rewards if clinic registered via referral code
        if (!empty($tenant->referred_by_code)) {
            $refCode = $tenant->referred_by_code;
            $partner = \App\Models\AffiliateReferral::where('referral_code', $refCode)->first();
            if ($partner) {
                $partner->increment('total_referred_clinics');
                $commission = round(($proof->amount_dzd * ($partner->commission_rate ?: 15.00)) / 100, 2);
                $partner->increment('total_earned_dzd', $commission);
            }
            $peerClinic = \App\Models\Tenant::where('referral_code', $refCode)->first();
            if ($peerClinic && $peerClinic->id !== $tenant->id) {
                $peerCurrentEnd = ($peerClinic->subscription_ends_at && $peerClinic->subscription_ends_at->gt($now))
                    ? $peerClinic->subscription_ends_at
                    : $now;
                $peerClinic->subscription_ends_at = $peerCurrentEnd->copy()->addDays(30);
                $peerClinic->referral_free_days_earned = ($peerClinic->referral_free_days_earned ?? 0) + 30;
                $peerClinic->save();
            }
        }

        AuditLogger::log(
            'subscription.proof_approved',
            "تم اعتماد وصل سداد بريدي موب للعيادة ({$tenant->name}) بمبلغ {$proof->amount_dzd} د.ج وتمديد الاشتراك حتى " . $newEnd->format('d/m/Y'),
            'info',
            'SaasPaymentRequest',
            (string) $proof->id,
            [
                'clinic_id' => $tenant->id,
                'amount_dzd' => $proof->amount_dzd,
                'transaction_ref' => $proof->transaction_reference,
                'invoice_number' => $invoiceNumber,
                'coupon_code' => $proof->coupon_code,
                'referred_by_code' => $tenant->referred_by_code,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "تم اعتماد وصل التحويل بنجاح وتفعيل اشتراك العيادة حتى " . $newEnd->format('d/m/Y') . " مع إصدار الفاتورة رقم {$invoiceNumber}.",
            'subscription_ends_at' => $newEnd->format('Y-m-d'),
            'invoice' => $invoice,
        ]);
    }

    /**
     * Reject BaridiMob Payment Proof.
     * POST /api/super-admin/lifecycle/proofs/{id}/reject
     */
    public function rejectPaymentProof(Request $request, int $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $proof = SaasPaymentRequest::with(['clinic'])->findOrFail($id);
        $reviewer = Auth::user();

        $proof->status = 'rejected';
        $proof->admin_notes = $validated['reason'];
        $proof->reviewed_by = $reviewer ? $reviewer->id : 1;
        $proof->reviewed_at = now();
        $proof->save();

        AuditLogger::log(
            'subscription.proof_rejected',
            "تم رفض وصل سداد لعيادة (" . ($proof->clinic->name ?? 'N/A') . ") بسبب: {$validated['reason']}",
            'warning',
            'SaasPaymentRequest',
            (string) $proof->id,
            ['reason' => $validated['reason']]
        );

        return response()->json([
            'success' => true,
            'message' => 'تم رفض وصل السداد وتوثيق سبب الرفض بنجاح.',
        ]);
    }

    /**
     * Coordinates for BaridiMob & CCP.
     */
    protected function getPlatformCoordinates(): array
    {
        return [
            'rip' => '00799999002233445566',
            'ccp' => '20045678',
            'cle' => '45',
            'titulaire' => 'SaaS PsyPro Algérie (EURL HealthTech Solutions)',
            'phone' => '+213 555 12 34 56',
            'email' => 'finance@psypro.tech',
            'default_grace_days' => 5,
        ];
    }
}
