<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('system_api_configs')) {
            Schema::create('system_api_configs', function (Blueprint $table) {
                $table->id();
                $table->string('provider', 50)->unique(); // gemini, google_cloud, elevenlabs, custom
                $table->text('api_key')->nullable(); // encrypted via Laravel cast
                $table->text('secondary_api_key')->nullable(); // encrypted fallback
                $table->string('default_text_model', 100)->default('gemini-3.6-flash');
                $table->string('default_vision_model', 100)->default('gemini-3.6-flash');
                $table->string('default_audio_model', 100)->default('gemini-3.6-flash');
                $table->string('default_video_model', 100)->default('veo_animation');
                $table->boolean('is_active')->default(true);
                $table->integer('rate_limit_per_minute')->default(60);
                $table->timestamp('last_tested_at')->nullable();
                $table->string('health_status', 30)->default('untested'); // healthy, invalid_key, quota_exceeded, untested
                $table->json('feature_flags')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('system_api_configs');
    }
};
