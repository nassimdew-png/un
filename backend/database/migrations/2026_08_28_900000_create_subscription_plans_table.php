<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('subscription_plans')) {
            Schema::create('subscription_plans', function (Blueprint $table) {
                $table->id();
                $table->string('name_ar');
                $table->string('name_fr')->nullable();
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->decimal('price_monthly', 10, 2)->default(0);
                $table->decimal('price_yearly', 10, 2)->default(0);
                $table->string('currency', 10)->default('DZD');
                $table->integer('trial_days')->default(14);
                $table->integer('max_patients')->default(500);
                $table->integer('max_staff')->default(5);
                $table->integer('ai_reports_limit')->default(100);
                $table->integer('ai_transcribe_mins')->default(120);
                $table->integer('ai_images_limit')->default(50);
                $table->integer('ai_podcasts_limit')->default(5);
                $table->integer('ai_videos_limit')->default(0);
                $table->boolean('has_custom_domain')->default(false);
                $table->boolean('has_priority_support')->default(false);
                $table->boolean('is_featured')->default(false);
                $table->boolean('is_active')->default(true);
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        // Add plan_id column to tenants table if not present
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'plan_id')) {
                $table->unsignedBigInteger('plan_id')->nullable()->index();
            }
        });

        // Seed default plans if empty
        if (DB::table('subscription_plans')->count() === 0) {
            DB::table('subscription_plans')->insert([
                [
                    'name_ar' => 'الباقة التجريبية المجانية',
                    'name_fr' => 'Plan Découverte Essai',
                    'slug' => 'trial',
                    'description' => 'تجربة شاملة لكافة ميزات المنصة والذكاء الاصطناعي مجاناً للعيادات الجديدة.',
                    'price_monthly' => 0.00,
                    'price_yearly' => 0.00,
                    'currency' => 'DZD',
                    'trial_days' => 14,
                    'max_patients' => 50,
                    'max_staff' => 2,
                    'ai_reports_limit' => 25,
                    'ai_transcribe_mins' => 30,
                    'ai_images_limit' => 20,
                    'ai_podcasts_limit' => 2,
                    'ai_videos_limit' => 0,
                    'has_custom_domain' => false,
                    'has_priority_support' => false,
                    'is_featured' => false,
                    'is_active' => true,
                    'sort_order' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name_ar' => 'الباقة الأساسية (Cabinet Starter)',
                    'name_fr' => 'Pack Praticien Individuel',
                    'slug' => 'starter',
                    'description' => 'مثالية للأطباء والأخصائيين الممارسين في عيادات مستقلة مع إدارة شاملة للمرضى والمواعيد.',
                    'price_monthly' => 4900.00,
                    'price_yearly' => 49000.00,
                    'currency' => 'DZD',
                    'trial_days' => 14,
                    'max_patients' => 250,
                    'max_staff' => 3,
                    'ai_reports_limit' => 60,
                    'ai_transcribe_mins' => 90,
                    'ai_images_limit' => 50,
                    'ai_podcasts_limit' => 5,
                    'ai_videos_limit' => 2,
                    'has_custom_domain' => false,
                    'has_priority_support' => false,
                    'is_featured' => false,
                    'is_active' => true,
                    'sort_order' => 2,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name_ar' => 'الباقة الاحترافية الذكية (Pro AI)',
                    'name_fr' => 'Pack Clinique Pro AI',
                    'slug' => 'pro-ai',
                    'description' => 'الباقة الأكثر طلباً للمراكز والعيادات المتخصصة مع كافة أدوات الذكاء الاصطناعي والنطاق المخصص.',
                    'price_monthly' => 8900.00,
                    'price_yearly' => 89000.00,
                    'currency' => 'DZD',
                    'trial_days' => 14,
                    'max_patients' => 1000,
                    'max_staff' => 8,
                    'ai_reports_limit' => 250,
                    'ai_transcribe_mins' => 300,
                    'ai_images_limit' => 200,
                    'ai_podcasts_limit' => 20,
                    'ai_videos_limit' => 10,
                    'has_custom_domain' => true,
                    'has_priority_support' => true,
                    'is_featured' => true,
                    'is_active' => true,
                    'sort_order' => 3,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name_ar' => 'باقة المراكز الكبرى والمتعددة (Enterprise VIP)',
                    'name_fr' => 'Pack Multi-Centres & Hôpitaux VIP',
                    'slug' => 'enterprise-vip',
                    'description' => 'سعة غير محدودة للمرضى وطاقم العمل مع دعم فني مخصص 24/7 ونسخ احتياطي فوري.',
                    'price_monthly' => 16900.00,
                    'price_yearly' => 169000.00,
                    'currency' => 'DZD',
                    'trial_days' => 30,
                    'max_patients' => -1,
                    'max_staff' => -1,
                    'ai_reports_limit' => -1,
                    'ai_transcribe_mins' => -1,
                    'ai_images_limit' => -1,
                    'ai_podcasts_limit' => -1,
                    'ai_videos_limit' => -1,
                    'has_custom_domain' => true,
                    'has_priority_support' => true,
                    'is_featured' => false,
                    'is_active' => true,
                    'sort_order' => 4,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};
