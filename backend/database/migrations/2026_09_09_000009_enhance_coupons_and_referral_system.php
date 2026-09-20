<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Ensure discount_coupons table and new columns
        if (!Schema::hasTable('discount_coupons')) {
            Schema::create('discount_coupons', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('discount_type')->default('percentage'); // percentage, fixed_dzd
                $table->decimal('discount_value', 10, 2)->default(10.00);
                $table->integer('max_uses')->default(100);
                $table->integer('used_count')->default(0);
                $table->datetime('starts_at')->nullable();
                $table->datetime('expires_at')->nullable();
                $table->boolean('is_active')->default(true);
                $table->string('description')->nullable();
                $table->string('campaign_name')->nullable();
                $table->unsignedBigInteger('applicable_plan_id')->nullable();
                $table->string('applicable_cycle', 20)->default('all'); // all, yearly, monthly
                $table->decimal('min_order_dzd', 10, 2)->default(0);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
            });
        } else {
            Schema::table('discount_coupons', function (Blueprint $table) {
                if (!Schema::hasColumn('discount_coupons', 'campaign_name')) {
                    $table->string('campaign_name')->nullable()->after('description');
                }
                if (!Schema::hasColumn('discount_coupons', 'applicable_plan_id')) {
                    $table->unsignedBigInteger('applicable_plan_id')->nullable()->after('campaign_name');
                }
                if (!Schema::hasColumn('discount_coupons', 'applicable_cycle')) {
                    $table->string('applicable_cycle', 20)->default('all')->after('applicable_plan_id');
                }
                if (!Schema::hasColumn('discount_coupons', 'min_order_dzd')) {
                    $table->decimal('min_order_dzd', 10, 2)->default(0)->after('applicable_cycle');
                }
                if (!Schema::hasColumn('discount_coupons', 'created_by')) {
                    $table->unsignedBigInteger('created_by')->nullable()->after('min_order_dzd');
                }
            });
        }

        // 2. Ensure coupon_redemptions table and new columns
        if (!Schema::hasTable('coupon_redemptions')) {
            Schema::create('coupon_redemptions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('coupon_id')->index();
                $table->string('clinic_id', 36)->index();
                $table->decimal('original_amount_dzd', 12, 2)->default(0);
                $table->decimal('discount_applied_dzd', 12, 2)->default(0);
                $table->decimal('final_amount_dzd', 12, 2)->default(0);
                $table->unsignedBigInteger('invoice_id')->nullable()->index();
                $table->unsignedBigInteger('payment_request_id')->nullable()->index();
                $table->datetime('redeemed_at')->nullable();
                $table->timestamps();
            });
        } else {
            Schema::table('coupon_redemptions', function (Blueprint $table) {
                if (!Schema::hasColumn('coupon_redemptions', 'original_amount_dzd')) {
                    $table->decimal('original_amount_dzd', 12, 2)->default(0)->after('clinic_id');
                }
                if (!Schema::hasColumn('coupon_redemptions', 'final_amount_dzd')) {
                    $table->decimal('final_amount_dzd', 12, 2)->default(0)->after('discount_applied_dzd');
                }
                if (!Schema::hasColumn('coupon_redemptions', 'invoice_id')) {
                    $table->unsignedBigInteger('invoice_id')->nullable()->after('final_amount_dzd');
                }
                if (!Schema::hasColumn('coupon_redemptions', 'payment_request_id')) {
                    $table->unsignedBigInteger('payment_request_id')->nullable()->after('invoice_id');
                }
            });
        }

        // 3. Ensure affiliate_referrals table and new columns
        if (!Schema::hasTable('affiliate_referrals')) {
            Schema::create('affiliate_referrals', function (Blueprint $table) {
                $table->id();
                $table->string('affiliate_name');
                $table->string('referral_code')->unique();
                $table->string('partner_type')->default('partner_association'); // partner_association, doctor_peer, influencer
                $table->string('clinic_id', 36)->nullable()->index();
                $table->string('reward_type')->default('commission_dzd'); // commission_dzd, free_subscription_months, both
                $table->decimal('commission_rate', 5, 2)->default(15.00);
                $table->integer('reward_months_per_referral')->default(1);
                $table->decimal('referee_discount_percent', 5, 2)->default(15.00);
                $table->integer('total_referred_clinics')->default(0);
                $table->decimal('total_earned_dzd', 12, 2)->default(0);
                $table->string('payout_phone')->nullable();
                $table->string('payout_ccp_rip')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        } else {
            Schema::table('affiliate_referrals', function (Blueprint $table) {
                if (!Schema::hasColumn('affiliate_referrals', 'partner_type')) {
                    $table->string('partner_type')->default('partner_association')->after('referral_code');
                }
                if (!Schema::hasColumn('affiliate_referrals', 'clinic_id')) {
                    $table->string('clinic_id', 36)->nullable()->after('partner_type');
                }
                if (!Schema::hasColumn('affiliate_referrals', 'reward_type')) {
                    $table->string('reward_type')->default('commission_dzd')->after('clinic_id');
                }
                if (!Schema::hasColumn('affiliate_referrals', 'reward_months_per_referral')) {
                    $table->integer('reward_months_per_referral')->default(1)->after('commission_rate');
                }
                if (!Schema::hasColumn('affiliate_referrals', 'referee_discount_percent')) {
                    $table->decimal('referee_discount_percent', 5, 2)->default(15.00)->after('reward_months_per_referral');
                }
            });
        }

        // 4. Enhance tenants table for referrals
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'referral_code')) {
                $table->string('referral_code', 50)->nullable()->unique()->after('referred_by_code');
            }
            if (!Schema::hasColumn('tenants', 'referral_credits_dzd')) {
                $table->decimal('referral_credits_dzd', 12, 2)->default(0)->after('referral_code');
            }
            if (!Schema::hasColumn('tenants', 'referral_free_days_earned')) {
                $table->integer('referral_free_days_earned')->default(0)->after('referral_credits_dzd');
            }
        });

        // 5. Enhance saas_payment_requests & saas_invoices for coupon tracking
        Schema::table('saas_payment_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('saas_payment_requests', 'coupon_code')) {
                $table->string('coupon_code', 50)->nullable()->after('amount_dzd');
            }
            if (!Schema::hasColumn('saas_payment_requests', 'discount_amount_dzd')) {
                $table->decimal('discount_amount_dzd', 12, 2)->default(0)->after('coupon_code');
            }
            if (!Schema::hasColumn('saas_payment_requests', 'original_amount_dzd')) {
                $table->decimal('original_amount_dzd', 12, 2)->nullable()->after('discount_amount_dzd');
            }
        });

        Schema::table('saas_invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('saas_invoices', 'coupon_code')) {
                $table->string('coupon_code', 50)->nullable()->after('amount_dzd');
            }
            if (!Schema::hasColumn('saas_invoices', 'discount_amount_dzd')) {
                $table->decimal('discount_amount_dzd', 12, 2)->default(0)->after('coupon_code');
            }
            if (!Schema::hasColumn('saas_invoices', 'original_amount_dzd')) {
                $table->decimal('original_amount_dzd', 12, 2)->nullable()->after('discount_amount_dzd');
            }
        });

        // 6. Backfill tenants referral codes
        $tenants = DB::table('tenants')->whereNull('referral_code')->get();
        foreach ($tenants as $t) {
            $prefix = match ($t->type ?? 'clinic') {
                'orthophony' => 'REF-ORTHO',
                'psychology' => 'REF-PSY',
                default => 'REF-CLINIC',
            };
            $subPart = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $t->subdomain ?? 'DZ'), 0, 4));
            $code = $prefix . '-' . $subPart . '-' . strtoupper(Str::random(3));
            DB::table('tenants')->where('id', $t->id)->update([
                'referral_code' => $code,
            ]);
        }

        // 7. Seed initial high-impact promo coupons if empty
        if (DB::table('discount_coupons')->count() === 0) {
            DB::table('discount_coupons')->insert([
                [
                    'code' => 'ORTHO-DZ-2026',
                    'discount_type' => 'percentage',
                    'discount_value' => 20.00,
                    'max_uses' => 100,
                    'used_count' => 8,
                    'starts_at' => now()->subMonth(),
                    'expires_at' => now()->addMonths(6),
                    'is_active' => true,
                    'description' => 'تخفيض حصري 20% لأعضاء الجمعية الوطنية للأرطوفونيين الجزائريين.',
                    'campaign_name' => 'حملة الشراكة مع ANOP الجزائر',
                    'applicable_cycle' => 'yearly',
                    'min_order_dzd' => 40000.00,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'code' => 'PSY-RAMADAN',
                    'discount_type' => 'percentage',
                    'discount_value' => 15.00,
                    'max_uses' => 50,
                    'used_count' => 14,
                    'starts_at' => now()->subWeeks(2),
                    'expires_at' => now()->addMonths(3),
                    'is_active' => true,
                    'description' => 'خصم رمضان المبارك على الباقات السنوية للعيادات النفسية والتأهيلية.',
                    'campaign_name' => 'عروض الموسم الرمضاني 2026',
                    'applicable_cycle' => 'yearly',
                    'min_order_dzd' => 35000.00,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'code' => 'START-DZ-5000',
                    'discount_type' => 'fixed_dzd',
                    'discount_value' => 5000.00,
                    'max_uses' => 200,
                    'used_count' => 27,
                    'starts_at' => now()->subMonth(),
                    'expires_at' => now()->addYear(),
                    'is_active' => true,
                    'description' => 'خصم ترحيبي مباشر بقيمة 5,000 د.ج عند أول اشتراك سنوي.',
                    'campaign_name' => 'منحة انطلاق العيادات الجديدة',
                    'applicable_cycle' => 'all',
                    'min_order_dzd' => 30000.00,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // 8. Seed initial affiliate partners if empty
        if (DB::table('affiliate_referrals')->count() === 0) {
            DB::table('affiliate_referrals')->insert([
                [
                    'affiliate_name' => 'الجمعية الوطنية للأرطوفونيين الجزائريين (ANOP)',
                    'referral_code' => 'ANOP-DZ',
                    'partner_type' => 'partner_association',
                    'reward_type' => 'commission_dzd',
                    'commission_rate' => 20.00,
                    'reward_months_per_referral' => 2,
                    'referee_discount_percent' => 15.00,
                    'total_referred_clinics' => 6,
                    'total_earned_dzd' => 48000.00,
                    'payout_phone' => '0550112233',
                    'payout_ccp_rip' => '00799999001122334455',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'affiliate_name' => 'د. حسان لعمارة (مؤثر وتدريب إكلينيكي)',
                    'referral_code' => 'DR-HASSAN',
                    'partner_type' => 'influencer',
                    'reward_type' => 'both',
                    'commission_rate' => 15.00,
                    'reward_months_per_referral' => 1,
                    'referee_discount_percent' => 10.00,
                    'total_referred_clinics' => 4,
                    'total_earned_dzd' => 28000.00,
                    'payout_phone' => '0661223344',
                    'payout_ccp_rip' => '00799999006677889900',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'affiliate_name' => 'د. أمين وهران (سفير طبي - عيادة النور)',
                    'referral_code' => 'DR-AMINE-ORAN',
                    'partner_type' => 'doctor_peer',
                    'reward_type' => 'free_subscription_months',
                    'commission_rate' => 10.00,
                    'reward_months_per_referral' => 1,
                    'referee_discount_percent' => 15.00,
                    'total_referred_clinics' => 3,
                    'total_earned_dzd' => 15000.00,
                    'payout_phone' => '0770998877',
                    'payout_ccp_rip' => '00799999003344556677',
                    'is_active' => true,
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
        // Safe reversible migration
    }
};
