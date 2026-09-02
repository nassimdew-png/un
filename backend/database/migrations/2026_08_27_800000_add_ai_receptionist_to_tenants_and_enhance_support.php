<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'ai_receptionist_enabled')) {
                $table->boolean('ai_receptionist_enabled')->default(true)->after('has_ai_access');
            }
            if (!Schema::hasColumn('tenants', 'ai_receptionist_greeting')) {
                $table->text('ai_receptionist_greeting')->nullable()->after('ai_receptionist_enabled');
            }
            if (!Schema::hasColumn('tenants', 'ai_receptionist_instructions')) {
                $table->text('ai_receptionist_instructions')->nullable()->after('ai_receptionist_greeting');
            }
        });

        Schema::table('support_conversations', function (Blueprint $table) {
            if (!Schema::hasColumn('support_conversations', 'clinic_id')) {
                $table->unsignedBigInteger('clinic_id')->nullable()->index()->after('id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['ai_receptionist_enabled', 'ai_receptionist_greeting', 'ai_receptionist_instructions']);
        });

        Schema::table('support_conversations', function (Blueprint $table) {
            $table->dropColumn(['clinic_id']);
        });
    }
};
