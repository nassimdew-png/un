<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ClinicAiQuota extends Model
{
    use HasFactory;

    protected $table = 'clinic_ai_quotas';

    protected $fillable = [
        'clinic_id',
        'plan_name',
        'monthly_reports_limit',
        'reports_used',
        'monthly_transcribe_mins_limit',
        'transcribe_mins_used',
        'monthly_images_limit',
        'images_used',
        'monthly_podcasts_limit',
        'podcasts_used',
        'monthly_videos_limit',
        'videos_used',
        'monthly_documents_limit',
        'documents_used',
        'resets_at',
    ];

    protected $casts = [
        'monthly_reports_limit' => 'integer',
        'reports_used' => 'integer',
        'monthly_transcribe_mins_limit' => 'integer',
        'transcribe_mins_used' => 'float',
        'monthly_images_limit' => 'integer',
        'images_used' => 'integer',
        'monthly_podcasts_limit' => 'integer',
        'podcasts_used' => 'integer',
        'monthly_videos_limit' => 'integer',
        'videos_used' => 'integer',
        'monthly_documents_limit' => 'integer',
        'documents_used' => 'integer',
        'resets_at' => 'datetime',
    ];

    /**
     * Get or initialize quota for a clinic.
     */
    public static function getForClinic($clinicId): self
    {
        $quota = self::firstOrCreate(
            ['clinic_id' => $clinicId],
            [
                'plan_name' => 'pro',
                'monthly_reports_limit' => 60,
                'reports_used' => 0,
                'monthly_transcribe_mins_limit' => 90,
                'transcribe_mins_used' => 0,
                'monthly_images_limit' => 40,
                'images_used' => 0,
                'monthly_podcasts_limit' => 10,
                'podcasts_used' => 0,
                'monthly_videos_limit' => 5,
                'videos_used' => 0,
                'monthly_documents_limit' => 30,
                'documents_used' => 0,
                'resets_at' => Carbon::now()->endOfMonth(),
            ]
        );

        // Auto-reset if monthly cycle has passed
        if ($quota->resets_at && Carbon::now()->greaterThan($quota->resets_at)) {
            $quota->update([
                'reports_used' => 0,
                'transcribe_mins_used' => 0,
                'images_used' => 0,
                'podcasts_used' => 0,
                'videos_used' => 0,
                'documents_used' => 0,
                'resets_at' => Carbon::now()->endOfMonth(),
            ]);
        }

        return $quota;
    }

    /**
     * Check if a feature is within limits.
     */
    public function canUseFeature(string $feature, float $quantity = 1): bool
    {
        return match($feature) {
            'reports', 'bilan', 'pep', 'soap' => ($this->reports_used + $quantity) <= $this->monthly_reports_limit,
            'transcribe', 'speech' => ($this->transcribe_mins_used + $quantity) <= $this->monthly_transcribe_mins_limit,
            'images', 'pecs' => ($this->images_used + $quantity) <= $this->monthly_images_limit,
            'podcasts', 'radio' => ($this->podcasts_used + $quantity) <= $this->monthly_podcasts_limit,
            'videos', 'animation' => ($this->videos_used + $quantity) <= $this->monthly_videos_limit,
            'documents', 'finance' => ($this->documents_used + $quantity) <= $this->monthly_documents_limit,
            default => true,
        };
    }

    /**
     * Increment usage for a specific feature.
     */
    public function incrementUsage(string $feature, float $quantity = 1): void
    {
        match($feature) {
            'reports', 'bilan', 'pep', 'soap' => $this->increment('reports_used', (int)$quantity),
            'transcribe', 'speech' => $this->increment('transcribe_mins_used', $quantity),
            'images', 'pecs' => $this->increment('images_used', (int)$quantity),
            'podcasts', 'radio' => $this->increment('podcasts_used', (int)$quantity),
            'videos', 'animation' => $this->increment('videos_used', (int)$quantity),
            'documents', 'finance' => $this->increment('documents_used', (int)$quantity),
            default => null,
        };
    }
}
