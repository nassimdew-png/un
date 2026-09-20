<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClinicalTestAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'appointment_id',
        'specialist_id',
        'clinical_assessment_id',
        'test_code',
        'test_title',
        'access_token',
        'pin_code',
        'mode',
        'status',
        'expires_at',
        'completed_at',
        'answers_payload',
        'raw_score',
        'severity_label',
        'diagnostic_notes',
        'has_critical_alert',
    ];

    protected $casts = [
        'answers_payload' => 'array',
        'expires_at' => 'datetime',
        'completed_at' => 'datetime',
        'raw_score' => 'float',
        'has_critical_alert' => 'boolean',
    ];

    protected $appends = ['portal_url', 'has_critical_alert'];

    public function getHasCriticalAlertAttribute(): bool
    {
        if (isset($this->attributes['has_critical_alert']) && $this->attributes['has_critical_alert'] !== null) {
            return (bool) $this->attributes['has_critical_alert'];
        }

        $code = strtoupper(trim($this->test_code ?? ''));
        $answers = $this->answers_payload;
        if (is_array($answers)) {
            if (!empty($answers['critical_alert']) || !empty($answers['has_critical_alert'])) {
                return true;
            }
            if ((str_contains($code, 'PHQ') || str_contains($code, 'BDI')) && isset($answers['9'])) {
                return ((int) $answers['9']) > 0;
            }
        }

        return false;
    }

    public function getPortalUrlAttribute(): string
    {
        return "http://145.223.116.54:3001/portal/test/{$this->access_token}";
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function specialist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'specialist_id');
    }

    public function clinicalAssessment(): BelongsTo
    {
        return $this->belongsTo(ClinicalAssessment::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }
}
