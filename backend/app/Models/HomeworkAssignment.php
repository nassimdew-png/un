<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HomeworkAssignment extends Model
{
    use HasFactory;

    protected $table = 'homework_assignments';

    protected $fillable = [
        'clinic_id',
        'patient_id',
        'specialist_id',
        'exercise_title',
        'instructions',
        'category',
        'attachment_path',
        'due_date',
        'is_completed',
        'parent_feedback',
        'completed_at',
    ];

    protected $casts = [
        'due_date' => 'date',
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'clinic_id');
    }

    public function specialist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'specialist_id');
    }
}
