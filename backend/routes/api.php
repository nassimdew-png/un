<?php

use App\Http\Controllers\Api\AiTherapyHubController;
use App\Http\Controllers\Api\AiRadioPodcastController;
use App\Http\Controllers\Api\AiImageStudioController;
use App\Http\Controllers\Api\AiVideoStudioController;
use App\Http\Controllers\Api\AiSpeechStudioController;
use App\Http\Controllers\Api\SpeechFluencyAnalyzerController;
use App\Http\Controllers\Api\AiSupportAssistantController;
use App\Http\Controllers\Api\AiDataAnalystController;
use App\Http\Controllers\Api\DocumentProcessorController;
use App\Http\Controllers\Api\SuperAdminAiController;
use App\Http\Controllers\Api\SuperAdmin\RepoMaintainerController;
use App\Http\Controllers\Api\SuperAdmin\ApiConfigManagerController;
use App\Http\Controllers\Api\SuperAdmin\ClinicQuotaManagerController;
use App\Http\Controllers\Api\SuperAdmin\FeatureFlagController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AttachmentController;
use App\Http\Controllers\Api\AudioNoteController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\BehaviorTrackingController;
use App\Http\Controllers\Api\ClinicalAiController;
use App\Http\Controllers\Api\ClinicalAssessmentCatalogController;
use App\Http\Controllers\Api\ClinicalAssessmentController;
use App\Http\Controllers\Api\ClinicalGoalController;
use App\Http\Controllers\Api\ClinicController;
use App\Http\Controllers\Api\ClinicServiceController;
use App\Http\Controllers\Api\ClinicStaffController;
use App\Http\Controllers\Api\ClinicSubscriptionController;
use App\Http\Controllers\Api\DataExportController;
use App\Http\Controllers\Api\DigitalTherapyController;
use App\Http\Controllers\Api\ExerciseController;
use App\Http\Controllers\Api\GeoController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\KioskController;
use App\Http\Controllers\Api\ParentPortalController;
use App\Http\Controllers\Api\PublicDirectoryController;
use App\Http\Controllers\Api\AcademicController;
use App\Http\Controllers\Api\PatientAudioController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PatientDocumentController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Controllers\Api\RemoteAssessmentController;
use App\Http\Controllers\Api\RemoteTherapyController;
use App\Http\Controllers\Api\PublicAuthController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\SuperAdminController;
use App\Http\Controllers\Api\SuperAdmin\SubscriptionPlanManagerController;
use App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController;
use App\Http\Controllers\Api\TenantSettingsController;
use App\Http\Controllers\Api\ClinicSettingsController;
use App\Http\Controllers\Api\TherapyHubController;
use App\Http\Controllers\Api\TherapySessionController;
use App\Http\Controllers\Api\WaitlistController;
use App\Http\Middleware\CheckSubscriptionActive;
use App\Http\Controllers\Api\AiCopilotController;
use App\Http\Controllers\Api\RehabilitationPlanController;
use App\Http\Controllers\Api\SessionDocumentationController;
use App\Http\Controllers\Api\CustomDomainManagerController;
use App\Http\Controllers\Api\SuperAdmin\DomainManagerController;
use Illuminate\Support\Facades\Route;

// Public Authentication, Registration & Kiosk Check-In with Rate Limiting
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:login')
        ->name('login');
    Route::post('/register', [PublicAuthController::class, 'registerClinic'])
        ->middleware('throttle:30,1')
        ->name('auth.register');
});

// Public Self-Registration & Onboarding (14-Day Free Trial)
Route::get('/public/tenant-info', [PublicAuthController::class, 'getTenantInfo'])->name('public.tenant_info');
Route::get('/clinic/public-info', [PublicAuthController::class, 'getTenantInfo'])->name('clinic.public_info');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

// User Profile & Onboarding Tour
Route::post('/user/complete-tour', [AuthController::class, 'completeTour'])->name('user.complete_tour');
Route::post('/auth/complete-tour', [AuthController::class, 'completeTour'])->name('auth.complete_tour');

// Superadmin Management Suite API
Route::prefix('superadmin')->group(function () {
    Route::get('/metrics', [SuperAdminController::class, 'getDashboardOverview'])->name('superadmin.metrics');
    Route::get('/stats', [SuperAdminController::class, 'getGlobalStats'])->name('superadmin.stats');
    Route::get('/tenants', [SuperAdminController::class, 'getClinics'])->name('superadmin.tenants');
    Route::post('/tenants', [SuperAdminController::class, 'createClinic'])->name('superadmin.tenants.store');
    Route::get('/clinics', [SuperAdminController::class, 'getClinics'])->name('superadmin.clinics');
    Route::post('/clinics', [SuperAdminController::class, 'createClinic'])->name('superadmin.clinics.store');
    Route::get('/plans', [SuperAdminController::class, 'getPlans'])->name('superadmin.plans');
    Route::get('/payment-requests', [SuperAdminController::class, 'getPaymentRequests'])->name('superadmin.payment_requests');
    Route::post('/payment-requests/{id}/approve', [SuperAdminController::class, 'approvePaymentRequest'])->name('superadmin.payment_requests.approve');
    Route::post('/payment-requests/{id}/reject', [SuperAdminController::class, 'rejectPaymentRequest'])->name('superadmin.payment_requests.reject');
    Route::get('/invoices', [SuperAdminController::class, 'getSaasInvoices'])->name('superadmin.invoices');
    Route::post('/tenants/{id}/impersonate', [SuperAdminController::class, 'impersonateClinic'])->name('superadmin.tenants.impersonate');
    Route::post('/clinics/{id}/impersonate', [SuperAdminController::class, 'impersonateClinic'])->name('superadmin.clinics.impersonate');
    Route::get('/domains', [DomainManagerController::class, 'index'])->name('superadmin.domains.index');
    Route::post('/domains/{id}/force-renew', [DomainManagerController::class, 'forceRenew'])->name('superadmin.domains.force_renew');
    Route::delete('/domains/{id}', [DomainManagerController::class, 'destroy'])->name('superadmin.domains.destroy');
});

