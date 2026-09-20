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
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\KioskController;
use App\Http\Controllers\Api\ParentPortalController;
use App\Http\Controllers\Api\PublicDirectoryController;
use App\Http\Controllers\Api\AcademicController;
use App\Http\Controllers\Api\PatientAudioController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PatientDocumentController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Controllers\Api\ClinicalTestAssignmentController;
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
use App\Http\Controllers\Api\UserProfileController;
use App\Http\Controllers\Api\CustomDomainManagerController;
use App\Http\Controllers\Api\SuperAdmin\DomainManagerController;
use App\Http\Controllers\Api\SpeechArticulationController;
use App\Http\Controllers\Api\SuperAdmin\ServerTelemetryController;
use App\Http\Controllers\Api\SuperAdmin\SubscriptionLifecycleController;
use App\Http\Controllers\Api\SuperAdmin\SystemBroadcastController;
use App\Http\Controllers\Api\SuperAdmin\AiRoutingStudioController;
use App\Http\Controllers\Api\SuperAdmin\GeoClinicMapController;
use App\Http\Controllers\Api\SuperAdmin\ClinicOnboardingFunnelController;
use App\Http\Controllers\Api\SuperAdmin\PromoReferralEngineController;
use App\Http\Controllers\Api\PatientRetentionRadarController;
use App\Http\Controllers\Api\ClinicAiReceptionistController;
use App\Http\Controllers\Api\ClinicalDdssController;
use App\Http\Controllers\Api\VisionMedicalDocumentController;
use App\Http\Controllers\Api\SuperAdmin\SovereignControlTowerController;
use App\Http\Controllers\Api\SuperAdmin\LandingPageStudioController;
use App\Http\Controllers\Api\SuperAdmin\HelpCenterStudioController;
use App\Http\Controllers\Api\SuperAdmin\StudentOfferController;
use App\Http\Controllers\Api\WhatsAppWebhookController;
use Illuminate\Support\Facades\Route;

// Meta WhatsApp Cloud API Official Webhooks (Verification GET & Event Receiver POST)
Route::get('/whatsapp/webhook', [WhatsAppWebhookController::class, 'verifyWebhook'])->name('whatsapp.webhook.verify');
Route::post('/whatsapp/webhook', [WhatsAppWebhookController::class, 'handleWebhook'])->name('whatsapp.webhook.handle');

// Public Authentication, Registration & Kiosk Check-In with Rate Limiting
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login')->name('auth.login');
    Route::post('/kiosk-pin-login', [AuthController::class, 'kioskPinLogin'])->name('auth.kiosk_pin_login');
    Route::post('/register', [PublicAuthController::class, 'registerClinic'])
        ->middleware('throttle:30,1')
        ->name('auth.register');
});

