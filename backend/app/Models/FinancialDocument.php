<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FinancialDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'clinic_id',
        'type',
        'vendor_name',
        'invoice_number',
        'invoice_date',
        'total_amount',
        'tax_amount',
        'currency',
        'category',
        'status',
        'file_path',
        'raw_extracted_data',
        'notes',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'total_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'raw_extracted_data' => 'array',
    ];

    public function clinic()
    {
        return $this->belongsTo(Tenant::class, 'clinic_id');
    }
}
