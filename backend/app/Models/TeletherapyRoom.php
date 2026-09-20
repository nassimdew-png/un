<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeletherapyRoom extends Model
{
    use HasFactory;

    protected $table = 'teletherapy_rooms';

    protected $fillable = [
        'tenant_id',
        'room_code',
        'patient_id',
        'specialist_id',
        'appointment_id',
        'access_token',
        'access_pin',
        'specialty',
        'status',
        'duration_seconds',
        'soap_snapshot',
        'canvas_snapshot',
        'signaling_state',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'soap_snapshot' => 'array',
        'signaling_state' => 'array',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'duration_seconds' => 'integer',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function specialist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'specialist_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }
}
