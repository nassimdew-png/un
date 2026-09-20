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
        Schema::table('academic_verifications', function (Blueprint $table) {
            if (!Schema::hasColumn('academic_verifications', 'specialty')) {
                $table->string('specialty')->nullable()->after('degree_level');
            }
            if (!Schema::hasColumn('academic_verifications', 'academic_year')) {
                $table->string('academic_year')->nullable()->after('specialty');
            }
            if (!Schema::hasColumn('academic_verifications', 'clinic_name')) {
                $table->string('clinic_name')->nullable()->after('academic_year');
            }
            if (!Schema::hasColumn('academic_verifications', 'admin_notes')) {
                $table->text('admin_notes')->nullable()->after('status');
            }
            if (!Schema::hasColumn('academic_verifications', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('expires_at');
            }
            if (!Schema::hasColumn('academic_verifications', 'approved_by')) {
                $table->unsignedBigInteger('approved_by')->nullable()->after('approved_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academic_verifications', function (Blueprint $table) {
            $cols = ['specialty', 'academic_year', 'clinic_name', 'admin_notes', 'approved_at', 'approved_by'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('academic_verifications', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
