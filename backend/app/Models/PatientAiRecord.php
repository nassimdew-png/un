<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PatientAiRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'clinic_id',
        'tenant_id',
        'patient_id',
        'user_id',
        'tool_type',
        'title',
        'summary',
        'payload',
        'notes',
        'is_shared_with_portal',
    ];

    protected $casts = [
        'payload' => 'array',
        'is_shared_with_portal' => 'boolean',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
