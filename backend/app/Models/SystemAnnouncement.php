<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemAnnouncement extends Model
{
    protected $fillable = [
        'title',
        'message',
        'type',
        'display_mode',
        'target_tier',
        'target_specialty',
        'priority',
        'action_label',
        'action_url',
        'dismissible',
        'is_active',
        'starts_at',
        'expires_at',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'dismissible' => 'boolean',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Active announcements scope
     */
    public function scopeActive($query)
    {
        $now = now();
        return $query->where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>=', $now);
            });
    }

    /**
     * Filter announcements matching a tenant/clinic
     */
    public function scopeForTenant($query, $tenant)
    {
        return $query->where(function ($q) use ($tenant) {
            $q->where('target_tier', 'all')
              ->orWhereNull('target_tier');

            if ($tenant && !empty($tenant->plan_id)) {
                $q->orWhere('target_tier', $tenant->plan_id);
            }
        })
        ->where(function ($q) use ($tenant) {
            $q->where('target_specialty', 'all')
              ->orWhereNull('target_specialty');

            if ($tenant && !empty($tenant->type)) {
                $q->orWhere('target_specialty', $tenant->type);
            }
        });
    }
}
