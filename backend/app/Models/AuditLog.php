<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $table = 'audit_logs';

    const UPDATED_AT = null;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'user_name',
        'user_email',
        'user_role',
        'event_type',
        'severity',
        'action_description',
        'target_type',
        'target_id',
        'ip_address',
        'user_agent',
        'metadata',
        'action',
        'auditable_type',
        'auditable_id',
        'old_values',
        'new_values',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationship to User (if user exists, bypass tenant scope so SuperAdmin actor is visible)
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->withoutGlobalScopes();
    }

    /**
     * Relationship to Tenant / Clinic
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /**
     * Scope for severity filtering
     */
    public function scopeSeverity($query, $severity)
    {
        if (!empty($severity) && $severity !== 'ALL') {
            return $query->where('severity', strtolower($severity));
        }
        return $query;
    }

    /**
     * Scope for event type filtering
     */
    public function scopeEventType($query, $type)
    {
        if (!empty($type) && $type !== 'ALL') {
            return $query->where('event_type', $type);
        }
        return $query;
    }

    /**
     * Scope for searching
     */
    public function scopeSearch($query, $term)
    {
        if (empty($term)) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('action_description', 'like', "%{$term}%")
              ->orWhere('user_name', 'like', "%{$term}%")
              ->orWhere('user_email', 'like', "%{$term}%")
              ->orWhere('ip_address', 'like', "%{$term}%")
              ->orWhere('event_type', 'like', "%{$term}%")
              ->orWhere('action', 'like', "%{$term}%")
              ->orWhere('auditable_type', 'like', "%{$term}%")
              ->orWhere('target_type', 'like', "%{$term}%")
              ->orWhere('auditable_id', 'like', "%{$term}%")
              ->orWhere('target_id', 'like', "%{$term}%")
              ->orWhere('metadata', 'like', "%{$term}%");
        });
    }
}
