<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AffiliateReferral extends Model
{
    protected $fillable = [
        'affiliate_name',
        'referral_code',
        'partner_type',
        'clinic_id',
        'reward_type',
        'commission_rate',
        'reward_months_per_referral',
        'referee_discount_percent',
        'total_referred_clinics',
        'total_earned_dzd',
        'payout_phone',
        'payout_ccp_rip',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'commission_rate' => 'float',
        'referee_discount_percent' => 'float',
        'reward_months_per_referral' => 'integer',
        'total_referred_clinics' => 'integer',
        'total_earned_dzd' => 'float',
    ];

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'clinic_id');
    }

    public function referredClinics(): HasMany
    {
        return $this->hasMany(Tenant::class, 'referred_by_code', 'referral_code');
    }

    public function getPartnerTypeLabelArAttribute(): string
    {
        return match ($this->partner_type ?? 'partner_association') {
            'doctor_peer' => 'طبيب سفير (Doctor-to-Doctor)',
            'influencer' => 'مؤثر / مدرب سريري',
            default => 'جمعية طبية / شريك مهني',
        };
    }
}
