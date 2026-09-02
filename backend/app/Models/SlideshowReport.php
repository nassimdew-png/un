<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SlideshowReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'clinic_id',
        'title',
        'period',
        'slides_json',
        'summary_kpis',
    ];

    protected $casts = [
        'slides_json' => 'array',
        'summary_kpis' => 'array',
    ];

    public function clinic()
    {
        return $this->belongsTo(Tenant::class, 'clinic_id');
    }
}
