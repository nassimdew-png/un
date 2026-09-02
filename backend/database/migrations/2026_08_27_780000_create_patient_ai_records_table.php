<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('patient_ai_records');

        Schema::create('patient_ai_records', function (Blueprint $table) {
            $table->id();
            $table->string('clinic_id')->nullable();
            $table->string('tenant_id')->nullable();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('tool_type'); // social_story, wisc_report, relaxation_plan, drawing_analysis, bilan_synthesis, pep_plan, soap_note
            $table->string('title');
            $table->text('summary')->nullable();
            $table->json('payload');
            $table->text('notes')->nullable();
            $table->boolean('is_shared_with_portal')->default(false);
            $table->timestamps();

            $table->index(['tenant_id', 'patient_id']);
            $table->index('tool_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_ai_records');
    }
};
