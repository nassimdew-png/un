<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TreatmentPlan extends Model
{
    use HasFactory;

    protected $table = 'treatment_plans';

    protected $fillable = [
        'clinic_id',
        'patient_id',
        'bilan_id',
        'specialty',
        'title',
        'short_term_goals',
        'medium_term_goals',
        'long_term_vision',
        'linked_exercise_ids',
        'smart_goals_matrix',
        'diagnostic_record_id',
        'status',
        'review_date',
    ];

    protected $casts = [
        'short_term_goals' => 'array',
        'medium_term_goals' => 'array',
        'linked_exercise_ids' => 'array',
        'smart_goals_matrix' => 'array',
        'review_date' => 'date',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'clinic_id', 'id');
    }

    public function bilan(): BelongsTo
    {
        return $this->belongsTo(PatientBilan::class, 'bilan_id', 'id');
    }

    public function diagnosticRecord(): BelongsTo
    {
        return $this->belongsTo(ClinicalDiagnosticRecord::class, 'diagnostic_record_id', 'id');
    }
}
