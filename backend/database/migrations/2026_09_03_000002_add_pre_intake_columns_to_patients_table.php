<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            if (!Schema::hasColumn('patients', 'pre_intake_token')) {
                $table->string('pre_intake_token', 64)->nullable()->unique()->after('portal_access_token');
            }
            if (!Schema::hasColumn('patients', 'pre_intake_status')) {
                $table->string('pre_intake_status', 30)->default('not_sent')->after('pre_intake_token'); // not_sent, pending_parent, submitted, reviewed
            }
            if (!Schema::hasColumn('patients', 'pre_intake_data')) {
                $table->json('pre_intake_data')->nullable()->after('pre_intake_status');
            }
            if (!Schema::hasColumn('patients', 'pre_intake_submitted_at')) {
                $table->timestamp('pre_intake_submitted_at')->nullable()->after('pre_intake_data');
            }
            if (!Schema::hasColumn('patients', 'sensory_body_map')) {
                $table->json('sensory_body_map')->nullable()->after('sensory_profile');
            }
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn([
                'pre_intake_token',
                'pre_intake_status',
                'pre_intake_data',
                'pre_intake_submitted_at',
                'sensory_body_map',
            ]);
        });
    }
};
