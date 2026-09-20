<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AffiliateReferral;
use App\Models\CouponRedemption;
use App\Models\DiscountCoupon;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\User;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PromoReferralEngineController extends Controller
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
                abort(403, 'غير مصرح لك بالوصول لمحرك الكوبونات وبرنامج الإحالة.');
            }
            return $user;
        }

        return null;
    }

    /**
     * Get Comprehensive Overview: Coupons, Referrals, Leaderboard & Aggregates.
     * GET /api/super-admin/promos-referrals/overview
     */
    public function getOverview(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin();

        // 1. Coupons & Redemptions
        $coupons = DiscountCoupon::with(['plan'])
            ->withCount('redemptions')
            ->latest()
            ->get();

        $totalRedeemedDiscount = (float) CouponRedemption::sum('discount_applied_dzd');
        $totalRevenueGenerated = (float) CouponRedemption::sum('final_amount_dzd');

        // Recent Redemptions with clinic names
        $recentRedemptions = CouponRedemption::with(['coupon', 'clinic', 'invoice'])
            ->latest('redeemed_at')
            ->limit(15)
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'coupon_code' => $r->coupon->code ?? 'N/A',
                    'clinic_id' => $r->clinic_id,
                    'clinic_name' => $r->clinic->name ?? 'عيادة غير محددة',
                    'original_amount_dzd' => (float) $r->original_amount_dzd,
                    'discount_applied_dzd' => (float) $r->discount_applied_dzd,
                    'final_amount_dzd' => (float) $r->final_amount_dzd,
                    'invoice_number' => $r->invoice->invoice_number ?? null,
                    'redeemed_at' => $r->redeemed_at ? $r->redeemed_at->format('Y-m-d H:i') : ($r->created_at ? $r->created_at->format('Y-m-d H:i') : '--'),
                ];
            });

        // 2. Affiliate Partners & Doctor Ambassadors
        $partners = AffiliateReferral::with(['clinic'])
            ->withCount('referredClinics')
            ->latest()
            ->get()
            ->map(function ($p) {
                $referredClinicsCount = $p->total_referred_clinics > 0 ? $p->total_referred_clinics : $p->referred_clinics_count;
                return [
                    'id' => $p->id,
                    'affiliate_name' => $p->affiliate_name,
                    'referral_code' => $p->referral_code,
                    'partner_type' => $p->partner_type ?? 'partner_association',
                    'partner_type_label_ar' => $p->partner_type_label_ar,
                    'clinic_id' => $p->clinic_id,
                    'clinic_name' => $p->clinic->name ?? null,
                    'reward_type' => $p->reward_type ?? 'commission_dzd',
                    'commission_rate' => (float) $p->commission_rate,
                    'reward_months_per_referral' => (int) ($p->reward_months_per_referral ?? 1),
                    'referee_discount_percent' => (float) ($p->referee_discount_percent ?? 15.00),
                    'total_referred_clinics' => $referredClinicsCount,
                    'total_earned_dzd' => (float) $p->total_earned_dzd,
                    'payout_phone' => $p->payout_phone ?? '--',
                    'payout_ccp_rip' => $p->payout_ccp_rip ?? '--',
                    'is_active' => (bool) $p->is_active,
                    'referral_url' => "https://psypro.tech/register?ref={$p->referral_code}",
                    'created_at' => $p->created_at ? $p->created_at->format('Y-m-d') : '--',
                ];
            });

        // 3. Clinics Referrals Directory (Peer-to-Peer Ambassador Clinics)
        $ambassadorClinics = Tenant::whereNotNull('referral_code')
            ->withCount('referredClinics')
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'name' => $t->name,
                    'wilaya' => $t->wilaya ?? 'غير محدد',
                    'type' => $t->type,
                    'referral_code' => $t->referral_code,
                    'referral_url' => $t->referral_url,
                    'referred_clinics_count' => $t->referred_clinics_count,
                    'referral_credits_dzd' => (float) ($t->referral_credits_dzd ?? 0),
                    'referral_free_days_earned' => (int) ($t->referral_free_days_earned ?? 0),
                    'subscription_ends_at' => $t->subscription_ends_at ? $t->subscription_ends_at->format('Y-m-d') : null,
                ];
            });

        // 4. Converted clinics that registered via referral
        $referredTenantsCount = Tenant::whereNotNull('referred_by_code')->count();
        $convertedPaidCount = Tenant::whereNotNull('referred_by_code')
            ->where('status', 'active')
            ->where('subscription_ends_at', '>', now())
            ->count();

        // 5. Active Plans list for targeting
        $plans = SubscriptionPlan::where('is_active', true)
            ->select('id', 'name_ar', 'slug', 'price_yearly', 'price_monthly')
            ->get();

        return response()->json([
            'success' => true,
            'kpis' => [
                // Coupons
                'total_coupons' => $coupons->count(),
                'active_coupons' => $coupons->where('is_active', true)->count(),
                'total_redemptions' => CouponRedemption::count(),
                'total_discount_given_dzd' => $totalRedeemedDiscount,
                'total_revenue_generated_dzd' => $totalRevenueGenerated,
                // Referrals
                'total_partners' => $partners->count(),
                'total_referred_clinics' => $referredTenantsCount,
                'converted_paid_clinics' => $convertedPaidCount,
                'conversion_rate_percent' => $referredTenantsCount > 0 ? round(($convertedPaidCount / $referredTenantsCount) * 100, 1) : 0,
                'total_commissions_earned_dzd' => (float) $partners->sum('total_earned_dzd'),
                'top_partner_name' => $partners->sortByDesc('total_referred_clinics')->first()['affiliate_name'] ?? 'لا يوجد',
            ],
            'coupons' => $coupons,
            'recent_redemptions' => $recentRedemptions,
            'partners' => $partners,
            'ambassador_clinics' => $ambassadorClinics,
            'plans' => $plans,
        ]);
    }

    /**
     * Create Promo Coupon.
     * POST /api/super-admin/promos-referrals/coupons
     */
    public function createCoupon(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:discount_coupons,code',
            'discount_type' => 'required|in:percentage,fixed_dzd',
            'discount_value' => 'required|numeric|min:1',
            'max_uses' => 'required|integer|min:1',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
            'description' => 'nullable|string|max:255',
            'campaign_name' => 'nullable|string|max:255',
            'applicable_plan_id' => 'nullable|exists:subscription_plans,id',
            'applicable_cycle' => 'nullable|in:all,yearly,monthly',
            'min_order_dzd' => 'nullable|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $validated['code'] = strtoupper(trim(preg_replace('/\s+/', '', $validated['code'])));
        $validated['created_by'] = Auth::id();
        $validated['used_count'] = 0;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $coupon = DiscountCoupon::create($validated);

        AuditLogger::log(
            'coupon.created',
            "قام المشرف العام بإنشاء كود الخصم الترويجي ({$coupon->code}) بقيمة " .
            ($coupon->discount_type === 'percentage' ? "{$coupon->discount_value}%" : "{$coupon->discount_value} د.ج") .
            " لحملة: " . ($coupon->campaign_name ?? 'عام'),
            'info',
            'DiscountCoupon',
            (string) $coupon->id,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => "تم إنشاء كوبون الخصم الترويجي ({$coupon->code}) بنجاح.",
            'coupon' => $coupon->load('plan'),
        ]);
    }

    /**
     * Update Promo Coupon.
     * PUT /api/super-admin/promos-referrals/coupons/{id}
     */
    public function updateCoupon(Request $request, int $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $coupon = DiscountCoupon::findOrFail($id);

        $validated = $request->validate([
            'code' => "required|string|max:50|unique:discount_coupons,code,{$id}",
            'discount_type' => 'required|in:percentage,fixed_dzd',
            'discount_value' => 'required|numeric|min:1',
            'max_uses' => 'required|integer|min:1',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date',
            'description' => 'nullable|string|max:255',
            'campaign_name' => 'nullable|string|max:255',
            'applicable_plan_id' => 'nullable|exists:subscription_plans,id',
            'applicable_cycle' => 'nullable|in:all,yearly,monthly',
            'min_order_dzd' => 'nullable|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $validated['code'] = strtoupper(trim(preg_replace('/\s+/', '', $validated['code'])));
        $coupon->update($validated);

        AuditLogger::log(
            'coupon.updated',
            "تم تحديث بيانات كود الخصم الترويجي ({$coupon->code})",
            'info',
            'DiscountCoupon',
            (string) $coupon->id,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => "تم تعديل كوبون الخصم ({$coupon->code}) بنجاح.",
            'coupon' => $coupon->load('plan'),
        ]);
    }

    /**
     * Toggle Coupon Active Status.
     * POST /api/super-admin/promos-referrals/coupons/{id}/toggle
     */
    public function toggleCoupon(int $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $coupon = DiscountCoupon::findOrFail($id);
        $coupon->is_active = !$coupon->is_active;
        $coupon->save();

        AuditLogger::log(
            'coupon.toggled',
            ($coupon->is_active ? "تم تفعيل" : "تم تعطيل") . " كوبون الخصم ({$coupon->code})",
            'info',
            'DiscountCoupon',
            (string) $coupon->id
        );

        return response()->json([
            'success' => true,
            'message' => $coupon->is_active ? "تم تفعيل الكوبون ({$coupon->code}) بنجاح 🟢" : "تم تعطيل الكوبون ({$coupon->code}) بنجاح 🔴",
            'is_active' => $coupon->is_active,
        ]);
    }

    /**
     * Delete Coupon.
     * DELETE /api/super-admin/promos-referrals/coupons/{id}
     */
    public function deleteCoupon(int $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $coupon = DiscountCoupon::findOrFail($id);

        if ($coupon->redemptions()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف الكوبون نظراً لوجود عيادات استخدمته في سداد اشتراكاتها السابقة. حفاظاً على النزاهة المحاسبية يمكنك تعطيل الكوبون بدلاً من حذفه.',
            ], 422);
        }

        $code = $coupon->code;
        $coupon->delete();

        AuditLogger::log(
            'coupon.deleted',
            "تم حذف كوبون الخصم ({$code}) نهائياً لعدم استخدامه.",
            'warning',
            'DiscountCoupon',
            (string) $id
        );

        return response()->json([
            'success' => true,
            'message' => "تم حذف كوبون الخصم ({$code}) بنجاح.",
        ]);
    }

    /**
     * Create Referral Partner / Ambassador.
     * POST /api/super-admin/promos-referrals/partners
     */
    public function createReferralPartner(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $validated = $request->validate([
            'affiliate_name' => 'required|string|max:255',
            'referral_code' => 'required|string|max:50|unique:affiliate_referrals,referral_code',
            'partner_type' => 'required|in:partner_association,doctor_peer,influencer',
            'clinic_id' => 'nullable|exists:tenants,id',
            'reward_type' => 'required|in:commission_dzd,free_subscription_months,both',
            'commission_rate' => 'required|numeric|min:0|max:100',
            'reward_months_per_referral' => 'nullable|integer|min:0|max:12',
            'referee_discount_percent' => 'required|numeric|min:0|max:100',
            'payout_phone' => 'nullable|string|max:30',
            'payout_ccp_rip' => 'nullable|string|max:50',
            'is_active' => 'sometimes|boolean',
        ]);

        $validated['referral_code'] = strtoupper(trim(preg_replace('/\s+/', '', $validated['referral_code'])));
        $validated['total_referred_clinics'] = 0;
        $validated['total_earned_dzd'] = 0;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $partner = AffiliateReferral::create($validated);

        AuditLogger::log(
            'referral.partner_created',
            "تم تسجيل شريك إحالة جديد: ({$partner->affiliate_name}) بكود إحالة: {$partner->referral_code}",
            'info',
            'AffiliateReferral',
            (string) $partner->id,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => "تم تسجيل شريك الإحالة ({$partner->affiliate_name}) بنجاح.",
            'partner' => $partner->load('clinic'),
        ]);
    }

    /**
     * Update Referral Partner.
     * PUT /api/super-admin/promos-referrals/partners/{id}
     */
    public function updateReferralPartner(Request $request, int $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $partner = AffiliateReferral::findOrFail($id);

        $validated = $request->validate([
            'affiliate_name' => 'required|string|max:255',
            'referral_code' => "required|string|max:50|unique:affiliate_referrals,referral_code,{$id}",
            'partner_type' => 'required|in:partner_association,doctor_peer,influencer',
            'clinic_id' => 'nullable|exists:tenants,id',
            'reward_type' => 'required|in:commission_dzd,free_subscription_months,both',
            'commission_rate' => 'required|numeric|min:0|max:100',
            'reward_months_per_referral' => 'nullable|integer|min:0|max:12',
            'referee_discount_percent' => 'required|numeric|min:0|max:100',
            'payout_phone' => 'nullable|string|max:30',
            'payout_ccp_rip' => 'nullable|string|max:50',
            'is_active' => 'sometimes|boolean',
        ]);

        $validated['referral_code'] = strtoupper(trim(preg_replace('/\s+/', '', $validated['referral_code'])));
        $partner->update($validated);

        AuditLogger::log(
            'referral.partner_updated',
            "تم تحديث بيانات شريك الإحالة ({$partner->affiliate_name})",
            'info',
            'AffiliateReferral',
            (string) $partner->id
        );

        return response()->json([
            'success' => true,
            'message' => "تم تحديث بيانات شريك الإحالة ({$partner->affiliate_name}) بنجاح.",
            'partner' => $partner->load('clinic'),
        ]);
    }

    /**
     * Toggle Referral Partner Active Status.
     * POST /api/super-admin/promos-referrals/partners/{id}/toggle
     */
    public function toggleReferralPartner(int $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $partner = AffiliateReferral::findOrFail($id);
        $partner->is_active = !$partner->is_active;
        $partner->save();

        AuditLogger::log(
            'referral.partner_toggled',
            ($partner->is_active ? "تم تفعيل" : "تم تعطيل") . " شريك الإحالة ({$partner->affiliate_name})",
            'info',
            'AffiliateReferral',
            (string) $partner->id
        );

        return response()->json([
            'success' => true,
            'message' => $partner->is_active ? "تم تفعيل شريك الإحالة 🟢" : "تم تعطيل شريك الإحالة 🔴",
            'is_active' => $partner->is_active,
        ]);
    }

    /**
     * Delete Referral Partner.
     * DELETE /api/super-admin/promos-referrals/partners/{id}
     */
    public function deleteReferralPartner(int $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $partner = AffiliateReferral::findOrFail($id);
        $name = $partner->affiliate_name;
        $partner->delete();

        AuditLogger::log(
            'referral.partner_deleted',
            "تم حذف شريك الإحالة ({$name}) بنجاح.",
            'warning',
            'AffiliateReferral',
            (string) $id
        );

        return response()->json([
            'success' => true,
            'message' => "تم حذف شريك الإحالة ({$name}) بنجاح.",
        ]);
    }

    /**
     * Record Partner Payout or Grant Free Months.
     * POST /api/super-admin/promos-referrals/partners/{id}/payout
     */
    public function recordPartnerPayout(Request $request, int $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $partner = AffiliateReferral::with('clinic')->findOrFail($id);

        $validated = $request->validate([
            'payout_type' => 'required|in:commission_payment,grant_free_months,both',
            'amount_paid_dzd' => 'nullable|numeric|min:0',
            'months_granted' => 'nullable|integer|min:1|max:24',
            'payment_method' => 'nullable|in:baridimob,ccp,bank_transfer,cash',
            'transaction_reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:255',
        ]);

        $messageParts = [];

        // If granting subscription extension to a doctor partner
        if (in_array($validated['payout_type'], ['grant_free_months', 'both']) && !empty($validated['months_granted'])) {
            $months = (int) $validated['months_granted'];
            if ($partner->clinic_id) {
                $tenant = Tenant::find($partner->clinic_id);
                if ($tenant) {
                    $now = Carbon::now();
                    $currentEnd = ($tenant->subscription_ends_at && $tenant->subscription_ends_at->gt($now))
                        ? $tenant->subscription_ends_at
                        : $now;
                    $newEnd = $currentEnd->copy()->addMonths($months);
                    $tenant->subscription_ends_at = $newEnd;
                    $tenant->referral_free_days_earned = ($tenant->referral_free_days_earned ?? 0) + ($months * 30);
                    $tenant->save();

                    $messageParts[] = "تم تمديد اشتراك عيادة ({$tenant->name}) بـ {$months} أشهر مجاناً حتى " . $newEnd->format('d/m/Y');
                }
            } else {
                $messageParts[] = "تم تسجيل منح {$months} أشهر مجانية للشريك.";
            }
        }

        if (in_array($validated['payout_type'], ['commission_payment', 'both']) && !empty($validated['amount_paid_dzd'])) {
            $amount = (float) $validated['amount_paid_dzd'];
            $ref = $validated['transaction_reference'] ?? 'CCP_' . time();
            $messageParts[] = "تم توثيق تحويل عمولة بقيمة {$amount} د.ج بالمرجع ({$ref})";
        }

        $summary = implode(' و ', $messageParts);

        AuditLogger::log(
            'referral.payout_recorded',
            "تم صرف مكافأة/عمولة لشريك الإحالة ({$partner->affiliate_name}): {$summary}",
            'info',
            'AffiliateReferral',
            (string) $partner->id,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => "تم توثيق المكافأة بنجاح: {$summary}",
        ]);
    }

    /**
     * Generate Tailored WhatsApp Share Link.
     * GET /api/super-admin/promos-referrals/share-whatsapp
     */
    public function generateWhatsAppShare(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $type = $request->query('type', 'coupon'); // coupon or referral
        $id = $request->query('id');

        if ($type === 'coupon') {
            $coupon = DiscountCoupon::findOrFail($id);
            $valText = $coupon->discount_type === 'percentage' ? "{$coupon->discount_value}%" : "{$coupon->discount_value} د.ج";
            $text = "السلام عليكم دكتور(ة) الفاضل(ة) 🩺\n\n" .
                "يسر منصة *PsyPro* السريرية تقديم عرض حصري وتخفيض خاص بنسبة *{$valText}* على اشتراككم السنوي عبر كود الخصم:\n\n" .
                "🏷️ الكود الترويجي: *{$coupon->code}*\n\n" .
                "✨ يشمل العرض: التوثيق السريري الذكي SOAP، الكاتب الطبي AI Whisper، بنك المقاييس الـ 18، وبنك الكراسات المطبوعة A4.\n\n" .
                "سجل الآن وفعّل كود الخصم فوراً عبر الرابط:\n" .
                "👉 https://psypro.tech/register\n\n" .
                "فريق الدعم الفني وإدارة PsyPro الجزائر 🇩🇿";
        } else {
            $partner = AffiliateReferral::findOrFail($id);
            $refUrl = "https://psypro.tech/register?ref={$partner->referral_code}";
            $text = "السلام عليكم زميلي العزيز 🩺\n\n" .
                "أدعوك لتجربة منصة *PsyPro* الطبية المتكاملة لإدارة العيادات السريرية (أرطوفونيا، نفساني عيادي، تأهيل حركي).\n\n" .
                "🎁 عند التسجيل عبر رابط الدعوة الخاص بي، ستحصل تلقائياً على *خصم {$partner->referee_discount_percent}%* وفترة تجريبية مجانية:\n\n" .
                "🔗 رابط الدعوة والتسجيل المباشر:\n" .
                "👉 {$refUrl}\n\n" .
                "كود الدعوة المعتمد: *{$partner->referral_code}*\n\n" .
                "بالتوفيق لعيادتكم الموقرة!";
        }

        $encodedText = urlencode($text);
        $waUrl = "https://wa.me/?text={$encodedText}";

        return response()->json([
            'success' => true,
            'text' => $text,
            'whatsapp_url' => $waUrl,
        ]);
    }
}
