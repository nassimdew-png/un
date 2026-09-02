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
        // 1. Add AI tokens quota to tenants table
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'ai_tokens_balance')) {
                $table->unsignedBigInteger('ai_tokens_balance')->default(100000)->after('status');
            }
            if (!Schema::hasColumn('tenants', 'ai_tokens_used')) {
                $table->unsignedBigInteger('ai_tokens_used')->default(0)->after('ai_tokens_balance');
            }
            if (!Schema::hasColumn('tenants', 'ai_monthly_token_quota')) {
                $table->unsignedBigInteger('ai_monthly_token_quota')->default(100000)->after('ai_tokens_used');
            }
        });

        // 2. Ensure ai_generation_logs table exists
        if (!Schema::hasTable('ai_generation_logs')) {
            Schema::create('ai_generation_logs', function (Blueprint $table) {
                $table->id();
                $table->uuid('clinic_id')->nullable()->index();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->uuid('patient_id')->nullable()->index();
                $table->string('action_type')->default('bilan_synthesis');
                $table->string('provider')->default('openai');
                $table->string('model_name')->nullable();
                $table->string('language', 10)->default('fr');
                $table->string('audience', 30)->default('medical');
                $table->integer('prompt_tokens')->default(0);
                $table->integer('completion_tokens')->default(0);
                $table->integer('total_tokens')->default(0);
                $table->integer('latency_ms')->default(0);
                $table->string('status', 30)->default('success');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (Schema::hasColumn('tenants', 'ai_tokens_balance')) {
                $table->dropColumn(['ai_tokens_balance', 'ai_tokens_used', 'ai_monthly_token_quota']);
            }
        });

        Schema::dropIfExists('ai_generation_logs');
    }
};
