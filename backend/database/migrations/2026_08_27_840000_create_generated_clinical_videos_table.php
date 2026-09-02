<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('generated_clinical_videos')) {
            Schema::create('generated_clinical_videos', function (Blueprint $table) {
                $table->id();
                $table->string('clinic_id', 100)->nullable();
                $table->string('tenant_id', 100)->nullable();
                $table->unsignedBigInteger('patient_id')->nullable();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('title');
                $table->text('prompt');
                $table->string('category', 50)->default('social_story'); // social_story, therapy_exercise, clinic_reel, breathing_visual
                $table->string('model_used', 50)->default('veo_animation');
                $table->string('aspect_ratio', 20)->default('16:9'); // 16:9, 9:16, 1:1
                $table->string('status', 30)->default('queued'); // queued, processing, completed, failed
                $table->string('video_url', 500)->nullable();
                $table->string('thumbnail_url', 500)->nullable();
                $table->integer('duration_seconds')->nullable();
                $table->text('error_message')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'status']);
                $table->index(['patient_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('generated_clinical_videos');
    }
};
