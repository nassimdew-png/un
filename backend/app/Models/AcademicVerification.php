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
        'student_card_doc_path',
        'status',
        'discount_code',
        'sandbox_tenant_id',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function sandboxTenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'sandbox_tenant_id');
    }
}
