<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientRecallLog extends Model
{
    protected $fillable = [
        'clinic_id',
        'patient_id',
        'last_attended_date',
        'days_absent',
        'recall_template',
        'recalled_at',
        'status',
        'notes',
    ];

    protected $casts = [
        'last_attended_date' => 'date',
        'recalled_at' => 'datetime',
        'days_absent' => 'integer',
    ];

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'clinic_id');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }
}
