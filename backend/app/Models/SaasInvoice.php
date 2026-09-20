<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaasInvoice extends Model
{
    protected $fillable = [
        'invoice_number',
        'clinic_id',
        'subscription_plan_id',
        'payment_request_id',
        'amount_dzd',
        'billing_cycle',
        'period_start',
        'period_end',
        'payment_method',
        'coupon_code',
        'discount_amount_dzd',
        'original_amount_dzd',
        'pdf_path',
    ];

    protected $casts = [
        'amount_dzd' => 'float',
        'discount_amount_dzd' => 'float',
        'original_amount_dzd' => 'float',
        'period_start' => 'datetime',
        'period_end' => 'datetime',
    ];

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'clinic_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'clinic_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    public function paymentRequest(): BelongsTo
    {
        return $this->belongsTo(SaasPaymentRequest::class, 'payment_request_id');
    }
}
