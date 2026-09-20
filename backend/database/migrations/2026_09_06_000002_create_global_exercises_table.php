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
        Schema::create('global_exercises', function (Blueprint $table) {
            $table->id();
            $table->string('exercise_code', 64)->unique();
            $table->string('specialty', 50)->default('orthophony'); // orthophony, psychology, psychomotricite
            $table->string('specialty_label')->nullable();
            $table->string('title_ar');
            $table->string('title_fr')->nullable();
            $table->string('category', 64)->default('articulation');
            $table->string('category_label')->nullable();
            $table->string('target_group')->nullable();
            $table->string('difficulty')->nullable();
            $table->string('estimated_duration')->nullable();
            $table->string('badge')->nullable();
            $table->text('summary')->nullable();
            $table->json('instructions')->nullable();
            $table->json('worksheet_content')->nullable();
            $table->text('homework_tips')->nullable();
            $table->boolean('is_globally_enabled')->default(true);
            $table->string('minimum_plan_required', 50)->default('starter');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('global_exercises');
    }
};
