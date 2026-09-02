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
        // 1. Add directory & booking columns to tenants table
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'is_listed_in_directory')) {
                $table->boolean('is_listed_in_directory')->default(true)->after('status');
            }
            if (!Schema::hasColumn('tenants', 'public_bio')) {
                $table->text('public_bio')->nullable()->after('is_listed_in_directory');
            }
            if (!Schema::hasColumn('tenants', 'commune')) {
                $table->string('commune')->nullable()->after('public_bio');
            }
            if (!Schema::hasColumn('tenants', 'accepts_public_bookings')) {
                $table->boolean('accepts_public_bookings')->default(true)->after('commune');
            }
            if (!Schema::hasColumn('tenants', 'consultation_fee_dzd')) {
                $table->integer('consultation_fee_dzd')->nullable()->default(2000)->after('accepts_public_bookings');
            }
        });

        // 2. Create public_booking_requests table
        if (!Schema::hasTable('public_booking_requests')) {
            Schema::create('public_booking_requests', function (Blueprint $table) {
                $table->id();
                $table->uuid('clinic_id')->index();
                $table->string('patient_name');
                $table->string('phone');
                $table->string('specialty')->default('orthophonie'); // orthophonie, psychologie, neuro_psychiatrie, pluridisciplinaire
                $table->date('preferred_date');
                $table->string('preferred_time_slot')->default('09:00 - 10:00');
                $table->text('reason_for_visit')->nullable();
                $table->string('status')->default('pending'); // pending, approved, rejected, converted
                $table->timestamps();
            });
        }

        // 3. Create academic_verifications table
        if (!Schema::hasTable('academic_verifications')) {
            Schema::create('academic_verifications', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('student_name')->nullable();
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->string('university_name');
                $table->string('faculty');
                $table->string('degree_level')->default('master_m2'); // licence_l3, master_m1, master_m2, intern_resident
                $table->string('student_card_doc_path')->nullable();
                $table->string('status')->default('pending'); // pending, verified, rejected
                $table->string('discount_code')->nullable();
                $table->uuid('sandbox_tenant_id')->nullable();
                $table->date('expires_at')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (Schema::hasColumn('tenants', 'is_listed_in_directory')) {
                $table->dropColumn([
                    'is_listed_in_directory',
                    'public_bio',
                    'commune',
                    'accepts_public_bookings',
                    'consultation_fee_dzd',
                ]);
            }
        });

        Schema::dropIfExists('public_booking_requests');
        Schema::dropIfExists('academic_verifications');
    }
};
