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
        if (!Schema::hasTable('clinic_custom_domains')) {
            Schema::create('clinic_custom_domains', function (Blueprint $table) {
                $table->id();
                $table->string('clinic_id'); // Match char(36) UUID from tenants table
                $table->string('domain')->unique();
                $table->enum('status', ['pending_dns', 'dns_verified', 'ssl_active', 'failed'])->default('pending_dns');
                $table->string('server_ip')->default('145.223.116.54');
                $table->string('dns_detected_ip')->nullable();
                $table->timestamp('ssl_issued_at')->nullable();
                $table->timestamp('ssl_expires_at')->nullable();
                $table->text('error_message')->nullable();
                $table->boolean('is_primary')->default(true);
                $table->timestamps();

                $table->foreign('clinic_id')->references('id')->on('tenants')->onDelete('cascade');
                $table->index(['clinic_id', 'status']);
                $table->index('domain');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinic_custom_domains');
    }
};
