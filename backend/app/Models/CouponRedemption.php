<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CouponRedemption extends Model
{
    protected $fillable = [
        'coupon_id',
        'clinic_id',
        'original_amount_dzd',
        'discount_applied_dzd',
        'final_amount_dzd',
        'invoice_id',
        'payment_request_id',
        'redeemed_at',
    ];

    protected $casts = [
        'original_amount_dzd' => 'float',
        'discount_applied_dzd' => 'float',
        'final_amount_dzd' => 'float',
        'redeemed_at' => 'datetime',
    ];

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(DiscountCoupon::class, 'coupon_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'clinic_id');
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'clinic_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(SaasInvoice::class, 'invoice_id');
    }

    public function paymentRequest(): BelongsTo
    {
        return $this->belongsTo(SaasPaymentRequest::class, 'payment_request_id');
    }
}
