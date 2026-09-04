<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('patient_bilans')) {
            Schema::create('patient_bilans', function (Blueprint $table) {
                $table->id();
                $table->string('tenant_id', 100)->nullable()->index();
                $table->unsignedBigInteger('patient_id')->index();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->unsignedBigInteger('specialist_id')->nullable()->index();
                $table->string('title')->default('Compte-Rendu de Bilan Clinique');
                $table->string('bilan_type', 50)->default('orthophonique');
                $table->string('language', 10)->default('fr');
                $table->string('audience', 30)->default('medical');
                $table->longText('clinical_summary')->nullable();
                $table->longText('psychometric_analysis')->nullable();
                $table->longText('strengths_weaknesses')->nullable();
                $table->longText('diagnosis_codes')->nullable();
                $table->longText('therapeutic_project')->nullable();
                $table->json('included_sections')->nullable();
                $table->json('anamnesis_snapshot')->nullable();
                $table->json('genogram_snapshot')->nullable();
                $table->json('sensory_map_snapshot')->nullable();
                $table->json('assessments_snapshot')->nullable();
                $table->string('pdf_path', 500)->nullable();
                $table->string('status', 30)->default('finalized');
                $table->timestamps();

                $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            });
        } else {
            Schema::table('patient_bilans', function (Blueprint $table) {
                if (!Schema::hasColumn('patient_bilans', 'user_id')) {
                    $table->unsignedBigInteger('user_id')->nullable()->index();
                }
                if (!Schema::hasColumn('patient_bilans', 'specialist_id')) {
                    $table->unsignedBigInteger('specialist_id')->nullable()->index();
                }
                if (!Schema::hasColumn('patient_bilans', 'audience')) {
                    $table->string('audience', 30)->default('medical');
                }
                if (!Schema::hasColumn('patient_bilans', 'psychometric_analysis')) {
                    $table->longText('psychometric_analysis')->nullable();
                }
                if (!Schema::hasColumn('patient_bilans', 'strengths_weaknesses')) {
                    $table->longText('strengths_weaknesses')->nullable();
                }
                if (!Schema::hasColumn('patient_bilans', 'included_sections')) {
                    $table->json('included_sections')->nullable();
                }
                if (!Schema::hasColumn('patient_bilans', 'anamnesis_snapshot')) {
                    $table->json('anamnesis_snapshot')->nullable();
                }
                if (!Schema::hasColumn('patient_bilans', 'genogram_snapshot')) {
                    $table->json('genogram_snapshot')->nullable();
                }
                if (!Schema::hasColumn('patient_bilans', 'sensory_map_snapshot')) {
                    $table->json('sensory_map_snapshot')->nullable();
                }
                if (!Schema::hasColumn('patient_bilans', 'assessments_snapshot')) {
                    $table->json('assessments_snapshot')->nullable();
                }
                if (!Schema::hasColumn('patient_bilans', 'status')) {
                    $table->string('status', 30)->default('finalized');
                }
            });
        }
    }

    public function down(): void
    {
        // No-op to preserve existing records
    }
};