// Public Self-Registration & Onboarding (14-Day Free Trial)
Route::get('/public/tenant-info', [PublicAuthController::class, 'getTenantInfo'])->name('public.tenant_info');
Route::get('/clinic/public-info', [PublicAuthController::class, 'getTenantInfo'])->name('clinic.public_info');
Route::get('/public/landing-page-config', [LandingPageStudioController::class, 'getPublicConfig'])->name('public.landing_page_config');
Route::get('/public/help-center-config', [HelpCenterStudioController::class, 'getPublicConfig'])->name('public.help_center_config');
Route::get('/help-center/content', [HelpCenterStudioController::class, 'getPublicConfig'])->name('help_center.content');
Route::get('/public/student-offer', [AcademicController::class, 'getOfferConfig'])->name('public.student_offer');
Route::post('/public/student-offer/apply', [AcademicController::class, 'apply'])->name('public.student_offer.apply');
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
    Route::post('/impersonate/stop', [SuperAdminController::class, 'stopImpersonation'])->name('superadmin.impersonate.stop');
    Route::get('/domains', [DomainManagerController::class, 'index'])->name('superadmin.domains.index');
    Route::post('/domains/{id}/force-renew', [DomainManagerController::class, 'forceRenew'])->name('superadmin.domains.force_renew');
    Route::delete('/domains/{id}', [DomainManagerController::class, 'destroy'])->name('superadmin.domains.destroy');

    // Teletherapy Aliases
    Route::get('/teletherapy/overview', [SuperAdminController::class, 'getTeletherapyOverview']);
    Route::get('/teletherapy/rooms', [SuperAdminController::class, 'getTeletherapyRooms']);
    Route::post('/teletherapy/rooms/{roomCode}/terminate', [SuperAdminController::class, 'terminateTeletherapyRoom']);
    Route::delete('/teletherapy/rooms/{roomCode}', [SuperAdminController::class, 'deleteTeletherapyRoom']);
    Route::get('/teletherapy/settings', [SuperAdminController::class, 'getTeletherapySettings']);
    Route::post('/teletherapy/settings', [SuperAdminController::class, 'updateTeletherapySettings']);

    // Server Health & PM2 Live Telemetry Cockpit
    Route::get('/telemetry/overview', [ServerTelemetryController::class, 'getOverview'])->name('superadmin.telemetry.overview');
    Route::post('/telemetry/pm2/restart', [ServerTelemetryController::class, 'restartPm2Process'])->name('superadmin.telemetry.pm2_restart');
    Route::post('/telemetry/cache/clear', [ServerTelemetryController::class, 'clearSystemCache'])->name('superadmin.telemetry.cache_clear');
    Route::post('/telemetry/queue/action', [ServerTelemetryController::class, 'handleQueueAction'])->name('superadmin.telemetry.queue_action');
    Route::get('/telemetry/logs', [ServerTelemetryController::class, 'getSystemLogs'])->name('superadmin.telemetry.logs');

    // Global Audit Logs & Security Guard
    Route::get('/audit-logs/overview', [AuditLogController::class, 'getSecurityOverview'])->name('superadmin.audit_logs.overview');
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('superadmin.audit_logs.index');
    Route::get('/audit-logs/blocked-ips', [AuditLogController::class, 'getBlockedIps'])->name('superadmin.audit_logs.blocked_ips');
    Route::post('/audit-logs/block-ip', [AuditLogController::class, 'blockIp'])->name('superadmin.audit_logs.block_ip');
    Route::delete('/audit-logs/blocked-ips/{id}', [AuditLogController::class, 'unblockIp'])->name('superadmin.audit_logs.unblock_ip');
    Route::get('/audit-logs/export', [AuditLogController::class, 'exportLogs'])->name('superadmin.audit_logs.export');

    // 3. Subscription Lifecycle & BaridiMob Automation
    Route::get('/lifecycle/overview', [SubscriptionLifecycleController::class, 'getLifecycleOverview'])->name('superadmin.lifecycle.overview');
    Route::post('/lifecycle/clinics/{id}/chase', [SubscriptionLifecycleController::class, 'sendRenewalChaser'])->name('superadmin.lifecycle.chase');
    Route::post('/lifecycle/clinics/{id}/grace-period', [SubscriptionLifecycleController::class, 'grantGracePeriod'])->name('superadmin.lifecycle.grace_period');
    Route::post('/lifecycle/clinics/{id}/manual-renew', [SubscriptionLifecycleController::class, 'manualRenewClinic'])->name('superadmin.lifecycle.manual_renew');
    Route::get('/lifecycle/proofs', [SubscriptionLifecycleController::class, 'getPaymentProofInbox'])->name('superadmin.lifecycle.proofs');
    Route::post('/lifecycle/proofs/{id}/approve', [SubscriptionLifecycleController::class, 'approvePaymentProof'])->name('superadmin.lifecycle.proofs.approve');
    Route::post('/lifecycle/proofs/{id}/reject', [SubscriptionLifecycleController::class, 'rejectPaymentProof'])->name('superadmin.lifecycle.proofs.reject');

    // 4. Global Broadcast & Announcements Hub
    Route::get('/broadcasts', [SystemBroadcastController::class, 'index'])->name('superadmin.broadcasts.index');
    Route::post('/broadcasts', [SystemBroadcastController::class, 'store'])->name('superadmin.broadcasts.store');
    Route::put('/broadcasts/{id}', [SystemBroadcastController::class, 'update'])->name('superadmin.broadcasts.update');
    Route::post('/broadcasts/{id}/toggle-status', [SystemBroadcastController::class, 'toggleStatus'])->name('superadmin.broadcasts.toggle_status');
    Route::delete('/broadcasts/{id}', [SystemBroadcastController::class, 'destroy'])->name('superadmin.broadcasts.destroy');

    // 5. AI Routing, Failover Cascade & Cost Studio
    Route::get('/ai-routing/overview', [AiRoutingStudioController::class, 'getStudioOverview'])->name('superadmin.ai_routing.overview');
    Route::put('/ai-routing/providers/{id}', [AiRoutingStudioController::class, 'updateProvider'])->name('superadmin.ai_routing.update_provider');
    Route::post('/ai-routing/providers/{id}/ping', [AiRoutingStudioController::class, 'pingProvider'])->name('superadmin.ai_routing.ping_provider');
    Route::put('/ai-routing/routes/{id}', [AiRoutingStudioController::class, 'updateTaskRoute'])->name('superadmin.ai_routing.update_route');

    // 6. Algeria Geo-Clinic Map
    Route::get('/geo-map/overview', [GeoClinicMapController::class, 'getGeoOverview'])->name('superadmin.geo_map.overview');
    Route::post('/geo-map/clinics/{id}/location', [GeoClinicMapController::class, 'updateClinicLocation'])->name('superadmin.geo_map.update_location');
    Route::post('/geo-map/auto-geocode', [GeoClinicMapController::class, 'autoGeocodeClinics'])->name('superadmin.geo_map.auto_geocode');

    // 7. Clinic Onboarding & Conversion Funnel
    Route::get('/onboarding-funnel/overview', [ClinicOnboardingFunnelController::class, 'getFunnelOverview'])->name('superadmin.onboarding_funnel.overview');
    Route::post('/onboarding-funnel/clinics/{id}/nudge', [ClinicOnboardingFunnelController::class, 'sendOnboardingNudge'])->name('superadmin.onboarding_funnel.nudge');
    Route::post('/onboarding-funnel/clinics/{id}/toggle-tour', [ClinicOnboardingFunnelController::class, 'toggleOnboardingTour'])->name('superadmin.onboarding_funnel.toggle_tour');

    // 8. Promo Coupons & Referral Engine
    Route::get('/promos-referrals/overview', [PromoReferralEngineController::class, 'getOverview'])->name('superadmin.promos_referrals.overview');
    Route::post('/promos-referrals/coupons', [PromoReferralEngineController::class, 'createCoupon'])->name('superadmin.promos_referrals.create_coupon');
    Route::put('/promos-referrals/coupons/{id}', [PromoReferralEngineController::class, 'updateCoupon'])->name('superadmin.promos_referrals.update_coupon');
    Route::post('/promos-referrals/coupons/{id}/toggle', [PromoReferralEngineController::class, 'toggleCoupon'])->name('superadmin.promos_referrals.toggle_coupon');
    Route::delete('/promos-referrals/coupons/{id}', [PromoReferralEngineController::class, 'deleteCoupon'])->name('superadmin.promos_referrals.delete_coupon');
    Route::post('/promos-referrals/partners', [PromoReferralEngineController::class, 'createReferralPartner'])->name('superadmin.promos_referrals.create_partner');
    Route::put('/promos-referrals/partners/{id}', [PromoReferralEngineController::class, 'updateReferralPartner'])->name('superadmin.promos_referrals.update_partner');
    Route::post('/promos-referrals/partners/{id}/toggle', [PromoReferralEngineController::class, 'toggleReferralPartner'])->name('superadmin.promos_referrals.toggle_partner');
    Route::delete('/promos-referrals/partners/{id}', [PromoReferralEngineController::class, 'deleteReferralPartner'])->name('superadmin.promos_referrals.delete_partner');
    Route::post('/promos-referrals/partners/{id}/payout', [PromoReferralEngineController::class, 'recordPartnerPayout'])->name('superadmin.promos_referrals.payout');
    Route::get('/promos-referrals/share-whatsapp', [PromoReferralEngineController::class, 'generateWhatsAppShare'])->name('superadmin.promos_referrals.share_whatsapp');

    // 9. Sovereign Command & Control Tower (Full Platform Sovereignty)
    Route::get('/sovereign-tower/overview', [SovereignControlTowerController::class, 'getTowerOverview'])->name('superadmin.sovereign_tower.overview');
    Route::post('/sovereign-tower/maintenance/toggle', [SovereignControlTowerController::class, 'toggleGlobalMaintenance'])->name('superadmin.sovereign_tower.maintenance_toggle');
    Route::post('/sovereign-tower/registration/toggle', [SovereignControlTowerController::class, 'toggleClinicRegistration'])->name('superadmin.sovereign_tower.registration_toggle');
    Route::post('/sovereign-tower/maintenance/rotate-token', [SovereignControlTowerController::class, 'rotateBypassToken'])->name('superadmin.sovereign_tower.rotate_token');
    Route::post('/sovereign-tower/clinics/{id}/quarantine', [SovereignControlTowerController::class, 'quarantineClinic'])->name('superadmin.sovereign_tower.quarantine');
    Route::post('/sovereign-tower/clinics/{id}/lift-quarantine', [SovereignControlTowerController::class, 'liftQuarantine'])->name('superadmin.sovereign_tower.lift_quarantine');
    Route::get('/sovereign-tower/clinics/{id}/features', [SovereignControlTowerController::class, 'getClinicFeaturesAndQuotas'])->name('superadmin.sovereign_tower.features');
    Route::post('/sovereign-tower/clinics/{id}/features', [SovereignControlTowerController::class, 'updateFeatureOverrides'])->name('superadmin.sovereign_tower.update_features');
    Route::post('/sovereign-tower/clinics/{id}/bump-quota', [SovereignControlTowerController::class, 'instantQuotaBump'])->name('superadmin.sovereign_tower.bump_quota');
    Route::get('/sovereign-tower/revenue-churn-radar', [SovereignControlTowerController::class, 'getRevenueAndChurnRadar'])->name('superadmin.sovereign_tower.revenue_churn_radar');
    Route::get('/sovereign-tower/system-prompts', [SovereignControlTowerController::class, 'getSystemPromptsHub'])->name('superadmin.sovereign_tower.prompts_hub');
    Route::post('/sovereign-tower/system-prompts/update', [SovereignControlTowerController::class, 'updateSystemPrompt'])->name('superadmin.sovereign_tower.update_prompt');
    Route::post('/sovereign-tower/system-prompts/test', [SovereignControlTowerController::class, 'testSystemPrompt'])->name('superadmin.sovereign_tower.test_prompt');
    Route::post('/sovereign-tower/clinics/{id}/clone-sandbox', [SovereignControlTowerController::class, 'cloneTenantSandbox'])->name('superadmin.sovereign_tower.clone_sandbox');
    Route::post('/sovereign-tower/clinics/{id}/snapshots', [SovereignControlTowerController::class, 'createTenantSnapshot'])->name('superadmin.sovereign_tower.create_snapshot');
    Route::get('/sovereign-tower/clinics/{id}/snapshots', [SovereignControlTowerController::class, 'listTenantSnapshots'])->name('superadmin.sovereign_tower.list_snapshots');
    Route::get('/sovereign-tower/live-audit-pulse', [SovereignControlTowerController::class, 'getLiveAuditPulse'])->name('superadmin.sovereign_tower.audit_pulse');
    Route::post('/sovereign-tower/broadcasts/dispatch', [SovereignControlTowerController::class, 'dispatchSovereignBroadcast'])->name('superadmin.sovereign_tower.dispatch_broadcast');

    // 10. Landing Page CMS & Appearance Studio
    Route::get('/landing-page-config', [LandingPageStudioController::class, 'getConfig'])->name('superadmin.landing_page_config.get');
    Route::put('/landing-page-config', [LandingPageStudioController::class, 'updateConfig'])->name('superadmin.landing_page_config.update');
    Route::post('/landing-page-config/reset', [LandingPageStudioController::class, 'resetConfig'])->name('superadmin.landing_page_config.reset');

    // 11. Help Center & Clinical User Guide Studio CMS
    Route::get('/help-center-config', [HelpCenterStudioController::class, 'getConfig'])->name('superadmin.help_center_config.get');
    Route::put('/help-center-config', [HelpCenterStudioController::class, 'updateConfig'])->name('superadmin.help_center_config.update');
    Route::post('/help-center-config/reset', [HelpCenterStudioController::class, 'resetConfig'])->name('superadmin.help_center_config.reset');

    // 12. Student Offer & Academic Verification Studio
    Route::get('/student-offers/config', [StudentOfferController::class, 'getConfig'])->name('superadmin.student_offers.config');
    Route::put('/student-offers/config', [StudentOfferController::class, 'updateConfig'])->name('superadmin.student_offers.update');
    Route::get('/student-offers/applications', [StudentOfferController::class, 'getApplications'])->name('superadmin.student_offers.applications');
    Route::post('/student-offers/applications/{id}/approve', [StudentOfferController::class, 'approveApplication'])->name('superadmin.student_offers.approve');
    Route::post('/student-offers/applications/{id}/reject', [StudentOfferController::class, 'rejectApplication'])->name('superadmin.student_offers.reject');
    Route::post('/student-offers/applications/{id}/extend', [StudentOfferController::class, 'extendApplication'])->name('superadmin.student_offers.extend');
    Route::delete('/student-offers/applications/{id}', [StudentOfferController::class, 'deleteApplication'])->name('superadmin.student_offers.delete');
    Route::post('/student-offers/applications/{id}/impersonate', [StudentOfferController::class, 'impersonateStudent'])->name('superadmin.student_offers.impersonate');
});

