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
        Schema::create('clinical_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('specialist_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['orthophony_bilan', 'psychometric_eval', 'initial_anamnesis']);
            $table->string('title');
            $table->date('assessment_date');
            $table->json('results_data')->nullable();
            $table->text('diagnostic_conclusion')->nullable();
            $table->text('recommendations')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinical_assessments');
    }
};
