<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Service extends Model
{
    protected $fillable = ['slug', 'event', 'media', 'duration', 'terms', 'price', 'active', 'order'];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Service $service) {
            if (empty($service->slug)) {
                $service->slug = Str::slug($service->event ?? 'layanan') . '-' . Str::slug($service->media ?? '') . '-' . Str::slug($service->event ?? '');
            }
        });
    }

    public function scopeActive($q)
    {
        return $q->where('active', true);
    }
}