Route::prefix('super-admin')->group(function () {
    Route::get('/dashboard-overview', [SuperAdminController::class, 'getDashboardOverview']);
    Route::get('/stats', [SuperAdminController::class, 'getGlobalStats']);
    Route::get('/clinics', [SuperAdminController::class, 'getClinics']);
    Route::post('/clinics', [SuperAdminController::class, 'createClinic']);
    Route::post('/tenants', [SuperAdminController::class, 'createClinic']);
    Route::post('/clinics/{id}/impersonate', [SuperAdminController::class, 'impersonateClinic'])->name('super_admin.clinics.impersonate');
    Route::post('/tenants/{id}/impersonate', [SuperAdminController::class, 'impersonateClinic'])->name('super_admin.tenants.impersonate');
    Route::get('/plans', [SuperAdminController::class, 'getPlans']);
    Route::get('/payment-requests', [SuperAdminController::class, 'getPaymentRequests']);
    Route::post('/payment-requests/{id}/approve', [SuperAdminController::class, 'approvePaymentRequest']);
    Route::post('/payment-requests/{id}/reject', [SuperAdminController::class, 'rejectPaymentRequest']);
    Route::get('/invoices', [SuperAdminController::class, 'getSaasInvoices']);
    Route::get('/coupons', [SuperAdminController::class, 'getCoupons']);
    Route::post('/coupons', [SuperAdminController::class, 'createCoupon']);
    Route::post('/coupons/{id}/toggle', [SuperAdminController::class, 'toggleCoupon']);
    Route::delete('/coupons/{id}', [SuperAdminController::class, 'deleteCoupon']);
    Route::get('/tests', [SuperAdminController::class, 'getGlobalTestsCatalog']);
    Route::post('/tests/{testCode}', [SuperAdminController::class, 'updateTestConfig']);

    // Custom Domains & DNS (Super Admin)
    Route::get('/domains', [DomainManagerController::class, 'index']);
    Route::post('/domains/{id}/force-renew', [DomainManagerController::class, 'forceRenew']);
    Route::delete('/domains/{id}', [DomainManagerController::class, 'destroy']);
    Route::post('/clinics/{clinicId}/domains', [SuperAdminController::class, 'updateClinicDomain']);
    Route::post('/clinics/{clinicId}/domains/check-dns', [SuperAdminController::class, 'checkDnsResolution']);
    Route::post('/clinics/{clinicId}/domains/provision-ssl', [SuperAdminController::class, 'provisionSslCertificate']);

    // Support Tickets & Inquiries
    Route::get('/support-tickets', [SuperAdminController::class, 'getSupportTickets']);
    Route::get('/support-tickets/{id}', [SuperAdminController::class, 'getSupportTicketDetails']);
    Route::post('/support-tickets/{id}/reply', [SuperAdminController::class, 'replySupportTicket']);
    Route::match(['post', 'patch'], '/support-tickets/{id}/status', [SuperAdminController::class, 'updateSupportTicketStatus']);

    // Admin Team RBAC
    Route::get('/admin-team', [SuperAdminController::class, 'getAdminTeam']);
    Route::post('/admin-team', [SuperAdminController::class, 'createAdminMember']);
    Route::put('/admin-team/{id}', [SuperAdminController::class, 'updateAdminPermissions']);
    Route::delete('/admin-team/{id}', [SuperAdminController::class, 'revokeAdminMember']);

    // Backups & Disaster Recovery
    Route::get('/disaster-recovery/backups', [SuperAdminController::class, 'getPlatformBackups']);
    Route::get('/backups/cloud-list', [SuperAdminController::class, 'getCloudBackupsList']);
    Route::post('/disaster-recovery/backups/create', [SuperAdminController::class, 'triggerPlatformBackupNow']);
    Route::delete('/disaster-recovery/backups/{filename}', [SuperAdminController::class, 'deletePlatformBackup']);
});

// Super Admin AI Governance & Quota Metering
Route::get('/super-admin/ai/overview', [SuperAdminAiController::class, 'getOverview'])->name('superadmin.ai.overview');
Route::put('/super-admin/ai/settings', [SuperAdminAiController::class, 'updateSettings'])->name('superadmin.ai.settings');
Route::post('/super-admin/ai/test-connection', [SuperAdminAiController::class, 'testConnection'])->name('superadmin.ai.test_connection');
Route::put('/super-admin/clinics/{clinicId}/ai-quota', [SuperAdminAiController::class, 'updateClinicAiQuota'])->name('superadmin.clinics.ai_quota');
Route::post('/super-admin/ai/reset-monthly-usage', [SuperAdminAiController::class, 'resetMonthlyUsage'])->name('superadmin.ai.reset_usage');

// In-Session AI Voice Documentation & SOAP Notes Engine
Route::post('/clinic/sessions/voice-soap', [SessionDocumentationController::class, 'processVoiceSoap'])->name('clinic.sessions.voice_soap');
Route::post('/clinic/sessions/save-soap', [SessionDocumentationController::class, 'saveSoapNote'])->name('clinic.sessions.save_soap');
Route::get('/clinic/patients/{patientId}/soap-history', [SessionDocumentationController::class, 'getPatientSoapHistory'])->name('clinic.patients.soap_history');
Route::post('/clinic/anamnesis/suggest-questions', [SessionDocumentationController::class, 'suggestAnamnesisQuestions'])->name('clinic.anamnesis.suggest_questions');

// Rehabilitation, PEP/IEP & Algerian-Context Exercises Engine
Route::get('/clinic/patients/{patientId}/pep', [RehabilitationPlanController::class, 'getPatientPlans'])->name('clinic.patients.pep');
Route::post('/clinic/patients/{patientId}/pep/ai-generate', [RehabilitationPlanController::class, 'aiGeneratePep'])->name('clinic.patients.pep_generate');
Route::post('/clinic/patients/{patientId}/pep/save', [RehabilitationPlanController::class, 'savePepPlan'])->name('clinic.patients.pep_save');
Route::put('/clinic/pep/{planId}/goal-status', [RehabilitationPlanController::class, 'updateGoalStatus'])->name('clinic.pep.goal_status');
Route::post('/clinic/rehab/ai-generate-content', [RehabilitationPlanController::class, 'aiGenerateContent'])->name('clinic.rehab.generate_content');
Route::post('/clinic/rehab/dispatch-to-portal', [RehabilitationPlanController::class, 'dispatchToPortal'])->name('clinic.rehab.dispatch_portal');

// AI Clinical Copilot & Bilan Synthesis Engine
Route::post('/clinic/ai/generate-bilan', [AiCopilotController::class, 'generateBilan'])->name('clinic.ai.generate_bilan');
Route::get('/clinic/ai/quota-status', [AiCopilotController::class, 'getQuotaStatus'])->name('clinic.ai.quota_status');
Route::get('/clinic/ai/logs', [AiCopilotController::class, 'getLogs'])->name('clinic.ai.logs');

// Super Admin Off-site Cloud Backup API
Route::get('/super-admin/backups/cloud-config', [SuperAdminController::class, 'getCloudStorageConfig'])->name('superadmin.backups.cloud_config');
Route::post('/super-admin/backups/cloud-config', [SuperAdminController::class, 'saveCloudStorageConfig'])->name('superadmin.backups.save_cloud_config');
Route::post('/super-admin/backups/test-cloud-connection', [SuperAdminController::class, 'testCloudStorageConnection'])->name('superadmin.backups.test_cloud_connection');
Route::get('/superadmin/backups/cloud-config', [SuperAdminController::class, 'getCloudStorageConfig']);
Route::post('/superadmin/backups/cloud-config', [SuperAdminController::class, 'saveCloudStorageConfig']);
Route::post('/superadmin/backups/test-cloud-connection', [SuperAdminController::class, 'testCloudStorageConnection']);

Route::post('/super-admin/backups/trigger-cloud', [SuperAdminController::class, 'triggerCloudBackup'])->name('superadmin.backups.trigger_cloud');
Route::get('/super-admin/backups/cloud-list', [SuperAdminController::class, 'getCloudBackupsList'])->name('superadmin.backups.cloud_list');
Route::post('/superadmin/backups/trigger-cloud', [SuperAdminController::class, 'triggerCloudBackup'])->name('superadmin.backups.trigger_cloud_alt');
Route::get('/superadmin/backups/cloud-list', [SuperAdminController::class, 'getCloudBackupsList'])->name('superadmin.backups.cloud_list_alt');

// Public National Directory & Online Booking Engine (/annuaire)
Route::get('/public/directory', [PublicDirectoryController::class, 'getDirectory'])->name('public.directory.list');
Route::get('/public/directory/{subdomain}', [PublicDirectoryController::class, 'getClinicProfile'])->name('public.directory.profile');
Route::post('/public/directory/{clinicId}/book', [PublicDirectoryController::class, 'submitBookingRequest'])->name('public.directory.book');

// Public Academic Hub & Student Licensing (/academic)
Route::get('/academic/tiers', [AcademicController::class, 'getAcademicTiers'])->name('academic.tiers');
Route::post('/academic/apply', [AcademicController::class, 'apply'])->name('academic.apply');

// Clinic Protected Booking Requests Pipeline
Route::get('/clinic/booking-requests', [PublicDirectoryController::class, 'listClinicBookingRequests'])->name('clinic.booking_requests.list');
Route::put('/clinic/booking-requests/{id}/status', [PublicDirectoryController::class, 'updateBookingStatus'])->name('clinic.booking_requests.update_status');

