<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Invoice;
use App\Models\Patient;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DataExportController extends Controller
{
    /**
     * Export clinic patients to CSV/Excel format.
     */
    public function exportPatientsExcel(Request $request): StreamedResponse
    {
        $fileName = 'patients_export_' . date('Y-m-d') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');
            // Add UTF-8 BOM for Excel Arabic character compatibility
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($handle, ['رقم الملف', 'الاسم', 'اللقب', 'الجنس', 'تاريخ الميلاد', 'الهاتف', 'تاريخ التسجيل']);

            Patient::orderBy('id', 'desc')->chunk(200, function ($patients) use ($handle) {
                foreach ($patients as $p) {
                    fputcsv($handle, [
                        $p->folder_number ?? "#{$p->id}",
                        $p->first_name,
                        $p->last_name,
                        $p->gender === 'male' ? 'ذكر' : 'أنثى',
                        $p->birth_date,
                        $p->phone,
                        $p->created_at ? $p->created_at->format('Y-m-d') : '',
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Export financial ledger & invoices to CSV/Excel format.
     */
    public function exportFinancialLedgerExcel(Request $request): StreamedResponse
    {
        $fileName = 'financial_ledger_' . date('Y-m-d') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($handle, ['رقم الفاتورة', 'المريض', 'المبلغ الإجمالي (دج)', 'المبلغ المدفوع (دج)', 'المتبقي (دج)', 'الحالة', 'التاريخ']);

            Invoice::with('patient')->orderBy('id', 'desc')->chunk(200, function ($invoices) use ($handle) {
                foreach ($invoices as $inv) {
                    $patientName = $inv->patient ? "{$inv->patient->first_name} {$inv->patient->last_name}" : 'N/A';
                    fputcsv($handle, [
                        $inv->invoice_number ?? "#{$inv->id}",
                        $patientName,
                        $inv->total_amount,
                        $inv->paid_amount,
                        $inv->remaining_amount ?? ($inv->total_amount - $inv->paid_amount),
                        $inv->status,
                        $inv->created_at ? $inv->created_at->format('Y-m-d') : '',
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Export appointments schedule to CSV/Excel format.
     */
    public function exportAppointmentsExcel(Request $request): StreamedResponse
    {
        $fileName = 'appointments_export_' . date('Y-m-d') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($handle, ['رقم الحجز', 'المريض', 'الأخصائي', 'التاريخ', 'الوقت', 'الحالة', 'النوع']);

            Appointment::with(['patient', 'practitioner'])->orderBy('appointment_date', 'desc')->chunk(200, function ($appts) use ($handle) {
                foreach ($appts as $a) {
                    $patientName = $a->patient ? "{$a->patient->first_name} {$a->patient->last_name}" : 'N/A';
                    $practitionerName = $a->practitioner ? $a->practitioner->name : 'N/A';
                    fputcsv($handle, [
                        "#{$a->id}",
                        $patientName,
                        $practitionerName,
                        $a->appointment_date,
                        $a->start_time,
                        $a->status,
                        $a->type ?? 'عادي',
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }
}
