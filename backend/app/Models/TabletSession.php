<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class TabletSession extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'tablet_sessions';

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'specialist_id',
        'test_type', // 'BDI-II', 'HAM-A', 'M-CHAT', 'PHQ-9'
        'pin_code',  // 4-digit PIN for Kiosk activation / locking
        'status',    // 'pending', 'in_progress', 'completed', 'cancelled'
        'answers',   // array of integer scores [0, 2, 1, 3, ...]
        'results',   // ['total_score' => 24, 'severity' => 'Moderate Depression', 'calculated_at' => '...']
        'expires_at',
    ];

    protected $casts = [
        'answers' => 'array',
        'results' => 'array',
        'expires_at' => 'datetime',
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
