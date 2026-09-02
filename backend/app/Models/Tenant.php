<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
        });

        static::saved(function ($tenant) {
            if (file_exists('/usr/local/bin/sync_traefik_subdomains.py')) {
                @exec('python3 /usr/local/bin/sync_traefik_subdomains.py > /dev/null 2>&1 &');
            }
        });

        static::deleted(function ($tenant) {
            if (file_exists('/usr/local/bin/sync_traefik_subdomains.py')) {
                @exec('python3 /usr/local/bin/sync_traefik_subdomains.py > /dev/null 2>&1 &');
            }
        });
    }

    protected $guarded = [];

    protected $fillable = [
        'name',
        'subdomain',
        'custom_domain',
        'type',
        'status',
        'onboarding_tour_enabled',
        'has_ai_access',
        'monthly_ai_quota',
        'ai_credits_used',
        'ai_monthly_token_limit',
        'ai_tokens_used_this_month',
        'ai_custom_quota_override',
        'ai_quota_reset_at',
        'ai_tokens_balance',
        'ai_tokens_used',
        'ai_monthly_token_quota',
        'ai_receptionist_enabled',
        'ai_receptionist_greeting',
        'ai_receptionist_instructions',
        'settings',
        'subscription_meta',
    ];

    protected $casts = [
        'onboarding_tour_enabled' => 'boolean',
        'has_ai_access' => 'boolean',
        'ai_receptionist_enabled' => 'boolean',
        'monthly_ai_quota' => 'integer',
        'ai_credits_used' => 'integer',
        'ai_custom_quota_override' => 'boolean',
        'ai_monthly_token_limit' => 'integer',
        'ai_tokens_used_this_month' => 'integer',
        'settings' => 'array',
        'subscription_meta' => 'array',
    ];

    public function knowledgeBaseArticles()
    {
        return $this->hasMany(KnowledgeBaseArticle::class, 'clinic_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'tenant_id');
    }

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function isOrthophony(): bool
    {
        return in_array($this->type, ['orthophony', 'orthophonie', 'cabinet_orthophonie', 'cabinet_orthophonie_specialise']);
    }

    public function isPsychology(): bool
    {
        return in_array($this->type, ['psychology', 'psychologie', 'cabinet_psychologie', 'cabinet_psychologique']);
    }
}
