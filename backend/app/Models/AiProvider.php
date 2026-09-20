<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiProvider extends Model
{
    use HasFactory;

    protected $table = 'ai_providers';

    protected $fillable = [
        'name',
        'slug',
        'api_key',
        'base_url',
        'default_model',
        'is_active',
        'priority',
        'status',
        'last_health_check_at',
        'latency_ms',
        'pricing_input_1m',
        'pricing_output_1m',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'priority' => 'integer',
        'latency_ms' => 'integer',
        'pricing_input_1m' => 'float',
        'pricing_output_1m' => 'float',
        'last_health_check_at' => 'datetime',
    ];

    /**
     * Mask API key for secure presentation in Super Admin UI
     */
    public function getMaskedApiKeyAttribute(): string
    {
        if (empty($this->api_key)) {
            return 'غير مضبوط (No API Key)';
        }

        $len = strlen($this->api_key);
        if ($len <= 8) {
            return '••••••••';
        }

        return substr($this->api_key, 0, 4) . '••••••••' . substr($this->api_key, -4);
    }
}
