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
        // 1. Add portal columns to patients table
        Schema::table('patients', function (Blueprint $table) {
            if (!Schema::hasColumn('patients', 'portal_access_token')) {
                $table->string('portal_access_token', 64)->nullable()->unique()->index()->after('id');
            }
            if (!Schema::hasColumn('patients', 'portal_pin')) {
                $table->string('portal_pin', 10)->nullable()->default('1234')->after('portal_access_token');
            }
            if (!Schema::hasColumn('patients', 'portal_enabled')) {
                $table->boolean('portal_enabled')->default(true)->after('portal_pin');
            }
        });

        // 2. Add confirmation columns to appointments table
        Schema::table('appointments', function (Blueprint $table) {
            if (!Schema::hasColumn('appointments', 'confirmed_by_patient')) {
                $table->boolean('confirmed_by_patient')->default(false)->after('status');
            }
            if (!Schema::hasColumn('appointments', 'patient_confirmed_at')) {
                $table->dateTime('patient_confirmed_at')->nullable()->after('confirmed_by_patient');
            }
        });

        // 3. Create homework_assignments table
        if (!Schema::hasTable('homework_assignments')) {
            Schema::create('homework_assignments', function (Blueprint $table) {
                $table->id();
                $table->uuid('clinic_id')->nullable()->index();
                $table->uuid('patient_id')->index();
                $table->unsignedBigInteger('specialist_id')->nullable();
                $table->string('exercise_title');
                $table->text('instructions')->nullable();
                $table->string('category')->default('articulation'); // articulation, langage_expressif, memoire, attention, motricite
                $table->string('attachment_path')->nullable();
                $table->date('due_date')->nullable();
                $table->boolean('is_completed')->default(false);
                $table->text('parent_feedback')->nullable();
                $table->dateTime('completed_at')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            if (Schema::hasColumn('patients', 'portal_access_token')) {
                $table->dropColumn(['portal_access_token', 'portal_pin', 'portal_enabled']);
            }
        });

        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'confirmed_by_patient')) {
                $table->dropColumn(['confirmed_by_patient', 'patient_confirmed_at']);
            }
        });

        Schema::dropIfExists('homework_assignments');
    }
};
