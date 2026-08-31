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
        'full_name',
        'birth_date',
        'gender', // 'male', 'female'
        'guardian_name',
        'guardian_relationship',
        'phone',
        'phone_operator',
        'email',
        'address',
        'wilaya_code',
        'commune_name',
        'national_id',
        'emergency_contact',
        'primary_specialist_id',
        'anamnese_generale',
        'anamnesis_data',
        'clinical_tags',
        'notes',
        'diagnosis',
        'portal_access_token',
        'portal_pin',
        'portal_enabled',
    ];

    protected $casts = [
        'anamnese_generale' => 'array',
        'anamnesis_data'    => 'array',
        'clinical_tags'     => 'array',
        'birth_date'        => 'date',
        'portal_enabled'    => 'boolean',
    ];

    protected $appends = ['name', 'full_name'];

    public function getNameAttribute()
    {
        return trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? '')) ?: ($this->attributes['full_name'] ?? 'مريض');
    }

    public function getFullNameAttribute()
    {
        return $this->getNameAttribute();
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
