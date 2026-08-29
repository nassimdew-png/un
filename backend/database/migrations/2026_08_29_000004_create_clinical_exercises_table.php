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
        Schema::create('clinical_exercises', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category'); // 'articulation', 'workbook', 'psychology', 'cognitive', 'autism', 'stuttering'
            $table->string('specialty'); // 'orthophonie', 'psychology', 'multidisciplinary'
            $table->string('target_age'); // '3-6', '7-12', 'teens', 'adults', 'all'
            $table->string('difficulty'); // 'easy', 'medium', 'advanced'
            $table->integer('pages_count')->default(1);
            $table->integer('duration_minutes')->default(15);
            $table->text('description');
            $table->json('clinical_goals')->nullable();
            $table->text('instructions')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->json('preview_images')->nullable();
            $table->string('pdf_url')->nullable();
            $table->json('interactive_steps')->nullable();
            $table->integer('assigned_count')->default(0);
            $table->float('rating', 3, 2)->default(4.9);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinical_exercises');
    }
};
