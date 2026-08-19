<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class OrthoBilan extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'ortho_bilans';

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'specialist_id',
        'bilan_type', // 'initial', 'reassessment', 'discharge'
        'clinical_input', // ['vocal_articulation' => '...', 'expressive_language' => '...', 'comprehension' => '...', 'stuttering' => '...']
        'ai_generated_report',
        'diagnostic_summary',
        'therapeutic_plan',
        'pdf_path',
        'status', // 'draft', 'finalized', 'exported'
    ];

    protected $casts = [
        'clinical_input' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    public function specialist()
    {
        return $this->belongsTo(User::class, 'specialist_id');
    }
}
