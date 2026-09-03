<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $table = 'system_settings';

    protected $fillable = [
        'setting_key',
        'setting_value',
        'group',
    ];

    /**
     * Get a setting by key with fallback default.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('setting_key', $key)->first();
        if (!$setting || $setting->setting_value === null) {
            return $default;
        }

        return $setting->setting_value;
    }

    /**
     * Set a setting value by key.
     */
    public static function set(string $key, mixed $value, string $group = 'general', bool $isEncrypted = false): static
    {
        return static::updateOrCreate(
            ['setting_key' => $key],
            [
                'setting_value' => (string)$value,
                'group' => $group,
            ]
        );
    }
}
