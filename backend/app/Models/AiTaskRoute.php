<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiTaskRoute extends Model
{
    use HasFactory;

    protected $table = 'ai_task_routes';

    protected $fillable = [
        'task_type',
        'task_label_ar',
        'primary_provider',
        'primary_model',
        'fallback_provider',
        'fallback_model',
        'temperature',
        'max_tokens',
        'is_enabled',
    ];

    protected $casts = [
        'temperature' => 'float',
        'max_tokens' => 'integer',
        'is_enabled' => 'boolean',
    ];

    public function primaryProvider()
    {
        return $this->belongsTo(AiProvider::class, 'primary_provider', 'slug');
    }

    public function fallbackProvider()
    {
        return $this->belongsTo(AiProvider::class, 'fallback_provider', 'slug');
    }
}
