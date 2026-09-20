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
        if (Schema::hasTable('audit_logs')) {
            Schema::table('audit_logs', function (Blueprint $table) {
                if (!Schema::hasColumn('audit_logs', 'tenant_id')) {
                    $table->string('tenant_id', 64)->nullable()->index();
                }
                if (!Schema::hasColumn('audit_logs', 'user_id')) {
                    $table->unsignedBigInteger('user_id')->nullable()->index();
                }
                if (!Schema::hasColumn('audit_logs', 'user_name')) {
                    $table->string('user_name')->nullable();
                }
                if (!Schema::hasColumn('audit_logs', 'user_email')) {
                    $table->string('user_email')->nullable();
                }
                if (!Schema::hasColumn('audit_logs', 'user_role')) {
                    $table->string('user_role', 50)->nullable();
                }
                if (!Schema::hasColumn('audit_logs', 'event_type')) {
                    $table->string('event_type', 100)->nullable()->index();
                }
                if (!Schema::hasColumn('audit_logs', 'severity')) {
                    $table->string('severity', 20)->default('info')->index();
                }
                if (!Schema::hasColumn('audit_logs', 'action_description')) {
                    $table->text('action_description')->nullable();
                }
                if (!Schema::hasColumn('audit_logs', 'target_type')) {
                    $table->string('target_type', 100)->nullable();
                }
                if (!Schema::hasColumn('audit_logs', 'target_id')) {
                    $table->string('target_id', 64)->nullable();
                }
                if (!Schema::hasColumn('audit_logs', 'ip_address')) {
                    $table->string('ip_address', 45)->nullable()->index();
                }
                if (!Schema::hasColumn('audit_logs', 'user_agent')) {
                    $table->text('user_agent')->nullable();
                }
                if (!Schema::hasColumn('audit_logs', 'metadata')) {
                    $table->json('metadata')->nullable();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No down needed for column guarantees
    }
};
