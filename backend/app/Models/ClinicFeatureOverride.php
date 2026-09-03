<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClinicFeatureOverride extends Model
{
    protected $fillable = [
        'clinic_id',
        'custom_max_patients',
        'custom_max_staff',
        'enabled_features',
        'notes',
    ];

    protected $casts = [
        'custom_max_patients' => 'integer',
        'custom_max_staff' => 'integer',
        'enabled_features' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'clinic_id');
    }
}
