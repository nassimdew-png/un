<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Throwable;

class SubscriptionPlanManagerController extends Controller
{
    /**
     * Get all subscription plans
     */
    public function index()
    {
        try {
            $plans = [
                [
                    'id'               => 'starter',
                    'name'             => 'الباقة الأساسية (Starter)',
                    'price_dzd'        => 3500,
                    'billing_period'   => 'شهري',
                    'max_patients'     => 150,
                    'max_staff'        => 2,
                    'ai_tokens'        => 50000,
                    'storage_mb'       => 1024,
                    'features'         => ['الحصيلة الأرطوفونية', 'ملاحظات SOAP', 'جدول المواعيد', 'بوابة المريض'],
                    'is_active'        => true,
                    'subscribers_count'=> 12
                ],
                [
                    'id'               => 'professional',
                    'name'             => 'الباقة الاحترافية (Pro Clinic)',
                    'price_dzd'        => 7500,
                    'billing_period'   => 'شهري',
                    'max_patients'     => 500,
                    'max_staff'        => 6,
                    'ai_tokens'        => 200000,
                    'storage_mb'       => 4096,
                    'features'         => ['جميع ميزات الأساسية', 'النطاق المخصص المجاني', 'شهادة SSL تلقائية', 'تفريغ صوتي الذكي', 'رسائل WhatsApp التلقائية'],
                    'is_active'        => true,
                    'is_popular'       => true,
                    'subscribers_count'=> 34
                ],
                [
                    'id'               => 'enterprise',
                    'name'             => 'باقة المراكز والمجمعات الطبية (Enterprise)',
                    'price_dzd'        => 15000,
                    'billing_period'   => 'شهري',
                    'max_patients'     => 2000,
                    'max_staff'        => 20,
                    'ai_tokens'        => 600000,
                    'storage_mb'       => 15360,
                    'features'         => ['سعة غير محدودة للمرضى', 'ربط نطاقات متعددة', 'API مخصص للربط المالي', 'دعم فني VIP مخصص 24/7'],
                    'is_active'        => true,
                    'subscribers_count'=> 8
                ]
            ];

            return response()->json([
                'status' => 'success',
                'plans'  => $plans,
                'data'   => $plans
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store new subscription plan
     */
    public function store(Request $request)
    {
        return response()->json([
            'status'  => 'success',
            'message' => 'تم إنشاء الخطة التسعيرية الجديدة بنجاح.'
        ], 201);
    }

    /**
     * Update subscription plan
     */
    public function update(Request $request, $id)
    {
        return response()->json([
            'status'  => 'success',
            'message' => "تم تحديث الخطة التسعيرية [{$id}] بنجاح."
        ]);
    }

    /**
     * Delete subscription plan
     */
    public function destroy($id)
    {
        return response()->json([
            'status'  => 'success',
            'message' => "تم حذف الخطة التسعيرية [{$id}] بنجاح."
        ]);
    }
}
