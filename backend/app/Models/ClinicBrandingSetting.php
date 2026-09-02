<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClinicBrandingSetting extends Model
{
    use HasFactory;

    protected $table = 'clinic_branding_settings';

    protected $fillable = [
        'tenant_id',
        'logo_url',
        'stamp_url',
        'signature_url',
        'primary_color',
        'secondary_color',
        'header_layout',
        'show_watermark',
        'show_stamp_on_bilans',
        'license_number',
        'official_title_ar',
        'official_title_fr',
        'phone',
        'address',
        'wilaya',
        'footer_text',
    ];

    protected $casts = [
        'show_watermark' => 'boolean',
        'show_stamp_on_bilans' => 'boolean',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
