<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClinicalDiagnosticRecord extends Model
{
    use HasFactory;

    protected $table = 'clinical_diagnostic_records';

    protected $fillable = [
        'clinic_id',
        'patient_id',
        'specialist_id',
        'session_id',
        'appointment_id',
        'specialty',
        'primary_diagnosis_code',
        'primary_diagnosis_title',
        'dsm5_code',
        'icd11_code',
        'confidence_score',
        'matched_criteria',
        'unmatched_criteria',
        'differential_diagnoses',
        'clinical_red_alerts',
        'recommended_referrals',
        'practitioner_confirmed',
        'practitioner_notes',
        'context_payload',
    ];

    protected $casts = [
        'confidence_score' => 'integer',
        'matched_criteria' => 'array',
        'unmatched_criteria' => 'array',
        'differential_diagnoses' => 'array',
        'clinical_red_alerts' => 'array',
        'recommended_referrals' => 'array',
        'practitioner_confirmed' => 'boolean',
        'context_payload' => 'array',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    public function specialist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'specialist_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'clinic_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }
}
