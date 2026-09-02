<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublicBookingRequest extends Model
{
    use HasFactory;

    protected $table = 'public_booking_requests';

    protected $fillable = [
        'clinic_id',
        'patient_name',
        'phone',
        'specialty',
        'preferred_date',
        'preferred_time_slot',
        'reason_for_visit',
        'status',
    ];

    protected $casts = [
        'preferred_date' => 'date',
    ];

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'clinic_id');
    }
}
