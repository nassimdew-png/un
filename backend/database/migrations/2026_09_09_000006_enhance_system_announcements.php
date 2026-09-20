<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('system_announcements')) {
            Schema::table('system_announcements', function (Blueprint $table) {
                if (!Schema::hasColumn('system_announcements', 'display_mode')) {
                    $table->string('display_mode', 30)->default('banner')->after('type'); // banner, modal, toast, maintenance
                }
                if (!Schema::hasColumn('system_announcements', 'target_specialty')) {
                    $table->string('target_specialty', 50)->default('all')->after('target_tier'); // all, orthophony, psychology, psychomotricite
                }
                if (!Schema::hasColumn('system_announcements', 'priority')) {
                    $table->string('priority', 20)->default('normal')->after('target_specialty'); // normal, high, urgent
                }
                if (!Schema::hasColumn('system_announcements', 'action_label')) {
                    $table->string('action_label', 100)->nullable()->after('priority');
                }
                if (!Schema::hasColumn('system_announcements', 'action_url')) {
                    $table->string('action_url', 500)->nullable()->after('action_label');
                }
                if (!Schema::hasColumn('system_announcements', 'dismissible')) {
                    $table->boolean('dismissible')->default(true)->after('action_url');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('system_announcements')) {
            Schema::table('system_announcements', function (Blueprint $table) {
                $cols = ['display_mode', 'target_specialty', 'priority', 'action_label', 'action_url', 'dismissible'];
                foreach ($cols as $col) {
                    if (Schema::hasColumn('system_announcements', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
