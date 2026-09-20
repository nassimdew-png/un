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
        Schema::create('speech_articulation_assessments', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 64)->nullable()->index();
            $table->unsignedBigInteger('patient_id')->index();
            $table->unsignedBigInteger('specialist_id')->nullable()->index();
            $table->unsignedBigInteger('appointment_id')->nullable()->index();
            $table->date('assessment_date');
            
            // 1. Bucco-facial functional examination results (Lips, tongue, palate, occlusion, breathing)
            $table->json('bucco_facial_exam')->nullable();
            
            // 2. Comprehensive phonetic inventory (Initial, Medial, Final positions)
            $table->json('phonetic_inventory')->nullable();
            
            // 3. Auditory discrimination of minimal pairs
            $table->json('auditory_discrimination')->nullable();
            
            // 4. Quantitative metrics (PCC - Percentage of Consonants Correct)
            $table->integer('total_consonants_tested')->default(0);
            $table->integer('correct_consonants_count')->default(0);
            $table->decimal('pcc_percentage', 5, 2)->default(0.00);
            $table->string('severity_level', 50)->default('mild');
            
            // 5. Categorized errors
            $table->json('distorted_sounds')->nullable();
            $table->json('omitted_sounds')->nullable();
            $table->json('substituted_sounds')->nullable();
            
            // 6. Clinical synthesis & PEI therapeutic goals
            $table->text('clinical_summary')->nullable();
            $table->json('therapeutic_goals')->nullable();
            
            $table->timestamps();

            // Foreign keys if tables exist
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('speech_articulation_assessments');
    }
};
