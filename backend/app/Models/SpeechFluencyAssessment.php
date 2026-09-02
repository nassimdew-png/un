<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SpeechFluencyAssessment extends Model
{
    use HasFactory;

    protected $table = 'speech_fluency_assessments';

    protected $fillable = [
        'clinic_id',
        'tenant_id',
        'patient_id',
        'user_id',
        'audio_path',
        'duration_seconds',
        'total_words',
        'total_syllables',
        'stuttered_syllables_percentage',
        'repetition_count',
        'prolongation_count',
        'block_count',
        'avg_block_duration_sec',
        'speech_rate_wpm',
        'severity_level',
        'speech_task',
        'language',
        'detailed_disfluencies_json',
        'clinical_recommendations',
    ];

    protected $casts = [
        'patient_id' => 'integer',
        'user_id' => 'integer',
        'duration_seconds' => 'float',
        'total_words' => 'integer',
        'total_syllables' => 'integer',
        'stuttered_syllables_percentage' => 'float',
        'repetition_count' => 'integer',
        'prolongation_count' => 'integer',
        'block_count' => 'integer',
        'avg_block_duration_sec' => 'float',
        'speech_rate_wpm' => 'float',
        'detailed_disfluencies_json' => 'array',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
