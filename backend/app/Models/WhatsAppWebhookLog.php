<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppWebhookLog extends Model
{
    use HasFactory;

    protected $table = 'whatsapp_webhook_logs';

    protected $fillable = [
        'tenant_id',
        'event_type',
        'message_id',
        'sender_phone',
        'sender_name',
        'message_type',
        'message_body',
        'status',
        'patient_id',
        'auto_reply_sent',
        'raw_payload',
        'ip_address',
        'signature_valid',
    ];

    protected $casts = [
        'raw_payload' => 'array',
        'signature_valid' => 'boolean',
    ];

    /**
     * Matched patient relationship.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    /**
     * Clinic tenant relationship.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
