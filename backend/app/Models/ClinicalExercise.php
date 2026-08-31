<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClinicalExercise extends Model
{
    protected $table = 'clinical_exercises';

    protected $fillable = [
        'title',
        'category',           // 'articulation', 'workbook', 'psychology', 'cognitive', 'autism', 'stuttering'
        'specialty',          // 'orthophonie', 'psychology', 'multidisciplinary'
        'disorder_type',
        'target_age',         // '3-6', '7-12', 'teens', 'adults', 'all'
        'difficulty',         // 'easy', 'medium', 'advanced'
        'pages_count',
        'duration_minutes',
        'sound_letter',
        'sound_positions',
        'description',
        'clinical_goals',
        'instructions',
        'thumbnail_url',
        'preview_images',
        'pdf_url',
        'interactive_steps',
        'assigned_count',
        'rating',
        'is_featured',
    ];

    protected $casts = [
        'clinical_goals'    => 'array',
        'preview_images'    => 'array',
        'interactive_steps' => 'array',
        'sound_positions'   => 'array',
        'pages_count'       => 'integer',
        'duration_minutes'  => 'integer',
        'assigned_count'    => 'integer',
        'rating'            => 'float',
        'is_featured'       => 'boolean',
    ];

    public function assignments()
    {
        return $this->hasMany(PatientAssignedExercise::class, 'exercise_id');
    }
}
