<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Tenant extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'tenants';

    protected $fillable = [
        'name',
        'subdomain',
        'specialty_type', // 'orthophonie', 'psychology', 'multidisciplinary'
        'subscription',   // ['status' => 'active', 'plan' => 'annual_standard', 'expires_at' => '...']
        'settings',       // ['logo_url' => '...', 'phone' => '...', 'address' => '...', 'currency' => 'DZD']
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'subscription' => 'array',
        'settings' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'tenant_id');
    }

    public function patients()
    {
        return $this->hasMany(Patient::class, 'tenant_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'tenant_id');
    }

    public function bilans()
    {
        return $this->hasMany(OrthoBilan::class, 'tenant_id');
    }

    public function tabletSessions()
    {
        return $this->hasMany(TabletSession::class, 'tenant_id');
    }
}
