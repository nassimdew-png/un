<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class PatientAssignedExercise extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'patient_assigned_exercises';

    protected $fillable = [
        'clinic_id',
        'patient_id',
        'exercise_id',
        'exercise_title',
        'specialist_id',
        'therapist_notes',
        'frequency_weekly',
        'due_date',
        'status',              // 'assigned', 'in_progress', 'completed'
        'progress_percentage',
    ];

    protected $casts = [
        'due_date'            => 'date',
        'progress_percentage' => 'integer',
    ];

    public function exercise()
    {
        return $this->belongsTo(ClinicalExercise::class, 'exercise_id', '_id');
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id', '_id');
    }

    public function clinic()
    {
        return $this->belongsTo(Tenant::class, 'clinic_id', '_id');
    }
}
