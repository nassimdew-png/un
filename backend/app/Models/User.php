<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'phone',
        'password',
        'role',
        'admin_role',
        'is_super_admin',
        'permissions',
        'admin_permissions',
        'two_factor_secret',
        'two_factor_confirmed_at',
        'specialty',
        'specialty_license_number',
        'is_active',
        'has_completed_tour',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'is_super_admin' => 'boolean',
            'has_completed_tour' => 'boolean',
            'permissions' => 'array',
            'admin_permissions' => 'array',
        ];
    }

    public function isSuperadmin(): bool
    {
        return (bool) $this->is_super_admin || $this->role === 'superadmin';
    }

    public function isAdminOrOwner(): bool
    {
        return in_array($this->role, ['admin_owner', 'clinic_admin', 'superadmin']);
    }

    public function isClinicAdmin(): bool
    {
        return in_array($this->role, ['admin_owner', 'clinic_admin', 'superadmin']);
    }

    public function isClinician(): bool
    {
        return in_array($this->role, [
            'clinician', 
            'specialist', 
            'orthophonist', 
            'psychologist', 
            'admin_owner', 
            'clinic_admin', 
            'superadmin'
        ]);
    }

    public function isSpecialist(): bool
    {
        return $this->isClinician();
    }

    public function isSecretary(): bool
    {
        return in_array($this->role, ['secretary', 'receptionist']);
    }

    public function isReceptionist(): bool
    {
        return $this->isSecretary();
    }

    public function isIntern(): bool
    {
        return $this->role === 'intern';
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isAdminOrOwner()) {
            return true;
        }

        if (empty($this->permissions) || !is_array($this->permissions)) {
            // Default permissions based on role
            if ($this->isSecretary()) {
                return in_array($permission, ['view_agenda', 'manage_appointments', 'view_patients_basic', 'manage_invoices']);
            }
            if ($this->isClinician()) {
                return in_array($permission, [
                    'view_agenda', 'manage_appointments', 'view_patients_full', 
                    'manage_assessments', 'manage_therapy', 'generate_bilans', 'view_invoices'
                ]);
            }
            return false;
        }

        return in_array($permission, $this->permissions);
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(ClinicalAssessment::class, 'specialist_id');
    }

    public function therapySessions(): HasMany
    {
        return $this->hasMany(TherapySession::class, 'specialist_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'specialist_id');
    }
}