Route::prefix('super-admin')->group(function () {
    Route::get('/dashboard-overview', [SuperAdminController::class, 'getDashboardOverview']);
    Route::get('/stats', [SuperAdminController::class, 'getGlobalStats']);
    Route::get('/clinics', [SuperAdminController::class, 'getClinics']);
    Route::post('/clinics', [SuperAdminController::class, 'createClinic']);
    Route::post('/tenants', [SuperAdminController::class, 'createClinic']);
    Route::post('/clinics/{id}/impersonate', [SuperAdminController::class, 'impersonateClinic'])->name('super_admin.clinics.impersonate');
    Route::post('/tenants/{id}/impersonate', [SuperAdminController::class, 'impersonateClinic'])->name('super_admin.tenants.impersonate');
    Route::post('/clinics/{id}/reset-password', [SuperAdminController::class, 'resetClinicPassword'])->name('super_admin.clinics.reset_password');
    Route::post('/tenants/{id}/reset-password', [SuperAdminController::class, 'resetClinicPassword'])->name('super_admin.tenants.reset_password');
    Route::post('/clinics/{id}/assign-plan', [SuperAdminController::class, 'assignPlan'])->name('super_admin.clinics.assign_plan');
    Route::post('/tenants/{id}/assign-plan', [SuperAdminController::class, 'assignPlan'])->name('super_admin.tenants.assign_plan');
    Route::post('/clinics/{id}/apply-custom-plan', [SuperAdminController::class, 'assignPlan']);
    Route::post('/tenants/{id}/apply-custom-plan', [SuperAdminController::class, 'assignPlan']);
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
    Route::post('/tests', [SuperAdminController::class, 'createTestConfig']);
    Route::post('/tests/sync-defaults', [SuperAdminController::class, 'syncDefaultCatalog']);
    Route::post('/tests/{testCode}', [SuperAdminController::class, 'updateTestConfig']);
    Route::post('/tests/{testCode}/toggle', [SuperAdminController::class, 'toggleTestStatus']);
    Route::delete('/tests/{testCode}', [SuperAdminController::class, 'deleteTestConfig']);

    // Global Clinical Exercises & Worksheets Bank (Super Admin CRUD)
    Route::get('/exercises', [SuperAdminController::class, 'getGlobalExercises']);
    Route::post('/exercises', [SuperAdminController::class, 'createExercise']);
    Route::post('/exercises/{id}', [SuperAdminController::class, 'updateExercise']);
    Route::put('/exercises/{id}', [SuperAdminController::class, 'updateExercise']);
    Route::post('/exercises/{id}/toggle', [SuperAdminController::class, 'toggleExerciseStatus']);
    Route::delete('/exercises/{id}', [SuperAdminController::class, 'deleteExercise']);

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

    // Teletherapy & Remote Consultations Governance (Super Admin)
    Route::get('/teletherapy/overview', [SuperAdminController::class, 'getTeletherapyOverview'])->name('superadmin.teletherapy.overview');
    Route::get('/teletherapy/rooms', [SuperAdminController::class, 'getTeletherapyRooms'])->name('superadmin.teletherapy.rooms');
    Route::post('/teletherapy/rooms/{roomCode}/terminate', [SuperAdminController::class, 'terminateTeletherapyRoom'])->name('superadmin.teletherapy.terminate');
    Route::delete('/teletherapy/rooms/{roomCode}', [SuperAdminController::class, 'deleteTeletherapyRoom'])->name('superadmin.teletherapy.destroy');
    Route::get('/teletherapy/settings', [SuperAdminController::class, 'getTeletherapySettings'])->name('superadmin.teletherapy.settings');
    Route::post('/teletherapy/settings', [SuperAdminController::class, 'updateTeletherapySettings'])->name('superadmin.teletherapy.update_settings');

    // Server Health & PM2 Live Telemetry Cockpit
    Route::get('/telemetry/overview', [ServerTelemetryController::class, 'getOverview']);
    Route::post('/telemetry/pm2/restart', [ServerTelemetryController::class, 'restartPm2Process']);
    Route::post('/telemetry/cache/clear', [ServerTelemetryController::class, 'clearSystemCache']);
    Route::post('/telemetry/queue/action', [ServerTelemetryController::class, 'handleQueueAction']);
    Route::get('/telemetry/logs', [ServerTelemetryController::class, 'getSystemLogs']);

    // Global Audit Logs & Security Guard
    Route::get('/audit-logs/overview', [AuditLogController::class, 'getSecurityOverview']);
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::get('/audit-logs/blocked-ips', [AuditLogController::class, 'getBlockedIps']);
    Route::post('/audit-logs/block-ip', [AuditLogController::class, 'blockIp']);
    Route::delete('/audit-logs/blocked-ips/{id}', [AuditLogController::class, 'unblockIp']);
    Route::get('/audit-logs/export', [AuditLogController::class, 'exportLogs']);

    // 3. Subscription Lifecycle & BaridiMob Automation
    Route::get('/lifecycle/overview', [SubscriptionLifecycleController::class, 'getLifecycleOverview']);
    Route::post('/lifecycle/clinics/{id}/chase', [SubscriptionLifecycleController::class, 'sendRenewalChaser']);
    Route::post('/lifecycle/clinics/{id}/grace-period', [SubscriptionLifecycleController::class, 'grantGracePeriod']);
    Route::post('/lifecycle/clinics/{id}/manual-renew', [SubscriptionLifecycleController::class, 'manualRenewClinic']);
    Route::get('/lifecycle/proofs', [SubscriptionLifecycleController::class, 'getPaymentProofInbox']);
    Route::post('/lifecycle/proofs/{id}/approve', [SubscriptionLifecycleController::class, 'approvePaymentProof']);
    Route::post('/lifecycle/proofs/{id}/reject', [SubscriptionLifecycleController::class, 'rejectPaymentProof']);

    // 4. Global Broadcast & Announcements Hub
    Route::get('/broadcasts', [SystemBroadcastController::class, 'index']);
    Route::post('/broadcasts', [SystemBroadcastController::class, 'store']);
    Route::put('/broadcasts/{id}', [SystemBroadcastController::class, 'update']);
    Route::post('/broadcasts/{id}/toggle-status', [SystemBroadcastController::class, 'toggleStatus']);
    Route::delete('/broadcasts/{id}', [SystemBroadcastController::class, 'destroy']);

    // 5. AI Routing, Failover Cascade & Cost Studio
    Route::get('/ai-routing/overview', [AiRoutingStudioController::class, 'getStudioOverview']);
    Route::put('/ai-routing/providers/{id}', [AiRoutingStudioController::class, 'updateProvider']);
    Route::post('/ai-routing/providers/{id}/ping', [AiRoutingStudioController::class, 'pingProvider']);
    Route::put('/ai-routing/routes/{id}', [AiRoutingStudioController::class, 'updateTaskRoute']);

    // 6. Algeria Geo-Clinic Map
    Route::get('/geo-map/overview', [GeoClinicMapController::class, 'getGeoOverview']);
    Route::post('/geo-map/clinics/{id}/location', [GeoClinicMapController::class, 'updateClinicLocation']);
    Route::post('/geo-map/auto-geocode', [GeoClinicMapController::class, 'autoGeocodeClinics']);

    // 7. Clinic Onboarding & Conversion Funnel
    Route::get('/onboarding-funnel/overview', [ClinicOnboardingFunnelController::class, 'getFunnelOverview']);
    Route::post('/onboarding-funnel/clinics/{id}/nudge', [ClinicOnboardingFunnelController::class, 'sendOnboardingNudge']);
    Route::post('/onboarding-funnel/clinics/{id}/toggle-tour', [ClinicOnboardingFunnelController::class, 'toggleOnboardingTour']);

    // 8. Promo Coupons & Referral Engine
    Route::get('/promos-referrals/overview', [PromoReferralEngineController::class, 'getOverview']);
    Route::post('/promos-referrals/coupons', [PromoReferralEngineController::class, 'createCoupon']);
    Route::put('/promos-referrals/coupons/{id}', [PromoReferralEngineController::class, 'updateCoupon']);
    Route::post('/promos-referrals/coupons/{id}/toggle', [PromoReferralEngineController::class, 'toggleCoupon']);
    Route::delete('/promos-referrals/coupons/{id}', [PromoReferralEngineController::class, 'deleteCoupon']);
    Route::post('/promos-referrals/partners', [PromoReferralEngineController::class, 'createReferralPartner']);
    Route::put('/promos-referrals/partners/{id}', [PromoReferralEngineController::class, 'updateReferralPartner']);
    Route::post('/promos-referrals/partners/{id}/toggle', [PromoReferralEngineController::class, 'toggleReferralPartner']);
    Route::delete('/promos-referrals/partners/{id}', [PromoReferralEngineController::class, 'deleteReferralPartner']);
    Route::post('/promos-referrals/partners/{id}/payout', [PromoReferralEngineController::class, 'recordPartnerPayout']);
    Route::get('/promos-referrals/share-whatsapp', [PromoReferralEngineController::class, 'generateWhatsAppShare']);

    // Marketing Affiliates
    Route::get('/affiliates', [SuperAdminController::class, 'getAffiliateStats']);
    Route::post('/affiliates', [SuperAdminController::class, 'createAffiliate']);
    Route::post('/affiliates/{id}/toggle', [SuperAdminController::class, 'toggleAffiliate']);
    Route::delete('/affiliates/{id}', [SuperAdminController::class, 'deleteAffiliate']);

    // Sovereign Command & Control Tower Aliases
    Route::get('/sovereign-tower/overview', [SovereignControlTowerController::class, 'getTowerOverview']);
    Route::post('/sovereign-tower/maintenance/toggle', [SovereignControlTowerController::class, 'toggleGlobalMaintenance']);
    Route::post('/sovereign-tower/registration/toggle', [SovereignControlTowerController::class, 'toggleClinicRegistration']);
    Route::post('/sovereign-tower/maintenance/rotate-token', [SovereignControlTowerController::class, 'rotateBypassToken']);
    Route::post('/sovereign-tower/clinics/{id}/quarantine', [SovereignControlTowerController::class, 'quarantineClinic']);
    Route::post('/sovereign-tower/clinics/{id}/lift-quarantine', [SovereignControlTowerController::class, 'liftQuarantine']);
    Route::get('/sovereign-tower/clinics/{id}/features', [SovereignControlTowerController::class, 'getClinicFeaturesAndQuotas']);
    Route::post('/sovereign-tower/clinics/{id}/features', [SovereignControlTowerController::class, 'updateFeatureOverrides']);
    Route::post('/sovereign-tower/clinics/{id}/bump-quota', [SovereignControlTowerController::class, 'instantQuotaBump']);
    Route::get('/sovereign-tower/revenue-churn-radar', [SovereignControlTowerController::class, 'getRevenueAndChurnRadar']);
    Route::get('/sovereign-tower/system-prompts', [SovereignControlTowerController::class, 'getSystemPromptsHub']);
    Route::post('/sovereign-tower/system-prompts/update', [SovereignControlTowerController::class, 'updateSystemPrompt']);
    Route::post('/sovereign-tower/system-prompts/test', [SovereignControlTowerController::class, 'testSystemPrompt']);
    Route::post('/sovereign-tower/clinics/{id}/clone-sandbox', [SovereignControlTowerController::class, 'cloneTenantSandbox']);
    Route::post('/sovereign-tower/clinics/{id}/snapshots', [SovereignControlTowerController::class, 'createTenantSnapshot']);
    Route::get('/sovereign-tower/clinics/{id}/snapshots', [SovereignControlTowerController::class, 'listTenantSnapshots']);
    Route::get('/sovereign-tower/live-audit-pulse', [SovereignControlTowerController::class, 'getLiveAuditPulse']);
    Route::post('/sovereign-tower/broadcasts/dispatch', [SovereignControlTowerController::class, 'dispatchSovereignBroadcast']);

    // Landing Page CMS & Appearance Studio Aliases
    Route::get('/landing-page-config', [LandingPageStudioController::class, 'getConfig']);
    Route::put('/landing-page-config', [LandingPageStudioController::class, 'updateConfig']);
    Route::post('/landing-page-config/reset', [LandingPageStudioController::class, 'resetConfig']);

    // Help Center & Clinical User Guide Studio Aliases
    Route::get('/help-center-config', [HelpCenterStudioController::class, 'getConfig']);
    Route::put('/help-center-config', [HelpCenterStudioController::class, 'updateConfig']);
    Route::post('/help-center-config/reset', [HelpCenterStudioController::class, 'resetConfig']);

    // Student Offer Aliases
    Route::get('/student-offers/config', [StudentOfferController::class, 'getConfig']);
    Route::put('/student-offers/config', [StudentOfferController::class, 'updateConfig']);
    Route::get('/student-offers/applications', [StudentOfferController::class, 'getApplications']);
    Route::post('/student-offers/applications/{id}/approve', [StudentOfferController::class, 'approveApplication']);
    Route::post('/student-offers/applications/{id}/reject', [StudentOfferController::class, 'rejectApplication']);
    Route::post('/student-offers/applications/{id}/extend', [StudentOfferController::class, 'extendApplication']);
    Route::delete('/student-offers/applications/{id}', [StudentOfferController::class, 'deleteApplication']);
    Route::post('/student-offers/applications/{id}/impersonate', [StudentOfferController::class, 'impersonateStudent']);
});

