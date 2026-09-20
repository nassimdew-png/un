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
        if (!Schema::hasTable('clinical_test_assignments')) {
            Schema::create('clinical_test_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
                $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
                $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
                $table->foreignId('specialist_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('clinical_assessment_id')->nullable()->constrained('clinical_assessments')->nullOnDelete();
                
                $table->string('test_code', 50)->index();
                $table->string('test_title');
                $table->string('access_token', 64)->unique()->index();
                $table->string('pin_code', 10)->nullable();
                
                $table->enum('mode', ['specialist_live', 'clinic_tablet', 'remote_link'])->default('remote_link');
                $table->enum('status', ['pending', 'in_progress', 'completed', 'expired'])->default('pending')->index();
                
                $table->dateTime('expires_at')->index();
                $table->dateTime('completed_at')->nullable();
                
                $table->json('answers_payload')->nullable();
                $table->decimal('raw_score', 8, 2)->nullable();
                $table->string('severity_label')->nullable();
                $table->text('diagnostic_notes')->nullable();
                
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinical_test_assignments');
    }
};
