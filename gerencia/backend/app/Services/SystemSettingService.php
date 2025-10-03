<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;

class SystemSettingService
{
    protected string $cachePrefix = 'system_setting:';

    public function get(string $key, mixed $default = null): mixed
    {
        $cacheKey = $this->cachePrefix.$key;

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($key, $default) {
            $value = SystemSetting::query()->where('key', $key)->value('value');

            if ($value === null) {
                return $default;
            }

            $decoded = json_decode($value, true);

            return json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
        }) ?? $default;
    }

    public function set(string $key, mixed $value): SystemSetting
    {
        $persistedValue = is_array($value) || is_object($value)
            ? json_encode($value)
            : $value;

        $setting = SystemSetting::query()->updateOrCreate(
            ['key' => $key],
            ['value' => $persistedValue]
        );

        Cache::forget($this->cachePrefix.$key);

        return $setting;
    }

    public function forget(string $key): void
    {
        Cache::forget($this->cachePrefix.$key);
    }
}