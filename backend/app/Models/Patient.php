<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $table = 'patients';

    protected $fillable = [
        'tenant_id',
        'first_name',
        'last_name',
        'birth_date',
        'gender', // 'male', 'female'
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
        'anamnesis_data',
        'family_genogram',
        'sensory_profile',
        'portal_access_token',
        'portal_pin',
        'portal_enabled',
    ];

    protected $casts = [
        'anamnesis_data'    => 'array',
        'family_genogram'   => 'array',
        'sensory_profile'   => 'array',
        'birth_date'        => 'date',
        'portal_enabled'    => 'boolean',
    ];

    protected $appends = ['name', 'full_name', 'notes', 'diagnosis'];

    public function getNameAttribute()
    {
        return trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? '')) ?: 'مريض';
    }

    public function getFullNameAttribute()
    {
        return $this->getNameAttribute();
    }

    public function getNotesAttribute()
    {
        return $this->anamnesis_data['notes'] ?? null;
    }

    public function getDiagnosisAttribute()
    {
        return $this->anamnesis_data['diagnosis'] ?? null;
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }

    public function bilans()
    {
        return $this->hasMany(OrthoBilan::class, 'patient_id');
    }

    public function assignedExercises()
    {
        return $this->hasMany(PatientAssignedExercise::class, 'patient_id');
    }
}
