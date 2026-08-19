<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Appointment extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'appointments';

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'specialist_id',
        'appointment_date',
        'start_time',
        'end_time',
        'status', // 'scheduled', 'completed', 'cancelled', 'no_show'
        'session_type', // 'orthophonie_bilan', 'orthophonie_session', 'psy_consultation', 'tablet_test'
        'fee',
        'is_paid',
        'notes',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'is_paid' => 'boolean',
        'fee' => 'float',
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
