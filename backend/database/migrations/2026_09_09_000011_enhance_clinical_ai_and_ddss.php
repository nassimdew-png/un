<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Clinical Diagnostic Decision Support System (DDSS) Records
        if (!Schema::hasTable('clinical_diagnostic_records')) {
            Schema::create('clinical_diagnostic_records', function (Blueprint $table) {
                $table->id();
                $table->string('clinic_id', 64)->index();
                $table->unsignedBigInteger('patient_id')->index();
                $table->unsignedBigInteger('specialist_id')->nullable()->index();
                $table->unsignedBigInteger('session_id')->nullable()->index();
                $table->unsignedBigInteger('appointment_id')->nullable()->index();
                
                $table->string('specialty', 50)->default('neurodevelopmental'); // neurodevelopmental, orthophony, psychology, psychomotricite
                $table->string('primary_diagnosis_code', 64); // DSM-5 / ICD-11 e.g. "299.00 / 6A02"
                $table->string('primary_diagnosis_title', 255);
                $table->string('dsm5_code', 32)->nullable();
                $table->string('icd11_code', 32)->nullable();
                $table->unsignedTinyInteger('confidence_score')->default(80); // 0 - 100%
                
                $table->json('matched_criteria')->nullable(); // Criteria A, B, C checklist met
                $table->json('unmatched_criteria')->nullable(); // Criteria pending or not observed
                $table->json('differential_diagnoses')->nullable(); // Competing diagnoses with rationale
                $table->json('clinical_red_alerts')->nullable(); // Red alert flags (e.g. self-harm, auditory exclusion)
                $table->json('recommended_referrals')->nullable(); // Interdisciplinary referrals (ORL, EEG, Neuro)
                
                $table->boolean('practitioner_confirmed')->default(false);
                $table->text('practitioner_notes')->nullable();
                $table->json('context_payload')->nullable(); // Raw symptoms, psychometrics snapshot
                
                $table->timestamps();

                $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            });
        }

        // 2. Enhance treatment_plans table for SMART PEI and exercises linking
        if (Schema::hasTable('treatment_plans')) {
            Schema::table('treatment_plans', function (Blueprint $table) {
                if (!Schema::hasColumn('treatment_plans', 'linked_exercise_ids')) {
                    $table->json('linked_exercise_ids')->nullable()->after('long_term_vision');
                }
                if (!Schema::hasColumn('treatment_plans', 'smart_goals_matrix')) {
                    $table->json('smart_goals_matrix')->nullable()->after('linked_exercise_ids');
                }
                if (!Schema::hasColumn('treatment_plans', 'diagnostic_record_id')) {
                    $table->unsignedBigInteger('diagnostic_record_id')->nullable()->after('bilan_id');
                }
            });
        }

        // 3. Enhance patient_attachments table for Vision AI intake
        if (Schema::hasTable('patient_attachments')) {
            Schema::table('patient_attachments', function (Blueprint $table) {
                if (!Schema::hasColumn('patient_attachments', 'vision_extracted_data')) {
                    $table->json('vision_extracted_data')->nullable()->after('notes');
                }
                if (!Schema::hasColumn('patient_attachments', 'is_clinical_report')) {
                    $table->boolean('is_clinical_report')->default(false)->after('vision_extracted_data');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinical_diagnostic_records');

        if (Schema::hasTable('treatment_plans')) {
            Schema::table('treatment_plans', function (Blueprint $table) {
                if (Schema::hasColumn('treatment_plans', 'linked_exercise_ids')) {
                    $table->dropColumn('linked_exercise_ids');
                }
                if (Schema::hasColumn('treatment_plans', 'smart_goals_matrix')) {
                    $table->dropColumn('smart_goals_matrix');
                }
                if (Schema::hasColumn('treatment_plans', 'diagnostic_record_id')) {
                    $table->dropColumn('diagnostic_record_id');
                }
            });
        }

        if (Schema::hasTable('patient_attachments')) {
            Schema::table('patient_attachments', function (Blueprint $table) {
                if (Schema::hasColumn('patient_attachments', 'vision_extracted_data')) {
                    $table->dropColumn('vision_extracted_data');
                }
                if (Schema::hasColumn('patient_attachments', 'is_clinical_report')) {
                    $table->dropColumn('is_clinical_report');
                }
            });
        }
    }
};
