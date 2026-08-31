<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Tenant extends Model
{
    protected $table = 'tenants';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'subdomain',
        'slug',
        'type',
        'specialty_type', // psychology | orthophony | multidisciplinary
        'subscription',   // status, plan, expires_at
        'status',
        'subscription_status',
        'subscription_plan_id',
        'subscription_ends_at',
        'settings',       // logo, phone, address
        'bio',
        'doctor_name',
        'doctor_title',
        'address_details',
        'google_maps_url',
        'booking_enabled',
        'slot_duration_minutes',
        'working_hours_json',
        'services_json',
        'primary_color',
    ];

    protected $casts = [
        'subscription'          => 'array',
        'settings'              => 'array',
        'booking_enabled'       => 'boolean',
        'slot_duration_minutes' => 'integer',
        'working_hours_json'    => 'array',
        'services_json'         => 'array',
        'subscription_ends_at'  => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function users()
    {
        return $this->hasMany(User::class, 'tenant_id');
    }

    public function customDomains()
    {
        return $this->hasMany(ClinicCustomDomain::class, 'clinic_id');
    }

    public function publicAppointmentRequests()
    {
        return $this->hasMany(PublicAppointmentRequest::class, 'clinic_id');
    }

    public function subscriptionTransactions()
    {
        return $this->hasMany(SubscriptionTransaction::class, 'clinic_id');
    }
}
