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
        // 1. Enhance tenants table
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'ai_monthly_token_limit')) {
                $table->integer('ai_monthly_token_limit')->default(100000)->after('status');
            }
            if (!Schema::hasColumn('tenants', 'ai_tokens_used_this_month')) {
                $table->integer('ai_tokens_used_this_month')->default(0)->after('ai_monthly_token_limit');
            }
            if (!Schema::hasColumn('tenants', 'ai_custom_quota_override')) {
                $table->boolean('ai_custom_quota_override')->default(false)->after('ai_tokens_used_this_month');
            }
            if (!Schema::hasColumn('tenants', 'ai_quota_reset_at')) {
                $table->date('ai_quota_reset_at')->nullable()->after('ai_custom_quota_override');
            }
        });

        // 2. Enhance ai_usage_logs table
        if (!Schema::hasTable('ai_usage_logs')) {
            Schema::create('ai_usage_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignUuid('clinic_id')->nullable()->index();
                $table->foreignId('user_id')->nullable()->index();
                $table->string('feature', 50)->default('bilan_generation');
                $table->string('provider_used', 30)->default('openai');
                $table->string('model_name', 100)->default('gpt-4o-mini');
                $table->integer('prompt_tokens')->default(0);
                $table->integer('completion_tokens')->default(0);
                $table->integer('total_tokens')->default(0);
                $table->decimal('estimated_cost_usd', 8, 4)->default(0.0000);
                $table->integer('execution_time_ms')->default(0);
                $table->string('status', 30)->default('success'); // success, fallback_triggered, failed
                $table->timestamps();
            });
        } else {
            Schema::table('ai_usage_logs', function (Blueprint $table) {
                if (!Schema::hasColumn('ai_usage_logs', 'feature')) {
                    $table->string('feature', 50)->default('bilan_generation')->after('user_id');
                }
                if (!Schema::hasColumn('ai_usage_logs', 'provider_used')) {
                    $table->string('provider_used', 30)->default('openai')->after('feature');
                }
                if (!Schema::hasColumn('ai_usage_logs', 'estimated_cost_usd')) {
                    $table->decimal('estimated_cost_usd', 8, 4)->default(0.0000)->after('total_tokens');
                }
                if (!Schema::hasColumn('ai_usage_logs', 'execution_time_ms')) {
                    $table->integer('execution_time_ms')->default(0)->after('estimated_cost_usd');
                }
                if (!Schema::hasColumn('ai_usage_logs', 'status')) {
                    $table->string('status', 30)->default('success')->after('execution_time_ms');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No destruct
    }
};