// Clinic Broadcasts & Announcements Feed
Route::get('/tenant/broadcasts/active', [SystemBroadcastController::class, 'getActiveBroadcastsForClinic']);

// Super Admin AI Governance & Quota Metering
Route::get('/super-admin/ai/overview', [SuperAdminAiController::class, 'getOverview'])->name('superadmin.ai.overview');
Route::put('/super-admin/ai/settings', [SuperAdminAiController::class, 'updateSettings'])->name('superadmin.ai.settings');
Route::post('/super-admin/ai/test-connection', [SuperAdminAiController::class, 'testConnection'])->name('superadmin.ai.test_connection');
Route::put('/super-admin/clinics/{clinicId}/ai-quota', [SuperAdminAiController::class, 'updateClinicAiQuota'])->name('superadmin.clinics.ai_quota');
Route::post('/super-admin/ai/reset-monthly-usage', [SuperAdminAiController::class, 'resetMonthlyUsage'])->name('superadmin.ai.reset_usage');

// Protected Clinic Workspace AI & Clinical Automation Endpoints
Route::middleware(['auth:sanctum'])->group(function () {
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
    Route::post('/clinic/ai/suggest-pei-goals', [AiCopilotController::class, 'suggestPeiGoals'])->name('clinic.ai.suggest_pei_goals');
    Route::post('/clinic/ai/suggest-next-session', [AiCopilotController::class, 'suggestNextSession'])->name('clinic.ai.suggest_next_session');

    // Tenant Knowledge Base & AI Receptionist Endpoints
    Route::prefix('tenant/knowledge-base')->group(function () {
        Route::get('/', [AiSupportAssistantController::class, 'tenantGetKnowledgeBase'])->name('tenant.kb.index');
        Route::post('/crawl', [AiSupportAssistantController::class, 'tenantCrawl'])->name('tenant.kb.crawl');
        Route::post('/text', [AiSupportAssistantController::class, 'tenantSaveDirectText'])->name('tenant.kb.text');
        Route::post('/settings', [AiSupportAssistantController::class, 'tenantUpdateSettings'])->name('tenant.kb.settings');
        Route::delete('/{id}', [AiSupportAssistantController::class, 'tenantDeleteArticle'])->name('tenant.kb.delete');
    });
});

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
// Global Exercises & Worksheets Catalog (Public & Clinic Available)
Route::get('/exercises', [SuperAdminController::class, 'getGlobalExercises']);
Route::get('/exercises/catalog', [SuperAdminController::class, 'getGlobalExercises']);

