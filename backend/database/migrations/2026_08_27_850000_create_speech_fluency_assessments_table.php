<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('speech_fluency_assessments')) {
            Schema::create('speech_fluency_assessments', function (Blueprint $table) {
                $table->id();
                $table->string('clinic_id', 100)->nullable();
                $table->string('tenant_id', 100)->nullable();
                $table->unsignedBigInteger('patient_id')->nullable();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('audio_path', 500)->nullable();
                $table->float('duration_seconds')->default(0);
                $table->integer('total_words')->default(0);
                $table->integer('total_syllables')->default(0);
                $table->float('stuttered_syllables_percentage')->default(0); // %SS
                $table->integer('repetition_count')->default(0);
                $table->integer('prolongation_count')->default(0);
                $table->integer('block_count')->default(0);
                $table->float('avg_block_duration_sec')->default(0);
                $table->float('speech_rate_wpm')->default(0);
                $table->string('severity_level', 30)->default('mild'); // mild, moderate, severe, very_severe
                $table->string('speech_task', 50)->default('spontaneous_dialogue');
                $table->string('language', 20)->default('ar-DZ');
                $table->json('detailed_disfluencies_json')->nullable();
                $table->longText('clinical_recommendations')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'patient_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('speech_fluency_assessments');
    }
};
