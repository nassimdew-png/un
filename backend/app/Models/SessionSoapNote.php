<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionSoapNote extends Model
{
    use HasFactory;

    protected $table = 'session_soap_notes';

    protected $fillable = [
        'clinic_id',
        'patient_id',
        'practitioner_id',
        'appointment_id',
        'session_date',
        'audio_duration_seconds',
        'raw_transcript',
        'subjective',
        'objective',
        'assessment',
        'plan',
    ];

    protected $casts = [
        'session_date' => 'date',
        'audio_duration_seconds' => 'integer',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'clinic_id', 'id');
    }

    public function practitioner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'practitioner_id', 'id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'appointment_id', 'id');
    }
}
