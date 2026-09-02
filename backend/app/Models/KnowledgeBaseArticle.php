<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KnowledgeBaseArticle extends Model
{
    use HasFactory;

    protected $fillable = [
        'clinic_id',
        'source_url',
        'title',
        'content',
        'tokens_count',
        'last_crawled_at',
    ];

    protected $casts = [
        'tokens_count' => 'integer',
        'last_crawled_at' => 'datetime',
    ];

    public function clinic()
    {
        return $this->belongsTo(Tenant::class, 'clinic_id');
    }
}
