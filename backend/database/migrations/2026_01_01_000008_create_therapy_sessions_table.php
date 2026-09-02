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
        Schema::create('therapy_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('specialist_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('session_date');
            $table->integer('duration_minutes')->default(45);
            $table->enum('specialty', ['orthophony', 'psychology']);
            $table->text('progress_notes')->nullable();
            $table->json('exercises_targeted')->nullable();
            $table->enum('attendance_status', ['present', 'absent', 'excused'])->default('present');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('therapy_sessions');
    }
};
