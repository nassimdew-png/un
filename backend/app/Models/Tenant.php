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
        'address',
        'wilaya',
        'wilaya_code',
        'commune',
        'phone',
        'latitude',
        'longitude',
        'subscription_ends_at',
        'trial_ends_at',
        'last_chased_at',
        'chase_count',
        'grace_period_ends_at',
        'last_chased_template',
        'onboarding_completed_at',
        'onboarding_current_step',
        'onboarding_score',
        'last_onboarding_nudge_at',
        'last_onboarding_nudge_template',
        'referred_by_code',
        'referral_code',
        'referral_credits_dzd',
        'referral_free_days_earned',
        'whatsapp_phone',
        'whatsapp_auto_reply_enabled',
        'retention_threshold_days',
        'tv_display_ticker_text',
        'tv_audio_chime_enabled',
        'is_quarantined',
        'quarantine_reason',
        'quarantined_at',
        'quarantined_by',
        'feature_overrides',
        'quota_overrides',
        'is_sandbox_clone',
        'cloned_from_tenant_id',
        'churn_risk_score',
        'churn_risk_level',
        'last_activity_at',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'onboarding_tour_enabled' => 'boolean',
        'has_ai_access' => 'boolean',
        'ai_receptionist_enabled' => 'boolean',
        'whatsapp_auto_reply_enabled' => 'boolean',
        'tv_audio_chime_enabled' => 'boolean',
        'is_quarantined' => 'boolean',
        'is_sandbox_clone' => 'boolean',
        'feature_overrides' => 'array',
        'quota_overrides' => 'array',
        'churn_risk_score' => 'integer',
        'retention_threshold_days' => 'integer',
        'monthly_ai_quota' => 'integer',
        'ai_credits_used' => 'integer',
        'ai_custom_quota_override' => 'boolean',
        'ai_monthly_token_limit' => 'integer',
        'ai_tokens_used_this_month' => 'integer',
        'chase_count' => 'integer',
        'onboarding_current_step' => 'integer',
        'onboarding_score' => 'integer',
        'referral_credits_dzd' => 'float',
        'referral_free_days_earned' => 'integer',
        'settings' => 'array',
        'subscription_meta' => 'array',
        'subscription_ends_at' => 'datetime',
        'trial_ends_at' => 'datetime',
        'last_chased_at' => 'datetime',
        'grace_period_ends_at' => 'datetime',
        'onboarding_completed_at' => 'datetime',
        'last_onboarding_nudge_at' => 'datetime',
        'quarantined_at' => 'datetime',
        'last_activity_at' => 'datetime',
    ];

    /**
     * Dynamically compute clinic onboarding progress (0-100%) and current milestone step.
     */
    public function computeOnboardingProgress(): array
    {
        $steps = [
            'identity' => [
                'step' => 1,
                'title_ar' => 'الهوية السريرية والختم الطبي',
                'description_ar' => 'ضبط اسم العيادة، العنوان، التخصص، والختم الطبي',
                'completed' => !empty($this->wilaya) && (!empty($this->address) || !empty($this->phone) || !empty($this->digital_stamp_path)),
            ],
            'first_patient' => [
                'step' => 2,
                'title_ar' => 'إضافة أول ملف مريض أو طفل',
                'description_ar' => 'تسجيل أول مريض وفتح السجل السريري',
                'completed' => \App\Models\Patient::where('tenant_id', $this->id)->exists(),
            ],
            'first_session' => [
                'step' => 3,
                'title_ar' => 'عقد أول موعد أو حصة سريرية',
                'description_ar' => 'إطلاق الجلسة واستخدام الميقاتية وتوثيق SOAP',
                'completed' => \App\Models\Appointment::where('tenant_id', $this->id)->exists(),
            ],
            'clinical_tools' => [
                'step' => 4,
                'title_ar' => 'استخدام المقاييس الـ 18 أو الكراسات',
                'description_ar' => 'تمرير رائز مقنن أو تكليف كراس تمارين منزلي',
                'completed' => \App\Models\ClinicalTestAssignment::where('tenant_id', $this->id)->exists()
                    || \App\Models\HomeworkAssignment::where('clinic_id', $this->id)->exists(),
            ],
            'official_output' => [
                'step' => 5,
                'title_ar' => 'إصدار أول وثيقة أو فاتورة علاجية',
                'description_ar' => 'توليد حصيلة رسمية أو وصل أتعاب للمريض',
                'completed' => \App\Models\Invoice::where('tenant_id', $this->id)->exists(),
            ],
            'paid_conversion' => [
                'step' => 6,
                'title_ar' => 'الترقية والاشتراك السنوي المدفوع',
                'description_ar' => 'تأكيد الاشتراك عبر بريدي موب وتفعيل الحساب الدائم',
                'completed' => $this->status === 'active' && ($this->plan_id !== 'trial' || $this->is_custom_plan || (float)($this->custom_price_dzd ?? 0) > 0),
            ],
        ];

        $completedCount = 0;
        $currentStep = 1;
        $foundIncomplete = false;

        foreach ($steps as $key => $data) {
            if ($data['completed']) {
                $completedCount++;
            } elseif (!$foundIncomplete) {
                $currentStep = $data['step'];
                $foundIncomplete = true;
            }
        }

        if (!$foundIncomplete) {
            $currentStep = 6;
        }

        $percentage = round(($completedCount / count($steps)) * 100);

        return [
            'score' => $percentage,
            'completed_count' => $completedCount,
            'total_steps' => count($steps),
            'current_step' => $currentStep,
            'is_fully_onboarded' => $completedCount >= 5,
            'steps' => $steps,
        ];
    }

    public function knowledgeBaseArticles()
    {
        return $this->hasMany(KnowledgeBaseArticle::class, 'clinic_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'tenant_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'tenant_id');
    }

    public function patients()
    {
        return $this->hasMany(Patient::class, 'tenant_id');
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

    public function referredClinics()
    {
        return $this->hasMany(Tenant::class, 'referred_by_code', 'referral_code');
    }

    public function getReferralUrlAttribute(): string
    {
        $code = $this->referral_code ?? ('REF-' . strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $this->subdomain ?? 'DZ'), 0, 6)));
        return "https://psypro.tech/register?ref={$code}";
    }
}
