<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Package extends Model
{
    protected $fillable = [
        'name', 'slug', 'type', 'price_mode', 'promo_type', 'promo_value',
        'manual_price', 'description', 'is_popular', 'is_featured', 'is_active', 'display_order',
    ];

    protected function casts(): array
    {
        return [
            'promo_value' => 'decimal:2',
            'manual_price' => 'decimal:2',
            'is_popular' => 'boolean',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Package $package) {
            if (empty($package->slug)) {
                $package->slug = Str::slug($package->name);
            }
        });
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'package_items')
            ->withPivot('qty')
            ->orderBy('package_items.id');
    }

    public function basePrice(): float
    {
        $total = 0;
        foreach ($this->services as $service) {
            $total += (float) $service->price * (int) max(1, $service->pivot->qty);
        }

        return round($total, 2);
    }

    public function computedPrice(): float
    {
        if ($this->price_mode === 'manual') {
            return (float) $this->manual_price;
        }

        $base = $this->basePrice();

        return match ($this->promo_type) {
            'percent' => round($base * (1 - (float) $this->promo_value / 100), 2),
            'nominal' => round(max(0, $base - (float) $this->promo_value), 2),
            default => $base,
        };
    }

    public function discountValue(): float
    {
        return round($this->basePrice() - $this->computedPrice(), 2);
    }

    public function isDiscounted(): bool
    {
        return $this->discountValue() > 0;
    }

    public function scopeActive($q)
    {
        return $q->where('is_active', true);
    }

    public function summary(): string
    {
        $byEvent = $this->services->groupBy(fn ($s) => $s->event ?: $s->name);
        $parts = [];
        foreach ($byEvent as $event => $rows) {
            $media = $rows->pluck('media')->map(fn ($m) => ucfirst($m))->unique()->join(' + ');
            $parts[] = $event . ' (' . $media . ')';
        }

        return implode(', ', $parts);
    }
}