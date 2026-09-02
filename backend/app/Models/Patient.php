<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'first_name',
        'last_name',
        'birth_date',
        'gender',
        'guardian_name',
        'phone',
        'emergency_contact',
        'kiosk_pin',
        'anamnesis_data',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'anamnesis_data' => 'array',
        ];
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(ClinicalAssessment::class, 'patient_id');
    }

    public function therapySessions(): HasMany
    {
        return $this->hasMany(TherapySession::class, 'patient_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'patient_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(PatientAttachment::class, 'patient_id');
    }

    public function aiRecords(): HasMany
    {
        return $this->hasMany(PatientAiRecord::class, 'patient_id')->orderBy('created_at', 'desc');
    }
}
