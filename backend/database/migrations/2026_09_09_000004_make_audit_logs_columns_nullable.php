<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('audit_logs')) {
            try {
                // Drop foreign key if needed to alter column, or modify directly
                // In MySQL, modifying column to NULL with existing FK is supported
                DB::statement("ALTER TABLE `audit_logs` MODIFY COLUMN `tenant_id` CHAR(36) NULL;");
            } catch (\Throwable $e) {
                // Ignore if already nullable
            }

            try {
                DB::statement("ALTER TABLE `audit_logs` MODIFY COLUMN `action` VARCHAR(100) NULL;");
            } catch (\Throwable $e) {
            }

            try {
                DB::statement("ALTER TABLE `audit_logs` MODIFY COLUMN `auditable_type` VARCHAR(255) NULL;");
            } catch (\Throwable $e) {
            }
        }
    }

    public function down(): void
    {
        // Keep non-destructive
    }
};
