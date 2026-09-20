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
        if (Schema::hasTable('subscription_plans')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                if (!Schema::hasColumn('subscription_plans', 'discount_percentage')) {
                    $table->unsignedTinyInteger('discount_percentage')->default(0)->after('price_yearly');
                }
                if (!Schema::hasColumn('subscription_plans', 'discount_badge')) {
                    $table->string('discount_badge', 120)->nullable()->after('discount_percentage');
                }
                if (!Schema::hasColumn('subscription_plans', 'is_discount_active')) {
                    $table->boolean('is_discount_active')->default(false)->after('discount_badge');
                }
                if (!Schema::hasColumn('subscription_plans', 'discount_ends_at')) {
                    $table->timestamp('discount_ends_at')->nullable()->after('is_discount_active');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('subscription_plans')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                $columns = ['discount_percentage', 'discount_badge', 'is_discount_active', 'discount_ends_at'];
                foreach ($columns as $col) {
                    if (Schema::hasColumn('subscription_plans', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