// Public Patient & Parent Interactive Portal (Magic Link & Secure Access)
Route::get('/portal/access/{token}', [ParentPortalController::class, 'getPortalData'])->name('portal.access');
Route::get('/portal/{token}', [ParentPortalController::class, 'getPortalData'])->name('portal.view');
Route::post('/portal/{token}/appointment/{appointmentId}/confirm', [ParentPortalController::class, 'confirmAppointment'])->name('portal.appointment.confirm');
Route::post('/portal/{token}/homework/{homeworkId}/complete', [ParentPortalController::class, 'completeHomework'])->name('portal.homework.complete');

// Clinic Protected Patient Portal Link Generator
Route::post('/patients/{id}/generate-portal-link', [ParentPortalController::class, 'generatePortalLink'])->name('clinic.patients.portal_link');
Route::post('/clinic/patients/{id}/generate-portal-link', [ParentPortalController::class, 'generatePortalLink'])->name('clinic.patients.portal_link_alt');

Route::post('/public/register-clinic', [PublicAuthController::class, 'registerClinic'])
    ->middleware('throttle:30,1')
    ->name('public.register_clinic');

Route::post('/kiosk/check-in', [KioskController::class, 'checkIn'])
    ->middleware('throttle:kiosk')
    ->name('kiosk.checkin');

// Public/Query-token streaming & PDF exports (Supports both Bearer Token Header and ?token= Query Parameter)
Route::get('attachments/{id}/stream', [AttachmentController::class, 'stream'])->name('attachments.stream');
Route::get('attachments/{id}/download', [AttachmentController::class, 'download'])->name('attachments.download');
Route::get('appointments/export-daily-pdf', [AppointmentController::class, 'exportDailyPdf'])->name('appointments.daily_pdf');
Route::get('appointments/export/daily-pdf', [AppointmentController::class, 'exportDailyPdf'])->name('appointments.daily_pdf_alt');
Route::get('appointments/daily-schedule/pdf', [AppointmentController::class, 'exportDailyPdf'])->name('appointments.daily_schedule_pdf');

// Clinical Assessments & Bilan PDF Exports
Route::get('assessments/{id}/pdf', [ClinicalAssessmentController::class, 'generatePdf'])->name('assessments.pdf');
Route::get('clinical-tests/bilan-pdf/{assessmentId}', [ClinicalAssessmentCatalogController::class, 'exportBilanPdf'])->name('clinical_tests.bilan_pdf');
Route::get('patients/{patientId}/master-bilan-pdf', [ClinicalAssessmentCatalogController::class, 'exportMasterBilanPdf'])->name('clinical_tests.master_bilan_pdf');
Route::get('patient-bilans/{bilanId}/pdf', [ClinicalAssessmentCatalogController::class, 'downloadPatientBilanPdf'])->name('clinical_tests.bilans.pdf');
Route::get('homework-plans/{planId}/workbook-pdf', [TherapyHubController::class, 'generateWorkbookPdf'])->name('therapy_hub.workbook_pdf');
Route::get('invoices/{id}/pdf', [InvoiceController::class, 'generatePdf'])->name('invoices.pdf');
Route::get('patients/{patientId}/documents/{documentId}/export-pdf', [PatientDocumentController::class, 'exportPdf'])->name('patients.documents.export_pdf');
Route::get('documents/{id}/pdf', [PatientDocumentController::class, 'exportPdf'])->name('documents.pdf');
Route::get('homeworks/{id}/pdf', [ExerciseController::class, 'downloadPdf'])->name('homeworks.pdf');
Route::get('patients/{patientId}/homeworks/{homeworkId}/export-pdf', [ExerciseController::class, 'exportHomeworkPdf'])->name('patients.homeworks.export_pdf');
Route::get('patients/{patientId}/assessments/export-progression-pdf', [ClinicalAssessmentController::class, 'exportProgressionPdf'])->name('assessments.progression_pdf');
Route::get('therapy/dysphagia/export-pdf/{patientId}', [DigitalTherapyController::class, 'exportDysphagiaPdf'])->name('therapy.dysphagia.export_pdf');

// Automated Backups & Granular Data Exports (Supports direct download via token)
Route::get('backups/download/{filename}', [BackupController::class, 'downloadBackup'])->name('backups.download');
Route::get('exports/patients/excel', [DataExportController::class, 'exportPatientsExcel'])->name('exports.patients.excel');
Route::get('exports/financial-ledger/excel', [DataExportController::class, 'exportFinancialLedgerExcel'])->name('exports.finance.excel');
Route::get('exports/appointments/excel', [DataExportController::class, 'exportAppointmentsExcel'])->name('exports.appointments.excel');

// Public Geo Data
Route::get('geo/algeria-wilayas', [GeoController::class, 'getWilayas'])->name('geo.wilayas');

// Public Remote Assessment Portal (PIN Gate, Draft Save & Submission)
Route::post('public/assessment/{token}/verify-pin', [RemoteAssessmentController::class, 'verifyPin'])->name('public.assessment.verify_pin');
Route::post('public/assessment/{token}/save-draft', [RemoteAssessmentController::class, 'saveDraft'])->name('public.assessment.save_draft');
Route::post('public/assessment/{token}/submit', [RemoteAssessmentController::class, 'submit'])->name('public.assessment.submit');
Route::get('public/assessment/{token}/print-slip', [RemoteAssessmentController::class, 'printSlip'])->name('public.assessment.print_slip');

// Public Waiting Room TV Queue Display Feed
Route::get('public/tv-queue/{tenantSlug?}', [QueueController::class, 'getTvQueue'])->name('public.tv_queue');

// Public Mobile-First Parent Portal
Route::post('public/parent-portal/login', [ParentPortalController::class, 'login'])->name('public.parent_portal.login');
Route::get('public/parent-portal/dashboard', [ParentPortalController::class, 'getDashboard'])->name('public.parent_portal.dashboard');
Route::post('public/parent-portal/homework/{id}/toggle-status', [ParentPortalController::class, 'toggleHomeworkStatus'])->name('public.parent_portal.toggle_homework');

// Public Magic Link Parent Portal (Mobile Screening, Anamnèse & Homework)
Route::get('public/portal/{token}', [ParentPortalController::class, 'validatePortalAccess'])->name('public.portal.validate');
Route::post('public/portal/{token}/submit', [ParentPortalController::class, 'submitParentForm'])->name('public.portal.submit');
Route::get('public/portal/{token}/homework', [ParentPortalController::class, 'getPatientHomeworkForParent'])->name('public.portal.homework');

// Public Remote Digital Therapy Portal (PIN & Interactive Task Execution)
Route::post('public/therapy/{token}/verify-pin', [RemoteTherapyController::class, 'verifyPin'])->name('public.therapy.verify_pin');
Route::post('public/therapy/{token}/submit-results', [RemoteTherapyController::class, 'submitResults'])->name('public.therapy.submit_results');

// Public TTS Audio Proxy Stream (Arabic/French Speech Synthesis)
Route::get('/public/tts-stream', function (\Illuminate\Http\Request $request) {
    $text = $request->query('text', '');
    $lang = $request->query('lang', 'ar');
    if (empty($text)) {
        return response()->json(['error' => 'Text required'], 400);
    }
    
    $encodedText = urlencode($text);
    $ttsUrl = "https://translate.google.com/translate_tts?ie=UTF-8&q={$encodedText}&tl={$lang}&client=tw-ob";
    
    try {
        $client = new \GuzzleHttp\Client(['timeout' => 8]);
        $response = $client->get($ttsUrl, [
            'headers' => [
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer' => 'https://translate.google.com/',
            ]
        ]);
        return response($response->getBody())
            ->header('Content-Type', 'audio/mpeg')
            ->header('Cache-Control', 'public, max-age=86400');
    } catch (\Exception $e) {
        return response()->json(['error' => 'TTS fetch failed', 'message' => $e->getMessage()], 500);
    }
})->name('public.tts_stream');

