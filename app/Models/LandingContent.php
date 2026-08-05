<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingContent extends Model
{
    protected $fillable = ['group', 'key', 'value'];

    public static function getValue(string $key, string $default = ''): string
    {
        return static::where('key', $key)->value('value') ?? $default;
    }

    public static function setValue(string $key, string $value, string $group = 'general'): void
    {
        $existing = static::where('key', $key)->first();

        if ($existing) {
            $existing->update(['value' => $value]);

            return;
        }

        static::create(['key' => $key, 'value' => $value, 'group' => $group]);
    }
}
