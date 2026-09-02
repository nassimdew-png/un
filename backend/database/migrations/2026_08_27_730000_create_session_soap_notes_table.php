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
        if (!Schema::hasTable('session_soap_notes')) {
            Schema::create('session_soap_notes', function (Blueprint $table) {
                $table->id();
                $table->foreignUuid('clinic_id')->nullable()->index();
                $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
                $table->foreignId('practitioner_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
                $table->date('session_date')->default(now()->toDateString());
                $table->integer('audio_duration_seconds')->nullable();
                $table->text('raw_transcript')->nullable();
                $table->text('subjective')->nullable();
                $table->text('objective')->nullable();
                $table->text('assessment')->nullable();
                $table->text('plan')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('session_soap_notes');
    }
};
