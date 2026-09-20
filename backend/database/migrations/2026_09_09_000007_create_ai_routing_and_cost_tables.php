<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. AI Providers Table
        if (!Schema::hasTable('ai_providers')) {
            Schema::create('ai_providers', function (Blueprint $table) {
                $table->id();
                $table->string('name', 100);
                $table->string('slug', 50)->unique(); // gemini, openai, anthropic, deepseek, groq
                $table->text('api_key')->nullable();
                $table->string('base_url', 255)->nullable();
                $table->string('default_model', 100)->default('gemini-2.5-flash');
                $table->boolean('is_active')->default(true);
                $table->integer('priority')->default(1);
                $table->string('status', 30)->default('healthy'); // healthy, degraded, failing, unconfigured
                $table->timestamp('last_health_check_at')->nullable();
                $table->integer('latency_ms')->default(0);
                $table->decimal('pricing_input_1m', 8, 4)->default(0.1500); // USD per 1M input tokens
                $table->decimal('pricing_output_1m', 8, 4)->default(0.6000); // USD per 1M output tokens
                $table->timestamps();
            });

            // Seed initial 5 providers
            DB::table('ai_providers')->insert([
                [
                    'name' => 'Google Gemini AI',
                    'slug' => 'gemini',
                    'api_key' => env('GEMINI_API_KEY', ''),
                    'base_url' => 'https://generativelanguage.googleapis.com',
                    'default_model' => 'gemini-2.5-flash',
                    'is_active' => true,
                    'priority' => 1,
                    'status' => 'healthy',
                    'latency_ms' => 180,
                    'pricing_input_1m' => 0.075,
                    'pricing_output_1m' => 0.300,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'OpenAI Platform',
                    'slug' => 'openai',
                    'api_key' => env('OPENAI_API_KEY', ''),
                    'base_url' => 'https://api.openai.com/v1',
                    'default_model' => 'gpt-4o-mini',
                    'is_active' => true,
                    'priority' => 2,
                    'status' => 'healthy',
                    'latency_ms' => 320,
                    'pricing_input_1m' => 0.150,
                    'pricing_output_1m' => 0.600,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Anthropic Claude',
                    'slug' => 'anthropic',
                    'api_key' => env('ANTHROPIC_API_KEY', ''),
                    'base_url' => 'https://api.anthropic.com/v1',
                    'default_model' => 'claude-3-5-sonnet-20241022',
                    'is_active' => true,
                    'priority' => 3,
                    'status' => 'healthy',
                    'latency_ms' => 450,
                    'pricing_input_1m' => 3.000,
                    'pricing_output_1m' => 15.000,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'DeepSeek AI (Reasoning & Speed)',
                    'slug' => 'deepseek',
                    'api_key' => env('DEEPSEEK_API_KEY', ''),
                    'base_url' => 'https://api.deepseek.com',
                    'default_model' => 'deepseek-chat',
                    'is_active' => true,
                    'priority' => 4,
                    'status' => 'healthy',
                    'latency_ms' => 240,
                    'pricing_input_1m' => 0.140,
                    'pricing_output_1m' => 0.280,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Groq Ultra-Fast LPU',
                    'slug' => 'groq',
                    'api_key' => env('GROQ_API_KEY', ''),
                    'base_url' => 'https://api.groq.com/openai/v1',
                    'default_model' => 'llama-3.3-70b-versatile',
                    'is_active' => true,
                    'priority' => 5,
                    'status' => 'healthy',
                    'latency_ms' => 95,
                    'pricing_input_1m' => 0.590,
                    'pricing_output_1m' => 0.790,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // 2. AI Clinical Task Routes Table
        if (!Schema::hasTable('ai_task_routes')) {
            Schema::create('ai_task_routes', function (Blueprint $table) {
                $table->id();
                $table->string('task_type', 50)->unique();
                $table->string('task_label_ar', 100);
                $table->string('primary_provider', 50)->default('gemini');
                $table->string('primary_model', 100)->default('gemini-2.5-flash');
                $table->string('fallback_provider', 50)->default('openai');
                $table->string('fallback_model', 100)->default('gpt-4o-mini');
                $table->decimal('temperature', 3, 2)->default(0.70);
                $table->integer('max_tokens')->default(4096);
                $table->boolean('is_enabled')->default(true);
                $table->timestamps();
            });

            // Seed clinical task routes
            DB::table('ai_task_routes')->insert([
                [
                    'task_type' => 'clinical_scribe',
                    'task_label_ar' => 'التفريغ والتوثيق السريري الذكي (Ambient Scribe)',
                    'primary_provider' => 'gemini',
                    'primary_model' => 'gemini-2.5-flash',
                    'fallback_provider' => 'groq',
                    'fallback_model' => 'llama-3.3-70b-versatile',
                    'temperature' => 0.40,
                    'max_tokens' => 2048,
                    'is_enabled' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'task_type' => 'master_bilan_generator',
                    'task_label_ar' => 'توليد وصياغة الحصيلة السريرية الشاملة (Bilan Officiel)',
                    'primary_provider' => 'gemini',
                    'primary_model' => 'gemini-2.5-flash',
                    'fallback_provider' => 'openai',
                    'fallback_model' => 'gpt-4o-mini',
                    'temperature' => 0.60,
                    'max_tokens' => 4096,
                    'is_enabled' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'task_type' => 'psychometrics_interpreter',
                    'task_label_ar' => 'تحليل وتفسير درجات المقاييس والروائز الـ 18',
                    'primary_provider' => 'gemini',
                    'primary_model' => 'gemini-2.5-flash',
                    'fallback_provider' => 'deepseek',
                    'fallback_model' => 'deepseek-chat',
                    'temperature' => 0.30,
                    'max_tokens' => 3072,
                    'is_enabled' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'task_type' => 'speech_acoustic_analyzer',
                    'task_label_ar' => 'فحص المعاملات الصوتية الحيوية ومخارج الحروف',
                    'primary_provider' => 'groq',
                    'primary_model' => 'llama-3.3-70b-versatile',
                    'fallback_provider' => 'gemini',
                    'fallback_model' => 'gemini-2.5-flash',
                    'temperature' => 0.20,
                    'max_tokens' => 2048,
                    'is_enabled' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'task_type' => 'general_assistant',
                    'task_label_ar' => 'المساعد السريري العام والمحادثة السريعة',
                    'primary_provider' => 'gemini',
                    'primary_model' => 'gemini-2.5-flash',
                    'fallback_provider' => 'openai',
                    'fallback_model' => 'gpt-4o-mini',
                    'temperature' => 0.70,
                    'max_tokens' => 2048,
                    'is_enabled' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // 3. AI Cost & Telemetry Logs Table
        if (!Schema::hasTable('ai_cost_logs')) {
            Schema::create('ai_cost_logs', function (Blueprint $table) {
                $table->id();
                $table->char('tenant_id', 36)->nullable();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('provider_slug', 50);
                $table->string('model_name', 100);
                $table->string('task_type', 50)->default('general');
                $table->integer('input_tokens')->default(0);
                $table->integer('output_tokens')->default(0);
                $table->integer('total_tokens')->default(0);
                $table->decimal('estimated_cost_usd', 10, 6)->default(0.000000);
                $table->integer('latency_ms')->default(0);
                $table->boolean('was_fallback_used')->default(false);
                $table->string('fallback_reason', 255)->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->index('tenant_id');
                $table->index('provider_slug');
                $table->index('task_type');
                $table->index('created_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_cost_logs');
        Schema::dropIfExists('ai_task_routes');
        Schema::dropIfExists('ai_providers');
    }
};
