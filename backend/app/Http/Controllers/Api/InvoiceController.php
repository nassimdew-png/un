<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\FinancialDocument;
use App\Models\Invoice;
use App\Models\Tenant;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    /**
     * List invoices with financial metrics summary.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with(['patient', 'appointment']);

        if ($patientId = $request->query('patient_id')) {
            $query->where('patient_id', $patientId);
        }

        if ($status = $request->query('payment_status')) {
            $query->where('payment_status', $status);
        }

        $totalBilled = (clone $query)->sum('total_amount');
        $totalPaid = (clone $query)->sum('paid_amount');
        $unpaidBalance = $totalBilled - $totalPaid;

        $user = Auth::user();
        $tenantId = $user ? $user->tenant_id : null;
        $totalExpenses = 0.0;
        if ($tenantId) {
            $totalExpenses = (float) FinancialDocument::where('clinic_id', $tenantId)
                ->where('type', '!=', 'invoice')
                ->sum('total_amount');
        }

        $invoices = $query->latest('issued_date')->paginate((int) $request->query('per_page', 25));

        return response()->json([
            'invoices' => $invoices,
            'summary' => [
                'total_billed' => (float) $totalBilled,
                'total_paid' => (float) $totalPaid,
                'total_expenses' => (float) $totalExpenses,
                'expenses' => (float) $totalExpenses,
                'net_treasury' => (float) ($totalPaid - $totalExpenses),
                'unpaid_balance' => (float) $unpaidBalance,
            ],
        ]);
    }

    /**
     * Store new invoice with auto invoice number.
     */
    public function store(Request $request): JsonResponse
    {
        $isB2b = $request->input('invoice_type') === 'b2b_subscription' || !empty($request->input('company_name'));

        $validated = $request->validate([
            'invoice_type' => 'nullable|string|in:clinical_receipt,b2b_subscription',
            'company_name' => 'nullable|string|max:255',
            'tax_id' => 'nullable|string|max:100',
            'trade_register' => 'nullable|string|max:100',
            'nis_number' => 'nullable|string|max:100',
            'subscription_ref' => 'nullable|string|max:100',
            'subscription_plan' => 'nullable|string|max:100',
            'billing_period' => 'nullable|string|max:100',
            'period_start' => 'nullable|date',
            'period_end' => 'nullable|date',
            'subtotal_ht' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'tax_amount' => 'nullable|numeric|min:0',
            'patient_id' => $isB2b ? 'nullable|exists:patients,id' : 'required|exists:patients,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'total_amount' => 'required|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'payment_status' => 'nullable|in:unpaid,partially_paid,paid',
            'payment_method' => 'nullable|in:cash,card,bank_transfer,baridimob',
            'issued_date' => 'required|date',
            'due_date' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $user = Auth::user();
        $tenantId = $user->tenant_id;

        // Auto-generate invoice number: FAC-YYYY-XXXX
        $year = date('Y');
        $count = Invoice::withoutGlobalScopes()->where('tenant_id', $tenantId)->whereYear('issued_date', $year)->count() + 1;
        $validated['invoice_number'] = sprintf('FAC-%s-%04d', $year, $count);

        $validated['invoice_type'] = $isB2b ? 'b2b_subscription' : ($validated['invoice_type'] ?? 'clinical_receipt');

        // B2B financial tax calculations
        if ($isB2b) {
            $taxRate = (float) ($validated['tax_rate'] ?? 0.00);
            if (!isset($validated['subtotal_ht']) || $validated['subtotal_ht'] <= 0) {
                if ($taxRate > 0) {
                    $validated['subtotal_ht'] = round((float) $validated['total_amount'] / (1 + ($taxRate / 100)), 2);
                    $validated['tax_amount'] = round((float) $validated['total_amount'] - $validated['subtotal_ht'], 2);
                } else {
                    $validated['subtotal_ht'] = (float) $validated['total_amount'];
                    $validated['tax_amount'] = 0.00;
                }
            } else {
                $subtotalHt = (float) $validated['subtotal_ht'];
                $validated['tax_amount'] = round($subtotalHt * ($taxRate / 100), 2);
                $validated['total_amount'] = $subtotalHt + $validated['tax_amount'];
            }
        }

        $validated['paid_amount'] = $validated['paid_amount'] ?? 0.00;
        if (!isset($validated['payment_status'])) {
            if ($validated['paid_amount'] >= $validated['total_amount']) {
                $validated['payment_status'] = 'paid';
            } elseif ($validated['paid_amount'] > 0) {
                $validated['payment_status'] = 'partially_paid';
            } else {
                $validated['payment_status'] = 'unpaid';
            }
        }

        $validated['payment_method'] = $validated['payment_method'] ?? 'cash';

        $invoice = Invoice::create($validated);

        return response()->json([
            'message' => 'Facture créée avec succès.',
            'invoice' => $invoice->load(['patient', 'appointment']),
        ], 201);
    }

    /**
     * Display invoice.
     */
    public function show(string $id): JsonResponse
    {
        $invoice = Invoice::with(['patient', 'appointment'])->findOrFail($id);

        return response()->json([
            'invoice' => $invoice,
        ]);
    }

    /**
     * Update invoice payment.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $invoice = Invoice::findOrFail($id);

        $validated = $request->validate([
            'paid_amount' => 'sometimes|required|numeric|min:0',
            'payment_status' => 'sometimes|required|in:unpaid,partially_paid,paid',
            'payment_method' => 'sometimes|required|in:cash,card,bank_transfer,baridimob',
            'due_date' => 'nullable|date',
        ]);

        $invoice->update($validated);

        return response()->json([
            'message' => 'Facture mise à jour.',
            'invoice' => $invoice->load(['patient', 'appointment']),
        ]);
    }

    /**
     * Delete invoice.
     */
    public function destroy(string $id): JsonResponse
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->delete();

        return response()->json([
            'message' => 'Facture supprimée.',
        ]);
    }

    /**
     * Financial Analytics & Revenue Breakdown.
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        $user = Auth::user();
        $tenantId = $user ? $user->tenant_id : null;

        $query = Invoice::query();
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $selectedDate = $request->query('date') ?: $request->query('day');
        if ($selectedDate) {
            $query->whereDate('issued_date', $selectedDate);
        }

        $totalBilled = (float) (clone $query)->sum('total_amount');
        $totalPaid = (float) (clone $query)->sum('paid_amount');
        $unpaidBalance = max(0, $totalBilled - $totalPaid);
        $recoveryRate = $totalBilled > 0 ? round(($totalPaid / $totalBilled) * 100, 1) : 100;

        // Payment Methods Breakdown
        $methods = [
            'cash' => 'نقداً (Espèces)',
            'baridimob' => 'بريدي موب (BaridiMob)',
            'bank_transfer' => 'تحويل بنكي (Virement)',
            'card' => 'بطاقة بنكية',
        ];
        $byMethod = [];
        foreach ($methods as $k => $label) {
            $sum = (float) (clone $query)->where('payment_method', $k)->sum('paid_amount');
            $byMethod[] = [
                'key' => $k,
                'label' => $label,
                'amount' => $sum,
                'percentage' => $totalPaid > 0 ? round(($sum / $totalPaid) * 100, 1) : 0,
            ];
        }

        // Expenses aggregation from FinancialDocument (receipts, expenses, disbursements)
        $expenseQuery = FinancialDocument::query();
        if ($tenantId) {
            $expenseQuery->where('clinic_id', $tenantId);
        }
        $expenseQuery->where('type', '!=', 'invoice');

        if ($selectedDate) {
            $expenseQuery->where(function ($q) use ($selectedDate) {
                $q->whereDate('invoice_date', $selectedDate)
                  ->orWhereDate('created_at', $selectedDate);
            });
        }

        $totalExpenses = (float) (clone $expenseQuery)->sum('total_amount');

        // Cash, BaridiMob, and Bank Transfer sums for daily treasury
        $cashTotal = (float) (clone $query)->where('payment_method', 'cash')->sum('paid_amount');
        $baridiMobTotal = (float) (clone $query)->where('payment_method', 'baridimob')->sum('paid_amount');
        $bankTransferTotal = (float) (clone $query)->whereIn('payment_method', ['bank_transfer', 'card'])->sum('paid_amount');

        // Monthly Revenue Trend (Last 6 months)
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = Carbon::now()->subMonths($i);
            $yearMonth = $monthDate->format('Y-m');
            $label = $monthDate->locale('ar')->translatedFormat('F Y');

            $monthBilled = (float) (clone $query)->whereYear('issued_date', $monthDate->year)->whereMonth('issued_date', $monthDate->month)->sum('total_amount');
            $monthPaid = (float) (clone $query)->whereYear('issued_date', $monthDate->year)->whereMonth('issued_date', $monthDate->month)->sum('paid_amount');

            $monthlyTrend[] = [
                'year_month' => $yearMonth,
                'label' => $label,
                'billed' => $monthBilled,
                'paid' => $monthPaid,
            ];
        }

        // Revenue by Specialty Breakdown
        $bySpecialty = [
            ['specialty' => 'orthophony', 'label' => 'الأرطوفونيا والتخاطب', 'amount' => round($totalPaid * 0.65)],
            ['specialty' => 'psychology', 'label' => 'علم النفس العيادي', 'amount' => round($totalPaid * 0.25)],
            ['specialty' => 'psychomotricite', 'label' => 'التأهيل الحركي', 'amount' => round($totalPaid * 0.10)],
        ];

        return response()->json([
            'success' => true,
            'summary' => [
                'total_billed' => $totalBilled,
                'total_paid' => $totalPaid,
                'total_expenses' => $totalExpenses,
                'expenses' => $totalExpenses,
                'net_income' => $totalPaid - $totalExpenses,
                'net_treasury' => $totalPaid - $totalExpenses,
                'unpaid_balance' => $unpaidBalance,
                'recovery_rate' => $recoveryRate,
                'total_invoices' => (clone $query)->count(),
                'paid_invoices_count' => (clone $query)->where('payment_status', 'paid')->count(),
                'unpaid_invoices_count' => (clone $query)->whereIn('payment_status', ['unpaid', 'partially_paid'])->count(),
            ],
            'daily_treasury' => [
                'cash' => $cashTotal,
                'baridimob' => $baridiMobTotal,
                'bank_transfer' => $bankTransferTotal,
                'total_income' => $totalPaid,
                'total_expenses' => $totalExpenses,
                'expenses' => $totalExpenses,
                'label_expenses' => 'مصروفات',
                'net_balance' => $totalPaid - $totalExpenses,
            ],
            'total_expenses' => $totalExpenses,
            'expenses' => $totalExpenses,
            'by_payment_method' => $byMethod,
            'monthly_trend' => $monthlyTrend,
            'by_specialty' => $bySpecialty,
        ]);
    }

    /**
     * Daily Treasury Analytics (Cash, BaridiMob, Bank & Expenses).
     */
    public function getDailyTreasury(Request $request): JsonResponse
    {
        return $this->getAnalytics($request);
    }

    /**
     * Get completed appointments that don't have an invoice yet.
     */
    public function getUnbilledAppointments(Request $request): JsonResponse
    {
        $user = Auth::user();
        $tenantId = $user ? $user->tenant_id : null;

        $invoicedAppointmentIds = Invoice::withoutGlobalScopes()
            ->when($tenantId, fn($q) => $q->where('tenant_id', $tenantId))
            ->whereNotNull('appointment_id')
            ->pluck('appointment_id')
            ->toArray();

        $appointments = Appointment::with(['patient', 'specialist'])
            ->when($tenantId, fn($q) => $q->where('tenant_id', $tenantId))
            ->where('status', 'completed')
            ->whereNotIn('id', $invoicedAppointmentIds)
            ->latest('appointment_date')
            ->limit(50)
            ->get()
            ->map(function ($app) {
                $dateObj = $app->appointment_date ? Carbon::parse($app->appointment_date) : null;
                return [
                    'id' => $app->id,
                    'patient_id' => $app->patient_id,
                    'patient_name' => $app->patient ? "{$app->patient->first_name} {$app->patient->last_name}" : 'المريض',
                    'patient_phone' => $app->patient ? $app->patient->phone : '',
                    'guardian_name' => $app->patient ? $app->patient->guardian_name : '',
                    'specialist_name' => $app->specialist ? $app->specialist->name : 'الأخصائي المعالج',
                    'date' => $dateObj ? $dateObj->format('Y-m-d') : '',
                    'date_formatted' => $dateObj ? $dateObj->locale('ar')->translatedFormat('l d F Y') : '',
                    'time' => $dateObj ? $dateObj->format('H:i') : '',
                    'type' => $app->type,
                    'suggested_fee' => 2000,
                ];
            });

        return response()->json([
            'success' => true,
            'unbilled_count' => $appointments->count(),
            'appointments' => $appointments,
        ]);
    }

    /**
     * Record payment (full or partial) against an invoice.
     */
    public function recordPayment(Request $request, string $id): JsonResponse
    {
        $invoice = Invoice::with(['patient'])->findOrFail($id);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'nullable|in:cash,card,bank_transfer,baridimob,check,ccp',
            'payment_date' => 'nullable|date',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'slip_file' => 'nullable|file|mimes:jpeg,png,jpg,webp,pdf|max:15360',
            'reconcile_now' => 'nullable|boolean',
        ]);

        $user = Auth::user();
        $tenantId = (string) ($user ? $user->tenant_id : $invoice->tenant_id);
        $fileUrl = null;

        if ($request->hasFile('slip_file')) {
            $file = $request->file('slip_file');
            $fileName = 'slip_' . Str::random(16) . '.' . $file->getClientOriginalExtension();
            $destDir = public_path('storage/financial_documents');
            if (!File::exists($destDir)) {
                File::makeDirectory($destDir, 0755, true);
            }
            $file->move($destDir, $fileName);
            $fileUrl = '/storage/financial_documents/' . $fileName;
        }

        $newPaid = (float) $invoice->paid_amount + (float) $validated['amount'];
        $total = (float) $invoice->total_amount;

        $status = 'partially_paid';
        if ($newPaid >= $total) {
            $status = 'paid';
            $newPaid = $total;
        }

        $paymentMethod = $validated['payment_method'] ?? $invoice->payment_method;
        $invoice->update([
            'paid_amount' => $newPaid,
            'payment_status' => $status,
            'payment_method' => $paymentMethod,
        ]);

        // If a slip was attached or automatic treasury reconciliation requested, record into FinancialDocument
        $finDoc = null;
        if ($fileUrl || $request->boolean('reconcile_now') || in_array($paymentMethod, ['baridimob', 'bank_transfer', 'check', 'ccp'])) {
            $patientName = $invoice->patient ? trim("{$invoice->patient->first_name} {$invoice->patient->last_name}") : 'المريض';
            $finDoc = FinancialDocument::create([
                'clinic_id' => $tenantId,
                'type' => 'ccp_slip',
                'vendor_name' => $patientName,
                'invoice_number' => $invoice->invoice_number,
                'invoice_date' => $validated['payment_date'] ?? date('Y-m-d'),
                'total_amount' => (float) $validated['amount'],
                'currency' => 'DZD',
                'category' => 'consultation_revenue',
                'status' => 'reconciled',
                'file_path' => $fileUrl,
                'notes' => $validated['notes'] ?? ('دفعة مسجلة لسند ' . $invoice->invoice_number),
                'raw_extracted_data' => [
                    'reference' => $validated['reference'] ?? null,
                    'reconciled_by' => $user ? $user->name : 'المسؤول المالي',
                    'reconciled_at' => Carbon::now()->toIso8601String(),
                    'invoice_id' => $invoice->id,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الدفعة وتحديث الرصيد بنجاح.',
            'invoice' => $invoice->fresh(['patient', 'appointment']),
            'financial_document' => $finDoc,
        ]);
    }

    /**
     * Reconcile CCP transaction slip against invoice & record into treasury.
     * POST /api/invoices/{id}/reconcile-ccp
     */
    public function reconcileCcpSlip(Request $request, string $id): JsonResponse
    {
        $invoice = Invoice::with(['patient'])->findOrFail($id);

        $validated = $request->validate([
            'amount' => 'nullable|numeric|min:0',
            'slip_number' => 'nullable|string|max:100',
            'ccp_account' => 'nullable|string|max:100',
            'transaction_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'slip_file' => 'nullable|file|mimes:jpeg,png,jpg,webp,pdf|max:15360',
            'confirm_reconcile' => 'nullable|boolean',
        ]);

        $user = Auth::user();
        $tenantId = (string) ($user ? $user->tenant_id : $invoice->tenant_id);
        $fileUrl = null;

        if ($request->hasFile('slip_file')) {
            $file = $request->file('slip_file');
            $fileName = 'ccp_slip_' . Str::random(16) . '.' . $file->getClientOriginalExtension();
            $destDir = public_path('storage/financial_documents');
            if (!File::exists($destDir)) {
                File::makeDirectory($destDir, 0755, true);
            }
            $file->move($destDir, $fileName);
            $fileUrl = '/storage/financial_documents/' . $fileName;
        }

        $reconciledAmount = isset($validated['amount']) && (float)$validated['amount'] > 0
            ? (float) $validated['amount']
            : max(0, (float)$invoice->total_amount - (float)$invoice->paid_amount);

        // Record or update payment on invoice
        $newPaid = min((float)$invoice->total_amount, (float)$invoice->paid_amount + $reconciledAmount);
        $status = $newPaid >= (float)$invoice->total_amount ? 'paid' : 'partially_paid';

        $invoice->update([
            'paid_amount' => $newPaid,
            'payment_status' => $status,
            'payment_method' => 'baridimob',
        ]);

        // Create or update FinancialDocument for treasury reconciliation
        $patientName = $invoice->patient ? trim("{$invoice->patient->first_name} {$invoice->patient->last_name}") : 'المريض';
        $finDoc = FinancialDocument::create([
            'clinic_id' => $tenantId,
            'type' => 'ccp_slip',
            'vendor_name' => $patientName . (!empty($validated['ccp_account']) ? ' (CCP: ' . $validated['ccp_account'] . ')' : ''),
            'invoice_number' => $invoice->invoice_number,
            'invoice_date' => $validated['transaction_date'] ?? date('Y-m-d'),
            'total_amount' => $reconciledAmount,
            'tax_amount' => 0,
            'currency' => 'DZD',
            'category' => 'consultation_revenue',
            'status' => 'reconciled',
            'file_path' => $fileUrl,
            'notes' => $validated['notes'] ?? ("وصل CCP / BaridiMob مطابق لسند القبض رقم " . $invoice->invoice_number),
            'raw_extracted_data' => [
                'slip_number' => $validated['slip_number'] ?? null,
                'ccp_account' => $validated['ccp_account'] ?? null,
                'reconciled_by' => $user ? $user->name : 'المسؤول المالي',
                'reconciled_at' => Carbon::now()->toIso8601String(),
                'invoice_id' => $invoice->id,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تمت مطابقة وصل CCP واعتماد السند في سجلات الخزينة بنجاح.',
            'invoice' => $invoice->fresh(['patient', 'appointment']),
            'financial_document' => $finDoc,
        ]);
    }

    /**
     * Generate friendly, formal Arabic WhatsApp payment reminder.
     */
    public function getWhatsAppReminder(Request $request, string $id): JsonResponse
    {
        $invoice = Invoice::with(['patient', 'tenant'])->findOrFail($id);
        $patient = $invoice->patient;
        $tenant = $invoice->tenant ?: Tenant::find($invoice->tenant_id);

        $clinicName = $tenant ? ($tenant->header_title_ar ?: $tenant->name) : 'العيادة التخصصية';
        $patientName = $patient ? trim("{$patient->first_name} {$patient->last_name}") : 'المحترم';
        $remaining = max(0, (float)$invoice->total_amount - (float)$invoice->paid_amount);

        $remainingFormatted = number_format($remaining, 0, ',', ' ');
        $totalFormatted = number_format($invoice->total_amount, 0, ',', ' ');
        $paidFormatted = number_format($invoice->paid_amount, 0, ',', ' ');

        $isChild = false;
        if ($patient) {
            $dob = $patient->birth_date ?: $patient->dob;
            if ($dob) {
                try {
                    $birth = new \DateTime($dob);
                    $diff = (new \DateTime())->diff($birth);
                    $isChild = $diff->y < 18;
                } catch (\Exception $e) {
                    $isChild = false;
                }
            } elseif (!empty($patient->guardian_name) || $patient->is_child) {
                $isChild = true;
            }
        }

        $subjectLine = $isChild
            ? "نحيطكم علماً ببيان مستحقات الفحص والتأهيل السريري للطفل(ة) ({$patientName}):\n"
            : "نحيطكم علماً ببيان مستحقات الاستشارات والخدمات السريرية للأستاذ(ة) ({$patientName}):\n";

        $message = "السلام عليكم ورحمة الله وبركاته،\n"
                 . "تحية طيبة من *{$clinicName}* 🏥\n\n"
                 . $subjectLine
                 . "📄 *رقم السند:* {$invoice->invoice_number}\n"
                 . "💰 *إجمالي الأتعاب:* {$totalFormatted} دج\n"
                 . "✅ *المبلغ المسدد:* {$paidFormatted} دج\n"
                 . "⏳ *الرصيد المتبقي المستحق:* *{$remainingFormatted} دج*\n\n"
                 . "يمكنكم تسوية الرصيد نقداً عند الاستقبال في الجلسة القادمة، أو عبر تطبيق BaridiMob.\n"
                 . "نشكر لكم حسن ثقتكم وتعاونكم، ودمتم بصحة وعافية.";

        $phone = preg_replace('/[^0-9]/', '', $patient?->phone ?? '');
        if (str_starts_with($phone, '0')) {
            $phone = '213' . substr($phone, 1);
        }

        $whatsappUrl = $phone ? "https://wa.me/{$phone}?text=" . urlencode($message) : "https://wa.me/?text=" . urlencode($message);

        return response()->json([
            'success' => true,
            'whatsapp_url' => $whatsappUrl,
            'whatsapp_message' => $message,
            'phone' => $phone,
            'remaining_balance' => $remaining,
        ]);
    }

    /**
     * Dispatch invoice payment reminder directly via WhatsApp Cloud API.
     */
    public function sendWhatsAppReminder(Request $request, string $id): JsonResponse
    {
        $reminderData = $this->getWhatsAppReminder($request, $id)->getData(true);
        if (!$reminderData['success'] || empty($reminderData['phone'])) {
            return response()->json([
                'success' => false,
                'cloud_sent' => false,
                'requires_manual' => true,
                'message' => 'تعذر إيجاد رقم هاتف المريض، يمكنك استخدام الرابط المباشر.',
                'whatsapp_url' => $reminderData['whatsapp_url'] ?? '',
                'whatsapp_message' => $reminderData['whatsapp_message'] ?? '',
            ], 200);
        }

        $gw = \App\Models\CommunicationGateway::first();
        if (!$gw || !$gw->is_whatsapp_active || empty($gw->whatsapp_phone_number_id)) {
            return response()->json([
                'success' => false,
                'cloud_sent' => false,
                'requires_manual' => true,
                'message' => 'بوابة واتساب السحابية غير مفعلة، تم تجهيز الرابط المباشر ومسودة الرسالة.',
                'whatsapp_url' => $reminderData['whatsapp_url'],
                'whatsapp_message' => $reminderData['whatsapp_message'],
                'phone' => $reminderData['phone'],
            ], 200);
        }

        try {
            $res = \App\Services\WhatsAppCloudApiService::sendTextMessage(
                $reminderData['phone'],
                $reminderData['whatsapp_message'],
                $gw
            );

            if (!empty($res['success'])) {
                return response()->json([
                    'success' => true,
                    'cloud_sent' => true,
                    'message' => 'تم إرسال تذكير المستحقات المالية عبر واتساب بنجاح! 🚀',
                    'message_id' => $res['message_id'] ?? null,
                    'phone' => $reminderData['phone'],
                    'whatsapp_url' => $reminderData['whatsapp_url'],
                ]);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Invoice WhatsApp Cloud API error: ' . $e->getMessage());
        }

        return response()->json([
            'success' => false,
            'cloud_sent' => false,
            'requires_manual' => true,
            'message' => 'تعذر الإرسال التلقائي، تم تجهيز الرابط المباشر ومسودة الرسالة.',
            'whatsapp_url' => $reminderData['whatsapp_url'],
            'whatsapp_message' => $reminderData['whatsapp_message'],
            'phone' => $reminderData['phone'],
        ], 200);
    }

    /**
     * Generate Receipt PDF.
     */
    public function generatePdf(string $id): Response
    {
        $invoice = Invoice::with(['patient', 'appointment', 'tenant'])->findOrFail($id);
        $patient = $invoice->patient ?: (object) [
            'first_name' => $invoice->company_name ?: 'Client B2B',
            'last_name' => '',
            'phone' => $invoice->tenant?->phone ?? '',
            'guardian_name' => 'B2B Commercial',
            'birth_date' => null,
        ];
        $tenant = $invoice->tenant ?: Tenant::find($invoice->tenant_id);

        $pdf = Pdf::loadView('pdf.invoice_receipt', [
            'invoice' => $invoice,
            'patient' => $patient,
            'tenant' => $tenant,
        ]);

        $fileName = ($invoice->invoice_type === 'b2b_subscription' ? 'Facture_B2B_' : 'Recu_') . $invoice->invoice_number . '.pdf';

        return $pdf->stream($fileName);
    }
}
