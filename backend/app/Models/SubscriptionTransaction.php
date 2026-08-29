<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class SubscriptionTransaction extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'subscription_transactions';

    protected $fillable = [
        'clinic_id',
        'plan_id',
        'amount',
        'payment_method',      // 'baridimob' | 'ccp' | 'chargily'
        'receipt_image_path',
        'transaction_reference',
        'payment_status',      // 'pending' | 'paid' | 'rejected'
        'admin_notes',
        'approved_at',
        'approved_by',
        'invoice_number',
    ];

    protected $casts = [
        'amount'      => 'float',
        'approved_at' => 'datetime',
    ];

    public function clinic()
    {
        return $this->belongsTo(Tenant::class, 'clinic_id', '_id');
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'clinic_id', '_id');
    }
}
