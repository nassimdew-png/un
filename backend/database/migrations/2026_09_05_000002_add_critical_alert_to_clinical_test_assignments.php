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
        if (Schema::hasTable('clinical_test_assignments')) {
            Schema::table('clinical_test_assignments', function (Blueprint $table) {
                if (!Schema::hasColumn('clinical_test_assignments', 'has_critical_alert')) {
                    $table->boolean('has_critical_alert')->default(false)->after('diagnostic_notes')->index();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('clinical_test_assignments')) {
            Schema::table('clinical_test_assignments', function (Blueprint $table) {
                if (Schema::hasColumn('clinical_test_assignments', 'has_critical_alert')) {
                    $table->dropColumn('has_critical_alert');
                }
            });
        }
    }
};