// Kiosk Public API
Route::get('kiosk/info', [KioskController::class, 'getClinicInfo']);
Route::post('kiosk/verify-access', [KioskController::class, 'verifyAccess']);

// Protected Superadmin Control Plane
Route::middleware(['auth:sanctum', 'role:superadmin'])->prefix('superadmin')->group(function () {
    Route::get('/metrics', [SuperAdminController::class, 'getDashboardOverview'])->name('superadmin.metrics.protected');
    Route::get('/plans', [SuperAdminController::class, 'getPlans'])->name('superadmin.plans.protected');
    Route::get('/tenants', [SuperAdminController::class, 'getClinics'])->name('superadmin.tenants.protected');
    Route::post('/tenants/{id}/impersonate', [SuperAdminController::class, 'impersonateClinic'])->name('superadmin.tenants.impersonate.protected');
    Route::put('/tenants/{id}/status', [SuperAdminController::class, 'updateClinicStatus'])->name('superadmin.tenants.status.protected');
    Route::post('/tenants/{id}/apply-custom-plan', [SuperAdminController::class, 'assignPlan'])->name('superadmin.tenants.apply_custom_plan');
    Route::get('/invoices', [SuperAdminController::class, 'getSaasInvoices'])->name('superadmin.invoices.protected');
    Route::get('/payment-requests', [SuperAdminController::class, 'getPaymentRequests'])->name('superadmin.payment_requests.protected');
    Route::get('/backups', [BackupController::class, 'listBackups'])->name('superadmin.backups.index');
    Route::post('/backups', [BackupController::class, 'createBackupNow'])->name('superadmin.backups.create');
    Route::get('/backups/{filename}/download', [BackupController::class, 'downloadBackup'])->name('superadmin.backups.download');
});

