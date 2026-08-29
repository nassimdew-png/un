<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class ClinicCustomDomain extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'clinic_custom_domains';

    protected $fillable = [
        'clinic_id',
        'domain',
        'status',          // 'pending_dns' | 'dns_verified' | 'ssl_active' | 'failed'
        'server_ip',
        'dns_detected_ip',
        'ssl_issued_at',
        'ssl_expires_at',
        'error_message',
        'is_primary',
    ];

    protected $casts = [
        'is_primary'     => 'boolean',
        'ssl_issued_at'  => 'datetime',
        'ssl_expires_at' => 'datetime',
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
