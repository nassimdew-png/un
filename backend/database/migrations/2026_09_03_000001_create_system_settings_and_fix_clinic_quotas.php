<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('system_settings')) {
            Schema::create('system_settings', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->longText('value')->nullable();
                $table->string('group', 50)->default('general');
                $table->boolean('is_encrypted')->default(false);
                $table->timestamps();
            });
        }

        if (Schema::hasTable('clinic_ai_quotas')) {
            Schema::table('clinic_ai_quotas', function (Blueprint $table) {
                $table->string('clinic_id', 255)->change();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
