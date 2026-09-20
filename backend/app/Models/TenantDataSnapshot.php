<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenantDataSnapshot extends Model
{
    use HasFactory;

    protected $table = 'tenant_data_snapshots';

    protected $fillable = [
        'clinic_id',
        'snapshot_type',
        'file_path',
        'file_name',
        'size_bytes',
        'records_count',
        'created_by',
        'notes',
    ];

    protected $casts = [
        'size_bytes' => 'integer',
        'records_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'clinic_id', 'id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
