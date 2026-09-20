<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GlobalExercise extends Model
{
    protected $fillable = [
        'exercise_code',
        'specialty',
        'specialty_label',
        'title_ar',
        'title_fr',
        'category',
        'category_label',
        'target_group',
        'difficulty',
        'estimated_duration',
        'badge',
        'summary',
        'instructions',
        'worksheet_content',
        'homework_tips',
        'is_globally_enabled',
        'minimum_plan_required',
    ];

    protected $casts = [
        'instructions' => 'array',
        'worksheet_content' => 'array',
        'is_globally_enabled' => 'boolean',
    ];
}
