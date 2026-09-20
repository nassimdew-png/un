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
        if (Schema::hasTable('homework_assignments')) {
            Schema::table('homework_assignments', function (Blueprint $table) {
                if (!Schema::hasColumn('homework_assignments', 'audio_path')) {
                    $table->string('audio_path')->nullable()->after('attachment_path');
                }
                if (!Schema::hasColumn('homework_assignments', 'difficulty_rating')) {
                    $table->string('difficulty_rating')->nullable()->after('is_completed'); // 'easy', 'moderate', 'hard'
                }
                if (!Schema::hasColumn('homework_assignments', 'attention_rating')) {
                    $table->string('attention_rating')->nullable()->after('difficulty_rating'); // 'focused', 'moderate', 'distracted'
                }
                if (!Schema::hasColumn('homework_assignments', 'duration_minutes')) {
                    $table->integer('duration_minutes')->nullable()->default(10)->after('attention_rating');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('homework_assignments')) {
            Schema::table('homework_assignments', function (Blueprint $table) {
                $columnsToDrop = [];
                if (Schema::hasColumn('homework_assignments', 'audio_path')) {
                    $columnsToDrop[] = 'audio_path';
                }
                if (Schema::hasColumn('homework_assignments', 'difficulty_rating')) {
                    $columnsToDrop[] = 'difficulty_rating';
                }
                if (Schema::hasColumn('homework_assignments', 'attention_rating')) {
                    $columnsToDrop[] = 'attention_rating';
                }
                if (Schema::hasColumn('homework_assignments', 'duration_minutes')) {
                    $columnsToDrop[] = 'duration_minutes';
                }
                if (!empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }
    }
};
