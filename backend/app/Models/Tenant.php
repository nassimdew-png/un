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
        'specialty_type', // psychology | orthophony | multidisciplinary
        'subscription',   // status, plan, expires_at
        'settings',       // logo, phone, address
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
