<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientBilan extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'user_id',
        'specialist_id',
        'title',
        'bilan_type',
        'language',
        'audience',
        'clinical_summary',
        'psychometric_analysis',
        'strengths_weaknesses',
        'diagnosis_codes',
        'therapeutic_project',
        'included_sections',
        'anamnesis_snapshot',
        'genogram_snapshot',
        'sensory_map_snapshot',
        'assessments_snapshot',
        'pdf_path',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'included_sections' => 'array',
            'anamnesis_snapshot' => 'array',
            'genogram_snapshot' => 'array',
            'sensory_map_snapshot' => 'array',
            'assessments_snapshot' => 'array',
        ];
    }

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
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
