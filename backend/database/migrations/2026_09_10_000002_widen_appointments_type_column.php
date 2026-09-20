<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('appointments')) {
            DB::statement("ALTER TABLE `appointments` MODIFY COLUMN `type` VARCHAR(50) NOT NULL DEFAULT 'follow_up';");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('appointments')) {
            DB::statement("ALTER TABLE `appointments` MODIFY COLUMN `type` ENUM('initial_consultation', 'follow_up', 'assessment', 'therapy_session') NOT NULL DEFAULT 'follow_up';");
        }
    }
};
