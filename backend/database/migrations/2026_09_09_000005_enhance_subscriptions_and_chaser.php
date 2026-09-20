<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('tenants')) {
            Schema::table('tenants', function (Blueprint $table) {
                if (!Schema::hasColumn('tenants', 'last_chased_at')) {
                    $table->timestamp('last_chased_at')->nullable()->after('subscription_ends_at');
                }
                if (!Schema::hasColumn('tenants', 'chase_count')) {
                    $table->integer('chase_count')->default(0)->after('last_chased_at');
                }
                if (!Schema::hasColumn('tenants', 'grace_period_ends_at')) {
                    $table->timestamp('grace_period_ends_at')->nullable()->after('chase_count');
                }
                if (!Schema::hasColumn('tenants', 'last_chased_template')) {
                    $table->string('last_chased_template', 50)->nullable()->after('grace_period_ends_at');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('tenants')) {
            Schema::table('tenants', function (Blueprint $table) {
                $columns = ['last_chased_at', 'chase_count', 'grace_period_ends_at', 'last_chased_template'];
                foreach ($columns as $column) {
                    if (Schema::hasColumn('tenants', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
