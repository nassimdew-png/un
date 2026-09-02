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
        if (!Schema::hasTable('clinic_branding_settings')) {
            Schema::create('clinic_branding_settings', function (Blueprint $table) {
                $table->id();
                $table->string('tenant_id')->index();
                $table->text('logo_url')->nullable();
                $table->text('stamp_url')->nullable();
                $table->text('signature_url')->nullable();
                $table->string('primary_color', 20)->default('#2563eb');
                $table->string('secondary_color', 20)->default('#06b6d4');
                $table->string('header_layout', 50)->default('modern_split');
                $table->boolean('show_watermark')->default(true);
                $table->boolean('show_stamp_on_bilans')->default(true);
                $table->string('license_number', 100)->nullable();
                $table->string('official_title_ar', 255)->nullable();
                $table->string('official_title_fr', 255)->nullable();
                $table->string('phone', 50)->nullable();
                $table->text('address')->nullable();
                $table->string('wilaya', 100)->nullable();
                $table->text('footer_text')->nullable();
                $table->timestamps();
            });
        }

        // Also add auxiliary columns on tenants table if not present
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'logo_path')) {
                $table->text('logo_path')->nullable();
            }
            if (!Schema::hasColumn('tenants', 'digital_stamp_path')) {
                $table->text('digital_stamp_path')->nullable();
            }
            if (!Schema::hasColumn('tenants', 'signature_path')) {
                $table->text('signature_path')->nullable();
            }
            if (!Schema::hasColumn('tenants', 'report_accent_color')) {
                $table->string('report_accent_color', 20)->nullable()->default('#2563eb');
            }
            if (!Schema::hasColumn('tenants', 'header_layout')) {
                $table->string('header_layout', 50)->nullable()->default('modern_split');
            }
            if (!Schema::hasColumn('tenants', 'show_watermark')) {
                $table->boolean('show_watermark')->default(true);
            }
            if (!Schema::hasColumn('tenants', 'show_stamp_on_bilans')) {
                $table->boolean('show_stamp_on_bilans')->default(true);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinic_branding_settings');
    }
};
