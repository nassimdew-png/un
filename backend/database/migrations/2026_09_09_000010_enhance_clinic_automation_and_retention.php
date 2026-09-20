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
        // 1. Enhance tenants table with automation & TV display settings
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'whatsapp_phone')) {
                $table->string('whatsapp_phone', 30)->nullable()->after('phone');
            }
            if (!Schema::hasColumn('tenants', 'whatsapp_auto_reply_enabled')) {
                $table->boolean('whatsapp_auto_reply_enabled')->default(true)->after('whatsapp_phone');
            }
            if (!Schema::hasColumn('tenants', 'retention_threshold_days')) {
                $table->integer('retention_threshold_days')->default(21)->after('whatsapp_auto_reply_enabled');
            }
            if (!Schema::hasColumn('tenants', 'tv_display_ticker_text')) {
                $table->text('tv_display_ticker_text')->nullable()->after('retention_threshold_days');
            }
            if (!Schema::hasColumn('tenants', 'tv_audio_chime_enabled')) {
                $table->boolean('tv_audio_chime_enabled')->default(true)->after('tv_display_ticker_text');
            }
        });

        // 2. Enhance appointments table with TV calling tracking
        Schema::table('appointments', function (Blueprint $table) {
            if (!Schema::hasColumn('appointments', 'called_at')) {
                $table->timestamp('called_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('appointments', 'call_counter')) {
                $table->integer('call_counter')->default(0)->after('called_at');
            }
        });

        // 3. Create patient_recall_logs table for retention tracking
        if (!Schema::hasTable('patient_recall_logs')) {
            Schema::create('patient_recall_logs', function (Blueprint $table) {
                $table->id();
                $table->string('clinic_id', 36)->index();
                $table->unsignedBigInteger('patient_id')->index();
                $table->date('last_attended_date')->nullable();
                $table->integer('days_absent')->default(0);
                $table->string('recall_template', 50)->default('gentle_checkin');
                $table->timestamp('recalled_at')->nullable();
                $table->enum('status', ['sent', 'scheduled', 'declined'])->default('sent');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe reversible migration
    }
};
