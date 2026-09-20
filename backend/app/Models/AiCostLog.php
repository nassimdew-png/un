<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiCostLog extends Model
{
    use HasFactory;

    public $timestamps = false; // only created_at
    protected $table = 'ai_cost_logs';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'provider_slug',
        'model_name',
        'task_type',
        'input_tokens',
        'output_tokens',
        'total_tokens',
        'estimated_cost_usd',
        'latency_ms',
        'was_fallback_used',
        'fallback_reason',
        'created_at',
    ];

    protected $casts = [
        'input_tokens' => 'integer',
        'output_tokens' => 'integer',
        'total_tokens' => 'integer',
        'estimated_cost_usd' => 'float',
        'latency_ms' => 'integer',
        'was_fallback_used' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
