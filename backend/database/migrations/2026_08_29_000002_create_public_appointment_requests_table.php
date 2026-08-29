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
        Schema::create('public_appointment_requests', function (Blueprint $table) {
            $table->id();
            $table->string('clinic_id')->index();
            $table->string('patient_full_name');
            $table->integer('patient_age')->nullable();
            $table->string('parent_name')->nullable();
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('service_type');
            $table->date('appointment_date');
            $table->string('start_time');
            $table->string('end_time');
            $table->text('notes')->nullable();
            $table->enum('status', ['pending_confirmation', 'confirmed', 'cancelled'])->default('pending_confirmation');
            $table->string('booking_reference')->unique()->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('public_appointment_requests');
    }
};