// Public National Directory & Online Booking Engine (/annuaire)
Route::get('/public/directory', [PublicDirectoryController::class, 'getDirectory'])->name('public.directory.list');
Route::get('/public/directory/{subdomain}', [PublicDirectoryController::class, 'getClinicProfile'])->name('public.directory.profile');
Route::post('/public/directory/{clinicId}/book', [PublicDirectoryController::class, 'submitBookingRequest'])->name('public.directory.book');

// Public Academic Hub & Student Licensing (/academic)
Route::get('/academic/tiers', [AcademicController::class, 'getAcademicTiers'])->name('academic.tiers');
Route::post('/academic/apply', [AcademicController::class, 'apply'])->name('academic.apply');

// Public Patient & Parent Interactive Portal (Magic Link & Secure Access)
Route::get('/portal/access/{token}', [ParentPortalController::class, 'getPortalData'])->name('portal.access');
Route::get('/portal/{token}', [ParentPortalController::class, 'getPortalData'])->name('portal.view');
Route::post('/portal/{token}/appointment/{appointmentId}/confirm', [ParentPortalController::class, 'confirmAppointment'])->name('portal.appointment.confirm');
Route::post('/portal/{token}/homework/{homeworkId}/complete', [ParentPortalController::class, 'completeHomework'])->name('portal.homework.complete');
Route::post('/portal/{token}/journal', [ParentPortalController::class, 'saveJournalNote'])->name('portal.journal.save');
Route::get('/portal/{token}/bilan/{bilanId}/pdf', [ParentPortalController::class, 'downloadBilanPdf'])->name('portal.bilan.pdf');
Route::post('/portal/{token}/audio', [ParentPortalController::class, 'uploadAudio'])->name('portal.audio.upload');
Route::get('/portal/{token}/audio', [ParentPortalController::class, 'getAudioSamples'])->name('portal.audio.list');
Route::delete('/portal/{token}/audio/{id}', [ParentPortalController::class, 'deleteAudioSample'])->name('portal.audio.delete');

// Public Parent Pre-Intake Self-Anamnesis Portal
Route::get('/public/pre-intake/{token?}', [PatientController::class, 'getPublicPreIntake'])->name('public.pre_intake.get');
Route::post('/public/pre-intake/{token?}', [PatientController::class, 'submitPublicPreIntake'])->name('public.pre_intake.submit');
Route::post('/public/pre-intake/{token?}/audio', [ParentPortalController::class, 'uploadAudio'])->name('public.pre_intake.audio.upload');
Route::get('/public/pre-intake/{token?}/audio', [ParentPortalController::class, 'getAudioSamples'])->name('public.pre_intake.audio.list');

// Clinic Protected Patient Portal Link Generator
Route::post('/patients/{id}/generate-portal-link', [ParentPortalController::class, 'generatePortalLink'])->name('clinic.patients.portal_link');
Route::post('/clinic/patients/{id}/generate-portal-link', [ParentPortalController::class, 'generatePortalLink'])->name('clinic.patients.portal_link_alt');

Route::post('/public/register-clinic', [PublicAuthController::class, 'registerClinic'])
    ->middleware('throttle:30,1')
    ->name('public.register_clinic');

Route::get('/public/registration-status', [PublicAuthController::class, 'getRegistrationStatus'])
    ->name('public.registration_status');

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
Route::get('geo/algeria-wilayas', fn() => response()->json([
    'success' => true,
    'wilayas' => \App\Http\Controllers\Api\PublicDirectoryController::WILAYAS_58,
]))->name('geo.wilayas');

// Public Remote Assessment Portal (PIN Gate, Draft Save & Submission)
Route::post('public/assessment/{token}/verify-pin', [RemoteAssessmentController::class, 'verifyPin'])->name('public.assessment.verify_pin');
Route::post('public/assessment/{token}/save-draft', [RemoteAssessmentController::class, 'saveDraft'])->name('public.assessment.save_draft');
Route::post('public/assessment/{token}/submit', [RemoteAssessmentController::class, 'submit'])->name('public.assessment.submit');
Route::get('public/assessment/{token}/print-slip', [RemoteAssessmentController::class, 'printSlip'])->name('public.assessment.print_slip');

// Public Interactive Clinical Test Portal (No Auth)
Route::get('public/clinical-test/{token}', [ClinicalTestAssignmentController::class, 'getPublicTest'])->name('public.clinical_test.get');
Route::post('public/clinical-test/{token}/submit', [ClinicalTestAssignmentController::class, 'submitPublicTest'])->name('public.clinical_test.submit');

// Public Waiting Room TV Queue Display Feed
Route::get('public/tv-queue/{tenantSlug?}', [QueueController::class, 'getTvQueue'])->name('public.tv_queue');
Route::get('queue/tv/{tenantSlug?}', [QueueController::class, 'getTvQueue'])->name('queue.tv');

// Waiting Room Interactive Kiosk Check-In & Info
Route::get('kiosk/info', [KioskController::class, 'getClinicInfo'])->name('kiosk.info');
Route::post('kiosk/verify-access', [KioskController::class, 'verifyAccess'])->name('kiosk.verify_access');
Route::post('kiosk/check-in', [KioskController::class, 'checkIn'])->name('kiosk.check_in');
Route::get('public/kiosk/info', [KioskController::class, 'getClinicInfo'])->name('public.kiosk.info');
Route::post('public/kiosk/verify-access', [KioskController::class, 'verifyAccess'])->name('public.kiosk.verify_access');
Route::post('public/kiosk/check-in', [KioskController::class, 'checkIn'])->name('public.kiosk.check_in');

