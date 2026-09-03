<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AffiliateReferral extends Model
{
    protected $fillable = [
        'affiliate_name',
        'referral_code',
        'commission_rate',
        'total_referred_clinics',
        'total_earned_dzd',
        'payout_phone',
        'payout_ccp_rip',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'commission_rate' => 'float',
        'total_referred_clinics' => 'integer',
        'total_earned_dzd' => 'float',
    ];
}
