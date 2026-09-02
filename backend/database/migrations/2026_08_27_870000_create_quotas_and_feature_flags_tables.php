<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Clinic AI Quotas Table
        if (!Schema::hasTable('clinic_ai_quotas')) {
            Schema::create('clinic_ai_quotas', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('clinic_id')->index();
                $table->string('plan_name', 50)->default('pro'); // basic, pro, enterprise
                $table->integer('monthly_reports_limit')->default(50);
                $table->integer('reports_used')->default(0);
                $table->integer('monthly_transcribe_mins_limit')->default(60);
                $table->float('transcribe_mins_used')->default(0);
                $table->integer('monthly_images_limit')->default(30);
                $table->integer('images_used')->default(0);
                $table->integer('monthly_podcasts_limit')->default(5);
                $table->integer('podcasts_used')->default(0);
                $table->integer('monthly_videos_limit')->default(3);
                $table->integer('videos_used')->default(0);
                $table->integer('monthly_documents_limit')->default(20);
                $table->integer('documents_used')->default(0);
                $table->timestamp('resets_at')->nullable();
                $table->timestamps();
            });
        }

        // 2. Platform Feature Flags Table
        if (!Schema::hasTable('platform_feature_flags')) {
            Schema::create('platform_feature_flags', function (Blueprint $table) {
                $table->id();
                $table->string('feature_key', 50)->unique();
                $table->string('feature_name', 150);
                $table->boolean('is_enabled')->default(true);
                $table->string('maintenance_message', 255)->default('هذه الميزة قيد التحديث والصيانة مؤقتاً.');
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_feature_flags');
        Schema::dropIfExists('clinic_ai_quotas');
    }
};
