<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GeneratedClinicalVideo extends Model
{
    use HasFactory;

    protected $table = 'generated_clinical_videos';

    protected $fillable = [
        'clinic_id',
        'tenant_id',
        'patient_id',
        'user_id',
        'title',
        'prompt',
        'category',
        'model_used',
        'aspect_ratio',
        'status',
        'video_url',
        'thumbnail_url',
        'duration_seconds',
        'error_message',
    ];

    protected $casts = [
        'patient_id' => 'integer',
        'user_id' => 'integer',
        'duration_seconds' => 'integer',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
