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
        if (!Schema::hasTable('treatment_plans')) {
            Schema::create('treatment_plans', function (Blueprint $table) {
                $table->id();
                $table->foreignUuid('clinic_id')->nullable()->index();
                $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
                $table->unsignedBigInteger('bilan_id')->nullable()->index();
                $table->string('specialty', 50)->default('orthophonie');
                $table->string('title');
                $table->json('short_term_goals')->nullable();
                $table->json('medium_term_goals')->nullable();
                $table->text('long_term_vision')->nullable();
                $table->string('status', 30)->default('active');
                $table->date('review_date')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('treatment_plans');
    }
};
