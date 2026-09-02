<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class CommunicationGateway extends Model
{
    use HasFactory;

    protected $table = 'communication_gateways';

    protected $fillable = [
        'mail_driver',
        'mail_host',
        'mail_port',
        'mail_username',
        'mail_password',
        'mail_encryption',
        'mail_from_address',
        'mail_from_name',
        'is_mail_active',
        'sms_provider',
        'sms_api_key',
        'sms_sender_id',
        'sms_api_url',
        'is_sms_active',
        'whatsapp_provider',
        'whatsapp_instance_id',
        'whatsapp_token',
        'whatsapp_phone_number_id',
        'whatsapp_sender_number',
        'is_whatsapp_active',
    ];

    protected $casts = [
        'mail_port' => 'integer',
        'is_mail_active' => 'boolean',
        'is_sms_active' => 'boolean',
        'is_whatsapp_active' => 'boolean',
    ];

    public function setMailPasswordAttribute($value)
    {
        if (!empty($value)) {
            try {
                $this->attributes['mail_password'] = Crypt::encryptString($value);
            } catch (\Exception $e) {
                $this->attributes['mail_password'] = $value;
            }
        }
    }

    public function getDecryptedMailPassword(): ?string
    {
        if (empty($this->attributes['mail_password'])) {
            return null;
        }
        try {
            return Crypt::decryptString($this->attributes['mail_password']);
        } catch (\Exception $e) {
            return $this->attributes['mail_password'];
        }
    }

    public function setSmsApiKeyAttribute($value)
    {
        if (!empty($value)) {
            try {
                $this->attributes['sms_api_key'] = Crypt::encryptString($value);
            } catch (\Exception $e) {
                $this->attributes['sms_api_key'] = $value;
            }
        }
    }

    public function getDecryptedSmsApiKey(): ?string
    {
        if (empty($this->attributes['sms_api_key'])) {
            return null;
        }
        try {
            return Crypt::decryptString($this->attributes['sms_api_key']);
        } catch (\Exception $e) {
            return $this->attributes['sms_api_key'];
        }
    }

    public function setWhatsappTokenAttribute($value)
    {
        if (!empty($value)) {
            try {
                $this->attributes['whatsapp_token'] = Crypt::encryptString($value);
            } catch (\Exception $e) {
                $this->attributes['whatsapp_token'] = $value;
            }
        }
    }

    public function getDecryptedWhatsappToken(): ?string
    {
        if (empty($this->attributes['whatsapp_token'])) {
            return null;
        }
        try {
            return Crypt::decryptString($this->attributes['whatsapp_token']);
        } catch (\Exception $e) {
            return $this->attributes['whatsapp_token'];
        }
    }
}
