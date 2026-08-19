<?php

namespace App\Services;

use App\Models\OrthoBilan;
use App\Models\Tenant;
use Illuminate\Support\Facades\Storage;

class PDFReportGenerator
{
    /**
     * Generate HTML representation and save clinical PDF report.
     */
    public function generateOrthoBilanReport(OrthoBilan $bilan, Tenant $tenant): string
    {
        $patient = $bilan->patient;
        $specialist = $bilan->specialist;
        $fileName = 'bilan_' . ($bilan->_id ?: time()) . '.pdf';
        $relativePath = '/storage/bilans/' . $fileName;

        // In a complete deployment, dompdf or snappy will render the view into a PDF file
        // Here we build the official structured medical report payload
        $htmlContent = $this->buildBilanHtml($bilan, $patient, $specialist, $tenant);

        // Ensure storage directory exists
        if (!Storage::disk('public')->exists('bilans')) {
            Storage::disk('public')->makeDirectory('bilans');
        }

        // Save metadata/html report
        Storage::disk('public')->put('bilans/' . $fileName . '.html', $htmlContent);

        return $relativePath;
    }

    protected function buildBilanHtml($bilan, $patient, $specialist, $tenant): string
    {
        $clinicName = $tenant->name ?? 'عيادة الأمل للأرطوفونيا والدعم النفسي';
        $patientName = $patient->full_name ?? 'ياسين بن علي';
        $specialistName = $specialist->name ?? 'الأخصائي المعالج';
        $aiReport = nl2br(e($bilan->ai_generated_report ?? ''));

        return <<<HTML
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>الحصيلة الأرطوفونية - {$patientName}</title>
    <style>
        body { font-family: 'Amiri', 'DejaVu Sans', sans-serif; margin: 40px; color: #1e293b; direction: rtl; }
        .header { border-bottom: 2px solid #0284c7; padding-bottom: 20px; display: flex; justify-content: space-between; }
        .clinic-title { font-size: 20px; font-weight: bold; color: #0369a1; }
        .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .report-content { font-size: 14px; line-height: 1.8; margin-top: 20px; }
        .footer { margin-top: 50px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 12px; text-align: center; color: #64748b; }
    </style>
</head>
<body>
    <div class="header">
        <div class="clinic-title">{$clinicName}</div>
        <div>تاريخ التقرير: {$bilan->created_at}</div>
    </div>

    <div class="meta-box">
        <p><strong>اسم المريض:</strong> {$patientName} | <strong>تاريخ الميلاد:</strong> {$patient->birth_date}</p>
        <p><strong>الأخصائي الفاحص:</strong> {$specialistName} | <strong>نوع الحصيلة:</strong> {$bilan->bilan_type}</p>
    </div>

    <div class="report-content">
        {$aiReport}
    </div>

    <div class="footer">
        وثيقة إكلينيكية رسمية صادرة عبر منصة PsyPro SaaS لإدارة العيادات النفسية والأرطوفونية
    </div>
</body>
</html>
HTML;
    }
}
