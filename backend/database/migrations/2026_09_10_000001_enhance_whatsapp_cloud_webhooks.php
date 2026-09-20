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
        // 1. Enhance communication_gateways with Meta WhatsApp Webhook & Security fields
        if (Schema::hasTable('communication_gateways')) {
            Schema::table('communication_gateways', function (Blueprint $table) {
                if (!Schema::hasColumn('communication_gateways', 'whatsapp_webhook_verify_token')) {
                    $table->string('whatsapp_webhook_verify_token')->nullable()->default('psypro_wa_webhook_verify_secret_2026')->after('whatsapp_sender_number');
                }
                if (!Schema::hasColumn('communication_gateways', 'whatsapp_app_secret')) {
                    $table->text('whatsapp_app_secret')->nullable()->after('whatsapp_webhook_verify_token');
                }
                if (!Schema::hasColumn('communication_gateways', 'whatsapp_business_account_id')) {
                    $table->string('whatsapp_business_account_id')->nullable()->after('whatsapp_app_secret');
                }
                if (!Schema::hasColumn('communication_gateways', 'whatsapp_webhook_url')) {
                    $table->string('whatsapp_webhook_url')->nullable()->default('https://psypro.tech/api/whatsapp/webhook')->after('whatsapp_business_account_id');
                }
            });
        }

        // 2. Create whatsapp_webhook_logs table for tracking incoming messages, status updates, and auto-replies
        if (!Schema::hasTable('whatsapp_webhook_logs')) {
            Schema::create('whatsapp_webhook_logs', function (Blueprint $table) {
                $table->id();
                $table->string('tenant_id', 50)->nullable()->index();
                $table->string('event_type', 40)->default('incoming_message'); // incoming_message, status_update, verification, error
                $table->string('message_id')->nullable()->index();
                $table->string('sender_phone', 40)->nullable()->index();
                $table->string('sender_name')->nullable();
                $table->string('message_type', 30)->nullable()->default('text'); // text, interactive, button, audio, image, location
                $table->text('message_body')->nullable();
                $table->string('status', 30)->nullable()->default('received'); // received, replied, delivered, read, failed
                $table->unsignedBigInteger('patient_id')->nullable()->index();
                $table->text('auto_reply_sent')->nullable();
                $table->json('raw_payload')->nullable();
                $table->string('ip_address', 60)->nullable();
                $table->boolean('signature_valid')->default(true);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_webhook_logs');

        if (Schema::hasTable('communication_gateways')) {
            Schema::table('communication_gateways', function (Blueprint $table) {
                $columns = [
                    'whatsapp_webhook_verify_token',
                    'whatsapp_app_secret',
                    'whatsapp_business_account_id',
                    'whatsapp_webhook_url',
                ];
                foreach ($columns as $column) {
                    if (Schema::hasColumn('communication_gateways', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
