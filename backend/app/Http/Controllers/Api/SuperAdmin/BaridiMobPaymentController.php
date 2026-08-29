<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionTransaction;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Throwable;

class BaridiMobPaymentController extends Controller
{
    /**
     * Plan pricing map
     */
    protected $plans = [
        'monthly_starter' => ['name' => 'الباقة الأساسية (شهري)', 'amount' => 3000, 'days' => 30],
        'monthly_pro'     => ['name' => 'الباقة الاحترافية (شهري)', 'amount' => 6500, 'days' => 30],
        'annual_pro'      => ['name' => 'الباقة السنوية الاحترافية (خصم شهرين)', 'amount' => 65000, 'days' => 365],
        'annual_vip'      => ['name' => 'باقة المراكز الكبرى (سنوي VIP)', 'amount' => 95000, 'days' => 365],
    ];

    /**
     * Helper to get current tenant
     */
    protected function getTenant(Request $request)
    {
        $tenant = $request->get('current_tenant');
        if (!$tenant && $request->user()) {
            $tenant = Tenant::find($request->user()->tenant_id);
        }
        if (!$tenant) {
            $tenant = Tenant::firstOrCreate(
                ['subdomain' => 'elamal'],
                [
                    'name' => 'عيادة الأمل التجريبية',
                    'specialty_type' => 'multidisciplinary',
                    'subscription' => ['status' => 'active', 'plan' => 'trial']
                ]
            );
        }
        return $tenant;
    }

