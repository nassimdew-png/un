<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemErrorDiagnostic extends Model
{
    use HasFactory;

    protected $fillable = [
        'exception_class',
        'message',
        'file',
        'line',
        'stack_trace',
        'code_context',
        'ai_diagnosis',
        'proposed_patch',
        'suggested_code',
        'status',
        'severity',
        'occurrences_count',
        'last_seen_at',
    ];

    protected $casts = [
        'line' => 'integer',
        'occurrences_count' => 'integer',
        'last_seen_at' => 'datetime',
    ];
}
