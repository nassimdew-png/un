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
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'wilaya')) {
                $table->string('wilaya')->nullable()->after('address');
            }
            if (!Schema::hasColumn('tenants', 'wilaya_code')) {
                $table->string('wilaya_code', 10)->nullable()->after('wilaya');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (Schema::hasColumn('tenants', 'wilaya')) {
                $table->dropColumn(['wilaya', 'wilaya_code']);
            }
        });
    }
};
