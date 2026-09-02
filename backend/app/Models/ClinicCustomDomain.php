<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClinicCustomDomain extends Model
{
    use HasFactory;

    protected $table = 'clinic_custom_domains';

    protected $fillable = [
        'clinic_id',
        'domain',
        'status',
        'server_ip',
        'dns_detected_ip',
        'ssl_issued_at',
        'ssl_expires_at',
        'error_message',
        'is_primary',
    ];

    protected $casts = [
        'ssl_issued_at' => 'datetime',
        'ssl_expires_at' => 'datetime',
        'is_primary' => 'boolean',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'clinic_id');
    }

    public function clinic()
    {
        return $this->belongsTo(Tenant::class, 'clinic_id');
    }
}
