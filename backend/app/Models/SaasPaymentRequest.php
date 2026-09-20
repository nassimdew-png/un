<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaasPaymentRequest extends Model
{
    protected $fillable = [
        'clinic_id',
        'subscription_plan_id',
        'billing_cycle',
        'amount_dzd',
        'payment_method',
        'transaction_reference',
        'receipt_image_path',
        'status',
        'coupon_code',
        'discount_amount_dzd',
        'original_amount_dzd',
        'admin_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'amount_dzd' => 'float',
        'discount_amount_dzd' => 'float',
        'original_amount_dzd' => 'float',
        'reviewed_at' => 'datetime',
    ];

    protected $appends = [
        'receipt_url',
        'payment_method_label_ar',
        'status_label_ar',
    ];

    public function getReceiptUrlAttribute(): ?string
    {
        if (empty($this->receipt_image_path)) {
            return null;
        }

        if (str_starts_with($this->receipt_image_path, 'http://') || str_starts_with($this->receipt_image_path, 'https://')) {
            return $this->receipt_image_path;
        }

        return url('storage/' . ltrim($this->receipt_image_path, '/'));
    }

    public function getPaymentMethodLabelArAttribute(): string
    {
        return match (strtolower($this->payment_method ?? 'baridimob')) {
            'baridimob' => 'بريدي موب (BaridiMob)',
            'ccp' => 'حوالة بريدية (CCP)',
            'bank_transfer' => 'تحويل بنكي رسمي',
            'cash' => 'دفع نقدي مباشر',
            default => 'بريدي موب (BaridiMob)',
        };
    }

    public function getStatusLabelArAttribute(): string
    {
        return match (strtolower($this->status ?? 'pending')) {
            'approved' => 'معتمد ومفعّل 🟢',
            'rejected' => 'مرفوض 🔴',
            default => 'بانتظار التدقيق والمطابقة ⏳',
        };
    }

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

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
