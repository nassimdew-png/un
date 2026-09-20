<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('therapy_sessions')) {
            // Alter column to varchar(50) for maximum cross-specialty flexibility
            Schema::table('therapy_sessions', function (Blueprint $table) {
                $table->string('specialty', 50)->default('orthophony')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('therapy_sessions')) {
            Schema::table('therapy_sessions', function (Blueprint $table) {
                $table->string('specialty', 50)->default('orthophony')->change();
            });
        }
    }
};
