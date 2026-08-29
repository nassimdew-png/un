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
        Schema::create('patient_assigned_exercises', function (Blueprint $table) {
            $table->id();
            $table->string('clinic_id')->index();
            $table->string('patient_id')->index();
            $table->string('exercise_id')->index();
            $table->string('exercise_title');
            $table->string('specialist_id')->nullable();
            $table->text('therapist_notes')->nullable();
            $table->string('frequency_weekly')->default('daily'); // 'daily', 'twice_daily', '3_times_week'
            $table->date('due_date')->nullable();
            $table->enum('status', ['assigned', 'in_progress', 'completed'])->default('assigned');
            $table->integer('progress_percentage')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_assigned_exercises');
    }
};