// Protected Multi-Tenant API (Protected by Active Tenant Check)
Route::middleware(['auth:sanctum', 'tenant.active'])->group(function () {
    // Auth Session
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
    });

    // Staff Management & Audit Trail (Restricted to Clinic Admin & Superadmin)
    Route::middleware('role:clinic_admin,admin_owner,owner,admin,doctor,practitioner,specialist,superadmin')->group(function () {
        Route::apiResource('staff', StaffController::class);
        Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit_logs.index');
        Route::get('tenant/settings', [TenantSettingsController::class, 'getSettings'])->name('tenant.settings.get');
        Route::post('tenant/settings', [TenantSettingsController::class, 'updateSettings'])->name('tenant.settings.update');
        Route::get('clinic/settings', [TenantSettingsController::class, 'getSettings'])->name('clinic.settings.get');
        Route::post('clinic/settings', [TenantSettingsController::class, 'updateSettings'])->name('clinic.settings.update');
        Route::get('clinic/settings/branding', [ClinicSettingsController::class, 'getBranding'])->name('clinic.settings.branding.get');
        Route::post('clinic/settings/branding', [ClinicSettingsController::class, 'updateBranding'])->name('clinic.settings.branding.update');
        Route::get('tenant/branding', [ClinicSettingsController::class, 'getBranding'])->name('tenant.branding.get');
        Route::post('tenant/branding', [ClinicSettingsController::class, 'updateBranding'])->name('tenant.branding.update');
        Route::get('tenant/subscription-invoices', [TenantSettingsController::class, 'getSubscriptionInvoices'])->name('tenant.subscription_invoices.index');
        Route::get('tenant/subscription-invoices/{id}/download', [TenantSettingsController::class, 'downloadSubscriptionInvoice'])->name('tenant.subscription_invoices.download');
    });

    // Clinic Branding, Daily Clinical Pulse & Smart Waiting List
    Route::get('clinic/branding', [ClinicController::class, 'getClinicBranding'])->name('clinic.branding.get');
    Route::post('clinic/branding', [ClinicController::class, 'updateClinicBranding'])->name('clinic.branding.update');
    Route::get('clinic/today-summary', [ClinicController::class, 'getTodayAgendaSummary'])->name('clinic.today_summary');
    Route::get('clinic/daily-pulse', [ClinicController::class, 'getDailyPulse'])->name('clinic.daily_pulse');
    Route::put('clinic/appointments/{id}/status', [ClinicController::class, 'updateAppointmentStatus'])->name('clinic.appointments.update_status');
    Route::get('clinic/waiting-list', [ClinicController::class, 'getWaitingList'])->name('clinic.waiting_list.index');
    Route::post('clinic/waiting-list', [ClinicController::class, 'addToWaitingList'])->name('clinic.waiting_list.store');
    Route::post('clinic/waiting-list/{id}/convert', [ClinicController::class, 'convertWaitingToAppointment'])->name('clinic.waiting_list.convert');
    Route::put('clinic/waiting-list/{id}/status', [ClinicController::class, 'updateWaitingStatus'])->name('clinic.waiting_list.update_status');
    Route::delete('clinic/waiting-list/{id}', [ClinicController::class, 'deleteWaitingEntry'])->name('clinic.waiting_list.destroy');

    // Clinic Custom Domains & SSL Automation Engine
    Route::get('clinic/domains', [CustomDomainManagerController::class, 'index'])->name('clinic.domains.index');
    Route::post('clinic/domains', [CustomDomainManagerController::class, 'store'])->name('clinic.domains.store');
    Route::post('clinic/domains/{id}/verify-dns', [CustomDomainManagerController::class, 'verifyDns'])->name('clinic.domains.verify_dns');
    Route::post('clinic/domains/{id}/issue-ssl', [CustomDomainManagerController::class, 'issueSsl'])->name('clinic.domains.issue_ssl');
    Route::delete('clinic/domains/{id}', [CustomDomainManagerController::class, 'destroy'])->name('clinic.domains.destroy');

    // Patients Management (Accessible to All Clinic Roles)
        // Patient AI Therapy Records Attachment
    Route::post('patients/{id}/ai-records', [PatientController::class, 'storeAiRecord'])->name('patients.store_ai_record');
    Route::get('patients/{id}/ai-records', [PatientController::class, 'getAiRecords'])->name('patients.get_ai_records');
    Route::apiResource('patients', PatientController::class);

    // Patient Attachments
    Route::get('patients/{patientId}/attachments', [AttachmentController::class, 'index'])->name('attachments.index');
    Route::post('patients/{patientId}/attachments', [AttachmentController::class, 'upload'])->name('attachments.upload');
    Route::delete('attachments/{id}', [AttachmentController::class, 'destroy'])->name('attachments.destroy');

    // Smart Appointments Scheduling & Active Consultation Workspace
    Route::get('appointments/{id}/whatsapp-reminder', [AppointmentController::class, 'whatsappReminder'])->name('appointments.whatsapp');
    Route::post('appointments/quick-start', [AppointmentController::class, 'quickStartSession'])->name('appointments.quick_start');
    Route::post('appointments/{id}/start-session', [AppointmentController::class, 'startSession'])->name('appointments.start_session');
    Route::post('appointments/{id}/complete-session', [AppointmentController::class, 'completeSession'])->name('appointments.complete_session');
    Route::post('appointments/{appointmentId}/assessments', [ClinicalAssessmentController::class, 'runInSession'])->name('appointments.assessments.run');
    Route::post('appointments/{appointmentId}/call-queue', [QueueController::class, 'callNext'])->name('appointments.call_queue');
    Route::post('queue/call-patient', [QueueController::class, 'callNext'])->name('queue.call_patient');
    Route::apiResource('appointments', AppointmentController::class);

    // Smart Waitlist & Slot Recovery
    Route::get('waitlist', [WaitlistController::class, 'index'])->name('waitlist.index');
    Route::post('waitlist', [WaitlistController::class, 'store'])->name('waitlist.store');
    Route::get('waitlist/matches', [WaitlistController::class, 'findMatches'])->name('waitlist.matches');
    Route::post('waitlist/{id}/assign-slot', [WaitlistController::class, 'assignSlot'])->name('waitlist.assign_slot');
    Route::delete('waitlist/{id}', [WaitlistController::class, 'destroy'])->name('waitlist.destroy');

    // Clinical Exercises & Take-Home Sheets
    Route::get('exercises', [ExerciseController::class, 'index'])->name('exercises.index');
    Route::get('patients/{patientId}/homeworks', [ExerciseController::class, 'listHomeworks'])->name('patients.homeworks.index');
    Route::post('patients/{patientId}/homeworks', [ExerciseController::class, 'storeHomework'])->name('patients.homeworks.store');
    Route::delete('patients/{patientId}/homeworks/{homeworkId}', [ExerciseController::class, 'deleteHomework'])->name('patients.homeworks.delete');

    // Clinical Speech, Language & Cognitive Digital Therapy Suite
    Route::get('therapy/modules', [DigitalTherapyController::class, 'index'])->name('therapy.modules.index');
    Route::post('therapy/test-log-result', [DigitalTherapyController::class, 'testLogResult'])->name('therapy.test_log_result');
    Route::post('patients/{patientId}/therapy-results', [DigitalTherapyController::class, 'logResults'])->name('patients.therapy_results.log');
    Route::get('patients/{patientId}/therapy-progression', [DigitalTherapyController::class, 'getPatientProgression'])->name('patients.therapy_results.progression');
    Route::get('patients/{patientId}/remote-therapy-tasks', [RemoteTherapyController::class, 'index'])->name('patients.remote_therapy.index');
    Route::post('patients/{patientId}/remote-therapy-tasks', [RemoteTherapyController::class, 'assignTask'])->name('patients.remote_therapy.assign');
    Route::delete('patients/{patientId}/remote-therapy-tasks/{taskId}', [RemoteTherapyController::class, 'deleteTask'])->name('patients.remote_therapy.delete');

    // In-Session Behavior Tracking
    Route::get('patients/{patientId}/behavior-logs', [BehaviorTrackingController::class, 'index'])->name('patients.behavior_logs.index');
    Route::post('patients/{patientId}/behavior-logs', [BehaviorTrackingController::class, 'store'])->name('patients.behavior_logs.store');
    Route::get('patients/{patientId}/behavior-progression', [BehaviorTrackingController::class, 'getProgression'])->name('patients.behavior_logs.progression');

    // Medical Letters & School Attestation Builder
    Route::get('patients/{patientId}/documents', [PatientDocumentController::class, 'index'])->name('patients.documents.index');
    Route::post('patients/{patientId}/documents', [PatientDocumentController::class, 'store'])->name('patients.documents.store');
    Route::get('patients/{patientId}/documents/{documentId}', [PatientDocumentController::class, 'show'])->name('patients.documents.show');
    Route::delete('patients/{patientId}/documents/{documentId}', [PatientDocumentController::class, 'destroy'])->name('patients.documents.destroy');

    // Remote Assessments Link & PIN Management
    Route::get('patients/{patientId}/remote-assessments', [RemoteAssessmentController::class, 'index'])->name('remote_assessments.index');
    Route::post('patients/{patientId}/remote-assessments', [RemoteAssessmentController::class, 'createToken'])->name('remote_assessments.create');
    Route::delete('remote-assessments/{id}', [RemoteAssessmentController::class, 'destroy'])->name('remote_assessments.destroy');

    // Clinical Goals & PEI Templates Bank
    Route::get('clinical-goals', [ClinicalGoalController::class, 'index'])->name('clinical_goals.index');
    Route::get('patients/{patientId}/goals', [ClinicalGoalController::class, 'getPatientGoals'])->name('patients.goals.index');
    Route::post('patients/{patientId}/goals', [ClinicalGoalController::class, 'assignGoals'])->name('patients.goals.assign');
    Route::put('assigned-goals/{assignedGoalId}', [ClinicalGoalController::class, 'updateProgress'])->name('assigned_goals.update');
    Route::delete('assigned-goals/{assignedGoalId}', [ClinicalGoalController::class, 'destroy'])->name('assigned_goals.destroy');

    // Master Clinical Tests & Psychometrics Bank
    Route::get('tests', [ClinicalAssessmentCatalogController::class, 'index'])->name('tests.index_alias');
    Route::get('clinical-scales', [ClinicalAssessmentCatalogController::class, 'index'])->name('clinical_scales.index_alias');
    Route::get('clinical-tests', [ClinicalAssessmentCatalogController::class, 'index'])->name('clinical_tests.index');
    Route::get('clinical-tests/{code}', [ClinicalAssessmentCatalogController::class, 'getTestSchema'])->name('clinical_tests.schema');
    Route::post('assessments/test-run/elo', [ClinicalAssessmentCatalogController::class, 'runEloCalculation'])->name('clinical_tests.run_elo');
    Route::post('assessments/test-run/bdi', [ClinicalAssessmentCatalogController::class, 'runBdiCalculation'])->name('clinical_tests.run_bdi');
    Route::post('assessments/test-run/wisc-v', [ClinicalAssessmentCatalogController::class, 'runWiscCalculation'])->name('clinical_tests.run_wisc');
    Route::post('assessments/test-run/alouette-r', [ClinicalAssessmentCatalogController::class, 'runAlouetteCalculation'])->name('clinical_tests.run_alouette');
    Route::post('assessments/test-run/mchat', [ClinicalAssessmentCatalogController::class, 'runMchatCalculation'])->name('clinical_tests.run_mchat');
    Route::post('assessments/test-run/vineland', [ClinicalAssessmentCatalogController::class, 'runVinelandCalculation'])->name('clinical_tests.run_vineland');
    Route::post('assessments/test-run/projective-grid', [ClinicalAssessmentCatalogController::class, 'runProjectiveGridCalculation'])->name('clinical_tests.run_projective_grid');
    Route::post('assessments/test-run/do80', [ClinicalAssessmentCatalogController::class, 'runDo80Calculation'])->name('clinical_tests.run_do80');
    Route::post('assessments/test-run/d2-stroop', [ClinicalAssessmentCatalogController::class, 'runD2StroopCalculation'])->name('clinical_tests.run_d2_stroop');
    Route::post('assessments/test-run/stai-rcmas', [ClinicalAssessmentCatalogController::class, 'runStaiRcmasCalculation'])->name('clinical_tests.run_stai_rcmas');
    Route::post('assessments/test-run/zareki', [ClinicalAssessmentCatalogController::class, 'runZarekiCalculation'])->name('clinical_tests.run_zareki');
    Route::post('assessments/test-run/raven', [ClinicalAssessmentCatalogController::class, 'runRavenCalculation'])->name('clinical_tests.run_raven');
    Route::post('assessments/test-run/rey-figure', [ClinicalAssessmentCatalogController::class, 'runReyFigureCalculation'])->name('clinical_tests.run_rey_figure');
    Route::post('assessments/test-run/bonhomme', [ClinicalAssessmentCatalogController::class, 'runBonhommeCalculation'])->name('clinical_tests.run_bonhomme');
    Route::post('assessments/test-run/nepsy2', [ClinicalAssessmentCatalogController::class, 'runNepsyCalculation'])->name('clinical_tests.run_nepsy2');
    Route::post('assessments/test-run/ados2', [ClinicalAssessmentCatalogController::class, 'runAdos2Calculation'])->name('clinical_tests.run_ados2');
    Route::post('assessments/test-run/adir', [ClinicalAssessmentCatalogController::class, 'runAdirCalculation'])->name('clinical_tests.run_adir');
    Route::post('assessments/test-run/l2ma', [ClinicalAssessmentCatalogController::class, 'runL2maCalculation'])->name('clinical_tests.run_l2ma');
    Route::post('assessments/test-run/neel', [ClinicalAssessmentCatalogController::class, 'runNeelCalculation'])->name('clinical_tests.run_neel');
    Route::post('assessments/test-run/cms', [ClinicalAssessmentCatalogController::class, 'runCmsCalculation'])->name('clinical_tests.run_cms');
    Route::post('assessments/test-run/mem-iv', [ClinicalAssessmentCatalogController::class, 'runMem4Calculation'])->name('clinical_tests.run_mem4');
    Route::post('assessments/test-run/becs', [ClinicalAssessmentCatalogController::class, 'runBecsCalculation'])->name('clinical_tests.run_becs');
    Route::post('assessments/test-run/csbs', [ClinicalAssessmentCatalogController::class, 'runCsbsCalculation'])->name('clinical_tests.run_csbs');
    Route::post('assessments/test-run/echa-ecaa', [ClinicalAssessmentCatalogController::class, 'runEchaEcaaCalculation'])->name('clinical_tests.run_echa_ecaa');
    Route::post('assessments/test-run/patte-noire', [ClinicalAssessmentCatalogController::class, 'runPatteNoireCalculation'])->name('clinical_tests.run_patte_noire');
    Route::post('assessments/test-run/sceno', [ClinicalAssessmentCatalogController::class, 'runScenoCalculation'])->name('clinical_tests.run_sceno');
    Route::post('assessments/test-run/tat', [ClinicalAssessmentCatalogController::class, 'runTatCalculation'])->name('clinical_tests.run_tat');
    Route::post('assessments/test-run/tms-ecs', [ClinicalAssessmentCatalogController::class, 'runTmsEcsCalculation'])->name('clinical_tests.run_tms_ecs');
    Route::post('assessments/test-run/traumaq', [ClinicalAssessmentCatalogController::class, 'runTraumaqCalculation'])->name('clinical_tests.run_traumaq');
    Route::post('assessments/test-run/str-ciss', [ClinicalAssessmentCatalogController::class, 'runStrCissCalculation'])->name('clinical_tests.run_str_ciss');
    Route::post('assessments/test-run/wais4', [ClinicalAssessmentCatalogController::class, 'runWais4Calculation'])->name('clinical_tests.run_wais4');
    Route::post('assessments/test-run/wppsi4', [ClinicalAssessmentCatalogController::class, 'runWppsi4Calculation'])->name('clinical_tests.run_wppsi4');
    Route::post('assessments/test-run/o52', [ClinicalAssessmentCatalogController::class, 'runO52Calculation'])->name('clinical_tests.run_o52');
    Route::post('assessments/test-run/vocim', [ClinicalAssessmentCatalogController::class, 'runVocimCalculation'])->name('clinical_tests.run_vocim');
    Route::post('patients/{patientId}/clinical-test-sessions', [ClinicalAssessmentCatalogController::class, 'saveAssessmentSession'])->name('clinical_tests.save_session');
    Route::get('patients/{patientId}/assessments-history', [ClinicalAssessmentCatalogController::class, 'getAssessmentsHistory'])->name('clinical_tests.assessments_history');
    Route::post('patients/{patientId}/generate-master-bilan', [ClinicalAssessmentCatalogController::class, 'generateMasterBilan'])->name('clinical_tests.generate_master_bilan');

    // Master Clinical Bilan Builder & Records
    Route::get('patients/{patientId}/bilan-data', [ClinicalAssessmentCatalogController::class, 'getPatientBilanData'])->name('clinical_tests.bilan_data');
    Route::post('patients/{patientId}/bilans/generate', [ClinicalAssessmentCatalogController::class, 'generatePatientBilan'])->name('clinical_tests.bilans.generate');
    Route::get('patients/{patientId}/bilans', [ClinicalAssessmentCatalogController::class, 'listPatientBilans'])->name('clinical_tests.bilans.index');

    // Digital Therapy Hub & Homework Workbook Engine
    Route::get('therapy-exercises', [TherapyHubController::class, 'getExercises'])->name('therapy_hub.exercises');
    Route::get('therapy-exercises/{id}', [TherapyHubController::class, 'getExercise'])->name('therapy_hub.exercise');
    Route::get('patients/{patientId}/homework-plans', [TherapyHubController::class, 'getPatientHomeworkPlans'])->name('therapy_hub.patient_plans');
    Route::post('patients/{patientId}/homework-plans', [TherapyHubController::class, 'assignHomeworkPlan'])->name('therapy_hub.assign_plan');
    Route::patch('homework-plans/{planId}/status', [TherapyHubController::class, 'updateHomeworkPlanStatus'])->name('therapy_hub.update_status');
    Route::delete('homework-plans/{planId}', [TherapyHubController::class, 'deleteHomeworkPlan'])->name('therapy_hub.delete_plan');

    // Patient Portal Magic Link Engine
    Route::post('patients/{patientId}/portal-links', [ParentPortalController::class, 'generatePortalLink'])->name('parent_portal.generate_link');
    Route::get('patients/{patientId}/portal-links', [ParentPortalController::class, 'listPatientPortalLinks'])->name('parent_portal.list_links');

    // Clinical Assessments & Therapy Sessions (Specialists, Doctors, & Clinic Admins)
    Route::middleware('role:clinic_admin,admin_owner,owner,admin,doctor,practitioner,specialist,orthophonist,psychologist,superadmin')->group(function () {
        Route::get('patients/{patientId}/assessments-progression', [ClinicalAssessmentController::class, 'getProgressionAnalytics'])->name('assessments.progression');
        Route::get('assessments/due-reassessments', [ClinicalAssessmentController::class, 'getDueReassessments'])->name('assessments.due_reassessments');
        Route::apiResource('assessments', ClinicalAssessmentController::class);
        Route::apiResource('sessions', TherapySessionController::class);

        // Voice Archive & Audio Notes
        Route::get('patients/{patientId}/voice-samples', [PatientAudioController::class, 'index'])->name('voice_samples.index');
        Route::post('patients/{patientId}/voice-samples', [PatientAudioController::class, 'store'])->name('voice_samples.store');
        Route::get('patients/{patientId}/voice-samples/{audioId}/stream', [PatientAudioController::class, 'stream'])->name('voice_samples.stream');
        Route::delete('patients/{patientId}/voice-samples/{audioId}', [PatientAudioController::class, 'destroy'])->name('voice_samples.destroy');
        Route::get('patients/{patientId}/audio-notes', [AudioNoteController::class, 'index'])->name('audio_notes.index');
        Route::post('patients/{patientId}/audio-notes', [AudioNoteController::class, 'store'])->name('audio_notes.store');
        Route::get('patients/{patientId}/audio-notes/{noteId}/stream', [AudioNoteController::class, 'stream'])->name('audio_notes.stream');
        Route::delete('patients/{patientId}/audio-notes/{noteId}', [AudioNoteController::class, 'destroy'])->name('audio_notes.destroy');
    });

    // Billing, Invoicing & Receipts PDF (Clinic Admins, Receptionists, Specialists, Doctors)
    Route::middleware('role:clinic_admin,admin_owner,owner,admin,receptionist,specialist,doctor,practitioner,orthophonist,psychologist,superadmin')->group(function () {
        Route::get('clinic-services/defaults', [ClinicServiceController::class, 'seedDefaultServices'])->name('clinic_services.defaults');
        Route::patch('clinic-services/{id}/toggle', [ClinicServiceController::class, 'toggleStatus'])->name('clinic_services.toggle');
        Route::apiResource('clinic-services', ClinicServiceController::class);

        Route::get('patient-packages', [ClinicServiceController::class, 'listPatientPackages'])->name('patient_packages.index');
        Route::post('patient-packages/{id}/use-session', [ClinicServiceController::class, 'usePackageSession'])->name('patient_packages.use_session');

        Route::apiResource('invoices', InvoiceController::class);
    });

    // Clinic Staff & RBAC Management (Admin/Owner only)
    Route::middleware('role:admin_owner,clinic_admin,superadmin')->group(function () {
        Route::get('clinic/staff', [ClinicStaffController::class, 'index'])->name('clinic.staff.index');
        Route::post('clinic/staff', [ClinicStaffController::class, 'store'])->name('clinic.staff.store');
        Route::put('clinic/staff/{id}', [ClinicStaffController::class, 'update'])->name('clinic.staff.update');
        Route::delete('clinic/staff/{id}', [ClinicStaffController::class, 'destroy'])->name('clinic.staff.destroy');
    });

    // Clinical AI Copilot Engine (Specialists & Clinicians)
    Route::middleware('role:clinic_admin,admin_owner,clinician,specialist,orthophonist,psychologist,superadmin')->group(function () {
        Route::post('ai/draft-synthesis', [ClinicalAiController::class, 'draftSynthesis'])->name('clinical_ai.draft_synthesis');
        Route::post('ai/refine-text', [ClinicalAiController::class, 'refineText'])->name('clinical_ai.refine_text');
    });

        // Automated & Manual Backup Management (Admin/Owner only)
    Route::middleware('role:admin_owner,clinic_admin,superadmin')->group(function () {
        Route::get('backups', [BackupController::class, 'index'])->name('backups.index');
        Route::post('backups/create', [BackupController::class, 'createBackupNow'])->name('backups.create');
        Route::delete('backups/{filename}', [BackupController::class, 'deleteBackup'])->name('backups.delete');
    });

    // Clinic Subscription & Renewal Proofs (Tenant workspace)
    Route::get('subscription/current', [ClinicSubscriptionController::class, 'getCurrentSubscription'])->name('subscription.current');
    Route::post('subscription/validate-coupon', [ClinicSubscriptionController::class, 'validateCoupon'])->name('subscription.validate_coupon');
    Route::post('subscription/renew', [ClinicSubscriptionController::class, 'submitRenewalProof'])->name('subscription.renew');
    Route::get('subscription/invoices', [ClinicSubscriptionController::class, 'getClinicInvoices'])->name('subscription.invoices');
    Route::get('subscription/invoices/{id}/download', [ClinicSubscriptionController::class, 'downloadClinicInvoicePdf'])->name('subscription.invoices.download');

});


