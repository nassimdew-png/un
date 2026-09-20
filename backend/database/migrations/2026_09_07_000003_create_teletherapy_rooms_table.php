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
        Schema::create('teletherapy_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 64)->nullable()->index();
            $table->string('room_code', 64)->unique();
            $table->unsignedBigInteger('patient_id')->nullable()->index();
            $table->unsignedBigInteger('specialist_id')->nullable()->index();
            $table->unsignedBigInteger('appointment_id')->nullable()->index();
            $table->string('access_token', 64)->nullable()->unique();
            $table->string('access_pin', 16)->nullable();
            $table->string('specialty', 64)->default('orthophony');
            $table->string('status', 32)->default('active'); // active, closed, scheduled
            $table->integer('duration_seconds')->default(0);
            
            // SOAP notes snapshot
            $table->json('soap_snapshot')->nullable();
            
            // Interactive canvas drawings snapshot (DataURL / PNG or SVG paths JSON)
            $table->longText('canvas_snapshot')->nullable();
            
            // Ephemeral signaling & canvas event relay state
            $table->json('signaling_state')->nullable();
            
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            // Foreign key to patients if available
            $table->foreign('patient_id')->references('id')->on('patients')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teletherapy_rooms');
    }
};
