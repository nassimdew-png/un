<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemApiConfig extends Model
{
    use HasFactory;

    protected $table = 'system_api_configs';

    protected $fillable = [
        'provider',
        'api_key',
        'secondary_api_key',
        'default_text_model',
        'default_vision_model',
        'default_audio_model',
        'default_video_model',
        'is_active',
        'rate_limit_per_minute',
        'last_tested_at',
        'health_status',
        'feature_flags',
    ];

    protected $casts = [
        'api_key' => 'encrypted',
        'secondary_api_key' => 'encrypted',
        'is_active' => 'boolean',
        'rate_limit_per_minute' => 'integer',
        'last_tested_at' => 'datetime',
        'feature_flags' => 'array',
    ];

    /**
     * Get masked API key for safe UI display.
     */
    public function getMaskedKeyAttribute(): ?string
    {
        $key = $this->api_key;
        if (empty($key)) return null;
        if (strlen($key) <= 8) return '****';
        return substr($key, 0, 6) . '...' . substr($key, -4);
    }

    /**
     * Get masked secondary key for safe UI display.
     */
    public function getMaskedSecondaryKeyAttribute(): ?string
    {
        $key = $this->secondary_api_key;
        if (empty($key)) return null;
        if (strlen($key) <= 8) return '****';
        return substr($key, 0, 6) . '...' . substr($key, -4);
    }
}
