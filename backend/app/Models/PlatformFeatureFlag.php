<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class PlatformFeatureFlag extends Model
{
    use HasFactory;

    protected $table = 'platform_feature_flags';

    protected $fillable = [
        'feature_key',
        'feature_name',
        'is_enabled',
        'maintenance_message',
        'updated_by',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    /**
     * Default comprehensive list of feature flags across the platform.
     */
    public static function getDefaultFeatures(): array
    {
        return [
            ['feature_key' => 'clinical_soap', 'feature_name' => 'المساعد السريري وتقارير SOAP والتشخيص'],
            ['feature_key' => 'ai_clinical_hub', 'feature_name' => 'المساعد السريري والحصائل ومشاريع PEP'],
            ['feature_key' => 'image_studio', 'feature_name' => 'استوديو البطاقات والوسائل البصرية (PECS)'],
            ['feature_key' => 'fluency_analyzer', 'feature_name' => 'فحص التأتأة وطلاقة النطق للأرطوفونيا (%SS)'],
            ['feature_key' => 'podcast_studio', 'feature_name' => 'استوديو البودكاست والإذاعة التثقيفية متعددة الأصوات'],
            ['feature_key' => 'video_studio', 'feature_name' => 'استوديو القصص المتحركة والنمذجة البصرية (MP4)'],
            ['feature_key' => 'live_studio', 'feature_name' => 'الجلسات الحية والتفاعل الصوتي المباشر والوضع السري'],
            ['feature_key' => 'live_audio_studio', 'feature_name' => 'استوديو الصوت التفاعلي المباشر (Real-time Live)'],
            ['feature_key' => 'speech_transcribe', 'feature_name' => 'المساعد الصوتي والإملاء وتفريغ SOAP المباشر'],
            ['feature_key' => 'data_analyst', 'feature_name' => 'محلل البيانات الذكي وتقارير الأداء السريري (BI)'],
            ['feature_key' => 'document_processor', 'feature_name' => 'معالج الفواتير والمطابقة المالية وعروض الشرائح'],
            ['feature_key' => 'repo_maintainer', 'feature_name' => 'فاحص وصيانة الكود وتشخيص الأخطاء الفورية'],
            ['feature_key' => 'api_gateway', 'feature_name' => 'إدارة مفاتيح الـ API ومزودي الذكاء الاصطناعي'],
            ['feature_key' => 'clinic_quotas', 'feature_name' => 'إدارة حصص واستهلاك العيادات والاشتراكات'],
            ['feature_key' => 'ai_support_bot', 'feature_name' => 'المساعد الذكي للدعم الفني والاستقبال'],
        ];
    }

    /**
     * Seed missing default features and ensure all are enabled.
     */
    public static function seedDefaults(): void
    {
        foreach (self::getDefaultFeatures() as $item) {
            self::updateOrCreate(
                ['feature_key' => $item['feature_key']],
                [
                    'feature_name' => $item['feature_name'],
                    'is_enabled' => true,
                    'maintenance_message' => 'هذه الميزة قيد الصيانة والتطوير مؤقتاً.',
                ]
            );
            Cache::forget("platform_feature_{$item['feature_key']}");
        }
        Cache::forget('platform_all_feature_flags');
    }

    /**
     * Check if a feature is enabled with caching (defaults to TRUE if unconfigured).
     */
    public static function isEnabled(string $key): bool
    {
        return Cache::rememberForever("platform_feature_{$key}", function () use ($key) {
            $flag = self::where('feature_key', $key)->first();
            // Defaults to true so missing keys never block users
            return $flag !== null ? (bool)$flag->is_enabled : true;
        });
    }

    /**
     * Set feature state and purge cache.
     */
    public static function setFeature(string $key, bool $isEnabled, ?string $message = null, ?int $adminId = null): self
    {
        $flag = self::updateOrCreate(
            ['feature_key' => $key],
            [
                'is_enabled' => $isEnabled,
                'maintenance_message' => $message ?: 'هذه الميزة قيد الصيانة والتطوير مؤقتاً.',
                'updated_by' => $adminId,
            ]
        );

        Cache::forget("platform_feature_{$key}");
        Cache::forget('platform_all_feature_flags');

        return $flag;
    }
}
