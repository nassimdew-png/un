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
        Schema::create('psychomotor_assessments', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 64)->nullable()->index();
            $table->unsignedBigInteger('patient_id')->index();
            $table->unsignedBigInteger('specialist_id')->nullable()->index();
            $table->unsignedBigInteger('appointment_id')->nullable()->index();
            $table->date('assessment_date');

            // 1. Sensory & Muscle Tonus Body Map (Detailed zones status, tonus, tactile sensitivity, notes)
            $table->json('body_map_data')->nullable();
            $table->json('body_map_stats')->nullable();

            // 2. Balance Battery (Static & Dynamic Romberg, Flamingo stance, Tandem gait, Hopping)
            $table->json('balance_battery')->nullable();

            // 3. Lateralization Battery (Harris & Zazzo hand, eye, foot dominance & profile)
            $table->json('lateralization')->nullable();
            $table->json('lateral_profile')->nullable();

            // 4. Visuo-Motor Coordination & Praxies (Diadochokinesia, Dysmetria, Pencil grasp)
            $table->json('visuo_motor')->nullable();

            // 5. Spatial-Temporal Organization (Piaget-Head left/right tests, Stambak rhythms)
            $table->json('spatial_temporal')->nullable();

            // 6. Clinical Synthesis & Therapeutic PEI Goals
            $table->text('clinical_summary')->nullable();
            $table->json('therapeutic_goals')->nullable();

            $table->timestamps();

            // Foreign key to patients
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('psychomotor_assessments');
    }
};
