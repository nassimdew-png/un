<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('subscription_plans')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                if (!Schema::hasColumn('subscription_plans', 'features')) {
                    $table->json('features')->nullable()->after('description');
                }
            });

            // Default complete feature matrix
            $baseClinicalFeatures = [
                // 1. Clinical Cockpit & EHR
                'clinical_consultation_workspace' => true,
                'clinical_live_timer' => true,
                'clinical_soap_notes' => true,
                'clinical_cbt_thought_records' => true,
                'clinical_suds_scale' => true,
                'clinical_pei_goals' => true,

                // 2. Standardized Psychometrics Suite
                'assessments_standardized_18' => true,
                'assessments_scoring_engine' => true,
                'assessments_master_bilan' => true,
                'assessments_red_alerts' => true,
                'assessments_remote_assignment' => true,

                // 3. Teletherapy & Clinical Whiteboard
                'teletherapy_video_rooms' => true,
                'interactive_whiteboard' => true,
                'teletherapy_screen_share' => true,

                // 4. Kiosk & Waiting Room TV
                'kiosk_self_checkin' => true,
                'waiting_room_tv_queue' => true,
                'tv_audio_chime' => true,
                'tv_custom_ticker' => true,

                // 5. Parent & Patient Portal
                'parent_portal_access' => true,
                'portal_homework_tracking' => true,
                'portal_self_anamnesis' => true,
                'portal_whatsapp_dispatch' => true,

                // 6. Speech & Psychomotricity Suites
                'orthophony_matrix' => true,
                'stuttering_fluency_analyzer' => true,
                'psychomotor_bodymap' => true,
                'therapy_homework_hub' => true,

                // 7. Billing & Vault
                'billing_medical_invoices' => true,
                'billing_insurance_slips' => true,
                'voice_recordings_vault' => true,
                'clinical_documents_export' => true,

                // 8. Clinical AI Studio & Copilot
                'ai_copilot_assistant' => true,
                'ai_voice_scribe' => true,
                'ai_pecs_image_studio' => true,
                'ai_podcast_studio' => true,
                'ai_video_modeling' => false,
                'ai_receptionist_bot' => true,

                // 9. Smart Agenda & Appointments
                'agenda_multi_views' => true,
                'agenda_conflict_detection' => true,
                'agenda_recurring_sessions' => true,
                'agenda_whatsapp_reminders' => true,

                // 10. Enterprise Security & Custom Domains
                'custom_domain_ssl' => false,
                'audit_logs_tracking' => true,
                'vip_priority_support' => false,
                'automated_backups' => true,
            ];

            $allFeaturesPro = array_merge($baseClinicalFeatures, [
                'ai_video_modeling' => true,
                'custom_domain_ssl' => true,
                'vip_priority_support' => true,
            ]);

            $starterFeatures = array_merge($baseClinicalFeatures, [
                'teletherapy_video_rooms' => false,
                'interactive_whiteboard' => false,
                'kiosk_self_checkin' => false,
                'waiting_room_tv_queue' => false,
                'ai_podcast_studio' => false,
                'ai_video_modeling' => false,
                'custom_domain_ssl' => false,
                'vip_priority_support' => false,
            ]);

            // Populate existing plans with default feature maps if empty
            $plans = DB::table('subscription_plans')->get();
            foreach ($plans as $plan) {
                if (empty($plan->features) || $plan->features === 'null') {
                    $slug = strtolower($plan->slug ?? '');
                    if (str_contains($slug, 'starter') || str_contains($slug, 'solo')) {
                        $features = $starterFeatures;
                    } elseif (str_contains($slug, 'enterprise') || str_contains($slug, 'vip') || str_contains($slug, 'pro')) {
                        $features = $allFeaturesPro;
                    } else {
                        // Trial and default
                        $features = $allFeaturesPro;
                    }

                    DB::table('subscription_plans')
                        ->where('id', $plan->id)
                        ->update(['features' => json_encode($features, JSON_UNESCAPED_UNICODE)]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('subscription_plans') && Schema::hasColumn('subscription_plans', 'features')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                $table->dropColumn('features');
            });
        }
    }
};
