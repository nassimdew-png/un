<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'has_ai_access')) {
                $table->boolean('has_ai_access')->default(true)->after('status');
            }
            if (!Schema::hasColumn('tenants', 'monthly_ai_quota')) {
                $table->integer('monthly_ai_quota')->default(50)->after('has_ai_access');
            }
            if (!Schema::hasColumn('tenants', 'ai_credits_used')) {
                $table->integer('ai_credits_used')->default(0)->after('monthly_ai_quota');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (Schema::hasColumn('tenants', 'has_ai_access')) {
                $table->dropColumn('has_ai_access');
            }
            if (Schema::hasColumn('tenants', 'monthly_ai_quota')) {
                $table->dropColumn('monthly_ai_quota');
            }
            if (Schema::hasColumn('tenants', 'ai_credits_used')) {
                $table->dropColumn('ai_credits_used');
            }
        });
    }
};
