<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlockedIp extends Model
{
    use HasFactory;

    protected $table = 'blocked_ips';

    protected $fillable = [
        'ip_address',
        'reason',
        'blocked_by_user_id',
        'blocked_by_name',
        'attempts_count',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'attempts_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Check if the block is currently active
     */
    public function isActive(): bool
    {
        if ($this->expires_at === null) {
            return true;
        }
        return $this->expires_at->isFuture();
    }
}
