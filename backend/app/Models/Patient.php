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
        'phone_operator',
        'email',
        'address',
        'wilaya_code',
        'commune_name',
        'national_id',
        'emergency_contact',
        'kiosk_pin',
        'portal_access_token',
        'portal_pin',
        'portal_enabled',
        'pre_intake_token',
        'pre_intake_status',
        'pre_intake_data',
        'pre_intake_submitted_at',
        'anamnesis_data',
        'family_genogram',
        'sensory_profile',
        'sensory_body_map',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'portal_enabled' => 'boolean',
            'pre_intake_submitted_at' => 'datetime',
            'pre_intake_data' => 'array',
            'anamnesis_data' => 'array',
            'family_genogram' => 'array',
            'sensory_profile' => 'array',
            'sensory_body_map' => 'array',
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

    public function recallLogs(): HasMany
    {
        return $this->hasMany(PatientRecallLog::class, 'patient_id')->orderBy('created_at', 'desc');
    }
}
