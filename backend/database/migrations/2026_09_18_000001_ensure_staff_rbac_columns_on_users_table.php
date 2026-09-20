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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'permissions')) {
                $table->json('permissions')->nullable()->after('password');
            }
            if (!Schema::hasColumn('users', 'admin_permissions')) {
                $table->json('admin_permissions')->nullable()->after('permissions');
            }
            if (!Schema::hasColumn('users', 'specialty')) {
                $table->string('specialty')->nullable()->after('role');
            }
            if (!Schema::hasColumn('users', 'room_number')) {
                $table->string('room_number')->nullable()->after('specialty');
            }
            if (!Schema::hasColumn('users', 'commission_percentage')) {
                $table->decimal('commission_percentage', 5, 2)->nullable()->default(0.00)->after('room_number');
            }
            if (!Schema::hasColumn('users', 'is_super_admin')) {
                $table->boolean('is_super_admin')->default(false)->after('role');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'commission_percentage')) {
                $table->dropColumn('commission_percentage');
            }
            if (Schema::hasColumn('users', 'room_number')) {
                $table->dropColumn('room_number');
            }
        });
    }
};
