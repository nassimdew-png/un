<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Patient extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'patients';

    protected $fillable = [
        'tenant_id',
        'full_name',
        'birth_date',
        'gender', // 'male', 'female'
        'guardian_name',
        'guardian_relationship',
        'phone',
        'email',
        'address',
        'primary_specialist_id',
        'anamnese_generale', // pregnancy_notes, motor_development, school_grade, hearing_test, medical_history
        'clinical_tags',
        'notes',
    ];

    protected $casts = [
        'anamnese_generale' => 'array',
        'clinical_tags' => 'array',
        'birth_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

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

    public function tabletSessions()
    {
        return $this->hasMany(TabletSession::class, 'patient_id');
    }
}
