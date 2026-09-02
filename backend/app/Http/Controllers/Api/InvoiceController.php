<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

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

        $invoices = $query->latest('issued_date')->paginate((int) $request->query('per_page', 25));

        return response()->json([
            'invoices' => $invoices,
            'summary' => [
                'total_billed' => (float) $totalBilled,
                'total_paid' => (float) $totalPaid,
                'unpaid_balance' => (float) $unpaidBalance,
            ],
        ]);
    }

    /**
     * Store new invoice with auto invoice number.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
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
     * Generate Receipt PDF.
     */
    public function generatePdf(string $id): Response
    {
        $invoice = Invoice::with(['patient', 'appointment', 'tenant'])->findOrFail($id);

        $pdf = Pdf::loadView('pdf.invoice_receipt', [
            'invoice' => $invoice,
            'patient' => $invoice->patient,
            'tenant' => $invoice->tenant,
        ]);

        $fileName = 'Recu_' . $invoice->invoice_number . '.pdf';

        return $pdf->stream($fileName);
    }
}
