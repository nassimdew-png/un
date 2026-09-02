<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('knowledge_base_articles', function (Blueprint $table) {
            $table->string('clinic_id', 100)->nullable()->change();
        });

        Schema::table('support_conversations', function (Blueprint $table) {
            $table->string('clinic_id', 100)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('knowledge_base_articles', function (Blueprint $table) {
            $table->unsignedBigInteger('clinic_id')->nullable()->change();
        });

        Schema::table('support_conversations', function (Blueprint $table) {
            $table->unsignedBigInteger('clinic_id')->nullable()->change();
        });
    }
};
