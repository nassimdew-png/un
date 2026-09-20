<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademicVerification extends Model
{
    use HasFactory;

    protected $table = 'academic_verifications';

    protected $fillable = [
        'user_id',
        'student_name',
        'email',
        'phone',
        'university_name',
        'faculty',
        'degree_level',
        'specialty',
        'academic_year',
        'clinic_name',
        'student_card_doc_path',
        'status',
        'admin_notes',
        'discount_code',
        'sandbox_tenant_id',
        'expires_at',
        'approved_at',
        'approved_by',
    ];

    protected $casts = [
        'expires_at' => 'date',
        'approved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function sandboxTenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'sandbox_tenant_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