// ==========================================
// AI Clinical Therapy Hub (All 13 Studios)
// ==========================================
Route::prefix('ai-therapy')->middleware(['auth:sanctum'])->group(function () {
    Route::post('/live-session/token', [AiTherapyHubController::class, 'createLiveSessionToken'])->name('ai_therapy.live_session_token');
    Route::post('/generate-bilan', [AiTherapyHubController::class, 'generateBilan'])->middleware(['feature:ai_clinical_hub', 'quota:reports'])->name('ai_therapy.generate_bilan');
    Route::post('/generate-pep', [AiTherapyHubController::class, 'generatePep'])->middleware(['feature:ai_clinical_hub', 'quota:reports'])->name('ai_therapy.generate_pep');
    Route::post('/generate-exercise', [AiTherapyHubController::class, 'generateExercise'])->middleware(['feature:ai_clinical_hub', 'quota:reports'])->name('ai_therapy.generate_exercise');
    Route::post('/voice-scribe', [AiTherapyHubController::class, 'voiceScribe'])->name('ai_therapy.voice_scribe');
    Route::post('/generate-social-story', [AiTherapyHubController::class, 'generateSocialStory'])->middleware(['feature:ai_clinical_hub', 'quota:reports'])->name('ai_therapy.generate_social_story');
    Route::post('/generate-relaxation-session', [AiTherapyHubController::class, 'generateRelaxationSession'])->name('ai_therapy.generate_relaxation');
    Route::post('/analyze-drawing', [AiTherapyHubController::class, 'analyzeDrawing'])->name('ai_therapy.analyze_drawing');
    Route::post('/interpret-wisc', [AiTherapyHubController::class, 'interpretWisc'])->name('ai_therapy.interpret_wisc');
    Route::post('/generate-podcast', [AiRadioPodcastController::class, 'generatePodcast'])->middleware(['feature:podcast_studio', 'quota:podcasts'])->name('ai_therapy.generate_podcast');
    Route::post('/generate-image', [AiImageStudioController::class, 'generateImage'])->middleware(['feature:image_studio', 'quota:images'])->name('ai_therapy.generate_image');
    Route::get('/generated-images', [AiImageStudioController::class, 'getGeneratedImages'])->name('ai_therapy.generated_images');

    // AI Video Modeling & Animated Social Stories
    Route::prefix('videos')->group(function () {
        Route::post('/generate', [AiVideoStudioController::class, 'generate'])->middleware(['feature:video_studio', 'quota:videos'])->name('ai_therapy.videos.generate');
        Route::get('/status/{id}', [AiVideoStudioController::class, 'getStatus'])->name('ai_therapy.videos.status');
        Route::get('/', [AiVideoStudioController::class, 'index'])->name('ai_therapy.videos.index');
    });

    // Live Clinical Dictation & Speech Transcription
    Route::prefix('speech')->group(function () {
        Route::post('/transcribe-file', [AiSpeechStudioController::class, 'transcribeFile'])->middleware(['feature:speech_transcribe', 'quota:transcribe'])->name('ai_therapy.speech.transcribe');
        Route::post('/convert-to-soap', [AiSpeechStudioController::class, 'convertToSoap'])->name('ai_therapy.speech.convert_soap');
    });

    // Speech Disfluency & Stuttering Analyzer (Orthophonie Module)
    Route::prefix('orthophonie')->group(function () {
        Route::post('/analyze-fluency', [SpeechFluencyAnalyzerController::class, 'analyzeFluency'])->middleware(['feature:fluency_analyzer', 'quota:transcribe'])->name('ai_therapy.orthophonie.analyze_fluency');
        Route::get('/assessments', [SpeechFluencyAnalyzerController::class, 'index'])->name('ai_therapy.orthophonie.assessments');
    });

    Route::post('/save-to-patient', [AiTherapyHubController::class, 'saveToPatientRecord'])->name('ai_therapy.save_to_patient');
});

