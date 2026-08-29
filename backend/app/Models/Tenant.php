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
        'slug',
        'specialty_type', // psychology | orthophony | multidisciplinary
        'subscription',   // status, plan, expires_at
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
        'booking_enabled'       => 'boolean',
        'slot_duration_minutes' => 'integer',
        'working_hours_json'    => 'array',
        'services_json'         => 'array',
        'subscription_ends_at'  => 'datetime',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function customDomains()
    {
        return $this->hasMany(ClinicCustomDomain::class, 'clinic_id', '_id');
    }

    public function publicAppointmentRequests()
    {
        return $this->hasMany(PublicAppointmentRequest::class, 'clinic_id', '_id');
    }

    public function subscriptionTransactions()
    {
        return $this->hasMany(SubscriptionTransaction::class, 'clinic_id', '_id');
    }
}