// Public Mobile-First Parent Portal
Route::post('public/parent-portal/login', [ParentPortalController::class, 'login'])->name('public.parent_portal.login');
Route::get('public/parent-portal/dashboard', [ParentPortalController::class, 'getDashboard'])->name('public.parent_portal.dashboard');
Route::post('public/parent-portal/homework/{id}/toggle-status', [ParentPortalController::class, 'toggleHomeworkStatus'])->name('public.parent_portal.toggle_homework');

// Public Magic Link Parent Portal (Mobile Screening, Anamnèse & Homework)
Route::get('public/portal/{token}', [ParentPortalController::class, 'validatePortalAccess'])->name('public.portal.validate');
Route::post('public/portal/{token}/submit', [ParentPortalController::class, 'submitParentForm'])->name('public.portal.submit');
Route::get('public/portal/{token}/homework', [ParentPortalController::class, 'getPatientHomeworkForParent'])->name('public.portal.homework');
Route::post('public/portal/{token}/audio', [ParentPortalController::class, 'uploadAudio'])->name('public.portal.audio.upload');
Route::get('public/portal/{token}/audio', [ParentPortalController::class, 'getAudioSamples'])->name('public.portal.audio.list');
Route::delete('public/portal/{token}/audio/{id}', [ParentPortalController::class, 'deleteAudioSample'])->name('public.portal.audio.delete');

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
    Route::post('/clinics/{id}/impersonate', [SuperAdminController::class, 'impersonateClinic'])->name('superadmin.clinics.impersonate.protected');
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
    Route::post('/impersonate/stop', [SuperAdminController::class, 'stopImpersonation'])->name('clinic.impersonate.stop');
    // Auth Session & Personal Profile
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::post('/impersonate/stop', [SuperAdminController::class, 'stopImpersonation'])->name('impersonate.stop');
        Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
    });

    // Practitioner Personal Profile & Password Management
    Route::get('user/profile', [UserProfileController::class, 'getProfile'])->name('user.profile.get');
    Route::match(['put', 'post'], 'user/profile', [UserProfileController::class, 'updateProfile'])->name('user.profile.update');
    Route::match(['put', 'post'], 'user/password', [UserProfileController::class, 'updatePassword'])->name('user.password.update');

    // Multi-Tab Clinic Operational Configuration & Data Export Suite
    Route::get('clinic/config', [ClinicSettingsController::class, 'getConfig'])->name('clinic.config.get');
    Route::post('clinic/config', [ClinicSettingsController::class, 'updateConfig'])->name('clinic.config.update');
    Route::get('clinic/export-data', [ClinicSettingsController::class, 'exportData'])->name('clinic.export_data');

    // Staff Management & Audit Trail (Restricted to Clinic Admin & Superadmin)
    Route::middleware('role:clinic_admin,admin_owner,owner,admin,doctor,practitioner,specialist,superadmin')->group(function () {
        Route::get('staff/permissions-catalog', [StaffController::class, 'getPermissionsCatalog'])->name('staff.permissions_catalog');
        Route::post('staff/{id}/permissions', [StaffController::class, 'updatePermissions'])->name('staff.update_permissions');
        Route::post('staff/{id}/toggle-status', [StaffController::class, 'toggleStatus'])->name('staff.toggle_status');
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
    Route::post('patients/{id}/generate-pre-intake-link', [PatientController::class, 'generatePreIntakeLink'])->name('patients.generate_pre_intake_link');
    Route::post('patients/{id}/approve-pre-intake', [PatientController::class, 'approvePreIntake'])->name('patients.approve_pre_intake');
    Route::post('patients/{id}/save-genogram', [PatientController::class, 'saveGenogram'])->name('patients.save_genogram');
    Route::post('patients/{id}/save-sensory-body-map', [PatientController::class, 'saveSensoryBodyMap'])->name('patients.save_sensory_body_map');
    Route::apiResource('patients', PatientController::class);

    // Patient Attachments
    Route::get('patients/{patientId}/attachments', [AttachmentController::class, 'index'])->name('attachments.index');
    Route::post('patients/{patientId}/attachments', [AttachmentController::class, 'upload'])->name('attachments.upload');
    Route::delete('attachments/{id}', [AttachmentController::class, 'destroy'])->name('attachments.destroy');

    // Smart Appointments Scheduling & Active Consultation Workspace
    Route::get('appointments/live-waiting', [AppointmentController::class, 'getLiveWaiting'])->name('appointments.live_waiting');
    Route::get('appointments/check-conflicts', [AppointmentController::class, 'checkConflicts'])->name('appointments.check_conflicts');
    Route::get('appointments/{id}/whatsapp-reminder', [AppointmentController::class, 'whatsappReminder'])->name('appointments.whatsapp');
    Route::post('appointments/{id}/send-whatsapp', [AppointmentController::class, 'sendWhatsAppReminder'])->name('appointments.send_whatsapp');
    Route::post('whatsapp/send-message', [WhatsAppWebhookController::class, 'sendDirectMessage'])->name('whatsapp.send_direct');
    Route::post('appointments/quick-start', [AppointmentController::class, 'quickStartSession'])->name('appointments.quick_start');
    Route::post('appointments/{id}/start-session', [AppointmentController::class, 'startSession'])->name('appointments.start_session');
    Route::post('appointments/{id}/complete-session', [AppointmentController::class, 'completeSession'])->name('appointments.complete_session');
    Route::post('appointments/{appointmentId}/assessments', [ClinicalAssessmentController::class, 'runInSession'])->name('appointments.assessments.run');
    Route::post('appointments/{appointmentId}/call-queue', [QueueController::class, 'callNext'])->name('appointments.call_queue');
    Route::post('queue/call-patient', [QueueController::class, 'callNext'])->name('queue.call_patient');
    Route::post('queue/call-next/{appointmentId?}', [QueueController::class, 'callNext'])->name('queue.call_next');
    Route::post('queue/tv-settings', [QueueController::class, 'updateTvSettings'])->name('queue.tv_settings');

    // Patient Retention & Clinical Recall Radar
    Route::get('clinic/retention-radar', [PatientRetentionRadarController::class, 'getRetentionOverview'])->name('clinic.retention_radar.index');
    Route::post('clinic/retention-radar/recall', [PatientRetentionRadarController::class, 'sendRecallWhatsApp'])->name('clinic.retention_radar.recall');
    Route::post('clinic/retention-radar/settings', [PatientRetentionRadarController::class, 'updateSettings'])->name('clinic.retention_radar.settings');

    // Clinic Protected Booking Requests Pipeline (From Public Directory)
    Route::get('clinic/booking-requests', [PublicDirectoryController::class, 'listClinicBookingRequests'])->name('clinic.booking_requests.list');
    Route::put('clinic/booking-requests/{id}/status', [PublicDirectoryController::class, 'updateBookingStatus'])->name('clinic.booking_requests.update_status');

    // AI Clinic Receptionist & WhatsApp Triage Simulator
    Route::get('clinic/receptionist/settings', [ClinicAiReceptionistController::class, 'getSettings'])->name('clinic.receptionist.settings');
    Route::post('clinic/receptionist/settings', [ClinicAiReceptionistController::class, 'updateSettings'])->name('clinic.receptionist.update_settings');
    Route::post('clinic/receptionist/simulate', [ClinicAiReceptionistController::class, 'simulateMessage'])->name('clinic.receptionist.simulate');

    // Parent Daily Home-Care Log & Compliance Sync for Therapist
    Route::get('patients/{id}/parent-notes', [ParentPortalController::class, 'getPatientJournalNotes'])->name('patients.parent_notes.index');
    Route::post('patients/{id}/parent-notes/{noteId}/acknowledge', [ParentPortalController::class, 'acknowledgeNote'])->name('patients.parent_notes.acknowledge');
    Route::get('patients/{id}/home-care/overview', [ParentPortalController::class, 'getPatientComplianceOverview'])->name('patients.home_care.overview');
    Route::post('patients/{id}/home-care/assign', [ParentPortalController::class, 'assignHomeworkByPractitioner'])->name('patients.home_care.assign');
    Route::post('patients/{id}/home-care/{homeworkId}/toggle', [ParentPortalController::class, 'toggleHomeworkStatusByPractitioner'])->name('patients.home_care.toggle');
    Route::delete('patients/{id}/home-care/{homeworkId}', [ParentPortalController::class, 'deleteHomeworkByPractitioner'])->name('patients.home_care.delete');

    // ==========================================
    // Clinical AI & DDSS Specialty Depth Suite
    // ==========================================
    // 1. Diagnostic Decision Support System (DSM-5-TR & ICD-11)
    Route::post('clinical-ai/ddss/evaluate', [ClinicalDdssController::class, 'evaluateDiagnosticHypotheses'])->name('clinical_ai.ddss.evaluate');
    Route::post('clinical-ai/ddss/save', [ClinicalDdssController::class, 'saveDiagnosticRecord'])->name('clinical_ai.ddss.save');
    Route::get('clinical-ai/ddss/patient/{patientId}', [ClinicalDdssController::class, 'getPatientDiagnosticHistory'])->name('clinical_ai.ddss.patient_history');

    // 2. Smart Individualized Rehabilitation Plan (PEI) & Exercises Bank Linking
    Route::get('rehab/exercises-catalog', [RehabilitationPlanController::class, 'getExercisesCatalog'])->name('rehab.exercises_catalog');
    Route::post('rehab/smart-pei/generate/{patientId}', [RehabilitationPlanController::class, 'generateSmartPei'])->name('rehab.smart_pei.generate');
    Route::get('rehab/patient-plans/{patientId}', [RehabilitationPlanController::class, 'getPatientPlans'])->name('rehab.patient_plans.index');
    Route::post('rehab/patient-plans/{patientId}', [RehabilitationPlanController::class, 'savePepPlan'])->name('rehab.patient_plans.save');
    Route::post('rehab/goal-status/{planId}', [RehabilitationPlanController::class, 'updateGoalStatus'])->name('rehab.goal_status.update');
    Route::post('rehab/dispatch-portal', [RehabilitationPlanController::class, 'dispatchToPortal'])->name('rehab.dispatch_portal');

    // 3. Vision AI Medical Document Ingestion & EHR Intake
    Route::post('clinical-ai/vision/ingest', [VisionMedicalDocumentController::class, 'ingestDocument'])->name('clinical_ai.vision.ingest');
    Route::post('clinical-ai/vision/inject/{patientId}', [VisionMedicalDocumentController::class, 'injectIntoPatientFile'])->name('clinical_ai.vision.inject');

    Route::apiResource('appointments', AppointmentController::class);

    // Smart Waitlist & Slot Recovery
    Route::get('waitlist', [WaitlistController::class, 'index'])->name('waitlist.index');
    Route::post('waitlist', [WaitlistController::class, 'store'])->name('waitlist.store');
    Route::get('waitlist/matches', [WaitlistController::class, 'findMatches'])->name('waitlist.matches');
    Route::post('waitlist/{id}/assign-slot', [WaitlistController::class, 'assignSlot'])->name('waitlist.assign_slot');
    Route::delete('waitlist/{id}', [WaitlistController::class, 'destroy'])->name('waitlist.destroy');

    // Clinical Exercises & Take-Home Sheets
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
    Route::get('patient-bilans', [ClinicalAssessmentCatalogController::class, 'listAllBilans'])->name('clinical_tests.bilans.all');
    Route::get('patient-bilans/{bilanId}', [ClinicalAssessmentCatalogController::class, 'showPatientBilan'])->name('clinical_tests.bilans.show');
    Route::delete('patient-bilans/{bilanId}', [ClinicalAssessmentCatalogController::class, 'destroyPatientBilan'])->name('clinical_tests.bilans.destroy');

    // Interactive Speech & Articulation Matrix (Orthophonie Suite)
    Route::get('patients/{patientId}/speech-matrix', [SpeechArticulationController::class, 'getPatientAssessments'])->name('speech_matrix.patient_index');
    Route::post('patients/{patientId}/speech-matrix', [SpeechArticulationController::class, 'store'])->name('speech_matrix.store');
    Route::get('speech-matrix/{id}', [SpeechArticulationController::class, 'show'])->name('speech_matrix.show');
    Route::delete('speech-matrix/{id}', [SpeechArticulationController::class, 'destroy'])->name('speech_matrix.destroy');

    // Interactive Psychomotor & Sensory Body Map Suite
    Route::get('patients/{patientId}/psychomotor-assessments', [PsychomotorAssessmentController::class, 'getPatientAssessments'])->name('psychomotor.patient_index');
    Route::get('patients/{patientId}/psychomotor-assessments/latest', [PsychomotorAssessmentController::class, 'getLatest'])->name('psychomotor.patient_latest');
    Route::post('patients/{patientId}/psychomotor-assessments', [PsychomotorAssessmentController::class, 'store'])->name('psychomotor.store');
    Route::delete('psychomotor-assessments/{id}', [PsychomotorAssessmentController::class, 'destroy'])->name('psychomotor.destroy');

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
        
        // Clinical Test Assignments & Remote Link Engine
        Route::post('patients/{patientId}/test-assignments', [ClinicalTestAssignmentController::class, 'store'])->name('patients.test_assignments.store');
        Route::get('patients/{patientId}/test-assignments', [ClinicalTestAssignmentController::class, 'getPatientAssignments'])->name('patients.test_assignments.index');
        Route::delete('test-assignments/{id}', [ClinicalTestAssignmentController::class, 'destroy'])->name('test_assignments.destroy');
        Route::post('test-assignments/{id}/send-whatsapp', [ClinicalTestAssignmentController::class, 'sendViaWhatsApp'])->name('test_assignments.send_whatsapp');

        Route::post('sessions/seed-demo', [TherapySessionController::class, 'seedDemo'])->name('sessions.seed_demo');
        Route::get('patients/{patientId}/sessions', [TherapySessionController::class, 'index'])->name('patients.sessions.index');
        Route::post('patients/{patientId}/sessions', [TherapySessionController::class, 'store'])->name('patients.sessions.store');
        Route::apiResource('sessions', TherapySessionController::class);

        // Psychomotor & Sensory Body Map Clinical Assessments
        Route::get('patients/{patientId}/psychomotor-assessments', [\App\Http\Controllers\Api\PsychomotorAssessmentController::class, 'index'])->name('psychomotor_assessments.index');
        Route::get('patients/{patientId}/psychomotor-assessments/latest', [\App\Http\Controllers\Api\PsychomotorAssessmentController::class, 'latest'])->name('psychomotor_assessments.latest');
        Route::post('patients/{patientId}/psychomotor-assessments', [\App\Http\Controllers\Api\PsychomotorAssessmentController::class, 'store'])->name('psychomotor_assessments.store');
        Route::delete('psychomotor-assessments/{id}', [\App\Http\Controllers\Api\PsychomotorAssessmentController::class, 'destroy'])->name('psychomotor_assessments.destroy');

        // Tele-Therapy & Interactive Clinical Canvas Signaling & Cockpit
        Route::get('teletherapy/rooms', [\App\Http\Controllers\Api\TeletherapySignalingController::class, 'index'])->name('teletherapy.index');
        Route::post('teletherapy/rooms', [\App\Http\Controllers\Api\TeletherapySignalingController::class, 'store'])->name('teletherapy.store');
        Route::get('teletherapy/rooms/{roomCode}', [\App\Http\Controllers\Api\TeletherapySignalingController::class, 'show'])->name('teletherapy.show');
        Route::post('teletherapy/save-session', [\App\Http\Controllers\Api\TeletherapySignalingController::class, 'saveSession'])->name('teletherapy.save_session');
        Route::post('teletherapy/rooms/{roomCode}/signal', [\App\Http\Controllers\Api\TeletherapySignalingController::class, 'signal'])->name('teletherapy.signal');
        Route::get('teletherapy/rooms/{roomCode}/signal', [\App\Http\Controllers\Api\TeletherapySignalingController::class, 'getSignals'])->name('teletherapy.get_signals');

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

        Route::get('invoices/analytics', [InvoiceController::class, 'getAnalytics'])->name('invoices.analytics');
        Route::get('invoices/daily-treasury', [InvoiceController::class, 'getDailyTreasury'])->name('invoices.daily_treasury');
        Route::get('billing/daily-treasury', [InvoiceController::class, 'getDailyTreasury'])->name('billing.daily_treasury');
        Route::get('treasury/daily', [InvoiceController::class, 'getDailyTreasury'])->name('treasury.daily');
        Route::get('invoices/unbilled-appointments', [InvoiceController::class, 'getUnbilledAppointments'])->name('invoices.unbilled');
        Route::post('invoices/{id}/payments', [InvoiceController::class, 'recordPayment'])->name('invoices.payments.record');
        Route::post('invoices/{id}/reconcile-ccp', [InvoiceController::class, 'reconcileCcpSlip'])->name('invoices.reconcile_ccp');
        Route::get('invoices/{id}/whatsapp-reminder', [InvoiceController::class, 'getWhatsAppReminder'])->name('invoices.whatsapp_reminder');
        Route::post('invoices/{id}/send-whatsapp', [InvoiceController::class, 'sendWhatsAppReminder'])->name('invoices.send_whatsapp');
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
        Route::get('/whatsapp-logs', [WhatsAppWebhookController::class, 'getWebhookLogs'])->name('superadmin.communication.whatsapp_logs');
        Route::post('/simulate-whatsapp-webhook', [WhatsAppWebhookController::class, 'simulateIncomingWebhook'])->name('superadmin.communication.simulate_whatsapp');
        
        // Meta WhatsApp Templates & Categorization Management
        Route::get('/templates', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'getTemplates'])->name('superadmin.communication.templates.index');
        Route::post('/templates/create', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'createTemplate'])->name('superadmin.communication.templates.create');
        Route::post('/templates/sync-defaults', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'syncDefaultTemplates'])->name('superadmin.communication.templates.sync');
        Route::delete('/templates/{name}', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'deleteTemplate'])->name('superadmin.communication.templates.destroy');
        Route::post('/templates/test-send', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'testSendTemplate'])->name('superadmin.communication.templates.test_send');
    });

    Route::prefix('super-admin/communication-settings')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'getSettings']);
        Route::post('/save', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'saveSettings']);
        Route::post('/test-email', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'testEmail']);
        Route::post('/test-sms', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'testSms']);
        Route::post('/test-whatsapp', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'testWhatsapp']);
        Route::get('/whatsapp-logs', [WhatsAppWebhookController::class, 'getWebhookLogs']);
        Route::post('/simulate-whatsapp-webhook', [WhatsAppWebhookController::class, 'simulateIncomingWebhook']);

        // Meta WhatsApp Templates & Categorization Management (Alias)
        Route::get('/templates', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'getTemplates']);
        Route::post('/templates/create', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'createTemplate']);
        Route::post('/templates/sync-defaults', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'syncDefaultTemplates']);
        Route::delete('/templates/{name}', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'deleteTemplate']);
        Route::post('/templates/test-send', [\App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController::class, 'testSendTemplate']);
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

    // Landing Page CMS & Appearance Studio
    Route::prefix('superadmin/landing-page-config')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\LandingPageStudioController::class, 'getConfig'])->name('superadmin.landing.get');
        Route::put('/', [\App\Http\Controllers\Api\SuperAdmin\LandingPageStudioController::class, 'updateConfig'])->name('superadmin.landing.update');
        Route::post('/reset', [\App\Http\Controllers\Api\SuperAdmin\LandingPageStudioController::class, 'resetConfig'])->name('superadmin.landing.reset');
    });

    Route::prefix('super-admin/landing-page-config')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\LandingPageStudioController::class, 'getConfig']);
        Route::put('/', [\App\Http\Controllers\Api\SuperAdmin\LandingPageStudioController::class, 'updateConfig']);
        Route::post('/reset', [\App\Http\Controllers\Api\SuperAdmin\LandingPageStudioController::class, 'resetConfig']);
    });

    // Global Knowledge Base Crawler & Management (SuperAdmin)
    Route::get('/support/articles', [AiSupportAssistantController::class, 'getArticles'])->name('superadmin.support.articles');
    Route::post('/support/crawl-url', [AiSupportAssistantController::class, 'crawlUrl'])->name('superadmin.support.crawl_url');
    Route::delete('/support/articles/{id}', [AiSupportAssistantController::class, 'deleteArticle'])->name('superadmin.support.delete_article');

    Route::prefix('superadmin/knowledge-base')->group(function () {
        Route::get('/articles', [AiSupportAssistantController::class, 'getArticles']);
        Route::post('/crawl-url', [AiSupportAssistantController::class, 'crawlUrl']);
        Route::delete('/articles/{id}', [AiSupportAssistantController::class, 'deleteArticle']);
    });

    Route::prefix('super-admin/knowledge-base')->group(function () {
        Route::get('/articles', [AiSupportAssistantController::class, 'getArticles']);
        Route::post('/crawl-url', [AiSupportAssistantController::class, 'crawlUrl']);
        Route::delete('/articles/{id}', [AiSupportAssistantController::class, 'deleteArticle']);
    });
});

