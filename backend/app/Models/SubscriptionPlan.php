<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $table = 'subscription_plans';

    protected $fillable = [
        'name_ar',
        'name_fr',
        'slug',
        'description',
        'price_monthly',
        'price_yearly',
        'currency',
        'trial_days',
        'max_patients',
        'max_staff',
        'ai_reports_limit',
        'ai_transcribe_mins',
        'ai_images_limit',
        'ai_podcasts_limit',
        'ai_videos_limit',
        'has_custom_domain',
        'has_priority_support',
        'is_featured',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price_monthly' => 'float',
        'price_yearly' => 'float',
        'trial_days' => 'integer',
        'max_patients' => 'integer',
        'max_staff' => 'integer',
        'ai_reports_limit' => 'integer',
        'ai_transcribe_mins' => 'integer',
        'ai_images_limit' => 'integer',
        'ai_podcasts_limit' => 'integer',
        'ai_videos_limit' => 'integer',
        'has_custom_domain' => 'boolean',
        'has_priority_support' => 'boolean',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function clinics()
    {
        return $this->hasMany(Tenant::class, 'plan_id');
    }

    public function tenants()
    {
        return $this->hasMany(Tenant::class, 'plan_id');
    }
}
