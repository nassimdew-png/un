<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PsychomotorAssessment extends Model
{
    use HasFactory;

    protected $table = 'psychomotor_assessments';

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'specialist_id',
        'appointment_id',
        'assessment_date',
        'body_map_data',
        'body_map_stats',
        'balance_battery',
        'lateralization',
        'lateral_profile',
        'visuo_motor',
        'spatial_temporal',
        'clinical_summary',
        'therapeutic_goals',
    ];

    protected $casts = [
        'body_map_data' => 'array',
        'body_map_stats' => 'array',
        'balance_battery' => 'array',
        'lateralization' => 'array',
        'lateral_profile' => 'array',
        'visuo_motor' => 'array',
        'spatial_temporal' => 'array',
        'therapeutic_goals' => 'array',
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
}
