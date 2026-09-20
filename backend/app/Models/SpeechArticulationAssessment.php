<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpeechArticulationAssessment extends Model
{
    use HasFactory;

    protected $table = 'speech_articulation_assessments';

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'specialist_id',
        'appointment_id',
        'assessment_date',
        'bucco_facial_exam',
        'phonetic_inventory',
        'auditory_discrimination',
        'total_consonants_tested',
        'correct_consonants_count',
        'pcc_percentage',
        'severity_level',
        'distorted_sounds',
        'omitted_sounds',
        'substituted_sounds',
        'clinical_summary',
        'therapeutic_goals',
    ];

    protected $casts = [
        'bucco_facial_exam' => 'array',
        'phonetic_inventory' => 'array',
        'auditory_discrimination' => 'array',
        'distorted_sounds' => 'array',
        'omitted_sounds' => 'array',
        'substituted_sounds' => 'array',
        'therapeutic_goals' => 'array',
        'pcc_percentage' => 'float',
        'total_consonants_tested' => 'integer',
        'correct_consonants_count' => 'integer',
        'assessment_date' => 'date',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function specialist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'specialist_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
