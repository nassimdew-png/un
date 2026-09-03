<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GlobalTestConfiguration extends Model
{
    protected $fillable = [
        'test_code',
        'name_ar',
        'name_fr',
        'category',
        'minimum_plan_required',
        'is_globally_enabled',
        'norms_payload',
        'description',
    ];

    protected $casts = [
        'is_globally_enabled' => 'boolean',
        'norms_payload' => 'array',
    ];
}
