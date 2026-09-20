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
        // 1. Audit Logs Master Table
        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->string('tenant_id', 64)->nullable()->index();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('user_name')->nullable();
                $table->string('user_email')->nullable();
                $table->string('user_role', 50)->nullable();
                $table->string('event_type', 100)->index();
                $table->string('severity', 20)->default('info')->index(); // info, warning, critical, emergency
                $table->text('action_description');
                $table->string('target_type', 100)->nullable();
                $table->string('target_id', 64)->nullable();
                $table->string('ip_address', 45)->nullable()->index();
                $table->text('user_agent')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index(['created_at', 'severity']);
                $table->index(['tenant_id', 'created_at']);
            });
        }

        // 2. Security Blocked IPs & Firewall Rules
        if (!Schema::hasTable('blocked_ips')) {
            Schema::create('blocked_ips', function (Blueprint $table) {
                $table->id();
                $table->string('ip_address', 45)->unique()->index();
                $table->string('reason')->nullable();
                $table->unsignedBigInteger('blocked_by_user_id')->nullable();
                $table->string('blocked_by_name')->nullable();
                $table->integer('attempts_count')->default(1);
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blocked_ips');
        Schema::dropIfExists('audit_logs');
    }
};