// ==========================================
// Super Admin AI Governance & Quota API
// ==========================================
Route::prefix('super-admin')->middleware(['auth:sanctum'])->group(function () {
    Route::get('/ai-settings', [SuperAdminAiController::class, 'getSettings'])->name('super_admin.ai_settings.get');
    Route::post('/ai-settings', [SuperAdminAiController::class, 'updateSettings'])->name('super_admin.ai_settings.update');
    Route::post('/ai-settings/test-connection', [SuperAdminAiController::class, 'testConnection'])->name('super_admin.ai_settings.test_connection');
    Route::put('/clinics/{clinicId}/ai-access', [SuperAdminAiController::class, 'toggleClinicAiAccess'])->name('super_admin.clinics.toggle_ai_access');
    Route::post('/ai/reset-monthly-usage', [SuperAdminAiController::class, 'resetMonthlyUsage'])->name('super_admin.ai.reset_monthly_usage');
});

// ==========================================
// Patient AI Records Attachment & Timeline
// ==========================================
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('patients/{id}/ai-records', [PatientController::class, 'storeAiRecord'])->name('patients.store_ai_record');
    Route::get('patients/{id}/ai-records', [PatientController::class, 'getAiRecords'])->name('patients.get_ai_records');
    Route::delete('patients/{id}/ai-records/{recordId}', [PatientController::class, 'deleteAiRecord'])->name('patients.delete_ai_record');
});

