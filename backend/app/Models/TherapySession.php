<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TherapySession extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'specialist_id',
        'session_date',
        'duration_minutes',
        'specialty',
        'progress_notes',
        'exercises_targeted',
        'attendance_status',
    ];

    protected function casts(): array
    {
        return [
            'session_date' => 'datetime',
            'duration_minutes' => 'integer',
            'exercises_targeted' => 'array',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    public function specialist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'specialist_id');
    }
}
