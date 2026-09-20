<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubscriptionPlanManagerController extends Controller
{
    /**
     * Get all subscription plans with subscriber counts.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $plans = SubscriptionPlan::orderBy('sort_order', 'asc')
                ->orderBy('id', 'asc')
                ->get()
                ->map(function ($plan) {
                    if (empty($plan->price_monthly) && !empty($plan->price_dzd_monthly)) {
                        $plan->price_monthly = (float)$plan->price_dzd_monthly;
                    }
                    if (empty($plan->price_yearly) && !empty($plan->price_dzd_yearly)) {
                        $plan->price_yearly = (float)$plan->price_dzd_yearly;
                    }
                    if (empty($plan->max_staff) && !empty($plan->max_clinicians)) {
                        $plan->max_staff = (int)$plan->max_clinicians;
                    }
                    $plan->discount_percentage = (float)($plan->discount_percentage ?? 0);
                    $plan->is_discount_active = (bool)($plan->is_discount_active ?? false);
                    $plan->discounted_price_monthly = (float)$plan->discounted_price_monthly;
                    $plan->discounted_price_yearly = (float)$plan->discounted_price_yearly;

                    // Compute matching clinics across ID, slug, and legacy plan names
                    $slug = strtolower($plan->slug ?? '');
                    $count = Tenant::where(function ($q) use ($plan, $slug) {
                        $q->where('plan_id', (string)$plan->id)
                          ->orWhere('plan_id', $plan->slug)
                          ->orWhere('custom_plan_name', $plan->name_ar)
                          ->orWhere('custom_plan_name', $plan->name_fr);

                        if ($slug === 'solo' || str_contains($slug, 'starter') || str_contains($slug, 'solo')) {
                            $q->orWhere('plan_id', 'starter')->orWhere('plan_id', 'solo');
                        } elseif ($slug === 'multi' || str_contains($slug, 'pro') || str_contains($slug, 'multi')) {
                            $q->orWhere('plan_id', 'pro')->orWhere('plan_id', 'multi')->orWhere('custom_plan_name', 'باقة Pro');
                        } elseif ($slug === 'enterprise' || str_contains($slug, 'dz')) {
                            $q->orWhere('plan_id', 'enterprise')->orWhere('custom_plan_name', 'باقة المؤسسات');
                        }
                    })->count();

                    $plan->clinics_count = $count;
                    return $plan;
                });

            // Calculate total active subscribed clinics across all plans
            $totalSubscribedClinics = Tenant::where(function ($q) {
                $q->whereNotNull('plan_id')
                  ->orWhereNotNull('custom_plan_name');
            })->count();

            return response()->json([
                'success' => true,
                'plans' => $plans,
                'features_catalog' => SubscriptionPlan::getFeaturesCatalog(),
                'stats' => [
                    'total_plans' => $plans->count(),
                    'active_plans' => $plans->where('is_active', true)->count(),
                    'total_subscribed_clinics' => $totalSubscribedClinics,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    /**
     * Store a new subscription plan.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_fr' => 'nullable|string|max:255',
            'slug' => 'nullable|string|max:100|unique:subscription_plans,slug',
            'description' => 'nullable|string',
            'features' => 'nullable|array',
            'price_monthly' => 'required|numeric|min:0',
            'price_yearly' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'discount_badge' => 'nullable|string|max:120',
            'is_discount_active' => 'nullable|boolean',
            'discount_ends_at' => 'nullable|date',
            'trial_days' => 'nullable|integer|min:0',
            'max_patients' => 'nullable|integer',
            'max_staff' => 'nullable|integer',
            'ai_reports_limit' => 'nullable|integer',
            'ai_transcribe_mins' => 'nullable|integer',
            'ai_images_limit' => 'nullable|integer',
            'ai_podcasts_limit' => 'nullable|integer',
            'ai_videos_limit' => 'nullable|integer',
            'has_custom_domain' => 'nullable|boolean',
            'has_priority_support' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $slug = $request->input('slug');
        if (empty($slug)) {
            $slug = Str::slug($request->input('name_fr') ?: $request->input('name_ar'));
            if (empty($slug) || SubscriptionPlan::where('slug', $slug)->exists()) {
                $slug = 'plan-' . time();
            }
        }

        $features = $request->input('features');
        if (empty($features) || !is_array($features)) {
            $tier = (str_contains($slug, 'enterprise') || str_contains($slug, 'vip')) ? 'enterprise' : ((str_contains($slug, 'starter') || str_contains($slug, 'solo')) ? 'starter' : 'pro');
            $features = SubscriptionPlan::getDefaultFeatureMap($tier);
        }

        $plan = SubscriptionPlan::create([
            'name_ar' => $request->input('name_ar'),
            'name_fr' => $request->input('name_fr'),
            'slug' => $slug,
            'description' => $request->input('description'),
            'features' => $features,
            'price_monthly' => (float)$request->input('price_monthly', 0),
            'price_yearly' => (float)$request->input('price_yearly', 0),
            'currency' => $request->input('currency', 'DZD'),
            'discount_percentage' => (float)$request->input('discount_percentage', 0),
            'discount_badge' => $request->input('discount_badge'),
            'is_discount_active' => filter_var($request->input('is_discount_active'), FILTER_VALIDATE_BOOLEAN),
            'discount_ends_at' => $request->input('discount_ends_at'),
            'trial_days' => (int)$request->input('trial_days', 14),
            'max_patients' => (int)$request->input('max_patients', 500),
            'max_staff' => (int)$request->input('max_staff', 5),
            'ai_reports_limit' => (int)$request->input('ai_reports_limit', 100),
            'ai_transcribe_mins' => (int)$request->input('ai_transcribe_mins', 120),
            'ai_images_limit' => (int)$request->input('ai_images_limit', 50),
            'ai_podcasts_limit' => (int)$request->input('ai_podcasts_limit', 5),
            'ai_videos_limit' => (int)$request->input('ai_videos_limit', 0),
            'has_custom_domain' => filter_var($request->input('has_custom_domain'), FILTER_VALIDATE_BOOLEAN),
            'has_priority_support' => filter_var($request->input('has_priority_support'), FILTER_VALIDATE_BOOLEAN),
            'is_featured' => filter_var($request->input('is_featured'), FILTER_VALIDATE_BOOLEAN),
            'is_active' => $request->has('is_active') ? filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN) : true,
            'sort_order' => (int)$request->input('sort_order', 0),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء باقة الاشتراك الجديدة بنجاح! 💳✨',
            'plan' => $plan->loadCount('clinics'),
        ], 201);
    }

    /**
     * Update an existing subscription plan.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $plan = SubscriptionPlan::findOrFail($id);

        $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_fr' => 'nullable|string|max:255',
            'slug' => "nullable|string|max:100|unique:subscription_plans,slug,{$id}",
            'description' => 'nullable|string',
            'features' => 'nullable|array',
            'price_monthly' => 'required|numeric|min:0',
            'price_yearly' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'discount_badge' => 'nullable|string|max:120',
            'is_discount_active' => 'nullable|boolean',
            'discount_ends_at' => 'nullable|date',
            'trial_days' => 'nullable|integer|min:0',
            'max_patients' => 'nullable|integer',
            'max_staff' => 'nullable|integer',
            'ai_reports_limit' => 'nullable|integer',
            'ai_transcribe_mins' => 'nullable|integer',
            'ai_images_limit' => 'nullable|integer',
            'ai_podcasts_limit' => 'nullable|integer',
            'ai_videos_limit' => 'nullable|integer',
            'has_custom_domain' => 'nullable|boolean',
            'has_priority_support' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $updateData = [
            'name_ar' => $request->input('name_ar'),
            'name_fr' => $request->input('name_fr'),
            'slug' => $request->input('slug') ?: $plan->slug,
            'description' => $request->input('description'),
            'price_monthly' => (float)$request->input('price_monthly', 0),
            'price_yearly' => (float)$request->input('price_yearly', 0),
            'currency' => $request->input('currency', 'DZD'),
            'discount_percentage' => (float)$request->input('discount_percentage', 0),
            'discount_badge' => $request->input('discount_badge'),
            'is_discount_active' => filter_var($request->input('is_discount_active'), FILTER_VALIDATE_BOOLEAN),
            'discount_ends_at' => $request->input('discount_ends_at'),
            'trial_days' => (int)$request->input('trial_days', 14),
            'max_patients' => (int)$request->input('max_patients', 500),
            'max_staff' => (int)$request->input('max_staff', 5),
            'ai_reports_limit' => (int)$request->input('ai_reports_limit', 100),
            'ai_transcribe_mins' => (int)$request->input('ai_transcribe_mins', 120),
            'ai_images_limit' => (int)$request->input('ai_images_limit', 50),
            'ai_podcasts_limit' => (int)$request->input('ai_podcasts_limit', 5),
            'ai_videos_limit' => (int)$request->input('ai_videos_limit', 0),
            'has_custom_domain' => filter_var($request->input('has_custom_domain'), FILTER_VALIDATE_BOOLEAN),
            'has_priority_support' => filter_var($request->input('has_priority_support'), FILTER_VALIDATE_BOOLEAN),
            'is_featured' => filter_var($request->input('is_featured'), FILTER_VALIDATE_BOOLEAN),
            'is_active' => filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN),
            'sort_order' => (int)$request->input('sort_order', 0),
        ];

        if ($request->has('features') && is_array($request->input('features'))) {
            $updateData['features'] = $request->input('features');
        }

        $plan->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث بيانات الباقة بنجاح! 💾✨',
            'plan' => $plan->loadCount('clinics'),
        ]);
    }

    /**
     * Toggle active state of a plan.
     */
    public function toggleStatus(Request $request, $id): JsonResponse
    {
        $plan = SubscriptionPlan::findOrFail($id);
        $plan->is_active = !$plan->is_active;
        $plan->save();

        $statusText = $plan->is_active ? 'تفعيل الباقة للاشتراك' : 'إيقاف وتعطيل الباقة';

        return response()->json([
            'success' => true,
            'message' => "تم {$statusText} بنجاح.",
            'is_active' => $plan->is_active,
            'plan' => $plan->loadCount('clinics'),
        ]);
    }

    /**
     * Safely delete a plan.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $plan = SubscriptionPlan::findOrFail($id);

        $activeClinicsCount = $plan->clinics()->count();
        if ($activeClinicsCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "لا يمكن حذف هذه الباقة لوجود ({$activeClinicsCount}) عيادة مسجلة بها حالياً. يمكنك تعطيل الباقة بدلاً من حذفها.",
            ], 422);
        }

        $plan->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الباقة بنجاح.',
        ]);
    }

    /**
     * Public endpoint to retrieve active subscription plans.
     */
    public function publicPlans(): JsonResponse
    {
        try {
            $plans = SubscriptionPlan::where('is_active', true)
                ->orderBy('sort_order', 'asc')
                ->get()
                ->map(function ($plan) {
                    if (empty($plan->price_monthly) && !empty($plan->price_dzd_monthly)) {
                        $plan->price_monthly = (float)$plan->price_dzd_monthly;
                    }
                    if (empty($plan->price_yearly) && !empty($plan->price_dzd_yearly)) {
                        $plan->price_yearly = (float)$plan->price_dzd_yearly;
                    }
                    if (empty($plan->max_staff) && !empty($plan->max_clinicians)) {
                        $plan->max_staff = (int)$plan->max_clinicians;
                    }
                    $plan->discount_percentage = (float)($plan->discount_percentage ?? 0);
                    $plan->is_discount_active = (bool)($plan->is_discount_active ?? false);
                    $plan->discounted_price_monthly = (float)$plan->discounted_price_monthly;
                    $plan->discounted_price_yearly = (float)$plan->discounted_price_yearly;
                    return $plan;
                });

            return response()->json([
                'success' => true,
                'plans' => $plans,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }
}