// ==========================================
// Knowledge Base & AI Support Assistant (RAG)
// ==========================================
Route::post('support/ask', [AiSupportAssistantController::class, 'ask'])->name('support.ask');
Route::post('public/support/chat', [AiSupportAssistantController::class, 'publicChat'])->name('public.support.chat');
Route::get('support/articles', [AiSupportAssistantController::class, 'getArticles'])->name('support.articles.index');
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('support/crawl-url', [AiSupportAssistantController::class, 'crawlUrl'])->name('support.crawl_url');
    Route::delete('support/articles/{id}', [AiSupportAssistantController::class, 'deleteArticle'])->name('support.articles.destroy');

    // Multi-Tenant Knowledge Base & AI Receptionist Training
    Route::prefix('tenant/knowledge-base')->group(function () {
        Route::get('/', [AiSupportAssistantController::class, 'tenantGetKnowledgeBase'])->name('tenant.knowledge_base.index');
        Route::post('/crawl', [AiSupportAssistantController::class, 'tenantCrawl'])->name('tenant.knowledge_base.crawl');
        Route::post('/text', [AiSupportAssistantController::class, 'tenantSaveDirectText'])->name('tenant.knowledge_base.text');
        Route::post('/settings', [AiSupportAssistantController::class, 'tenantUpdateSettings'])->name('tenant.knowledge_base.settings');
        Route::delete('/{id}', [AiSupportAssistantController::class, 'tenantDeleteArticle'])->name('tenant.knowledge_base.destroy');
    });

    // AI Conversational Data Analyst & BI Engine
    Route::post('/analytics/ai-query', [AiDataAnalystController::class, 'handleQuery'])->name('analytics.ai_query');

    // AI Document Processor, OCR & Presentation Slideshow
    Route::prefix('finance')->group(function () {
        Route::post('/process-document', [DocumentProcessorController::class, 'processDocument'])->name('finance.process_document');
        Route::get('/documents', [DocumentProcessorController::class, 'getDocuments'])->name('finance.documents.index');
        Route::post('/documents/{id}/reconcile', [DocumentProcessorController::class, 'reconcileDocument'])->name('finance.documents.reconcile');
        Route::delete('/documents/{id}', [DocumentProcessorController::class, 'deleteDocument'])->name('finance.documents.destroy');
        Route::post('/generate-slideshow-report', [DocumentProcessorController::class, 'generateSlideshowReport'])->name('finance.generate_slideshow');
        Route::get('/slideshow-reports', [DocumentProcessorController::class, 'getSlideshowReports'])->name('finance.slideshow_reports.index');
        Route::get('/slideshow-reports/{id}', [DocumentProcessorController::class, 'getSlideshowReport'])->name('finance.slideshow_reports.show');
    });

    // Super Admin AI Repo Maintainer & Codebase Diagnostic Studio
    Route::prefix('superadmin/repo')->group(function () {
        Route::post('/scan', [RepoMaintainerController::class, 'scan'])->name('superadmin.repo.scan');
        Route::post('/analyze-issue', [RepoMaintainerController::class, 'analyzeIssue'])->name('superadmin.repo.analyze');
        Route::post('/apply-patch', [RepoMaintainerController::class, 'applyPatch'])->name('superadmin.repo.apply_patch');
    });

    // Live Error 500 Interceptor & AI Auto-Diagnostic Pipeline
    Route::prefix('superadmin')->group(function () {
        Route::get('/system-diagnostics', [RepoMaintainerController::class, 'getDiagnostics'])->name('superadmin.system_diagnostics.index');
        Route::post('/system-diagnostics/{id}/apply', [RepoMaintainerController::class, 'applyDiagnosticPatch'])->name('superadmin.system_diagnostics.apply');
        Route::post('/system-diagnostics/{id}/dismiss', [RepoMaintainerController::class, 'dismissDiagnostic'])->name('superadmin.system_diagnostics.dismiss');
    });

    // Centralized AI API Gateway & Keys Manager
    Route::prefix('superadmin/api-configs')->group(function () {
        Route::get('/', [ApiConfigManagerController::class, 'getConfigs'])->name('superadmin.api_configs.index');
        Route::post('/update', [ApiConfigManagerController::class, 'updateConfigs'])->name('superadmin.api_configs.update');
        Route::post('/test-connection', [ApiConfigManagerController::class, 'testConnection'])->name('superadmin.api_configs.test');
        Route::post('/toggle-feature', [ApiConfigManagerController::class, 'toggleFeature'])->name('superadmin.api_configs.toggle_feature');
    });

    // Clinic AI Quota Manager
    Route::prefix('superadmin/clinics')->group(function () {
        Route::get('/quotas', [ClinicQuotaManagerController::class, 'getQuotas'])->name('superadmin.clinics.quotas');
        Route::post('/{id}/update-quota', [ClinicQuotaManagerController::class, 'updateQuota'])->name('superadmin.clinics.update_quota');
    });

    // Platform Feature Flags Master Switcher
    Route::prefix('superadmin/feature-flags')->group(function () {
        Route::get('/', [FeatureFlagController::class, 'getAdminFlags'])->name('superadmin.feature_flags.index');
        Route::post('/toggle', [FeatureFlagController::class, 'toggleFlag'])->name('superadmin.feature_flags.toggle');
    });

    // Communication & Notifications Gateway Center (WhatsApp, SMS, Email/SMTP)
    Route::prefix('superadmin/communication-settings')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'getSettings'])->name('superadmin.communication.get');
        Route::post('/save', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'saveSettings'])->name('superadmin.communication.save');
        Route::post('/test-email', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'testEmail'])->name('superadmin.communication.test_email');
        Route::post('/test-sms', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'testSms'])->name('superadmin.communication.test_sms');
        Route::post('/test-whatsapp', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'testWhatsapp'])->name('superadmin.communication.test_whatsapp');
    });

    Route::prefix('super-admin/communication-settings')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'getSettings']);
        Route::post('/save', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'saveSettings']);
        Route::post('/test-email', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'testEmail']);
        Route::post('/test-sms', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'testSms']);
        Route::post('/test-whatsapp', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'testWhatsapp']);
    });

    // Dynamic Subscription Plans & Pricing Manager
    Route::prefix('superadmin/plans')->group(function () {
        Route::get('/', [SubscriptionPlanManagerController::class, 'index'])->name('superadmin.plans.index');
        Route::post('/', [SubscriptionPlanManagerController::class, 'store'])->name('superadmin.plans.store');
        Route::put('/{id}', [SubscriptionPlanManagerController::class, 'update'])->name('superadmin.plans.update');
        Route::post('/{id}/toggle-status', [SubscriptionPlanManagerController::class, 'toggleStatus'])->name('superadmin.plans.toggle_status');
        Route::delete('/{id}', [SubscriptionPlanManagerController::class, 'destroy'])->name('superadmin.plans.destroy');
    });

    Route::prefix('super-admin/plans')->group(function () {
        Route::get('/', [SubscriptionPlanManagerController::class, 'index']);
        Route::post('/', [SubscriptionPlanManagerController::class, 'store']);
        Route::put('/{id}', [SubscriptionPlanManagerController::class, 'update']);
        Route::post('/{id}/toggle-status', [SubscriptionPlanManagerController::class, 'toggleStatus']);
        Route::delete('/{id}', [SubscriptionPlanManagerController::class, 'destroy']);
    });
});

// Public Discovery Endpoint for Frontend UI Feature Flags & Subscription Plans
Route::get('/public/feature-flags', [FeatureFlagController::class, 'getPublicFlags'])->name('public.feature_flags');
Route::get('/public/subscription-plans', [SubscriptionPlanManagerController::class, 'publicPlans'])->name('public.subscription_plans');
Route::get('/clinic/my-quota', [ClinicQuotaManagerController::class, 'getMyQuota'])->middleware(['auth:sanctum'])->name('clinic.my_quota');

