<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\SubscriptionPlan;
use App\Models\SaasPaymentRequest;
use App\Models\SaasInvoice;
use App\Models\DiscountCoupon;
use App\Models\AffiliateReferral;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ClinicSubscriptionController extends Controller
{
    /**
     * Get the current clinic subscription status, active plans catalog, and payment coordinates.
     */
    public function getCurrentSubscription(Request $request): JsonResponse
    {
        $user = Auth::user();
        $tenant = $user ? $user->tenant : Tenant::first();
        if (!$tenant) {
            $tenant = new Tenant([
                'id' => '00000000-0000-0000-0000-000000000000',
                'name' => 'العيادة الافتراضية',
                'status' => 'active',
                'plan_id' => 1,
            ]);
        }

        // 1. Current tenant's plan & subscription details
        $currentPlan = null;
        if ($tenant && $tenant->plan_id) {
            $currentPlan = SubscriptionPlan::find($tenant->plan_id);
        }

        // A tenant is in trial ONLY if status is trial/trialing, OR if not active and trial_ends_at is in future
        $isTrial = false;
        if ($tenant) {
            if (in_array($tenant->status, ['trial', 'trialing'])) {
                $isTrial = true;
            } elseif ($tenant->status !== 'active' && !empty($tenant->trial_ends_at) && now()->lt($tenant->trial_ends_at)) {
                $isTrial = true;
            }
        }

        // Effective expiration date: trial_ends_at or subscription_ends_at
        $expiresAt = null;
        if ($isTrial) {
            $expiresAt = $tenant ? $tenant->trial_ends_at : null;
            $rawDays = $expiresAt ? (int) now()->diffInDays($expiresAt, false) : 14;
            $daysRemaining = max(0, min(14, $rawDays));
        } else {
            $expiresAt = $tenant ? $tenant->subscription_ends_at : null;
            $daysRemaining = $expiresAt ? max(0, (int) now()->diffInDays($expiresAt, false)) : 365;
        }

        $isExpired = $expiresAt ? now()->isAfter($expiresAt) : false;
        $isExpiringSoon = $expiresAt ? (!$isExpired && $daysRemaining <= 7) : false;


        $subscriptionData = [
            'plan' => $currentPlan ? $currentPlan->name_ar : ($isTrial ? 'باقة التجربة المجانية (14 يوماً)' : 'باقة الأخصائي الفردي (Cabinet Solo)'),
            'plan_name_ar' => $currentPlan ? $currentPlan->name_ar : ($isTrial ? 'باقة التجربة المجانية (14 يوماً)' : 'باقة الأخصائي الفردي (Cabinet Solo)'),
            'plan_name_fr' => $currentPlan ? $currentPlan->name_fr : ($isTrial ? 'Essai Gratuit (14 jours)' : 'Pack Praticien Solo'),
            'plan_id' => $tenant->plan_id ?? 1,
            'plan_slug' => $currentPlan ? $currentPlan->slug : 'solo_starter',
            'status' => $tenant->status ?? ($isTrial ? 'trial' : 'active'),
            'modules' => $tenant->settings['enabled_modules'] ?? [
                'orthophony' => true,
                'psychology' => true,
                'psychomotricite' => true,
            ],
            'features' => array_merge(
                $currentPlan ? ($currentPlan->features ?: SubscriptionPlan::getDefaultFeatureMap('pro')) : SubscriptionPlan::getDefaultFeatureMap($isTrial ? 'pro' : 'starter'),
                (array)($tenant->feature_overrides ?? [])
            ),
            'expires_at' => $expiresAt ? $expiresAt->toDateString() : now()->addDays($daysRemaining)->toDateString(),
            'trial_ends_at' => $tenant->trial_ends_at ? $tenant->trial_ends_at->toDateString() : null,
            'days_remaining' => $daysRemaining,
            'is_trial' => $isTrial,
            'is_expiring_soon' => $isExpiringSoon,
            'is_expired' => $isExpired,
        ];

        // 2. Fetch all active subscription plans
        $plans = SubscriptionPlan::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name_ar' => $p->name_ar,
                    'name_fr' => $p->name_fr,
                    'slug' => $p->slug,
                    'description' => $p->description,
                    'features' => $p->features ?: SubscriptionPlan::getDefaultFeatureMap('pro'),
                    'price_yearly' => (float) ($p->price_yearly ?: $p->price_dzd_yearly),
                    'price_monthly' => (float) ($p->price_monthly ?: $p->price_dzd_monthly),
                    'price_dzd_yearly' => (float) ($p->price_dzd_yearly ?: $p->price_yearly),
                    'price_dzd_monthly' => (float) ($p->price_dzd_monthly ?: $p->price_monthly),
                    'max_patients' => $p->max_patients,
                    'max_staff' => $p->max_staff,
                    'max_clinicians' => $p->max_clinicians ?? 1,
                    'trial_days' => $p->trial_days ?? 14,
                    'is_featured' => (bool) $p->is_featured,
                    'badge' => $p->is_featured ? 'الأكثر طلباً ⭐' : ($p->slug === 'solo_starter' ? 'الأكثر ملاءمة للأفراد' : ($p->slug === 'starter' ? 'اقتصادية للبداية' : null)),
                ];
            });

        // 3. Check for any pending renewal/payment request
        $hasPendingRequest = false;
        $pendingRequest = null;
        if ($tenant) {
            $pending = SaasPaymentRequest::with('plan')
                ->where('clinic_id', $tenant->id)
                ->where('status', 'pending')
                ->latest()
                ->first();

            if ($pending) {
                $hasPendingRequest = true;
                $pendingRequest = [
                    'id' => $pending->id,
                    'plan_name' => $pending->plan ? $pending->plan->name_ar : null,
                    'amount_dzd' => (float) $pending->amount_dzd,
                    'billing_cycle' => $pending->billing_cycle,
                    'payment_method' => $pending->payment_method,
                    'payment_method_label' => $pending->payment_method_label_ar,
                    'created_at' => $pending->created_at ? $pending->created_at->toIso8601String() : null,
                    'receipt_url' => $pending->receipt_url,
                ];
            }
        }

        // 4. Official Algerian Payment Coordinates
        $paymentDetails = [
            'baridimob_rip' => '00799999002233445566',
            'ccp_number' => '0022334455',
            'ccp_key' => '66',
            'account_holder' => 'SARL PsyPro SaaS Tech DZ',
            'bank_name' => 'Algérie Poste / BaridiMob (بريدي موب)',
            'support_phone' => '+213 550 00 00 00',
        ];

        return response()->json([
            'success' => true,
            'subscription' => $subscriptionData,
            'clinic' => [
                'id' => $tenant->id ?? null,
                'name' => $tenant->name ?? null,
                'subdomain' => $tenant->subdomain ?? null,
            ],
            'plans' => $plans,
            'has_pending_request' => $hasPendingRequest,
            'pending_request' => $pendingRequest,
            'payment_details' => $paymentDetails,
        ]);
    }

    /**
     * Validate a promo coupon or referral partner / doctor code.
     */
    public function validateCoupon(Request $request): JsonResponse
    {
        $code = strtoupper(trim(preg_replace('/\s+/', '', $request->input('code', ''))));

        if (empty($code)) {
            return response()->json([
                'success' => true,
                'valid' => false,
                'message' => 'يرجى إدخال رمز الكوبون أو كود الإحالة.',
            ], 422);
        }

        $planId = $request->input('plan_id');
        $cycle = strtolower($request->input('billing_cycle', 'yearly'));
        $originalAmount = (float) $request->input('amount_dzd', 0);

        // Fetch plan if price not directly passed
        if ($originalAmount <= 0 && $planId) {
            $plan = SubscriptionPlan::find($planId);
            if ($plan) {
                $originalAmount = $cycle === 'monthly'
                    ? (float) ($plan->price_monthly ?: $plan->price_dzd_monthly)
                    : (float) ($plan->price_yearly ?: $plan->price_dzd_yearly);
            }
        }
        if ($originalAmount <= 0) {
            $originalAmount = 45000.00; // Default starter yearly price fallback
        }

        $now = Carbon::now();

        // 1. Check in DiscountCoupon
        $coupon = DiscountCoupon::where('code', $code)->first();
        if ($coupon) {
            if (!$coupon->is_active) {
                return response()->json([
                    'success' => true,
                    'valid' => false,
                    'message' => 'عذراً، هذا الكوبون معطل حالياً من قبل الإدارة.',
                ]);
            }

            if ($coupon->starts_at && $now->lt($coupon->starts_at)) {
                return response()->json([
                    'success' => true,
                    'valid' => false,
                    'message' => 'هذا الكوبون لم يبدأ تاريخ سريانه بعد.',
                ]);
            }

            if ($coupon->expires_at && $now->gt($coupon->expires_at)) {
                return response()->json([
                    'success' => true,
                    'valid' => false,
                    'message' => 'عذراً، لقد انتهت صلاحية هذا الكوبون.',
                ]);
            }

            if ($coupon->max_uses > 0 && $coupon->used_count >= $coupon->max_uses) {
                return response()->json([
                    'success' => true,
                    'valid' => false,
                    'message' => 'عذراً، استنفد هذا الكوبون الحد الأقصى لمرات الاستخدام.',
                ]);
            }

            if ($coupon->applicable_cycle && $coupon->applicable_cycle !== 'all' && $coupon->applicable_cycle !== $cycle) {
                $cycleAr = $coupon->applicable_cycle === 'yearly' ? 'السنوية فقط' : 'الشهرية فقط';
                return response()->json([
                    'success' => true,
                    'valid' => false,
                    'message' => "هذا الكوبون مخصص للباقات {$cycleAr}.",
                ]);
            }

            if ($coupon->min_order_dzd > 0 && $originalAmount < $coupon->min_order_dzd) {
                return response()->json([
                    'success' => true,
                    'valid' => false,
                    'message' => "الحد الأدنى لقيمة الاشتراك لتفعيل هذا الكوبون هو {$coupon->min_order_dzd} د.ج.",
                ]);
            }

            // Compute discount
            $discountAmount = 0;
            if ($coupon->discount_type === 'percentage') {
                $discountAmount = round(($originalAmount * $coupon->discount_value) / 100, 2);
            } else {
                $discountAmount = min($originalAmount, (float) $coupon->discount_value);
            }

            $finalAmount = max(0, $originalAmount - $discountAmount);
            $valLabel = $coupon->discount_type === 'percentage' ? "{$coupon->discount_value}%" : "{$coupon->discount_value} د.ج";

            return response()->json([
                'success' => true,
                'valid' => true,
                'code_type' => 'coupon',
                'coupon_id' => $coupon->id,
                'code' => $coupon->code,
                'discount_type' => $coupon->discount_type,
                'discount_value' => (float) $coupon->discount_value,
                'discount_amount_dzd' => $discountAmount,
                'original_amount_dzd' => $originalAmount,
                'final_amount_dzd' => $finalAmount,
                'campaign_name' => $coupon->campaign_name ?? 'عرض ترويجي خاص',
                'message' => "كوبون صحيح 🟢: تم تطبيق خصم {$valLabel} بنجاح!",
            ]);
        }

        // 2. Check in AffiliateReferral (Partner / Ambassador)
        $partner = AffiliateReferral::where('referral_code', $code)->first();
        if ($partner) {
            if (!$partner->is_active) {
                return response()->json([
                    'success' => true,
                    'valid' => false,
                    'message' => 'كود الإحالة غير نشط حالياً.',
                ]);
            }

            $discountPercent = (float) ($partner->referee_discount_percent ?: 15.00);
            $discountAmount = round(($originalAmount * $discountPercent) / 100, 2);
            $finalAmount = max(0, $originalAmount - $discountAmount);

            return response()->json([
                'success' => true,
                'valid' => true,
                'code_type' => 'referral_partner',
                'partner_id' => $partner->id,
                'code' => $partner->referral_code,
                'partner_name' => $partner->affiliate_name,
                'discount_type' => 'percentage',
                'discount_value' => $discountPercent,
                'discount_amount_dzd' => $discountAmount,
                'original_amount_dzd' => $originalAmount,
                'final_amount_dzd' => $finalAmount,
                'message' => "كود دعوة معتمد من ({$partner->affiliate_name}) 🤝: تم تطبيق خصم {$discountPercent}% للعيادة الجديدة!",
            ]);
        }

        // 3. Check in Tenants (Doctor-to-Doctor peer referral)
        $peerClinic = Tenant::where('referral_code', $code)->first();
        if ($peerClinic) {
            $discountPercent = 15.00; // Standard 15% discount for peer invite
            $discountAmount = round(($originalAmount * $discountPercent) / 100, 2);
            $finalAmount = max(0, $originalAmount - $discountAmount);

            return response()->json([
                'success' => true,
                'valid' => true,
                'code_type' => 'referral_doctor',
                'clinic_id' => $peerClinic->id,
                'code' => $peerClinic->referral_code,
                'clinic_name' => $peerClinic->name,
                'discount_type' => 'percentage',
                'discount_value' => $discountPercent,
                'discount_amount_dzd' => $discountAmount,
                'original_amount_dzd' => $originalAmount,
                'final_amount_dzd' => $finalAmount,
                'message' => "كود دعوة من الزميل ({$peerClinic->name}) 🩺: تم تطبيق خصم ترحيبي 15%!",
            ]);
        }

        return response()->json([
            'success' => true,
            'valid' => false,
            'message' => 'رمز الكوبون أو كود الإحالة غير صحيح أو منتهي الصلاحية.',
        ]);
    }

    /**
     * Submit payment receipt for subscription renewal or plan upgrade.
     */
    public function submitRenewalProof(Request $request): JsonResponse
    {
        $user = Auth::guard('sanctum')->user() ?: Auth::user() ?: $request->user();
        $tenant = $user ? ($user->tenant ?: Tenant::find($user->tenant_id)) : null;

        if (!$tenant) {
            $tenant = Tenant::first();
        }

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'تعذر تحديد حساب العيادة.',
            ], 403);
        }

        $request->validate([
            'plan_id' => 'required',
            'billing_cycle' => 'required|string|in:yearly,monthly',
            'amount_dzd' => 'required|numeric|min:0',
            'payment_method' => 'nullable|string',
            'transaction_reference' => 'nullable|string|max:100',
            'coupon_code' => 'nullable|string|max:50',
            'receipt_file' => 'required|file|mimes:jpeg,png,jpg,pdf,webp|max:10240',
        ]);

        $plan = SubscriptionPlan::find($request->input('plan_id'));
        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'الباقة المحددة غير موجودة في النظام.',
            ], 404);
        }

        $receiptPath = null;
        if ($request->hasFile('receipt_file')) {
            $file = $request->file('receipt_file');
            $filename = 'receipt_' . $tenant->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $receiptPath = $file->storeAs('payment_proofs', $filename, 'public');
        }

        $cycle = $request->input('billing_cycle', 'yearly');
        $amountDzd = (float) $request->input('amount_dzd');
        $originalAmount = $cycle === 'yearly'
            ? (float) ($plan->price_yearly ?: $plan->price_dzd_yearly)
            : (float) ($plan->price_monthly ?: $plan->price_dzd_monthly);
        $discountAmount = max(0, $originalAmount - $amountDzd);

        $paymentRequest = SaasPaymentRequest::create([
            'clinic_id' => $tenant->id,
            'subscription_plan_id' => $plan->id,
            'billing_cycle' => $cycle,
            'amount_dzd' => $amountDzd,
            'original_amount_dzd' => $originalAmount,
            'discount_amount_dzd' => $discountAmount,
            'payment_method' => $request->input('payment_method', 'baridimob'),
            'transaction_reference' => $request->input('transaction_reference'),
            'coupon_code' => $request->input('coupon_code'),
            'receipt_image_path' => $receiptPath,
            'status' => 'pending',
            'admin_notes' => 'طلب سداد وتجديد مرسل من واجهة العيادة.',
        ]);

        // Audit Log safely
        try {
            if (class_exists(AuditLogger::class)) {
                AuditLogger::log(
                    'subscription.renewal_submitted',
                    "تم إرسال وصل سداد لتجديد الاشتراك ({$plan->name_ar} - " . number_format($amountDzd) . " DZD)",
                    'info',
                    'Tenant',
                    (string) $tenant->id,
                    [
                        'payment_request_id' => $paymentRequest->id,
                        'plan_id' => $plan->id,
                        'amount_dzd' => $amountDzd,
                        'billing_cycle' => $cycle,
                        'receipt_path' => $receiptPath,
                    ],
                    (string) $tenant->id
                );
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('AuditLog renewal submission failed: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'تم استلام وصل السداد بنجاح! سيقوم فريق الدعم بمطابقته وتفعيل الاشتراك وتحديث الحساب فوراً.',
            'payment_request' => $paymentRequest,
        ]);
    }

    /**
     * List official SaaS invoices for this clinic.
     */
    public function getClinicInvoices(Request $request): JsonResponse
    {
        $user = Auth::user();
        $tenant = $user ? $user->tenant : Tenant::first();

        if (!$tenant) {
            return response()->json(['success' => true, 'invoices' => []]);
        }

        $invoices = SaasInvoice::with('plan')
            ->where('clinic_id', $tenant->id)
            ->latest()
            ->get()
            ->map(function ($inv) {
                return [
                    'id' => $inv->id,
                    'invoice_number' => $inv->invoice_number,
                    'plan_name' => $inv->plan ? $inv->plan->name_ar : 'اشتراك العيادة',
                    'amount_dzd' => (float) $inv->amount_dzd,
                    'billing_cycle' => $inv->billing_cycle,
                    'period_start' => $inv->period_start ? $inv->period_start->toDateString() : null,
                    'period_end' => $inv->period_end ? $inv->period_end->toDateString() : null,
                    'payment_method' => $inv->payment_method,
                    'download_url' => "/api/subscription/invoices/{$inv->id}/download",
                    'created_at' => $inv->created_at ? $inv->created_at->toDateString() : null,
                ];
            });

        return response()->json([
            'success' => true,
            'invoices' => $invoices,
        ]);
    }

    /**
     * Download an official invoice PDF.
     */
    public function downloadClinicInvoicePdf(Request $request, string|int $id)
    {
        $user = Auth::user();
        $tenant = $user ? $user->tenant : Tenant::first();

        $invoice = SaasInvoice::where('id', $id)
            ->when($tenant, fn($q) => $q->where('clinic_id', $tenant->id))
            ->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'الفاتورة غير متوفرة حالياً.',
            ], 404);
        }

        if ($invoice->pdf_path && Storage::disk('public')->exists($invoice->pdf_path)) {
            return Storage::disk('public')->download($invoice->pdf_path, "Facture-{$invoice->invoice_number}.pdf");
        }

        return response()->json([
            'success' => false,
            'message' => 'ملف الفاتورة بصيغة PDF غير متاح حالياً.',
        ], 404);
    }
}
