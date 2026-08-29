<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class PublicAppointmentRequest extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'public_appointment_requests';

    protected $fillable = [
        'clinic_id',
        'patient_full_name',
        'patient_age',
        'parent_name',
        'phone',
        'email',
        'service_type',
        'appointment_date',
        'start_time',
        'end_time',
        'notes',
        'status', // 'pending_confirmation', 'confirmed', 'cancelled'
        'booking_reference',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'patient_age'      => 'integer',
    ];

    public function clinic()
    {
        return $this->belongsTo(Tenant::class, 'clinic_id', '_id');
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'clinic_id', '_id');
    }
}
