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
        if (!Schema::hasTable('communication_gateways')) {
            Schema::create('communication_gateways', function (Blueprint $table) {
                $table->id();

                // Mail SMTP Configuration
                $table->string('mail_driver')->default('smtp');
                $table->string('mail_host')->nullable()->default('smtp.gmail.com');
                $table->integer('mail_port')->default(587);
                $table->string('mail_username')->nullable();
                $table->text('mail_password')->nullable();
                $table->string('mail_encryption')->nullable()->default('tls');
                $table->string('mail_from_address')->nullable()->default('noreply@psypro.tech');
                $table->string('mail_from_name')->nullable()->default('PsyPro Tech Clinics Suite');
                $table->boolean('is_mail_active')->default(true);

                // SMS Gateways Configuration
                $table->string('sms_provider')->default('custom_http'); // 'twilio', 'infobip', 'custom_http'
                $table->text('sms_api_key')->nullable();
                $table->string('sms_sender_id')->nullable()->default('PsyProDZ');
                $table->string('sms_api_url')->nullable();
                $table->boolean('is_sms_active')->default(false);

                // WhatsApp Gateways Configuration
                $table->string('whatsapp_provider')->default('whatsapp_cloud_api'); // 'whatsapp_cloud_api', 'ultramsg', 'green_api'
                $table->string('whatsapp_instance_id')->nullable();
                $table->text('whatsapp_token')->nullable();
                $table->string('whatsapp_phone_number_id')->nullable();
                $table->string('whatsapp_sender_number')->nullable();
                $table->boolean('is_whatsapp_active')->default(false);

                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('communication_gateways');
    }
};