    /**
     * POST /api/clinic/subscription/upload-receipt
     * Upload BaridiMob/CCP receipt by clinic
     */
    public function uploadReceipt(Request $request)
    {
        try {
            $request->validate([
                'plan_id'               => 'required|string',
                'amount'                => 'nullable|numeric',
                'payment_method'        => 'required|string|in:baridimob,ccp,chargily',
                'transaction_reference' => 'nullable|string',
                'receipt_image'         => 'nullable|string', // base64 or file
            ]);

            $tenant = $this->getTenant($request);
            $tenantId = (string) ($tenant->_id ?? $tenant->id);

            $planId = $request->plan_id;
            $planInfo = $this->plans[$planId] ?? ['name' => 'باقة عيادات', 'amount' => 6500, 'days' => 30];
            $amount = $request->amount ? (float)$request->amount : (float)$planInfo['amount'];

            // Handle Receipt Image (File Upload or Base64)
            $receiptPath = null;
            if ($request->hasFile('receipt_file')) {
                $file = $request->file('receipt_file');
                $filename = 'receipt_' . $tenantId . '_' . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('public/receipts', $filename);
                $receiptPath = Storage::url($path);
            } elseif ($request->receipt_image) {
                // If base64 string or url
                $receiptPath = $request->receipt_image;
            }

            // Generate unique invoice number
            $invoiceNumber = 'INV-' . date('Y') . '-' . rand(10000, 99999);

            $transaction = SubscriptionTransaction::create([
                'clinic_id'             => $tenantId,
                'plan_id'               => $planId,
                'amount'                => $amount,
                'payment_method'        => $request->payment_method,
                'receipt_image_path'    => $receiptPath,
                'transaction_reference' => $request->transaction_reference ?? ('BM-' . rand(100000, 999999)),
                'payment_status'        => 'pending',
                'admin_notes'           => null,
                'approved_at'           => null,
                'approved_by'           => null,
                'invoice_number'        => $invoiceNumber,
            ]);

            return response()->json([
                'success'        => true,
                'message'        => 'تم رفع وصل التحويل بنجاح! جاري مراجعة الدفع من قِبل الإدارة وتفعيل الاشتراك.',
                'transaction'    => $transaction,
                'invoice_number' => $invoiceNumber
            ], 201);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/clinic/subscription/status
     * Get clinic subscription status and history
     */
    public function getClinicStatus(Request $request)
    {
        try {
            $tenant = $this->getTenant($request);
            $tenantId = (string) ($tenant->_id ?? $tenant->id);

            $transactions = SubscriptionTransaction::where('clinic_id', $tenantId)
                ->orderBy('created_at', 'desc')
                ->get();

            $endsAt = $tenant->subscription_ends_at 
                ? Carbon::parse($tenant->subscription_ends_at)
                : Carbon::now()->addDays(20);

            $daysRemaining = max(0, Carbon::now()->diffInDays($endsAt, false));

            return response()->json([
                'success'             => true,
                'clinic_id'           => $tenantId,
                'clinic_name'         => $tenant->name,
                'subscription_status' => $tenant->subscription_status ?? 'active',
                'current_plan'        => $tenant->subscription_plan_id ?? 'annual_pro',
                'subscription_ends_at'=> $endsAt->toISOString(),
                'days_remaining'      => $daysRemaining,
                'transactions'        => $transactions,
                'baridimob_rip'       => '007 99999 0001234567 89',
                'ccp_account'         => '12345678 مفتاح 90',
                'account_name'        => 'منصة ساي برو للحلول الإكلينيكية (PsyPro SAS)'
            ]);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/superadmin/payments/pending-receipts
     * SuperAdmin: List all subscription receipts
     */
    public function getPendingReceipts(Request $request)
    {
        try {
            $status = $request->query('status', 'all');
            $query = SubscriptionTransaction::query();

            if ($status && $status !== 'all') {
                $query->where('payment_status', $status);
            }

            $transactions = $query->orderBy('created_at', 'desc')->get();

            // Enrich with clinic details
            $enriched = $transactions->map(function ($tx) {
                $clinic = Tenant::find($tx->clinic_id);
                return [
                    'id'                    => (string) ($tx->_id ?? $tx->id),
                    'clinic_id'             => (string) $tx->clinic_id,
                    'clinic_name'           => $clinic->name ?? 'عيادة غير محددة',
                    'clinic_subdomain'      => $clinic->subdomain ?? 'unknown',
                    'plan_id'               => $tx->plan_id,
                    'plan_name'             => $this->plans[$tx->plan_id]['name'] ?? $tx->plan_id,
                    'amount'                => (float) $tx->amount,
                    'payment_method'        => $tx->payment_method,
                    'receipt_image_path'    => $tx->receipt_image_path,
                    'transaction_reference' => $tx->transaction_reference,
                    'payment_status'        => $tx->payment_status,
                    'admin_notes'           => $tx->admin_notes,
                    'approved_at'           => $tx->approved_at,
                    'approved_by'           => $tx->approved_by,
                    'invoice_number'        => $tx->invoice_number,
                    'created_at'            => $tx->created_at,
                ];
            });

            return response()->json([
                'success'      => true,
                'metrics'      => [
                    'total'    => SubscriptionTransaction::count(),
                    'pending'  => SubscriptionTransaction::where('payment_status', 'pending')->count(),
                    'paid'     => SubscriptionTransaction::where('payment_status', 'paid')->count(),
                    'rejected' => SubscriptionTransaction::where('payment_status', 'rejected')->count(),
                ],
                'transactions' => $enriched
            ]);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/superadmin/payments/{id}/approve
     * 1-Click Approve BaridiMob receipt and extend clinic subscription
     */
    public function approve($id, Request $request)
    {
        try {
            $tx = SubscriptionTransaction::find($id);
            if (!$tx) {
                return response()->json(['success' => false, 'message' => 'المعاملة غير موجودة'], 404);
            }

            $tx->payment_status = 'paid';
            $tx->approved_at = Carbon::now();
            $tx->approved_by = 'SuperAdmin';
            $tx->admin_notes = $request->input('notes', 'تم التحقق من إيداع بريدي موب وتفعيل الاشتراك بنجاح.');
            $tx->save();

            // Extend clinic subscription
            $clinic = Tenant::find($tx->clinic_id);
            if ($clinic) {
                $daysToAdd = $this->plans[$tx->plan_id]['days'] ?? 365;
                $currentEnd = $clinic->subscription_ends_at ? Carbon::parse($clinic->subscription_ends_at) : Carbon::now();
                $baseDate = $currentEnd->isFuture() ? $currentEnd : Carbon::now();
                $newEndsAt = $baseDate->copy()->addDays($daysToAdd);

                $clinic->subscription_status = 'active';
                $clinic->subscription_plan_id = $tx->plan_id;
                $clinic->subscription_ends_at = $newEndsAt;
                $clinic->subscription = [
                    'status'     => 'active',
                    'plan'       => $tx->plan_id,
                    'expires_at' => $newEndsAt->toISOString()
                ];
                $clinic->save();
            }

            return response()->json([
                'success'     => true,
                'message'     => "تمت الموافقة على التحويل بنجاح وتمديد اشتراك العيادة حتى {$newEndsAt->format('Y-m-d')} 🎉",
                'transaction' => $tx
            ]);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/superadmin/payments/{id}/reject
     * Reject BaridiMob receipt with reason
     */
    public function reject($id, Request $request)
    {
        try {
            $request->validate([
                'reason' => 'required|string|max:300'
            ]);

            $tx = SubscriptionTransaction::find($id);
            if (!$tx) {
                return response()->json(['success' => false, 'message' => 'المعاملة غير موجودة'], 404);
            }

            $tx->payment_status = 'rejected';
            $tx->admin_notes = $request->reason;
            $tx->approved_at = null;
            $tx->save();

            return response()->json([
                'success' => true,
                'message' => 'تم رفض الوصل وإشعار العيادة بسبب الرفض.',
                'transaction' => $tx
            ]);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