// Public Discovery Endpoint for Frontend UI Feature Flags & Subscription Plans
Route::get('/public/feature-flags', [FeatureFlagController::class, 'getPublicFlags'])->name('public.feature_flags');
Route::get('/public/subscription-plans', [SubscriptionPlanManagerController::class, 'publicPlans'])->name('public.subscription_plans');
Route::get('/public/landing-page-config', [\App\Http\Controllers\Api\SuperAdmin\LandingPageStudioController::class, 'getPublicConfig'])->name('public.landing_page_config');
Route::get('/clinic/my-quota', [ClinicQuotaManagerController::class, 'getMyQuota'])->middleware(['auth:sanctum'])->name('clinic.my_quota');

// Public Tele-Therapy Room Access (Zero-Install Guest Entry)
Route::get('/public/teletherapy/{roomCode}', [\App\Http\Controllers\Api\TeletherapySignalingController::class, 'publicRoom'])->name('public.teletherapy.show');

// Public Document Verification Route (QR Code verification for Bilan, Letters, Attestations)
Route::get('/public/verify/doc/{token}', [\App\Http\Controllers\Api\DocumentVerificationController::class, 'verifyDocument'])->name('public.verify.doc');

// Public & Synchronized EMDR Patient Screen Signaling Endpoints
Route::get('/public/emdr/{sessionCode}/sync', [\App\Http\Controllers\Api\EmdrSignalingController::class, 'getState'])->name('public.emdr.get_state');
Route::post('/public/emdr/{sessionCode}/sync', [\App\Http\Controllers\Api\EmdrSignalingController::class, 'syncState'])->name('public.emdr.sync_state');

// AI Support Assistant & Embeddable Receptionist Chat Endpoints
Route::post('/public/support/chat', [AiSupportAssistantController::class, 'publicChat'])->name('public.support.chat');
Route::post('/support/ask', [AiSupportAssistantController::class, 'ask'])->name('support.ask');
Route::get('/embed/support-widget.js', [AiSupportAssistantController::class, 'serveEmbedScript'])->name('support.embed_script');


